/**
 * ProjectStorage over a JupyterLite-contents-schema key-value store
 * (ADR-001 §3-§4).
 *
 * One implementation, two backends: localforage on the "JupyterLite Storage"
 * IndexedDB (the persistent library — shared with the notebook by
 * construction) or an in-memory store (quick runs, embeds, tests). Listing
 * never bulk-reads file bodies beyond the directory being listed: project
 * and run discovery scan keys and read only the small `.atomify/*.json`
 * records. Key scans are scoped too — a key range under the directory
 * (keysWithPrefix), or a skip-scan of top-level names for the library — so
 * their cost follows the project, not every file in the whole library.
 */

import {
  buildDirectoryRecord,
  buildFileRecord,
  classifyPath,
  recordToReadResult,
  recordToStat,
  validateRelativePath,
  type ContentsRecord,
} from "./contentsSchema";
import {
  createJupyterCheckpointsStore,
  createJupyterFilesStore,
  keysWithPrefix,
  MemoryStore,
  topLevelNames,
} from "./kv";
import type { KeyValueStore } from "./kv";
import { uniqueSlug } from "./slug";
import type {
  FileStat,
  NewProjectMeta,
  ProjectMeta,
  ProjectStorage,
} from "./types";

export const PROJECT_META_PATH = ".atomify/project.json";

/** Colors assigned round-robin to new projects (design palette). */
const PROJECT_COLORS = [
  "#3F6EFF",
  "#7C3AED",
  "#10B981",
  "#06B6D4",
  "#F43F5E",
  "#FFB020",
];

export class ContentsProjectStorage implements ProjectStorage {
  constructor(
    private readonly files: KeyValueStore,
    private readonly checkpoints: KeyValueStore,
  ) {}

  // --- Projects -----------------------------------------------------------

  async listProjects(): Promise<ProjectMeta[]> {
    const topLevel = await topLevelNames(this.files);
    const projects: ProjectMeta[] = [];
    for (const dirName of topLevel) {
      const meta = await this.readProjectMeta(dirName);
      if (meta) {
        projects.push(meta);
      }
    }
    return projects.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  async createProject(meta: NewProjectMeta): Promise<ProjectMeta> {
    const taken = new Set(await topLevelNames(this.files));
    const dirName = uniqueSlug(meta.displayName, taken);
    const color =
      meta.color ?? PROJECT_COLORS[taken.size % PROJECT_COLORS.length];

    const projectMeta: ProjectMeta = {
      schemaVersion: 1,
      dirName,
      displayName: meta.displayName,
      description: meta.description,
      createdAt: new Date().toISOString(),
      inputScript: meta.inputScript,
      color,
      source: meta.source,
    };

    await this.writeDirectoryRecord(dirName);
    await this.writeDirectoryRecord(`${dirName}/.atomify`);
    await this.writeDirectoryRecord(`${dirName}/runs`);
    await this.write(
      dirName,
      PROJECT_META_PATH,
      JSON.stringify(projectMeta, null, 2),
    );
    return projectMeta;
  }

  async updateProjectMeta(
    dirName: string,
    patch: Partial<Omit<ProjectMeta, "dirName" | "schemaVersion">>,
  ): Promise<ProjectMeta> {
    if ("dirName" in patch) {
      throw new Error("dirName is immutable (ADR-001 §2)");
    }
    const existing = await this.readProjectMeta(dirName);
    if (!existing) {
      throw new Error(`Not a project: ${dirName}`);
    }
    const updated: ProjectMeta = { ...existing, ...patch, dirName };
    await this.write(
      dirName,
      PROJECT_META_PATH,
      JSON.stringify(updated, null, 2),
    );
    return updated;
  }

  async deleteProject(dirName: string): Promise<void> {
    validateRelativePath(dirName);
    // project.json goes after the files and the directory record last: a
    // closed tab mid-delete leaves a still-listed project to delete again,
    // never invisible orphaned records eating quota.
    const metaKey = `${dirName}/${PROJECT_META_PATH}`;
    const keys = await keysWithPrefix(this.files, `${dirName}/`);
    await this.removeKeys(keys.filter((key) => key !== metaKey));
    await this.removeKeys([metaKey]);
    await this.removeKeys([dirName]);
  }

  // --- Files ----------------------------------------------------------------

  async list(dirName: string, subdir?: string): Promise<FileStat[]> {
    validateRelativePath(dirName);
    if (subdir !== undefined) {
      validateRelativePath(subdir);
    }
    const base = subdir ? `${dirName}/${subdir}` : dirName;
    const prefix = `${base}/`;
    const keys = await keysWithPrefix(this.files, prefix);

    // Direct children, plus directories implied by deeper keys whose own
    // record is missing (defensive against externally-written trees).
    const children = new Set<string>();
    for (const key of keys) {
      const rest = key.slice(prefix.length);
      const slash = rest.indexOf("/");
      children.add(slash === -1 ? rest : rest.slice(0, slash));
    }

    const stats: FileStat[] = [];
    for (const child of children) {
      const fullPath = `${prefix}${child}`;
      const relative = fullPath.slice(dirName.length + 1);
      const record = await this.files.getItem<ContentsRecord>(fullPath);
      if (record) {
        stats.push(recordToStat(record, relative));
      } else {
        // Implied directory: a deeper key exists but no record for this level.
        stats.push({
          path: relative,
          type: "directory",
          format: "json",
          mimetype: "application/json",
          lastModified: new Date(0).toISOString(),
          size: 0,
        });
      }
    }
    return stats.sort((a, b) => a.path.localeCompare(b.path));
  }

  async read(dirName: string, path: string): Promise<string | Uint8Array> {
    const record = await this.requireRecord(dirName, path);
    return recordToReadResult(record);
  }

  async write(
    dirName: string,
    path: string,
    content: string | Uint8Array,
  ): Promise<FileStat> {
    validateRelativePath(dirName);
    validateRelativePath(path);
    const fullPath = `${dirName}/${path}`;
    await this.ensureParents(fullPath);
    const existing = await this.files.getItem<ContentsRecord>(fullPath);
    const record = buildFileRecord(fullPath, content, existing?.created);
    await this.files.setItem(fullPath, record);
    return recordToStat(record, path);
  }

  /**
   * Move a file or directory tree. The store has no multi-key transaction
   * (writes stay on localforage, see kv.ts), so the order is what makes it
   * crash-safe: every new key (and its checkpoints) is written before any
   * old key is removed. A tab closed mid-rename leaves the tree under BOTH
   * names — a duplicate the user can delete — never a half-moved directory
   * with records missing from both.
   */
  async rename(dirName: string, from: string, to: string): Promise<void> {
    validateRelativePath(dirName);
    validateRelativePath(from);
    validateRelativePath(to);
    const fromFull = `${dirName}/${from}`;
    const toFull = `${dirName}/${to}`;
    const record = await this.requireRecord(dirName, from);
    if (fromFull === toFull) {
      // Copy-then-delete onto itself would delete the file.
      return;
    }
    if (toFull.startsWith(`${fromFull}/`)) {
      throw new Error(`Cannot move ${from} into itself`);
    }

    // Ascending key order puts each directory record before its children,
    // so the new tree is coherent at every point of the copy phase.
    const keys =
      record.type === "directory"
        ? [fromFull, ...(await keysWithPrefix(this.files, `${fromFull}/`))]
        : [fromFull];
    await this.ensureParents(toFull);
    for (const key of keys) {
      await this.copyKey(key, toFull + key.slice(fromFull.length));
    }
    await this.removeKeys(keys.slice(1));
    await this.removeKeys([fromFull]);
  }

  async remove(dirName: string, path: string): Promise<void> {
    validateRelativePath(dirName);
    validateRelativePath(path);
    const fullPath = `${dirName}/${path}`;
    const record = await this.files.getItem<ContentsRecord>(fullPath);
    if (record?.type === "directory") {
      await this.removeKeys(await keysWithPrefix(this.files, `${fullPath}/`));
    }
    // The directory record last, so an interrupted remove stays visible.
    await this.removeKeys([fullPath]);
  }

  async stat(dirName: string, path: string): Promise<FileStat | null> {
    validateRelativePath(dirName);
    validateRelativePath(path);
    const record = await this.files.getItem<ContentsRecord>(
      `${dirName}/${path}`,
    );
    return record ? recordToStat(record, path) : null;
  }

  // --- Internals ------------------------------------------------------------

  private async readProjectMeta(dirName: string): Promise<ProjectMeta | null> {
    const record = await this.files.getItem<ContentsRecord>(
      `${dirName}/${PROJECT_META_PATH}`,
    );
    if (!record || record.type === "directory") {
      return null;
    }
    try {
      const raw = recordToReadResult(record);
      const meta = JSON.parse(
        typeof raw === "string" ? raw : new TextDecoder().decode(raw),
      ) as ProjectMeta;
      // The path is the identity; a copied/moved project.json must not
      // impersonate another dirName.
      return { ...meta, dirName };
    } catch {
      return null;
    }
  }

  /** Create directory records for every missing ancestor of fullPath. */
  private async ensureParents(fullPath: string): Promise<void> {
    const segments = fullPath.split("/");
    let current = "";
    for (let i = 0; i < segments.length - 1; i++) {
      current = current ? `${current}/${segments[i]}` : segments[i];
      const existing = await this.files.getItem<ContentsRecord>(current);
      if (!existing) {
        await this.files.setItem(current, buildDirectoryRecord(current));
      }
    }
  }

  private async writeDirectoryRecord(fullPath: string): Promise<void> {
    const existing = await this.files.getItem<ContentsRecord>(fullPath);
    if (!existing) {
      await this.files.setItem(fullPath, buildDirectoryRecord(fullPath));
    }
  }

  private async requireRecord(
    dirName: string,
    path: string,
  ): Promise<ContentsRecord> {
    validateRelativePath(dirName);
    validateRelativePath(path);
    const record = await this.files.getItem<ContentsRecord>(
      `${dirName}/${path}`,
    );
    if (!record) {
      throw new Error(`File not found: ${dirName}/${path}`);
    }
    return record;
  }

  /** Remove records and their checkpoints (independent keys, in parallel). */
  private async removeKeys(keys: string[]): Promise<void> {
    await Promise.all(
      keys.flatMap((key) => [
        this.files.removeItem(key),
        this.checkpoints.removeItem(key),
      ]),
    );
  }

  /** Write `from`'s record (and checkpoints) under `to`; `from` is kept. */
  private async copyKey(from: string, to: string): Promise<void> {
    const record = await this.files.getItem<ContentsRecord>(from);
    if (!record) {
      return;
    }
    const moved: ContentsRecord = {
      ...record,
      path: to,
      name: to.slice(to.lastIndexOf("/") + 1),
      last_modified: new Date().toISOString(),
    };
    // A rename that changes the extension changes how the record should be
    // classified; rebuild file records so format/mimetype stay truthful.
    if (moved.type !== "directory") {
      const kind = classifyPath(to);
      if (kind.format !== (record.format ?? "text")) {
        const raw = recordToReadResult(record);
        await this.files.setItem(to, buildFileRecord(to, raw, record.created));
      } else {
        moved.type = kind.type;
        await this.files.setItem(to, moved);
      }
    } else {
      await this.files.setItem(to, moved);
    }
    // Checkpoints follow the file (mirrors BrowserStorageDrive's own rename).
    const checkpoint = await this.checkpoints.getItem(from);
    if (checkpoint !== null) {
      await this.checkpoints.setItem(to, checkpoint);
    }
  }
}

/** The persistent library: JupyterLite's own contents database. */
export function createIndexedDbProjectStorage(): ProjectStorage {
  return new ContentsProjectStorage(
    createJupyterFilesStore(),
    createJupyterCheckpointsStore(),
  );
}

/** Scratch space for quick runs, embeds, and tests — invisible to Jupyter. */
export function createMemoryProjectStorage(): ProjectStorage {
  return new ContentsProjectStorage(new MemoryStore(), new MemoryStore());
}

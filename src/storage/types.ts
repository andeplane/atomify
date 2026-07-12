/**
 * Project storage contracts (ADR-001).
 *
 * A project is a directory in the shared project filesystem: a working tree
 * of source files plus a `runs/` directory of immutable run records. The
 * filesystem is stored in JupyterLite's contents database, so everything a
 * project contains is visible to the embedded notebook with no sync layer.
 *
 * All persistence goes through {@link ProjectStorage}; implementations are
 * swappable (IndexedDB-backed today, HTTP API later, in-memory for quick
 * runs/embeds/tests).
 */

export type FileFormat = "text" | "json" | "base64";
export type FileType = "file" | "notebook" | "directory";

export interface FileStat {
  /** Project-relative path, no leading slash (e.g. "runs/run-001/log.lammps"). */
  path: string;
  type: FileType;
  format: FileFormat;
  mimetype: string;
  /** ISO 8601. */
  lastModified: string;
  size: number;
}

export interface ProjectSource {
  type: "blank" | "upload" | "example" | "shared";
  /** Example id from examples.json when type is "example". */
  exampleId?: string;
}

/** Contents of `<dirName>/.atomify/project.json`. */
export interface ProjectMeta {
  schemaVersion: 1;
  /**
   * The project's identity AND its directory name in the shared filesystem.
   * Immutable after creation so notebook paths never break; renames touch
   * only displayName.
   */
  dirName: string;
  displayName: string;
  description?: string;
  createdAt: string;
  /** Designated input script (project-relative path). Absent until chosen. */
  inputScript?: string;
  /** Library identity dot color. */
  color?: string;
  source?: ProjectSource;
}

export interface NewProjectMeta {
  displayName: string;
  description?: string;
  inputScript?: string;
  color?: string;
  source?: ProjectSource;
}

export type RunStatus =
  | "running"
  | "completed"
  | "failed"
  | "canceled"
  | "interrupted";

/** Contents of `<dirName>/runs/<runId>/.atomify/run.json`. */
export interface RunMeta {
  schemaVersion: 1;
  id: string;
  inputScript: string;
  /** LAMMPS variables injected for this run (sweeps, URL vars). */
  vars?: Record<string, number>;
  /** Groups the runs of one sweep. */
  sweepId?: string;
  status: RunStatus;
  startedAt: string;
  finishedAt?: string;
  stats?: {
    timesteps?: number;
    numAtoms?: number;
    wallSeconds?: number;
  };
  /** LAMMPS error message when status is "failed". */
  error?: string;
  /** Files excluded from the snapshot by the size cap (name + size + sha256). */
  snapshotGaps?: { path: string; size: number; sha256: string }[];
  origin: "app" | "sweep" | "notebook";
}

/**
 * A run row as listed by the app: either a real run.json, or an "external"
 * directory created by scripts/tools that wrote no metadata (ADR-001 §5) —
 * still listed, with what can be derived.
 */
export interface RunListEntry {
  runId: string;
  meta: RunMeta | null;
  /** Directory record mtime — the only timestamp an external run has. */
  lastModified: string;
}

export interface ProjectStorage {
  // --- Projects ---------------------------------------------------------
  listProjects(): Promise<ProjectMeta[]>;
  /** Allocates a unique dirName from displayName and creates the skeleton. */
  createProject(meta: NewProjectMeta): Promise<ProjectMeta>;
  /** dirName is immutable; a patch attempting to change it throws. */
  updateProjectMeta(
    dirName: string,
    patch: Partial<Omit<ProjectMeta, "dirName" | "schemaVersion">>,
  ): Promise<ProjectMeta>;
  /** Recursive; also clears matching checkpoint records. */
  deleteProject(dirName: string): Promise<void>;

  // --- Files (project-relative paths; parents auto-created on write) -----
  /** Direct children of subdir (default: project root). Never recursive. */
  list(dirName: string, subdir?: string): Promise<FileStat[]>;
  /** Returns Uint8Array iff the stored format is base64; else string. */
  read(dirName: string, path: string): Promise<string | Uint8Array>;
  write(
    dirName: string,
    path: string,
    content: string | Uint8Array,
  ): Promise<FileStat>;
  rename(dirName: string, from: string, to: string): Promise<void>;
  remove(dirName: string, path: string): Promise<void>;
  stat(dirName: string, path: string): Promise<FileStat | null>;
}

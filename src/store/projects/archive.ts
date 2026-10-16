/**
 * Zip export and import of a whole project tree.
 */

import { thunk } from "easy-peasy";
import { unzipSync, zipSync } from "fflate";
import type { ProjectMeta } from "../../storage";
import {
  bytesToWriteContent,
  RUNS_DIR,
  validateRelativePath,
} from "../../storage";
import { track } from "../../utils/metrics";
import { isScriptFile, storageFor } from "./helpers";
import type { ProjectsModel } from "./types";

export const archiveThunks: Pick<
  ProjectsModel,
  "exportProject" | "importProject"
> = {
  exportProject: thunk(
    async (actions, { includeRuns }, { getState, injections }) => {
      const active = getState().active;
      if (!active) {
        return null;
      }
      // Edits still in the debounce buffer belong in the zip.
      await actions.flushPendingSaves();
      const storage = storageFor(injections, active.quick);
      const dirName = active.meta.dirName;
      const entries: Record<string, Uint8Array> = {};
      const walk = async (subdir?: string): Promise<void> => {
        for (const entry of await storage.list(dirName, subdir)) {
          if (entry.type === "directory") {
            // entry.path is the full project-relative path, so RUNS_DIR only
            // matches the top-level runs/ directory.
            if (!includeRuns && entry.path === RUNS_DIR) {
              continue;
            }
            await walk(entry.path);
          } else {
            const content = await storage.read(dirName, entry.path);
            entries[entry.path] =
              typeof content === "string"
                ? new TextEncoder().encode(content)
                : content;
          }
        }
      };
      await walk();
      track("Project.Export", {
        includeRuns,
        fileCount: Object.keys(entries).length,
      });
      return { fileName: `${dirName}.zip`, bytes: zipSync(entries) };
    },
  ),

  importProject: thunk(
    async (actions, { zip, displayName, color, quick = false }, helpers) => {
      const unzipped = unzipSync(zip);
      let files = new Map<string, Uint8Array>();
      for (const [path, bytes] of Object.entries(unzipped)) {
        if (!path || path.endsWith("/") || path.includes("__MACOSX/")) {
          continue; // directory records and archiver junk
        }
        files.set(path, bytes);
      }
      if (files.size === 0) {
        throw new Error("The zip contains no files.");
      }
      // Zips made by zipping a folder nest everything under one root
      // directory; strip it so the layout matches an exported project.
      const paths = [...files.keys()];
      if (paths.every((path) => path.includes("/"))) {
        const root = paths[0].slice(0, paths[0].indexOf("/") + 1);
        if (paths.every((path) => path.startsWith(root))) {
          files = new Map(
            [...files].map(([path, bytes]) => [path.slice(root.length), bytes]),
          );
        }
      }
      // Metadata defaults from an exported project's .atomify/project.json;
      // the caller's (modal's) explicit fields win.
      let zipMeta: Partial<ProjectMeta> = {};
      const metaBytes = files.get(".atomify/project.json");
      if (metaBytes) {
        try {
          zipMeta = JSON.parse(
            new TextDecoder().decode(metaBytes),
          ) as Partial<ProjectMeta>;
        } catch {
          // Not an Atomify export; import the files as-is.
        }
      }
      // Project-level .atomify/ is regenerated with a fresh identity; run
      // directories keep their .atomify/run.json records.
      const payloadPaths = [...files.keys()].filter(
        (path) => !path.startsWith(".atomify/"),
      );
      // Every entry name must be a valid project-relative path BEFORE any
      // write: a zip with a "../"/absolute/%-containing entry must fail the
      // import up front, not strand a half-written project. (The common-root
      // stripping above cannot bypass this — a stripped "root/../x" still
      // yields a ".." segment, which is rejected here.)
      for (const path of payloadPaths) {
        try {
          validateRelativePath(path);
        } catch (error) {
          throw new Error(
            `The zip contains an entry that cannot be imported ("${path}"): ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
      const workingScripts = payloadPaths.filter(
        (path) => !path.startsWith(`${RUNS_DIR}/`) && isScriptFile(path),
      );
      const inputScript =
        zipMeta.inputScript && payloadPaths.includes(zipMeta.inputScript)
          ? zipMeta.inputScript
          : workingScripts.length === 1
            ? workingScripts[0]
            : undefined;

      const meta = await actions.createProject({
        displayName:
          displayName?.trim() ||
          zipMeta.displayName?.trim() ||
          "Imported project",
        color: color ?? zipMeta.color,
        source: { type: "upload" },
        inputScript,
        files: [],
        quick,
      });
      const storage = storageFor(helpers.injections, quick);
      for (const path of payloadPaths) {
        try {
          await storage.write(
            meta.dirName,
            path,
            bytesToWriteContent(path, files.get(path)!),
          );
        } catch (error) {
          // All-or-nothing: a half-imported project must not stay in the
          // library looking complete. Remove it and surface the entry that
          // failed.
          await storage.deleteProject(meta.dirName).catch(() => {});
          if (!quick) {
            actions.setProjects(
              await helpers.injections.libraryStorage.listProjects(),
            );
          }
          actions.setActive(undefined);
          actions.setScreen({ name: "home" });
          throw new Error(
            `Import failed at "${path}": ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
      track("Project.Import", {
        fileCount: payloadPaths.length,
        hasRuns: payloadPaths.some((path) => path.startsWith(`${RUNS_DIR}/`)),
      });
      await actions.refreshActive();
      return meta;
    },
  ),
};

/**
 * File operations on the active project's working tree (the editor cache
 * and its debounced saves, writes, renames, removals), plus raw reads and
 * listings of any project for run outputs and the Settings storage tab.
 */

import { thunk } from "easy-peasy";
import { RUNS_DIR } from "../../storage";
import { track } from "../../utils/metrics";
import { storageFor } from "./helpers";
import type { ProjectsModel } from "./types";

// Debounced editor saves live outside the (immer) store: content buffers and
// timers are not state. flushPendingSaves is awaited before every snapshot so
// what runs is always what is recorded (ADR-001 §8).
interface PendingSave {
  dirName: string;
  quick: boolean;
  path: string;
  content: string;
  timer: ReturnType<typeof setTimeout>;
  /** Set once the debounce fires; the entry stays until this settles so
   *  flushPendingSaves can await writes already in flight (ADR-001 §8). */
  inflight?: Promise<void>;
}
const pendingSaves = new Map<string, PendingSave>();

export const fileThunks: Pick<
  ProjectsModel,
  | "readFile"
  | "saveFileDebounced"
  | "flushPendingSaves"
  | "writeFile"
  | "removeFile"
  | "renameFile"
  | "setInputScript"
  | "readFileRaw"
  | "listFiles"
  | "projectSizes"
> = {
  readFile: thunk(async (actions, path, { getState, injections }) => {
    const active = getState().active;
    if (!active) {
      return "";
    }
    // runs/ paths are engine outputs, not editor buffers: they change on
    // disk mid-run and run ids are reused after deleteRun, so a cache entry
    // would go stale (or describe a deleted run). Always read them fresh.
    const isRunOutput = path.startsWith(`${RUNS_DIR}/`);
    if (!isRunOutput) {
      const cached = getState().fileContents[path];
      if (cached !== undefined) {
        return cached;
      }
    }
    const storage = storageFor(injections, active.quick);
    const content = await storage.read(active.meta.dirName, path);
    const text =
      typeof content === "string" ? content : new TextDecoder().decode(content);
    if (!isRunOutput) {
      actions.setFileContent({ path, content: text });
    }
    return text;
  }),

  saveFileDebounced: thunk(
    (actions, { path, content }, { getState, injections }) => {
      const active = getState().active;
      if (!active) {
        return;
      }
      actions.setFileContent({ path, content });
      actions.setSaveState({ path, state: "saving" });
      const key = `${active.meta.dirName}/${path}`;
      const existing = pendingSaves.get(key);
      if (existing) {
        clearTimeout(existing.timer);
      }
      const save: PendingSave = {
        dirName: active.meta.dirName,
        quick: active.quick,
        path,
        content,
        timer: setTimeout(() => {
          // The entry stays in the map (with inflight set) until the write
          // settles — deleting first would let a pre-snapshot flush miss an
          // in-flight write and record stale content (review finding).
          save.inflight = storageFor(injections, save.quick)
            .write(save.dirName, save.path, save.content)
            .then(() => actions.setSaveState({ path, state: "saved" }))
            .catch(() => actions.setSaveState({ path, state: "error" }))
            .finally(() => {
              if (pendingSaves.get(key) === save) {
                pendingSaves.delete(key);
              }
            });
        }, 500),
      };
      pendingSaves.set(key, save);
    },
  ),

  flushPendingSaves: thunk(async (actions, _, { injections }) => {
    const saves = [...pendingSaves.values()];
    pendingSaves.clear();
    for (const save of saves) {
      clearTimeout(save.timer);
      if (save.inflight) {
        // Debounce already fired; the write is in flight — settle it.
        await save.inflight;
        continue;
      }
      try {
        await storageFor(injections, save.quick).write(
          save.dirName,
          save.path,
          save.content,
        );
        actions.setSaveState({ path: save.path, state: "saved" });
      } catch {
        actions.setSaveState({ path: save.path, state: "error" });
      }
    }
  }),

  writeFile: thunk(
    async (actions, { path, content }, { getState, injections }) => {
      const active = getState().active;
      if (!active) {
        return;
      }
      await storageFor(injections, active.quick).write(
        active.meta.dirName,
        path,
        content,
      );
      if (typeof content === "string") {
        actions.setFileContent({ path, content });
      }
      await actions.refreshActive();
    },
  ),

  removeFile: thunk(async (actions, path, { getState, injections }) => {
    const active = getState().active;
    if (!active) {
      return;
    }
    await storageFor(injections, active.quick).remove(
      active.meta.dirName,
      path,
    );
    track("File.Delete", {});
    if (active.meta.inputScript === path) {
      const meta = await storageFor(injections, active.quick).updateProjectMeta(
        active.meta.dirName,
        { inputScript: undefined },
      );
      actions.patchActiveMeta(meta);
    }
    await actions.refreshActive();
  }),

  renameFile: thunk(async (actions, { from, to }, { getState, injections }) => {
    const active = getState().active;
    if (!active) {
      return;
    }
    const storage = storageFor(injections, active.quick);
    await storage.rename(active.meta.dirName, from, to);
    track("File.Rename", {});
    if (active.meta.inputScript === from) {
      const meta = await storage.updateProjectMeta(active.meta.dirName, {
        inputScript: to,
      });
      actions.patchActiveMeta(meta);
    }
    await actions.refreshActive();
  }),

  setInputScript: thunk(async (actions, path, { getState, injections }) => {
    const active = getState().active;
    if (!active) {
      return;
    }
    const meta = await storageFor(injections, active.quick).updateProjectMeta(
      active.meta.dirName,
      { inputScript: path },
    );
    actions.patchActiveMeta(meta);
    track("InputScript.Set", {});
  }),

  readFileRaw: thunk(
    async (_actions, { path, dirName, quick }, { getState, injections }) => {
      const active = getState().active;
      const dir = dirName ?? active?.meta.dirName;
      if (!dir) {
        return null;
      }
      const isActive = active?.meta.dirName === dir;
      const storage = storageFor(
        injections,
        quick ?? (isActive ? active!.quick : false),
      );
      try {
        return await storage.read(dir, path);
      } catch {
        return null;
      }
    },
  ),

  listFiles: thunk(
    async (_actions, { subdir, dirName, quick }, { getState, injections }) => {
      const active = getState().active;
      const dir = dirName ?? active?.meta.dirName;
      if (!dir) {
        return [];
      }
      const isActive = active?.meta.dirName === dir;
      const storage = storageFor(
        injections,
        quick ?? (isActive ? active!.quick : false),
      );
      try {
        return await storage.list(dir, subdir);
      } catch {
        return [];
      }
    },
  ),

  projectSizes: thunk(async (_actions, _payload, { getState, injections }) => {
    const storage = injections.libraryStorage;
    const sizes: Record<string, { bytes: number; runs: number }> = {};
    for (const meta of getState().projects) {
      let bytes = 0;
      let runs = 0;
      const walk = async (subdir?: string): Promise<void> => {
        const entries = await storage
          .list(meta.dirName, subdir)
          .catch(() => []);
        for (const entry of entries) {
          if (entry.type === "directory") {
            await walk(entry.path);
          } else {
            bytes += entry.size;
          }
        }
      };
      await walk();
      const runDirs = await storage
        .list(meta.dirName, RUNS_DIR)
        .catch(() => []);
      runs = runDirs.filter((entry) => entry.type === "directory").length;
      sizes[meta.dirName] = { bytes, runs };
    }
    return sizes;
  }),
};

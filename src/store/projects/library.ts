/**
 * Project lifecycle on top of the storage layer: listing the library,
 * opening/refreshing the active project, and create, rename, duplicate,
 * delete and save-quick-run-as-project.
 */

import { thunk } from "easy-peasy";
import { listRuns, reconcileRuns, RUNS_DIR } from "../../storage";
import { projectAnalysisNotebook } from "../../utils/AnalyzeNotebook";
import { track } from "../../utils/metrics";
import {
  copyTree,
  isScriptFile,
  isStaleExampleCopy,
  storageFor,
} from "./helpers";
import type { ProjectsModel } from "./types";

export const libraryThunks: Pick<
  ProjectsModel,
  | "initialize"
  | "openProject"
  | "refreshActive"
  | "createProject"
  | "renameProject"
  | "duplicateProject"
  | "deleteProject"
  | "saveQuickAsProject"
> = {
  initialize: thunk(async (actions, _, { injections }) => {
    const projects = await injections.libraryStorage.listProjects();
    actions.setProjects(projects);
  }),

  openProject: thunk(
    async (actions, { dirName, quick = false, tab }, helpers) => {
      const storage = storageFor(helpers.injections, quick);
      const metas = await storage.listProjects();
      let meta = metas.find((m) => m.dirName === dirName);
      if (!meta) {
        actions.setNotice(`Project ${dirName} was not found.`);
        return;
      }
      if (!quick && isStaleExampleCopy(meta)) {
        // One-time migration: rewritten on disk, so the next open is a no-op.
        // Only metrics depend on it, so a failed write must not block opening.
        try {
          meta = await storage.updateProjectMeta(dirName, {
            source: { type: "duplicate" },
          });
        } catch (error) {
          console.warn("Could not migrate stale example source", error);
        }
      }
      const owned = new Set(
        helpers.getState().activeRun
          ? [helpers.getState().activeRun!.runId]
          : [],
      );
      const interrupted = await reconcileRuns(storage, dirName, owned);
      if (interrupted.length > 0) {
        actions.setNotice(
          `${interrupted.length} interrupted ${interrupted.length === 1 ? "run" : "runs"} found in ${meta.displayName}.`,
        );
      }
      const [files, runs] = await Promise.all([
        storage.list(dirName),
        listRuns(storage, dirName),
      ]);
      actions.clearFileContents();
      actions.setActive({ meta, quick, files, runs });
      const hasRuns = runs.length > 0;
      actions.setScreen({
        name: "project",
        dirName,
        tab: tab ?? (hasRuns ? "runs" : "files"),
      });
      // No dirName in metrics — it is user content (PII policy).
      track("Project.Open", { quick, runCount: runs.length });
    },
  ),

  refreshActive: thunk(async (actions, _, { getState, injections }) => {
    const active = getState().active;
    if (!active) {
      return;
    }
    const storage = storageFor(injections, active.quick);
    const owned = new Set(
      getState().activeRun ? [getState().activeRun!.runId] : [],
    );
    await reconcileRuns(storage, active.meta.dirName, owned);
    const [files, runs] = await Promise.all([
      storage.list(active.meta.dirName),
      listRuns(storage, active.meta.dirName),
    ]);
    actions.setActive({ ...active, files, runs });
  }),

  createProject: thunk(async (actions, payload, helpers) => {
    const storage = storageFor(helpers.injections, payload.quick ?? false);

    // Fetch lazy (url-only) files first so creation is all-or-nothing.
    const files: { fileName: string; content: string }[] = [];
    for (const file of payload.files) {
      let content = file.content;
      if (content === undefined && file.url) {
        const response = await fetch(file.url);
        if (!response.ok) {
          throw new Error(
            `Could not download ${file.fileName} (HTTP ${response.status}).`,
          );
        }
        content = await response.text();
      }
      files.push({ fileName: file.fileName, content: content ?? "" });
    }

    const scripts = files.filter((f) => isScriptFile(f.fileName));
    const inputScript =
      payload.inputScript ??
      (scripts.length === 1 ? scripts[0].fileName : undefined);

    const meta = await storage.createProject({
      displayName: payload.displayName,
      color: payload.color,
      source: payload.source,
      inputScript,
    });
    for (const file of files) {
      await storage.write(meta.dirName, file.fileName, file.content);
    }
    // A starter notebook that shares the project filesystem — generated once,
    // owned by the user afterwards. Curated notebooks (uploaded/example) win.
    const hasNotebook = files.some((f) => f.fileName.endsWith(".ipynb"));
    if (!hasNotebook) {
      await storage.write(
        meta.dirName,
        "analysis.ipynb",
        JSON.stringify(projectAnalysisNotebook(meta)),
      );
    }

    if (!payload.quick) {
      const projects = await helpers.injections.libraryStorage.listProjects();
      actions.setProjects(projects);
    }
    track("Project.New", { source: payload.source?.type });
    await actions.openProject({
      dirName: meta.dirName,
      quick: payload.quick ?? false,
      tab: "files",
    });
    if (payload.autoStart && inputScript) {
      await actions.startRuns([
        { inputScript, vars: {}, useKokkos: false, threads: 1 },
      ]);
    }
    return meta;
  }),

  renameProject: thunk(
    async (actions, displayName, { getState, injections }) => {
      const active = getState().active;
      if (!active) {
        return;
      }
      const storage = storageFor(injections, active.quick);
      const meta = await storage.updateProjectMeta(active.meta.dirName, {
        displayName,
      });
      actions.patchActiveMeta(meta);
      track("Project.Rename", {});
    },
  ),

  duplicateProject: thunk(async (actions, _, { getState, injections }) => {
    const active = getState().active;
    if (!active) {
      return;
    }
    // Edits still in the debounce buffer belong in the copy.
    await actions.flushPendingSaves();
    const storage = storageFor(injections, active.quick);
    // Remember the source before createProject switches the active project
    // to the copy.
    const sourceDirName = active.meta.dirName;
    const meta = await actions.createProject({
      displayName: `${active.meta.displayName} (copy)`,
      color: active.meta.color,
      // A duplicate is a fork the user intends to change: dropping the
      // example identity makes the copy's runs report its own dir name in
      // metrics instead of the original example forever (#394), and the
      // explicit "duplicate" source keeps Project.New's breakdown honest
      // (undefined would look like a blank creation).
      source: { type: "duplicate" },
      inputScript: active.meta.inputScript,
      files: [],
    });
    // Working tree (nested directories included) + notebook, no runs and a
    // fresh .atomify identity (ADR-003 §5). Copy contents directly so binary
    // files survive (a text-only detour through CreateProjectPayload would
    // empty them); the copied notebook overwrites the template createProject
    // generated.
    const library = storageFor(injections, false);
    const entries = await storage.list(sourceDirName);
    for (const entry of entries) {
      // Exact match: a user file named ".atomify-notes.txt" must be copied;
      // only the identity directory itself stays behind.
      if (entry.path === RUNS_DIR || entry.path === ".atomify") {
        continue;
      }
      if (entry.type === "directory") {
        await copyTree(
          storage,
          sourceDirName,
          library,
          meta.dirName,
          entry.path,
        );
      } else {
        await library.write(
          meta.dirName,
          entry.path,
          await storage.read(sourceDirName, entry.path),
        );
      }
    }
    track("Project.Duplicate", {});
    await actions.refreshActive();
  }),

  deleteProject: thunk(async (actions, dirName, { getState, injections }) => {
    const activeRun = getState().activeRun;
    if (activeRun && activeRun.dirName === dirName) {
      actions.setNotice("This project has a run in progress — stop it first.");
      return;
    }
    await injections.libraryStorage.deleteProject(dirName);
    track("Project.Delete", {});
    const projects = await injections.libraryStorage.listProjects();
    actions.setProjects(projects);
    if (getState().active?.meta.dirName === dirName) {
      actions.setActive(undefined);
      actions.setScreen({ name: "home" });
    }
  }),

  saveQuickAsProject: thunk(async (actions, _, helpers) => {
    const active = helpers.getState().active;
    if (!active || !active.quick) {
      return;
    }
    await actions.flushPendingSaves();
    const { scratchStorage, libraryStorage } = helpers.injections;
    const meta = await libraryStorage.createProject({
      displayName: active.meta.displayName.replace(/^Quick run — /, ""),
      color: active.meta.color,
      source: active.meta.source,
      inputScript: active.meta.inputScript,
    });
    // Everything materializes: working tree AND completed runs (ADR-003).
    const entries = await scratchStorage.list(active.meta.dirName);
    for (const entry of entries) {
      if (entry.path === ".atomify") {
        continue; // fresh identity: keep the new project.json
      }
      if (entry.type === "directory") {
        await copyTree(
          scratchStorage,
          active.meta.dirName,
          libraryStorage,
          meta.dirName,
          entry.path,
        );
      } else {
        await libraryStorage.write(
          meta.dirName,
          entry.path,
          await scratchStorage.read(active.meta.dirName, entry.path),
        );
      }
    }
    const projects = await libraryStorage.listProjects();
    actions.setProjects(projects);
    track("Project.SavedFromQuickRun", {});
    await actions.openProject({ dirName: meta.dirName });
  }),
};

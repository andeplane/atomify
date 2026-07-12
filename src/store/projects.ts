/**
 * The projects model (ADR-001/003): the persisted library, the active
 * project's working tree + run history, navigation state, and run
 * orchestration (single runs and sweeps) on top of the storage layer.
 *
 * Runs execute through the existing simulation model unchanged: each run
 * materializes a legacy `Simulation` whose id is `<dirName>/runs/<runId>`,
 * so the engine pipeline writes into the run directory by construction.
 * This model does the work around that: snapshot, run.json, output copies
 * into project storage, and queue advancement.
 */

import { action, Action, thunk, Thunk, Actions, State } from "easy-peasy";
import { unzipSync, zipSync } from "fflate";
import { StoreModel } from "./model";
import { getFullLammpsOutput, type Simulation } from "./simulation";
import type {
  FileStat,
  ProjectMeta,
  ProjectStorage,
  RunListEntry,
  RunMeta,
} from "../storage";
import {
  allocateRunDir,
  bytesToWriteContent,
  listRuns,
  readRunMeta,
  reconcileRuns,
  RUNS_DIR,
  snapshotWorkingTree,
  validateRelativePath,
  writeRunMeta,
} from "../storage";
import { projectAnalysisNotebook } from "../utils/AnalyzeNotebook";
import { injectKokkosOptIn } from "../utils/kokkos";
import { getWasm } from "../wasm/wasmInstance";
import { track } from "../utils/metrics";

export interface StoreInjections {
  /** The persistent library (JupyterLite contents IndexedDB). */
  libraryStorage: ProjectStorage;
  /** Scratch space for quick runs and embeds — never visible to Jupyter. */
  scratchStorage: ProjectStorage;
}

export type ProjectTab = "files" | "runs" | "notebook";

export type Screen =
  | { name: "home" }
  | { name: "examples" }
  | {
      name: "project";
      dirName: string;
      tab: ProjectTab;
      /** files tab: file open in the editor sub-screen. */
      filePath?: string;
      /** runs tab: run open in the run-detail sub-screen. */
      runId?: string;
    };

export interface ActiveProject {
  meta: ProjectMeta;
  /** True when the project lives on scratch storage (quick run / embed). */
  quick: boolean;
  /** Working-tree root listing (directories included). */
  files: FileStat[];
  runs: RunListEntry[];
}

export interface NewProjectFile {
  fileName: string;
  content?: string;
  url?: string;
}

export interface CreateProjectPayload {
  displayName: string;
  color?: string;
  source?: ProjectMeta["source"];
  files: NewProjectFile[];
  inputScript?: string;
  /** Create on scratch storage (quick run) instead of the library. */
  quick?: boolean;
  /** Start a run immediately after creation. */
  autoStart?: boolean;
}

export interface RunRequest {
  dirName: string;
  quick: boolean;
  inputScript: string;
  vars: Record<string, number>;
  useKokkos: boolean;
  threads: number;
  sweepId?: string;
  /**
   * How the run was launched, for metrics only ("sweep" is derived from
   * sweepId). Defaults to "button".
   */
  origin?: "button" | "file";
}

export type SaveState = "saving" | "saved" | "error";

/** Files ≤ this size stream to storage during the run; larger wait for the end. */
const MID_RUN_COPY_CAP = 4 * 1024 * 1024;
const MID_RUN_COPY_INTERVAL_MS = 3000;

/** Wrapper artifacts from the vars-injection mechanism — engine detail. */
const RUN_INTERNAL_FILE = /^(_vars_|_wrapper_)/;

const SCRIPT_FILE = /(^|\/)in\.[^/]*$|\.in$/;

export function isScriptFile(fileName: string): boolean {
  return SCRIPT_FILE.test(fileName);
}

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

export interface ProjectsModel {
  screen: Screen;
  projects: ProjectMeta[];
  active?: ActiveProject;
  /** Editor cache: project-relative path -> content (active project only). */
  fileContents: Record<string, string>;
  saveStates: Record<string, SaveState>;
  runQueue: RunRequest[];
  /** The run this session is executing right now. */
  activeRun?: { dirName: string; runId: string; quick: boolean };
  /** One-shot notice (toasts): run finished, sweep interrupted, quota… */
  notice?: string;

  setScreen: Action<ProjectsModel, Screen>;
  setProjects: Action<ProjectsModel, ProjectMeta[]>;
  setActive: Action<ProjectsModel, ActiveProject | undefined>;
  patchActiveMeta: Action<ProjectsModel, ProjectMeta>;
  setFileContent: Action<ProjectsModel, { path: string; content: string }>;
  clearFileContents: Action<ProjectsModel, void>;
  setSaveState: Action<ProjectsModel, { path: string; state: SaveState }>;
  setRunQueue: Action<ProjectsModel, RunRequest[]>;
  shiftRunQueue: Action<ProjectsModel, void>;
  setActiveRun: Action<
    ProjectsModel,
    { dirName: string; runId: string; quick: boolean } | undefined
  >;
  setNotice: Action<ProjectsModel, string | undefined>;

  initialize: Thunk<ProjectsModel, void, StoreInjections, StoreModel>;
  openProject: Thunk<
    ProjectsModel,
    { dirName: string; quick?: boolean; tab?: ProjectTab },
    StoreInjections,
    StoreModel
  >;
  refreshActive: Thunk<ProjectsModel, void, StoreInjections, StoreModel>;
  createProject: Thunk<
    ProjectsModel,
    CreateProjectPayload,
    StoreInjections,
    StoreModel,
    Promise<ProjectMeta>
  >;
  renameProject: Thunk<ProjectsModel, string, StoreInjections, StoreModel>;
  duplicateProject: Thunk<ProjectsModel, void, StoreInjections, StoreModel>;
  deleteProject: Thunk<ProjectsModel, string, StoreInjections, StoreModel>;
  saveQuickAsProject: Thunk<ProjectsModel, void, StoreInjections, StoreModel>;
  /**
   * Zip the active project's tree for download: working tree + analysis
   * notebook + .atomify/project.json, plus runs/ when includeRuns.
   */
  exportProject: Thunk<
    ProjectsModel,
    { includeRuns: boolean },
    StoreInjections,
    StoreModel,
    Promise<{ fileName: string; bytes: Uint8Array } | null>
  >;
  /**
   * Create a project from a zip (New Project modal upload path). A
   * .atomify/project.json inside the zip provides displayName/inputScript/
   * color defaults; the explicit displayName/color arguments (the modal's
   * fields) win. Binary-safe: entries are written through the same
   * bytes→content classification the run-output copies use.
   */
  importProject: Thunk<
    ProjectsModel,
    { zip: Uint8Array; displayName?: string; color?: string; quick?: boolean },
    StoreInjections,
    StoreModel,
    Promise<ProjectMeta>
  >;

  readFile: Thunk<
    ProjectsModel,
    string,
    StoreInjections,
    StoreModel,
    Promise<string>
  >;
  saveFileDebounced: Thunk<
    ProjectsModel,
    { path: string; content: string },
    StoreInjections,
    StoreModel
  >;
  flushPendingSaves: Thunk<ProjectsModel, void, StoreInjections, StoreModel>;
  writeFile: Thunk<
    ProjectsModel,
    { path: string; content: string | Uint8Array },
    StoreInjections,
    StoreModel
  >;
  removeFile: Thunk<ProjectsModel, string, StoreInjections, StoreModel>;
  renameFile: Thunk<
    ProjectsModel,
    { from: string; to: string },
    StoreInjections,
    StoreModel
  >;
  setInputScript: Thunk<ProjectsModel, string, StoreInjections, StoreModel>;

  /**
   * Raw read of any project-relative path (binary stays Uint8Array).
   * Defaults to the active project; pass dirName for other projects
   * (e.g. the Home continue card's frame.png). Returns null when missing.
   */
  readFileRaw: Thunk<
    ProjectsModel,
    { path: string; dirName?: string; quick?: boolean },
    StoreInjections,
    StoreModel,
    Promise<string | Uint8Array | null>
  >;
  /** Direct children of a subdir (run output lists, run-frame lookups). */
  listFiles: Thunk<
    ProjectsModel,
    { subdir: string; dirName?: string; quick?: boolean },
    StoreInjections,
    StoreModel,
    Promise<FileStat[]>
  >;
  /** Per-project storage footprint for the Settings storage tab (ADR-003 §5). */
  projectSizes: Thunk<
    ProjectsModel,
    void,
    StoreInjections,
    StoreModel,
    Promise<Record<string, { bytes: number; runs: number }>>
  >;

  startRuns: Thunk<
    ProjectsModel,
    Omit<RunRequest, "dirName" | "quick" | "sweepId">[],
    StoreInjections,
    StoreModel
  >;
  cancelQueuedRuns: Thunk<ProjectsModel, void, StoreInjections, StoreModel>;
  deleteRun: Thunk<ProjectsModel, string, StoreInjections, StoreModel>;
  executeNextRun: Thunk<ProjectsModel, void, StoreInjections, StoreModel>;
}

function storageFor(
  injections: StoreInjections,
  quick: boolean,
): ProjectStorage {
  return quick ? injections.scratchStorage : injections.libraryStorage;
}

/** Recursively copy a directory subtree between storages (same layout). */
async function copyTree(
  from: ProjectStorage,
  fromDir: string,
  to: ProjectStorage,
  toDir: string,
  subdir?: string,
) {
  const entries = await from.list(fromDir, subdir);
  for (const entry of entries) {
    if (entry.type === "directory") {
      await copyTree(from, fromDir, to, toDir, entry.path);
    } else {
      await to.write(toDir, entry.path, await from.read(fromDir, entry.path));
    }
  }
}

/** Best-effort viewport capture for `frame.png` (ADR-003 §2). */
async function captureViewport(): Promise<Uint8Array | null> {
  try {
    // Only the simulation viewport (the container View renders the
    // visualizer into) counts. A bare `canvas` query would grab whatever
    // canvas happens to be first — Monaco's minimap, a notebook chart —
    // once the user navigates away and View unmounts.
    const canvas = document.querySelector<HTMLCanvasElement>(
      "#canvas-container canvas",
    );
    if (!canvas || canvas.width === 0) {
      return null;
    }
    // The visualizer renders in its own rAF loop and WebGL drawing buffers
    // (preserveDrawingBuffer: false) are invalidated after compositing.
    // Waiting two frames and reading the pixels synchronously right after the
    // rAF callback — before this frame composites — captures real pixels
    // instead of a black frame. toDataURL is used over toBlob because it is
    // synchronous: toBlob's callback lands after compositing.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1];
    if (!base64) {
      return null;
    }
    const binary = atob(base64);
    if (binary.length < 200) {
      // Empty/cleared buffers compress to nearly nothing; skip those.
      return null;
    }
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

export const projectsModel: ProjectsModel = {
  screen: { name: "home" },
  projects: [],
  fileContents: {},
  saveStates: {},
  runQueue: [],

  setScreen: action((state, screen) => {
    state.screen = screen;
  }),
  setProjects: action((state, projects) => {
    state.projects = projects;
  }),
  setActive: action((state, active) => {
    state.active = active;
  }),
  patchActiveMeta: action((state, meta) => {
    if (state.active) {
      state.active.meta = meta;
    }
    state.projects = state.projects.map((p) =>
      p.dirName === meta.dirName ? meta : p,
    );
  }),
  setFileContent: action((state, { path, content }) => {
    state.fileContents[path] = content;
  }),
  clearFileContents: action((state) => {
    state.fileContents = {};
    state.saveStates = {};
  }),
  setSaveState: action((state, { path, state: saveState }) => {
    state.saveStates[path] = saveState;
  }),
  setRunQueue: action((state, queue) => {
    state.runQueue = queue;
  }),
  shiftRunQueue: action((state) => {
    state.runQueue = state.runQueue.slice(1);
  }),
  setActiveRun: action((state, run) => {
    state.activeRun = run;
  }),
  setNotice: action((state, notice) => {
    state.notice = notice;
  }),

  initialize: thunk(async (actions, _, { injections }) => {
    const projects = await injections.libraryStorage.listProjects();
    actions.setProjects(projects);
  }),

  openProject: thunk(
    async (actions, { dirName, quick = false, tab }, helpers) => {
      const storage = storageFor(helpers.injections, quick);
      const metas = await storage.listProjects();
      const meta = metas.find((m) => m.dirName === dirName);
      if (!meta) {
        actions.setNotice(`Project ${dirName} was not found.`);
        return;
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
      source: active.meta.source,
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
      if (entry.path === RUNS_DIR || entry.path.startsWith(".atomify")) {
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
      if (entry.path.startsWith(".atomify")) {
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

  startRuns: thunk(async (actions, requests, { getState }) => {
    const active = getState().active;
    if (!active || requests.length === 0) {
      return;
    }
    const sweepId =
      requests.length > 1
        ? `sweep-${Math.random().toString(36).slice(2, 8)}`
        : undefined;
    if (sweepId) {
      // varCount = variables actually swept (taking >1 distinct value).
      const values = new Map<string, Set<number>>();
      for (const request of requests) {
        for (const [name, value] of Object.entries(request.vars)) {
          const set = values.get(name) ?? new Set<number>();
          set.add(value);
          values.set(name, set);
        }
      }
      track("Sweep.Create", {
        varCount: [...values.values()].filter((set) => set.size > 1).length,
        runCount: requests.length,
      });
    }
    const queue: RunRequest[] = requests.map((request) => ({
      ...request,
      dirName: active.meta.dirName,
      quick: active.quick,
      sweepId,
    }));
    actions.setRunQueue([...getState().runQueue, ...queue]);
    await actions.executeNextRun();
  }),

  cancelQueuedRuns: thunk((actions) => {
    actions.setRunQueue([]);
  }),

  deleteRun: thunk(async (actions, runId, { getState, injections }) => {
    const active = getState().active;
    if (!active) {
      return;
    }
    const activeRun = getState().activeRun;
    if (activeRun && activeRun.runId === runId) {
      actions.setNotice("This run is in progress — stop it first.");
      return;
    }
    await storageFor(injections, active.quick).remove(
      active.meta.dirName,
      `${RUNS_DIR}/${runId}`,
    );
    await actions.refreshActive();
  }),

  executeNextRun: thunk(async (actions, _, helpers) => {
    const { getState, getStoreState, getStoreActions, injections } = helpers;
    if (getState().activeRun) {
      return;
    }
    const request = getState().runQueue[0];
    if (!request) {
      return;
    }
    actions.shiftRunQueue();
    // Claim the executor slot SYNCHRONOUSLY (no await since the guard above):
    // a concurrent executeNextRun (double-click Run, queue advance racing a
    // new startRuns) must see activeRun set, or two engines' worth of state
    // fight over one wasm instance and one run-NNN id.
    actions.setActiveRun({
      dirName: request.dirName,
      runId: "pending",
      quick: request.quick,
    });

    const storage = storageFor(injections, request.quick);
    const storeActions = getStoreActions() as Actions<StoreModel>;
    const lammps = (getStoreState() as State<StoreModel>).simulation.lammps;
    if (!lammps) {
      actions.setNotice("The simulation engine is still loading.");
      actions.setRunQueue([]);
      actions.setActiveRun(undefined);
      return;
    }

    await actions.flushPendingSaves();

    // 1. Claim the run directory and snapshot the working tree (ADR-001 §5).
    const runId = await allocateRunDir(storage, request.dirName);
    // Record the real run id immediately: reconcileRuns (window focus, tab
    // clicks) builds its owned set from activeRun.runId, and the snapshot
    // below can take seconds — "pending" would leave run-NNN unowned and
    // zombie-marked mid-claim.
    actions.setActiveRun({
      dirName: request.dirName,
      runId,
      quick: request.quick,
    });
    const { copied, gaps } = await snapshotWorkingTree(
      storage,
      request.dirName,
      runId,
    );
    const snapshotFiles = new Set(copied);
    let runMeta: RunMeta = {
      schemaVersion: 1,
      id: runId,
      inputScript: request.inputScript,
      vars: Object.keys(request.vars).length ? request.vars : undefined,
      sweepId: request.sweepId,
      status: "running",
      startedAt: new Date().toISOString(),
      snapshotGaps: gaps && gaps.length ? gaps : undefined,
      origin: request.sweepId ? "sweep" : "app",
    };
    await writeRunMeta(storage, request.dirName, runMeta);
    track("Run.Start", {
      origin: request.sweepId ? "sweep" : (request.origin ?? "button"),
      kokkos: request.useKokkos,
      hasVars: Object.keys(request.vars).length > 0,
    });
    actions.setScreen({
      name: "project",
      dirName: request.dirName,
      tab: "runs",
      runId,
    });
    await actions.refreshActive();

    // 2. Materialize the legacy Simulation from the snapshot: its id is the
    //    run directory, so the whole engine pipeline (kokkos preprocessing,
    //    vars wrapper, wasm FS writes, streaming) lands inside the run.
    const snapshotEntries = await storage.list(
      request.dirName,
      `${RUNS_DIR}/${runId}`,
    );
    const files = [];
    const binaryFiles: { fileName: string; bytes: Uint8Array }[] = [];
    for (const entry of snapshotEntries) {
      if (entry.type === "directory") {
        continue;
      }
      const relative = entry.path.slice(`${RUNS_DIR}/${runId}/`.length);
      if (relative.startsWith(".atomify")) {
        continue;
      }
      const content = await storage.read(request.dirName, entry.path);
      if (typeof content === "string") {
        files.push({ fileName: relative, content });
      } else {
        // Binary inputs (restart files, .npy…) must reach the engine FS
        // byte-exact — TextDecoder would mangle them into U+FFFD soup.
        // They bypass the Simulation object (whose files are editor-facing
        // text) and are written to the run's wasm dir directly below.
        binaryFiles.push({ fileName: relative, bytes: content });
      }
    }
    // The Multithreading toggle (New Run modal): KOKKOS acceleration is
    // engaged per run by the `suffix kk` marker in the input script (the
    // engine's `-sf kk -k on t 4` args are constant; syncFilesWasm applies
    // serial-styles preprocessing to scripts WITHOUT the marker — see
    // src/utils/kokkos.ts). When the toggle is on and the script doesn't
    // already opt in, inject the marker into the materialized copy here —
    // the working tree and the run snapshot keep the original text. When
    // the toggle is off we leave opted-in scripts alone: the toggle
    // defaults from the script, so "off" only means "don't inject".
    if (request.useKokkos) {
      const mainScript = files.find(
        (file) => file.fileName === request.inputScript,
      );
      if (mainScript) {
        mainScript.content = injectKokkosOptIn(mainScript.content);
      }
    }
    const simulation: Simulation = {
      id: `${request.dirName}/${RUNS_DIR}/${runId}`,
      files,
      inputScript: request.inputScript,
      start: false,
      vars: Object.keys(request.vars).length ? request.vars : undefined,
    };

    // 3. Copy outputs out of the worker FS into project storage on a
    //    throttle, so the notebook can analyze a run in flight (ADR-002 §4).
    const workdir = `/${simulation.id}`;
    const copyOutputs = async (maxBytes?: number) => {
      if (!lammps.snapshotWorkdir) {
        return;
      }
      try {
        const snapshot = await lammps.snapshotWorkdir(workdir, maxBytes);
        for (const file of snapshot.files) {
          if (RUN_INTERNAL_FILE.test(file.path)) {
            continue;
          }
          // The engine wrote the snapshotted inputs into its FS itself —
          // possibly preprocessed (kokkos suffix rewriting) — so copying
          // them back would overwrite the pristine snapshot with mangled
          // text and break run provenance (ADR-001 §2). Skip everything
          // snapshotWorkingTree copied; only genuine outputs come back.
          // (Trade-off: a run that MODIFIES an input file in place keeps
          // the authored version in the snapshot — provenance wins.)
          if (snapshotFiles.has(file.path)) {
            continue;
          }
          await storage.write(
            request.dirName,
            `${RUNS_DIR}/${runId}/${file.path}`,
            bytesToWriteContent(file.path, file.bytes),
          );
        }
      } catch (error) {
        actions.setNotice(
          `Could not copy run outputs to storage: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    };

    let stopReason: string = "failed";
    let errorMessage: string | undefined;
    const interval = setInterval(() => {
      void copyOutputs(MID_RUN_COPY_CAP);
    }, MID_RUN_COPY_INTERVAL_MS);
    try {
      await storeActions.simulation.newSimulation(simulation);
      for (const file of binaryFiles) {
        getWasm().FS.writeFile(
          `/${simulation.id}/${file.fileName}`,
          file.bytes,
        );
      }
      const result = (await storeActions.simulation.run()) as
        | { stopReason: string; errorMessage?: string }
        | undefined;
      // run() returns undefined on its guard paths (engine busy, input
      // script missing from the snapshot) — the run never executed.
      stopReason = result?.stopReason ?? "failed";
      errorMessage =
        result?.errorMessage ??
        (result
          ? undefined
          : ((getStoreState() as State<StoreModel>).simulation.lastError ??
            "The engine did not start this run."));
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      clearInterval(interval);
    }

    // 4. Final full output copy + run.json + best-effort frame capture.
    await copyOutputs(undefined);
    const lammpsState = (getStoreState() as State<StoreModel>).simulation;
    // This wasm build streams LAMMPS output to stdout instead of writing a
    // log file; persist the captured console as the run's log.lammps
    // (ADR-003 §4.6 renders finished-run consoles from it). A log the engine
    // did write itself wins. The source is the UNCAPPED accumulator, not
    // state.lammpsOutput (a display buffer capped at 2000 lines) — long runs
    // must keep their header and thermo columns.
    try {
      const logPath = `${RUNS_DIR}/${runId}/log.lammps`;
      const engineLog = await storage.stat(request.dirName, logPath);
      const fullLog = getFullLammpsOutput();
      if (!engineLog && fullLog.length > 0) {
        await storage.write(
          request.dirName,
          logPath,
          fullLog.join("\n") + "\n",
        );
      }
    } catch {
      // The log is a convenience copy; never fail the run over it.
    }
    const existing = await readRunMeta(storage, request.dirName, runId);
    runMeta = {
      ...(existing ?? runMeta),
      status:
        stopReason === "canceled"
          ? "canceled"
          : stopReason === "failed"
            ? "failed"
            : "completed",
      finishedAt: new Date().toISOString(),
      error: stopReason === "failed" ? errorMessage : undefined,
      stats: {
        timesteps: lammps.getTimesteps(),
        numAtoms: lammps.getNumAtoms(),
        wallSeconds:
          (Date.now() - new Date(runMeta.startedAt).getTime()) / 1000,
      },
    };
    await writeRunMeta(storage, request.dirName, runMeta);
    track("Run.Finish", {
      status: runMeta.status,
      wallSeconds: runMeta.stats?.wallSeconds,
      timesteps: runMeta.stats?.timesteps,
    });
    const frame = await captureViewport();
    if (frame) {
      try {
        await storage.write(
          request.dirName,
          `${RUNS_DIR}/${runId}/.atomify/frame.png`,
          frame,
        );
      } catch {
        // Frame capture is decorative; never fail the run over it.
      }
    }

    actions.setActiveRun(undefined);
    await actions.refreshActive();
    const state = getState();
    if (state.screen.name !== "project" || state.screen.runId !== runId) {
      actions.setNotice(
        `Run #${runId.replace(/^run-0*/, "")} ${runMeta.status}.`,
      );
    }
    if (lammpsState.running) {
      // Defensive: the engine reported running after run() settled.
      return;
    }
    // 5. Advance the sweep queue.
    await actions.executeNextRun();
  }),
};

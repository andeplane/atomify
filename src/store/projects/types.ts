/**
 * Types of the projects model (ADR-001/003): navigation state, the active
 * project, run requests and the ProjectsModel shape that the slices in this
 * folder implement together.
 */

import type { Action, Thunk } from "easy-peasy";
import type { StoreModel } from "../model";
import type {
  FileStat,
  ProjectMeta,
  ProjectStorage,
  RunListEntry,
} from "../../storage";
import type { EngineRegistry } from "../../engine/EngineRegistry";

export interface StoreInjections {
  /** The persistent library (JupyterLite contents IndexedDB). */
  libraryStorage: ProjectStorage;
  /** Scratch space for quick runs and embeds — never visible to Jupyter. */
  scratchStorage: ProjectStorage;
  /** The live engine, renderer and modifier objects (outside the store). */
  engine: EngineRegistry;
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
  continueFrom?: { runId: string; steps: number };
  replayOf?: string;
  viewOnly?: boolean;
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
  /**
   * Curated example id when the project came from the example library, for
   * metrics only. Resolved once from the active project's meta at enqueue
   * (startRuns) so the executor needs no storage read per run.
   */
  exampleId?: string;
}

export type SaveState = "saving" | "saved" | "error";

export interface ResidentRun {
  dirName: string;
  runId: string;
  quick: boolean;
  workdirId: string;
  inputFiles: string[];
}

export interface ProjectsModel {
  /** Only the last completed live engine state can be continued. Never persisted. */
  residentRun?: ResidentRun;
  setResidentRun: Action<ProjectsModel, ResidentRun | undefined>;
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
    // exampleId is also omitted: it is resolved here from the active
    // project's meta — a caller-supplied value would be silently overridden.
    Omit<RunRequest, "dirName" | "quick" | "sweepId" | "exampleId">[],
    StoreInjections,
    StoreModel
  >;
  cancelQueuedRuns: Thunk<ProjectsModel, void, StoreInjections, StoreModel>;
  deleteRun: Thunk<ProjectsModel, string, StoreInjections, StoreModel>;
  executeNextRun: Thunk<ProjectsModel, void, StoreInjections, StoreModel>;
}

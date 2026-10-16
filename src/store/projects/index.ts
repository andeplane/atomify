/**
 * The projects model (ADR-001/003): the persisted library, the active
 * project's working tree + run history, navigation state, and run
 * orchestration (single runs and sweeps) on top of the storage layer.
 *
 * A run executes through the run pipeline (engine/RunController.ts) in its
 * own engine workdir, `<dirName>/runs/<runId>`, so the engine writes into
 * the run directory by construction. This model does the work around it:
 * the queue, the run directory with its snapshot and initial run.json, the
 * resident run a continuation needs, and queue advancement.
 *
 * The model is composed from slices by responsibility: state.ts (state and
 * plain actions), library.ts (project lifecycle), archive.ts (zip export/
 * import), files.ts (file operations) and runs.ts (run queue and executor).
 */

import { STORAGE_FULL_RUN_ERROR } from "../../engine/RunController";
import { archiveThunks } from "./archive";
import { fileThunks } from "./files";
import { libraryThunks } from "./library";
import { runThunks } from "./runs";
import { projectsState } from "./state";
import type { ProjectsModel } from "./types";

export { STORAGE_FULL_RUN_ERROR };
export { isScriptFile } from "./helpers";
export type {
  ActiveProject,
  CreateProjectPayload,
  NewProjectFile,
  ProjectsModel,
  ProjectTab,
  ResidentRun,
  RunRequest,
  SaveState,
  Screen,
  StoreInjections,
} from "./types";

export const projectsModel: ProjectsModel = {
  ...projectsState,
  ...libraryThunks,
  ...archiveThunks,
  ...fileThunks,
  ...runThunks,
};

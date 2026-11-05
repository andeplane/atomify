/**
 * The projects model's initial state and its plain (synchronous) actions.
 */

import { action } from "easy-peasy";
import type { ProjectsModel } from "./types";

export const projectsState: Pick<
  ProjectsModel,
  | "screen"
  | "projects"
  | "fileContents"
  | "saveStates"
  | "runQueue"
  | "setScreen"
  | "setProjects"
  | "setActive"
  | "patchActiveMeta"
  | "setFileContent"
  | "clearFileContents"
  | "setSaveState"
  | "setRunQueue"
  | "shiftRunQueue"
  | "setResidentRun"
  | "setActiveRun"
  | "setNotice"
> = {
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
  setResidentRun: action((state, run) => {
    state.residentRun = run;
  }),
  setActiveRun: action((state, run) => {
    state.activeRun = run;
  }),
  setNotice: action((state, notice) => {
    state.notice = notice;
  }),
};

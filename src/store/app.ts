import { action, Action } from "easy-peasy";
import { isEmbeddedMode } from "../utils/embeddedMode";

interface Status {
  title: String;
  text: String;
  progress: number;
}

export interface SimulationFile {
  fileName: string;
  content?: string;
  url?: string;
}

export interface AppModel {
  selectedMenu: string;
  status?: Status;
  preferredView?: string;
  selectedFile?: SimulationFile;
  setSelectedMenu: Action<AppModel, string>;
  setPreferredView: Action<AppModel, string | undefined>;
  setSelectedFile: Action<AppModel, SimulationFile>;
  setStatus: Action<AppModel, Status | undefined>;
}

// Check if we're in embedded mode at initialization
function getInitialSelectedMenu(): string {
  // Use shared utility function to determine embedded mode. isEmbeddedMode() is safe to call on the server.
  return isEmbeddedMode() ? "view" : "examples";
}

export const appModel: AppModel = {
  selectedMenu: getInitialSelectedMenu(),
  setSelectedMenu: action((state, selectedMenu: string) => {
    state.selectedMenu = selectedMenu;
  }),
  setPreferredView: action((state, preferredView?: string) => {
    state.preferredView = preferredView;
  }),
  setSelectedFile: action((state, selectedFile?: SimulationFile) => {
    state.selectedFile = selectedFile;
  }),
  setStatus: action((state, status?: Status) => {
    state.status = status;
  }),
};

import { action, Action } from "easy-peasy";

interface Status {
  title: string;
  text: string;
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
  setSelectedFile: Action<AppModel, SimulationFile | undefined>;
  setStatus: Action<AppModel, Status | undefined>;
}

export const appModel: AppModel = {
  // The shell drives this legacy gate ("view" streams particles into the
  // renderer); embedded mode and its menu are gone.
  selectedMenu: "examples",
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

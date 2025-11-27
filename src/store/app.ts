import { action, Action } from "easy-peasy";

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
  if (typeof window === 'undefined') return "examples";
  
  const urlSearchParams = new URLSearchParams(window.location.search);
  const embeddedSimulationUrl = urlSearchParams.get('embeddedSimulationUrl');
  const simulationIndex = parseInt(urlSearchParams.get('simulationIndex') || '0', 10);
  const embeddedData = urlSearchParams.get('data');
  const embedParam = urlSearchParams.get('embed');
  
  // Same logic as useEmbeddedMode hook
  const isEmbeddedMode = Boolean(
    (embeddedSimulationUrl && simulationIndex >= 0) || 
    (embeddedData && embedParam === 'true')
  );
  
  return isEmbeddedMode ? "view" : "examples";
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

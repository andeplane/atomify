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
  /**
   * True while the shell shows the live run-detail screen (the 3D viewport of
   * the running simulation). New Particles/Bonds are only registered for the
   * renderer (EngineRegistry), and viewport keyboard shortcuts only fire,
   * while this is set.
   * Driven by Shell.tsx (ADR-003).
   */
  liveViewportVisible: boolean;
  status?: Status;
  engineError?: string;
  setEngineError: Action<AppModel, string | undefined>;
  setLiveViewportVisible: Action<AppModel, boolean>;
  setStatus: Action<AppModel, Status | undefined>;
}

export const appModel: AppModel = {
  setEngineError: action((state, error) => {
    state.engineError = error;
  }),
  liveViewportVisible: false,
  setLiveViewportVisible: action((state, visible: boolean) => {
    state.liveViewportVisible = visible;
  }),
  setStatus: action((state, status?: Status) => {
    state.status = status;
  }),
};

import { action, Action } from "easy-peasy";

export interface RenderSettings {
  ssao: boolean;
  brightness: number;
}

export interface SimulationSettings {
  speed: number;
  uiUpdateFrequency: number;
}

export interface SettingsModel {
  render: RenderSettings;
  simulation: SimulationSettings;
  setRender: Action<SettingsModel, RenderSettings>;
  setSimulation: Action<SettingsModel, SimulationSettings>;
}

export const settingsModel: SettingsModel = {
  simulation: {
    speed: 1,
    uiUpdateFrequency: 15,
  },
  render: {
    ssao: true,
    brightness: 1.0,
  },
  setRender: action((state, render: RenderSettings) => {
    state.render = render;
  }),
  setSimulation: action((state, simulation: SimulationSettings) => {
    state.simulation = {
      ...state.simulation,
      ...simulation,
    };
    // @ts-ignore
    window.syncFrequency = state.simulation.speed;
  }),
};

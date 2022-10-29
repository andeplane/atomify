import { action, Action } from 'easy-peasy';

export interface RenderSettings {
  ssao: boolean
  brightness: number
}

export interface SimulationSettings {
  speed: number
}

export interface SettingsModel {
  render: RenderSettings
  simulation: SimulationSettings
  hideWelcome: boolean
  setRender: Action<SettingsModel, RenderSettings>
  setSimulation: Action<SettingsModel, SimulationSettings>
  setHideWelcome: Action<SettingsModel, boolean>
}

export const settingsModel: SettingsModel = {
  hideWelcome: false,
  simulation: {
    speed: 1
  },
  render: {
    ssao: true,
    brightness: 1.0
  },
  setHideWelcome: action((state, value: boolean) => {
    state.hideWelcome = value
  }),
  setRender: action((state, render: RenderSettings) => {
    state.render = render
  }),
  setSimulation: action((state, simulation: SimulationSettings) => {
    state.simulation = simulation
    // @ts-ignore
    window.syncFrequency = simulation.speed
  }),
};

import { action, Action } from "easy-peasy";

export interface RenderSettings {
  ssao: boolean;
  ambientLightIntensity: number;
  pointLightIntensity: number;
  showSimulationBox: boolean;
}

const RENDER_SETTINGS_STORAGE_KEY = "atomify_render_settings";

export const loadRenderSettingsFromStorage = (): Partial<RenderSettings> => {
  try {
    const stored = localStorage.getItem(RENDER_SETTINGS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Failed to load render settings from localStorage", e);
  }
  return {};
};

export const saveRenderSettingsToStorage = (settings: RenderSettings) => {
  try {
    localStorage.setItem(RENDER_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn("Failed to save render settings to localStorage", e);
  }
};

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

const defaultRenderSettings: RenderSettings = {
  ssao: true,
  ambientLightIntensity: 0.05,
  pointLightIntensity: 20.0,
  showSimulationBox: true,
};

// Load settings from localStorage on initialization
const loadedSettings = loadRenderSettingsFromStorage();
const initialRenderSettings: RenderSettings = {
  ...defaultRenderSettings,
  ...loadedSettings,
};

export const settingsModel: SettingsModel = {
  simulation: {
    speed: 1,
    uiUpdateFrequency: 15,
  },
  render: initialRenderSettings,
  setRender: action((state, render: RenderSettings) => {
    state.render = render;
    saveRenderSettingsToStorage(render);
  }),
  setSimulation: action((state, simulation: SimulationSettings) => {
    state.simulation = simulation;
    window.syncFrequency = simulation.speed;
  }),
};

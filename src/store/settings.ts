import { action, Action } from 'easy-peasy';

export interface RenderSettings {
  ssao: boolean
  brightness: number
}

export interface SettingsModel {
  render: RenderSettings
  setRender: Action<SettingsModel, RenderSettings>
}

export const settingsModel: SettingsModel = {
  render: {
    ssao: true,
    brightness: 1.0
  },
  setRender: action((state, render: RenderSettings) => {
    state.render = render
  }),
};

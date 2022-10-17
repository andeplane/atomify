import { action, Action } from 'easy-peasy';

export interface RenderSettingsModel {
  ssao: boolean
  brightness: number
  setSsao: Action<RenderSettingsModel, boolean>
  setBrightness: Action<RenderSettingsModel, number>
}

export const renderSettingsModel: RenderSettingsModel = {
  ssao: true,
  brightness: 1.0,
  setSsao: action((state, ssao: boolean) => {
    state.ssao = ssao
  }),
  setBrightness: action((state, brightness: number) => {
    state.brightness = brightness
  }),
};

import { SimulationModel, simulationModel } from './simulation'
import { RenderSettingsModel, renderSettingsModel } from './rendersettings'
import { persist } from 'easy-peasy';

export interface StoreModel {
  simulation: SimulationModel;
  renderSettings: RenderSettingsModel
}

export const storeModel: StoreModel = {
  simulation: simulationModel,
  renderSettings: persist(renderSettingsModel)
};

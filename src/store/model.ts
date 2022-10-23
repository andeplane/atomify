import { SimulationModel, simulationModel } from './simulation'
import { SettingsModel, settingsModel } from './settings'
import { persist } from 'easy-peasy';

export interface StoreModel {
  simulation: SimulationModel;
  settings: SettingsModel
}

export const storeModel: StoreModel = {
  simulation: simulationModel,
  settings: persist(settingsModel)
};

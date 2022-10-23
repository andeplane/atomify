import { SimulationModel, simulationModel } from './simulation'
import { SettingsModel, settingsModel } from './settings'
import { SimulationStatusModel, simulationStatusModel } from './simulationstatus'
import { persist } from 'easy-peasy';

export interface StoreModel {
  simulation: SimulationModel;
  settings: SettingsModel,
  simulationStatus: SimulationStatusModel
}

export const storeModel: StoreModel = {
  simulation: simulationModel,
  settings: persist(settingsModel),
  simulationStatus: simulationStatusModel
};

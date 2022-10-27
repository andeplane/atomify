import { SimulationModel, simulationModel } from './simulation'
import { SettingsModel, settingsModel } from './settings'
import { SimulationStatusModel, simulationStatusModel } from './simulationstatus'
import { ProcessingModel, processingModel } from './processing'
import { RenderModel, renderModel } from './render'
import { persist } from 'easy-peasy';

export interface StoreModel {
  simulation: SimulationModel;
  settings: SettingsModel,
  simulationStatus: SimulationStatusModel,
  processing: ProcessingModel,
  render: RenderModel
}

export const storeModel: StoreModel = {
  simulation: simulationModel,
  settings: persist(settingsModel),
  simulationStatus: simulationStatusModel,
  processing: processingModel,
  render: renderModel
};

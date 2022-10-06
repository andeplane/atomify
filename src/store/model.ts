import { SimulationModel, simulationModel } from './simulation'

export interface StoreModel {
  simulation: SimulationModel;
}

export const storeModel: StoreModel = {
  simulation: simulationModel
};

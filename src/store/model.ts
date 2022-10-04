import { LammpsModel, lammpsModel } from './lammps'
import { SimulationModel, simulationModel } from './simulation'

export interface StoreModel {
  lammps: LammpsModel;
  simulation: SimulationModel;
}

export const storeModel: StoreModel = {
  lammps: lammpsModel,
  simulation: simulationModel
};

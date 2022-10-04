import { FilesModel, filesModel } from './files';
import { LammpsModel, lammpsModel } from './lammps'
import { SimulationModel, simulationModel } from './simulation'

export interface StoreModel {
  lammps: LammpsModel;
  files: FilesModel;
  simulation: SimulationModel;
}

export const storeModel: StoreModel = {
  lammps: lammpsModel,
  files: filesModel,
  simulation: simulationModel
};

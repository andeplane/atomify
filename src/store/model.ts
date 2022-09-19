import { FilesModel, filesModel } from './files';
import { LammpsModel, lammpsModel } from './lammps'

export interface StoreModel {
  lammps: LammpsModel;
  files: FilesModel;
}

export const storeModel: StoreModel = {
  lammps: lammpsModel,
  files: filesModel
};

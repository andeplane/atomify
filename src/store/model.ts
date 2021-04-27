import { LammpsModel, lammpsModel } from './lammps'

export interface StoreModel {
  lammps: LammpsModel;
}

export const storeModel: StoreModel = {
  lammps: lammpsModel
};

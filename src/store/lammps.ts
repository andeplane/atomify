import { action, Action } from 'easy-peasy';
import {LAMMPSWeb} from 'types'

export interface LammpsModel {
  lammps?: LAMMPSWeb
  setLammps: Action<LammpsModel, LAMMPSWeb>;
}

export const lammpsModel: LammpsModel = {
  lammps: undefined,
  // methods
  setLammps: action((state, lammps: LAMMPSWeb) => {
    state.lammps = lammps
  })
};

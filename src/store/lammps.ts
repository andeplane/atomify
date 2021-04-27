import { action, Action } from 'easy-peasy';
import {LammpsWeb} from 'types'

export interface LammpsModel {
  wasm?: any
  lammps?: LammpsWeb
  setWasm: Action<LammpsModel, any>
  resetLammps: Action<LammpsModel, void>
  loadLJ: Action<LammpsModel, void>
}

export const lammpsModel: LammpsModel = {
  lammps: undefined,
  // methods
  setWasm: action((state, wasm: any) => {
    state.wasm = wasm
  }),
  resetLammps: action((state) => {
    state.lammps = new state.wasm.LAMMPSWeb() as LammpsWeb
  }),
  loadLJ: action((state) => {
    state.lammps = new state.wasm.LAMMPSWeb() as LammpsWeb
    state.lammps.loadLJ()
  }),

};

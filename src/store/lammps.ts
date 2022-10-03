import { action, Action } from 'easy-peasy';
import {LammpsWeb} from '../types'

export interface LammpsModel {
  wasm?: any
  running: boolean
  lammps?: LammpsWeb
  setRunning: Action<LammpsModel, boolean>
  setWasm: Action<LammpsModel, any>
  resetLammps: Action<LammpsModel, void>
  loadLJ: Action<LammpsModel, void>
}

export const lammpsModel: LammpsModel = {
  lammps: undefined,
  running: false,
  // methods
  setRunning: action((state, running: boolean) => {
    state.running = running
  }),
  setWasm: action((state, wasm: any) => {
    state.wasm = wasm
  }),
  resetLammps: action((state) => {
    state.lammps = new state.wasm.LAMMPSWeb() as LammpsWeb
    //@ts-ignore
    window.lammps = state.lammps
  }),
  loadLJ: action((state) => {
    state.lammps = new state.wasm.LAMMPSWeb() as LammpsWeb
    //@ts-ignore
    window.lammps = state.lammps
    state.lammps.loadLJ()
  }),

};

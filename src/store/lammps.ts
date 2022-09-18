import { action, Action } from 'easy-peasy';
import {LammpsWeb} from 'types'

export interface LammpsModel {
  wasm?: any
  running: boolean
  lammps?: LammpsWeb
  synchronizationCounter: number
  setRunning: Action<LammpsModel, boolean>
  setSynchronizationCounter: Action<LammpsModel, number>
  setWasm: Action<LammpsModel, any>
  resetLammps: Action<LammpsModel, void>
  loadLJ: Action<LammpsModel, void>
}

export const lammpsModel: LammpsModel = {
  lammps: undefined,
  running: false,
  synchronizationCounter: 0,
  // methods
  setRunning: action((state, running: boolean) => {
    state.running = running
  }),
  setWasm: action((state, wasm: any) => {
    state.wasm = wasm
  }),
  setSynchronizationCounter: action((state, synchronizationCounter) => {
    state.synchronizationCounter = synchronizationCounter
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

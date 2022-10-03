import { action, Action } from 'easy-peasy';
import {LammpsWeb} from '../types'

export interface LammpsModel {
  wasm?: any
  running: boolean
  lammps?: LammpsWeb
  syncFrequency: number
  setSyncFrequency: Action<LammpsModel, number>, 
  setRunning: Action<LammpsModel, boolean>
  setWasm: Action<LammpsModel, any>
  resetLammps: Action<LammpsModel, void>
  loadLJ: Action<LammpsModel, void>
}

export const lammpsModel: LammpsModel = {
  lammps: undefined,
  running: false,
  syncFrequency: 2,
  // methods
  setRunning: action((state, running: boolean) => {
    state.running = running
  }),
  setWasm: action((state, wasm: any) => {
    state.wasm = wasm
  }),
  resetLammps: action((state) => {
    console.log("Existing ", state.lammps)
    if (state.lammps == null) {
      state.lammps = new state.wasm.LAMMPSWeb() as LammpsWeb
      //@ts-ignore
      window.lammps = state.lammps
    } 
    state.lammps.start()
    state.running = false
    state.lammps.setSyncFrequency(state.syncFrequency)
    //@ts-ignore
    window.lammps = state.lammps
  }),
  setSyncFrequency: action((state, syncFrequency: number) => {
    // @ts-ignore
    window.syncFrequency = syncFrequency
    state.syncFrequency = syncFrequency
  }),
  loadLJ: action((state) => {
    if (state.lammps == null) {
      state.lammps = new state.wasm.LAMMPSWeb() as LammpsWeb
      //@ts-ignore
      window.lammps = state.lammps
    }
    state.lammps.loadLJ()
  }),

};

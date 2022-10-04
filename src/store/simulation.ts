import { action, Action } from 'easy-peasy';
import {LammpsWeb} from '../types'

export interface SimulationModel {
  files: string[]
  setFiles: Action<SimulationModel, string[]>
  lammps?: LammpsWeb
  reset: Action<SimulationModel, undefined>
}

export const simulationModel: SimulationModel = {
  files: [],
  setFiles: action((state, files: string[]) => {
    state.files = files
  }),
  reset: action((state) => {
    state.files = []
    state.lammps = undefined
  })
};

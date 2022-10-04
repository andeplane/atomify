import { action, Action } from 'easy-peasy';
import {LammpsWeb} from '../types'
import {Particles} from 'omovi'

interface Status {
  title: String
  text: String
}

export interface SimulationModel {
  loading: boolean
  status?: Status
  files: string[]
  particles?: Particles
  setParticles: Action<SimulationModel, Particles>
  setFiles: Action<SimulationModel, string[]>
  setStatus: Action<SimulationModel, Status>
  lammps?: LammpsWeb
  reset: Action<SimulationModel, undefined>
}

export const simulationModel: SimulationModel = {
  loading: false,
  files: [],
  setFiles: action((state, files: string[]) => {
    state.files = files
  }),
  setParticles: action((state, particles: Particles) => {
    state.particles = particles
  }),
  setStatus: action((state, status?: Status) => {
    state.status = status
  }),
  reset: action((state) => {
    state.files = []
    state.lammps = undefined
  })
};

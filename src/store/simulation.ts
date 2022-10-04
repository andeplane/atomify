import { action, Action, thunk, Thunk } from 'easy-peasy';
import {LammpsWeb} from '../types'
import {Particles} from 'omovi'
import { SimulationFile } from './files';

interface Status {
  title: String
  text: String
}

export interface Simulation {
  id: string
  files: SimulationFile[]
  inputScript: string
}

export interface SimulationModel {
  loading: boolean
  status?: Status
  files: string[]
  particles?: Particles
  setLoading: Action<SimulationModel, boolean>
  setParticles: Action<SimulationModel, Particles>
  setFiles: Action<SimulationModel, string[]>
  setStatus: Action<SimulationModel, Status>
  newSimulation: Thunk<SimulationModel, Simulation>
  lammps?: LammpsWeb
  reset: Action<SimulationModel, undefined>
}

export const simulationModel: SimulationModel = {
  loading: false,
  files: [],
  setLoading: action((state, loading: boolean) => {
    state.loading = loading
  }),
  setFiles: action((state, files: string[]) => {
    state.files = files
  }),
  setParticles: action((state, particles: Particles) => {
    state.particles = particles
  }),
  setStatus: action((state, status?: Status) => {
    state.status = status
  }),
  newSimulation: thunk(async (actions, simulation: Simulation, {getStoreState}) => {
    actions.setLoading(true)
    // @ts-ignore
    const wasm = getStoreState().lammps.wasm
    // @ts-ignore
    const lammps = getStoreState().lammps.lammps

    wasm.FS.mkdir(`/${simulation.id}`)
    let counter = 0
    for (const file of simulation.files) {
      console.log("Downloading ", file.fileName)
      await actions.setStatus({
        title: `Downloading file (${counter+1}/${simulation.files.length})`,
        text: file.fileName
      })

      const response = await fetch(file.url)
      const content = await response.text()
      wasm.FS.writeFile(`/${simulation.id}/${file.fileName}`, content)
      console.log("Did write it")
    }
    wasm.FS.chdir(`/${simulation.id}`)
    lammps.start()
    lammps.load_local(`/${simulation.id}/${simulation.inputScript}`)
    actions.setLoading(false)
  }),
  reset: action((state) => {
    state.files = []
    state.lammps = undefined
  })
};

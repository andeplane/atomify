import { action, Action, thunk, Thunk } from 'easy-peasy';
import {LammpsWeb} from '../types'
import {Particles} from 'omovi'

interface Status {
  title: String
  text: String
}

export interface SimulationFile {
  fileName: string
  content?: string
  url: string
}

export interface Simulation {
  id: string
  files: SimulationFile[]
  inputScript: string
  start: boolean
}

export interface SimulationModel {
  loading: boolean
  simulation?: Simulation
  status?: Status
  files: string[]
  selectedFile?: SimulationFile
  particles?: Particles
  setSelectedFile: Action<SimulationModel, SimulationFile>
  setSimulation: Action<SimulationModel, Simulation>
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
  setSelectedFile: action((state, selectedFile?: SimulationFile) => {
    state.selectedFile = selectedFile
  }),
  setSimulation: action((state, simulation: Simulation) => {
    state.simulation = simulation
  }),
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
    // @ts-ignore
    window.simulation = simulation
    actions.setLoading(true)
    actions.setSimulation(simulation)
    // @ts-ignore
    const wasm = getStoreState().lammps.wasm
    // @ts-ignore
    const lammps = getStoreState().lammps.lammps

    wasm.FS.mkdir(`/${simulation.id}`)
    let counter = 0
    for (const file of simulation.files) {
      await actions.setStatus({
        title: `Downloading file (${counter+1}/${simulation.files.length})`,
        text: file.fileName
      })

      const response = await fetch(file.url)
      const content = await response.text()
      file.content = content
      wasm.FS.writeFile(`/${simulation.id}/${file.fileName}`, content)
    }
    actions.setSimulation(simulation) // Set it again now that files are updated
    wasm.FS.chdir(`/${simulation.id}`)
    if (simulation.start) {
      lammps.start()
      lammps.load_local(`/${simulation.id}/${simulation.inputScript}`)
    } else {
      const inputScriptFile = simulation.files.filter(file => file.fileName==simulation.inputScript)[0]
      actions.setSelectedFile(inputScriptFile)
    }
    actions.setLoading(false)
  }),
  reset: action((state) => {
    state.files = []
    state.lammps = undefined
  })
};

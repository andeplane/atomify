import { action, Action, thunk, Thunk, computed, Computed } from 'easy-peasy';
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
  preferredView?: string
  files: string[]
  selectedFile?: SimulationFile
  particles?: Particles
  setPreferredView: Action<SimulationModel, string|undefined>
  setSelectedFile: Action<SimulationModel, SimulationFile>
  setSimulation: Action<SimulationModel, Simulation>
  setLoading: Action<SimulationModel, boolean>
  setParticles: Action<SimulationModel, Particles>
  setFiles: Action<SimulationModel, string[]>
  setStatus: Action<SimulationModel, Status>
  setLammps: Action<SimulationModel, LammpsWeb>
  setWasm: Action<SimulationModel, any>
  syncFiles: Action<SimulationModel, string|undefined>
  run: Thunk<SimulationModel>
  newSimulation: Thunk<SimulationModel, Simulation>
  wasm?: any
  lammps?: LammpsWeb
  reset: Action<SimulationModel, undefined>
}

export const simulationModel: SimulationModel = {
  loading: false,
  files: [],
  setPreferredView: action((state, preferredView?: string) => {
    state.preferredView = preferredView
  }),
  setSelectedFile: action((state, selectedFile?: SimulationFile) => {
    state.selectedFile = selectedFile
  }),
  setWasm: action((state, wasm: any) => {
    state.wasm = wasm
  }),
  setLammps: action((state, lammps: LammpsWeb) => {
    state.lammps = lammps
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
  syncFiles: action((state, fileName?: string) => {
    if (!state.simulation) {
      return
    }
    for (const file of state.simulation.files) {
      // Update all files if no fileName is specified
      if (file.fileName == fileName || !fileName) {
        state.wasm.FS.writeFile(`/${state.simulation.id}/${file.fileName}`, file.content)
        console.log("Synced file ", file.fileName)
      }
    }
  }),
  run: thunk(async (actions, payload, {getStoreState}) => {
    // @ts-ignore
    const simulation = getStoreState().simulation.simulation as Simulation
    if (!simulation) {
      return
    }
    // @ts-ignore
    if (getStoreState().simulation.lammps.isRunning()) {
      // We can't run while it is running
      return
    }
    // @ts-ignore
    getStoreState().simulation.lammps?.start()
    // @ts-ignore
    getStoreState().simulation.lammps?.runFile(`/${simulation.id}/${simulation.inputScript}`)
  }),
  newSimulation: thunk(async (actions, simulation: Simulation, {getStoreState}) => {
    // @ts-ignore
    window.simulation = simulation
    actions.setLoading(true)
    actions.setSimulation(simulation)
    // @ts-ignore
    const wasm = getStoreState().simulation.wasm
    // @ts-ignore
    const lammps = getStoreState().simulation.lammps

    if (!wasm.FS.analyzePath(`/${simulation.id}`).exists) {
      wasm.FS.mkdir(`/${simulation.id}`)
    }
    
    let counter = 0
    for (const file of simulation.files) {
      await actions.setStatus({
        title: `Downloading file (${counter+1}/${simulation.files.length})`,
        text: file.fileName
      })

      const response = await fetch(file.url)
      const content = await response.text()
      file.content = content
    }
    actions.syncFiles(undefined)
    actions.setSimulation(simulation) // Set it again now that files are updated
    wasm.FS.chdir(`/${simulation.id}`)
    if (simulation.start) {
      actions.run()
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

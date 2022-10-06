import { action, Action, thunk, Thunk, computed, Computed } from 'easy-peasy';
import {LammpsWeb} from '../types'
import {Particles} from 'omovi'
import * as THREE from 'three'

const colors: THREE.Color[] = [
  new THREE.Color(255, 102, 102 ),
  new THREE.Color(102, 102, 255 ),
  new THREE.Color(255, 255, 0 ),
  new THREE.Color(255, 102, 255 ),
  new THREE.Color(102, 255, 51 ),
  new THREE.Color(204, 255, 179 ),
  new THREE.Color(179, 0, 255 ),
  new THREE.Color(51, 255, 255 ),
  new THREE.Color(247, 247, 247)
]

const getColor = (particleType: number) => {
  const index = particleType % colors.length
  return colors[index]
}

interface Status {
  title: String
  text: String
  progress: number
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
  particleColors?: THREE.Color[]
  simulationBox?: THREE.Matrix3
  simulationOrigo?: THREE.Vector3
  numAtoms?: number
  setNumAtoms: Action<SimulationModel, number|undefined>
  setPreferredView: Action<SimulationModel, string|undefined>
  setParticleColors: Action<SimulationModel, THREE.Color[]|undefined>
  setSelectedFile: Action<SimulationModel, SimulationFile>
  setSimulation: Action<SimulationModel, Simulation>
  setLoading: Action<SimulationModel, boolean>
  setParticles: Action<SimulationModel, Particles>
  updateParticles: Thunk<SimulationModel, Particles>
  setSimulationBox: Action<SimulationModel, THREE.Matrix3|undefined>
  setSimulationOrigo: Action<SimulationModel, THREE.Vector3|undefined>
  setFiles: Action<SimulationModel, string[]>
  setStatus: Action<SimulationModel, Status|undefined>
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
  setNumAtoms: action((state, numAtoms?: number) => {
    state.numAtoms = numAtoms
  }),
  setParticleColors: action((state, particleColors?: THREE.Color[]) => {
    state.particleColors = particleColors
  }),
  setSelectedFile: action((state, selectedFile?: SimulationFile) => {
    state.selectedFile = selectedFile
  }),
  setSimulationBox: action((state, simulationBox: THREE.Matrix3) => {
    state.simulationBox = simulationBox
  }),
  setSimulationOrigo: action((state, simulationOrigo: THREE.Vector3) => {
    state.simulationOrigo = simulationOrigo
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
  updateParticles: thunk((actions, particles: Particles, {getStoreState}) => {
    // @ts-ignore
    if (!getStoreState().simulation.particleColors && particles) {
      // We need to compute colors
      const colors: THREE.Color[] = []
      particles.types.forEach( (type: number, index: number) => {
        const realIndex = particles.indices[index]
        colors[realIndex] = getColor(type)
      })
      actions.setParticleColors(colors)
    }
    // @ts-ignore
    actions.setParticles(particles)
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
    actions.setNumAtoms(undefined)
    actions.setSimulationBox(undefined)
    actions.setSimulationOrigo(undefined)
    actions.setParticles(undefined)

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
        text: file.fileName,
        progress: 0.2 + 0.8 * counter / simulation.files.length
      })
      
      const response = await fetch(file.url)
      const content = await response.text()
      file.content = content
      counter += 1
    }
    await actions.setStatus({
      title: `Uploading files to VM ...`,
      text: "",
      progress: 0.9
    })

    actions.syncFiles(undefined)
    actions.setSimulation(simulation) // Set it again now that files are updated
    wasm.FS.chdir(`/${simulation.id}`)
    await actions.setStatus(undefined)
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

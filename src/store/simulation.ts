import { action, Action, thunk, Thunk } from 'easy-peasy';
import {LammpsWeb} from '../types'
import {Particles, Bonds} from 'omovi'
import {AtomTypes, AtomType, hexToRgb} from '../utils/atomtypes'
import * as THREE from 'three'

const defaultAtomTypes: {[key:string]: AtomType} = {
  '1': { shortname: "1", fullname: "1", radius: 1.20, color: new THREE.Color(255, 102, 102 ) },
  '2': { shortname: "2", fullname: "2", radius: 1.20, color: new THREE.Color(102, 102, 255 )},
  '3': { shortname: "3", fullname: "3", radius: 1.20, color: new THREE.Color(255, 255, 0 )},
  '4': { shortname: "4", fullname: "4", radius: 1.20, color: new THREE.Color(255, 102, 255 )},
  '5': { shortname: "5", fullname: "5", radius: 1.20, color: new THREE.Color(102, 255, 51 )},
  '6': { shortname: "6", fullname: "6", radius: 1.20, color: new THREE.Color(204, 255, 179 )},
  '7': { shortname: "7", fullname: "7", radius: 1.20, color: new THREE.Color(179, 0, 255 )},
  '8': { shortname: "8", fullname: "8", radius: 1.20, color: new THREE.Color(51, 255, 255 )},
  '9': { shortname: "9", fullname: "9", radius: 1.20, color: new THREE.Color(247, 247, 247)},
}

const parseCameraPosition = (line: string) => {
  const splitted = line.split(" ")
  if (splitted[0] === 'camera' && splitted[1] === 'position' && splitted.length === 5) {
    const x = parseFloat(splitted[2])
    const y = parseFloat(splitted[3])
    const z = parseFloat(splitted[4])
    return new THREE.Vector3(x,y,z)
  }
}

const parseCameraTarget = (line: string) => {
  const splitted = line.split(" ")
  if (splitted[0] === 'camera' && splitted[1] === 'target' && splitted.length === 5) {
    const x = parseFloat(splitted[2])
    const y = parseFloat(splitted[3])
    const z = parseFloat(splitted[4])
    return new THREE.Vector3(x,y,z)
  }
}

const parseAtomType = (line: string) => {
  const regex = /^(?:atom)(?:\s*|\t*)(\d*)(?:\s*|\t*)(\w*)$/
  const matches = line.match(regex)
  if (matches) {
    return {
      atomType: parseInt(matches[1]),
      atomName: matches[2],
    }
  }
}

const parseBond = (line: string) => {
  const regex = /^(?:bond)(?:\s*|\t*)(\d*)(?:\s*|\t*)(\d*)(?:\s*|\t*)(\d*.\d*)$/
  const matches = line.match(regex)
  if (matches) {
    return {
      atomType1: parseInt(matches[1]),
      atomType2: parseInt(matches[2]),
      distance: parseFloat(matches[3])
    }
  }
}

const parseAtomSizeAndColor = (line: string) => {
  const regex = /^(?:atom)(?:\s*|\t*)(\d*)(?:\s*|\t*)(\d*.\d*)(?:\s*|\t*)(#[0-9a-fA-F]{6,6})$/
  const matches = line.match(regex)
  if (matches) {
    return {
      'atomTypeIndex': parseInt(matches[1]),
      'radius': parseFloat(matches[2]),
      'color': matches[3],
    }
  }
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
  bonds?: Bonds
  particleColors?: THREE.Color[]
  simulationBox?: THREE.Matrix3
  simulationOrigo?: THREE.Vector3
  cameraPosition?: THREE.Vector3
  cameraTarget?: THREE.Vector3
  atomTypes?: {[key: number]: AtomType}
  numAtoms?: number
  setNumAtoms: Action<SimulationModel, number|undefined>
  setCameraPosition: Action<SimulationModel, THREE.Vector3|undefined>
  setCameraTarget: Action<SimulationModel, THREE.Vector3|undefined>
  setAtomTypes: Action<SimulationModel, {[key: number]: AtomType}|undefined>
  setPreferredView: Action<SimulationModel, string|undefined>
  setParticleColors: Action<SimulationModel, THREE.Color[]|undefined>
  setSelectedFile: Action<SimulationModel, SimulationFile>
  setSimulation: Action<SimulationModel, Simulation>
  setLoading: Action<SimulationModel, boolean>
  setParticles: Action<SimulationModel, Particles>
  setBonds: Action<SimulationModel, Bonds>
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
  setCameraPosition: action((state, cameraPosition: THREE.Vector3) => {
    state.cameraPosition = cameraPosition
  }),
  setCameraTarget: action((state, cameraTarget: THREE.Vector3) => {
    state.cameraTarget = cameraTarget
  }),
  setAtomTypes: action((state, atomTypes: {[key: number]: AtomType}) => {
    state.atomTypes = atomTypes
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
  setBonds: action((state, bonds: Bonds) => {
    state.bonds = bonds
  }),
  updateParticles: thunk((actions, particles: Particles, {getStoreState}) => {
    // @ts-ignore
    if (!getStoreState().simulation.particleColors && particles) {
      // @ts-ignore
      let atomTypes = getStoreState().simulation.atomTypes
      // We need to compute colors
      const colors: THREE.Color[] = []
      particles.types.forEach( (type: number, index: number) => {
        const realIndex = particles.indices[index]
        // @ts-ignore
        if (type > Object.keys(atomTypes).length) {
          // If we have lots of atom types, just wrap around
          type = (type % Object.keys(atomTypes).length) + 1
        }
        
        let atomType = atomTypes[type]
        if (atomType == null) {
          // Fallback to default
          atomType = atomTypes[1]
        }
        colors[realIndex] = atomType.color
        particles.radii[realIndex] = atomType.radius * 0.2
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
      if (file.fileName === fileName || !fileName) {
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
    // @ts-ignore
    const atomTypes = getStoreState().simulation.atomTypes

    if (!wasm.FS.analyzePath(`/${simulation.id}`).exists) {
      wasm.FS.mkdir(`/${simulation.id}`)
    }
    
    // Reset all settings for dynamic bonds
    const bondsDistanceMapPointer = lammps.getBondsDistanceMapPointer() / 4;
    const bondsDistanceMapSubarray = wasm.HEAPF32.subarray(bondsDistanceMapPointer, bondsDistanceMapPointer + 10000) as Float32Array
    bondsDistanceMapSubarray.fill(0)
    lammps.setBuildNeighborlist(false)
    
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

    const extractAtomifyCommands = (inputScript?: string) => {
      if (!inputScript) {
        return
      }

      const newAtomTypes: {[key: number]: AtomType} = {...defaultAtomTypes}
      
      const lines = inputScript.split("\n")
      lines.forEach(line => {
        line = line.trim()
        if (line.startsWith("#/")) {
          // This is an atomify command
          line = line.substring(2)
          const atomType = parseAtomType(line)
          if (atomType) {
            newAtomTypes[atomType.atomType] = AtomTypes.filter(at => at.fullname===atomType.atomName)[0]
          }
          const atomSizeAndColor = parseAtomSizeAndColor(line)
          if (atomSizeAndColor) {
            newAtomTypes[atomSizeAndColor.atomTypeIndex].color = new THREE.Color(...hexToRgb(atomSizeAndColor.color))
            newAtomTypes[atomSizeAndColor.atomTypeIndex].radius = atomSizeAndColor.radius
          }
          const bond = parseBond(line);
          if (bond) {
            bondsDistanceMapSubarray[100 * bond.atomType1 + bond.atomType2] = bond.distance
            bondsDistanceMapSubarray[100 * bond.atomType2 + bond.atomType1] = bond.distance
            lammps.setBuildNeighborlist(true)
          }
          const cameraPosition = parseCameraPosition(line)
          if (cameraPosition) {
            actions.setCameraPosition(cameraPosition)
          }
          const cameraTarget = parseCameraTarget(line)
          if (cameraTarget) {
            actions.setCameraTarget(cameraTarget)
          }
        }
      })
      actions.setAtomTypes(newAtomTypes)
    }

    const inputScriptFile = simulation.files.filter(file => file.fileName===simulation.inputScript)[0]
    extractAtomifyCommands(inputScriptFile?.content)
    
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

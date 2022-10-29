import { action, Action } from 'easy-peasy';
import {Compute, Fix} from '../types'

export interface SimulationStatusModel {
  timesteps: number
  runTimesteps: number
  runTotalTimesteps: number
  lastCommand?: string
  remainingTime: number
  timestepsPerSecond: number
  box?: THREE.Matrix3
  origo?: THREE.Vector3
  runType: string
  numAtoms: number
  computes: Compute[]
  fixes: Fix[]
  setTimesteps: Action<SimulationStatusModel, number>
  setRunTimesteps: Action<SimulationStatusModel, number>
  setRunTotalTimesteps: Action<SimulationStatusModel, number>
  setLastCommand: Action<SimulationStatusModel, string|undefined>
  setComputes: Action<SimulationStatusModel, Compute[]>
  setFixes: Action<SimulationStatusModel, Fix[]>
  setRemainingTime: Action<SimulationStatusModel, number>
  setTimestepsPerSecond: Action<SimulationStatusModel, number>
  setNumAtoms: Action<SimulationStatusModel, number>
  setRunType:  Action<SimulationStatusModel, string>
  setBox: Action<SimulationStatusModel, THREE.Matrix3>
  setOrigo: Action<SimulationStatusModel, THREE.Vector3>
}

export const simulationStatusModel: SimulationStatusModel = {
  timesteps: 0,
  runTimesteps: 0,
  runTotalTimesteps: 0,
  remainingTime: 0,
  timestepsPerSecond: 0,
  runType: "",
  numAtoms: 0,
  computes: [],
  fixes: [],
  setComputes: action((state, value: Compute[]) => {
    state.computes = value
  }),
  setFixes: action((state, value: Fix[]) => {
    state.fixes = value
  }),
  setTimesteps: action((state, timesteps: number) => {
    state.timesteps = timesteps
  }),
  setRunTimesteps: action((state, runTimesteps: number) => {
    state.runTimesteps = runTimesteps
  }),
  setRunTotalTimesteps: action((state, runTotalTimesteps: number) => {
    state.runTotalTimesteps = runTotalTimesteps
  }),
  setLastCommand: action((state, lastCommand?: string) => {
    state.lastCommand = lastCommand
  }),
  setRemainingTime: action((state, value: number) => {
    state.remainingTime = value
  }),
  setTimestepsPerSecond: action((state, value: number) => {
    state.timestepsPerSecond = value
  }),
  setNumAtoms: action((state, value: number) => {
    state.numAtoms = value
  }),
  setRunType: action((state, value: string) => {
    state.runType = value
  }),
  setBox: action((state, value: THREE.Matrix3) => {
    state.box = value
  }),
  setOrigo: action((state, value: THREE.Vector3) => {
    state.origo = value
  })
};

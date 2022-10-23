import { action, Action } from 'easy-peasy';

export interface SimulationStatusModel {
  remainingTime: number
  timestepsPerSecond: number
  box?: THREE.Matrix3
  origo?: THREE.Vector3
  runType: string
  numAtoms: number
  setRemainingTime: Action<SimulationStatusModel, number>
  setTimestepsPerSecond: Action<SimulationStatusModel, number>
  setNumAtoms: Action<SimulationStatusModel, number>
  setRunType:  Action<SimulationStatusModel, string>
  setBox: Action<SimulationStatusModel, THREE.Matrix3>
  setOrigo: Action<SimulationStatusModel, THREE.Vector3>
}

export const simulationStatusModel: SimulationStatusModel = {
  remainingTime: 0,
  timestepsPerSecond: 0,
  runType: "",
  numAtoms: 0,
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

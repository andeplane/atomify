import { action, Action } from "easy-peasy";
import { Compute, Fix, Variable } from "../types";
import * as THREE from "three";

export interface SimulationStatusModel {
  timesteps: number;
  memoryUsage: number;
  runTimesteps: number;
  runTotalTimesteps: number;
  lastCommand?: string;
  remainingTime: number;
  timestepsPerSecond: number;
  hasSynchronized: boolean;
  box?: THREE.Matrix3;
  origo?: THREE.Vector3;
  runType: string;
  numAtoms: number;
  numBonds: number;
  computes: { [key: string]: Compute };
  fixes: { [key: string]: Fix };
  variables: { [key: string]: Variable };
  setTimesteps: Action<SimulationStatusModel, number>;
  setMemoryUsage: Action<SimulationStatusModel, number>;
  setHasSynchronized: Action<SimulationStatusModel, boolean>;
  setRunTimesteps: Action<SimulationStatusModel, number>;
  setRunTotalTimesteps: Action<SimulationStatusModel, number>;
  setLastCommand: Action<SimulationStatusModel, string | undefined>;
  setComputes: Action<SimulationStatusModel, { [key: string]: Compute }>;
  setFixes: Action<SimulationStatusModel, { [key: string]: Fix }>;
  setVariables: Action<SimulationStatusModel, { [key: string]: Variable }>;
  setRemainingTime: Action<SimulationStatusModel, number>;
  setTimestepsPerSecond: Action<SimulationStatusModel, number>;
  setNumAtoms: Action<SimulationStatusModel, number>;
  setNumBonds: Action<SimulationStatusModel, number>;
  setRunType: Action<SimulationStatusModel, string>;
  setBox: Action<SimulationStatusModel, THREE.Matrix3>;
  setOrigo: Action<SimulationStatusModel, THREE.Vector3>;
  reset: Action<SimulationStatusModel>;
}

export const simulationStatusModel: SimulationStatusModel = {
  hasSynchronized: false,
  timesteps: 0,
  memoryUsage: 0,
  runTimesteps: 0,
  runTotalTimesteps: 0,
  remainingTime: 0,
  timestepsPerSecond: 0,
  runType: "",
  numAtoms: 0,
  numBonds: 0,
  computes: {},
  fixes: {},
  variables: {},
  setComputes: action((state, value: { [key: string]: Compute }) => {
    state.computes = value;
  }),
  setFixes: action((state, value: { [key: string]: Fix }) => {
    state.fixes = value;
  }),
  setVariables: action((state, value: { [key: string]: Variable }) => {
    state.variables = value;
  }),
  setHasSynchronized: action((state, value: boolean) => {
    state.hasSynchronized = value;
  }),
  setTimesteps: action((state, timesteps: number) => {
    state.timesteps = timesteps;
  }),
  setMemoryUsage: action((state, memoryUsage: number) => {
    state.memoryUsage = memoryUsage;
  }),
  setRunTimesteps: action((state, runTimesteps: number) => {
    state.runTimesteps = runTimesteps;
  }),
  setRunTotalTimesteps: action((state, runTotalTimesteps: number) => {
    state.runTotalTimesteps = runTotalTimesteps;
  }),
  setLastCommand: action((state, lastCommand?: string) => {
    state.lastCommand = lastCommand;
  }),
  setRemainingTime: action((state, value: number) => {
    state.remainingTime = value;
  }),
  setTimestepsPerSecond: action((state, value: number) => {
    state.timestepsPerSecond = value;
  }),
  setNumAtoms: action((state, value: number) => {
    state.numAtoms = value;
  }),
  setNumBonds: action((state, value: number) => {
    state.numBonds = value;
  }),
  setRunType: action((state, value: string) => {
    state.runType = value;
  }),
  setBox: action((state, value: THREE.Matrix3) => {
    state.box = value;
  }),
  setOrigo: action((state, value: THREE.Vector3) => {
    state.origo = value;
  }),
  reset: action((state) => {
    state.hasSynchronized = false;
    state.lastCommand = undefined;
    state.timesteps = 0;
    state.memoryUsage = 0;
    state.runTimesteps = 0;
    state.runTotalTimesteps = 0;
    state.remainingTime = 0;
    state.timestepsPerSecond = 0;
    state.runType = "";
    state.numAtoms = 0;
    state.numBonds = 0;
    state.computes = {};
    state.fixes = {};
    state.variables = {};
  }),
};

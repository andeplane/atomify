export type LammpsWeb = {
  getNumAtoms: () => number;
  setSyncFrequency: (every: number) => void;
  setBuildNeighborlist: (buildNeighborlist: boolean) => void;
  getIsRunning: () => boolean;
  getErrorMessage: () => string;
  getLastCommand: () => string;
  getTimesteps: () => number;
  getRunTimesteps: () => number;
  getRunTotalTimesteps: () => number;
  getTimestepsPerSecond: () => number;
  getCPURemain: () => number;
  getWhichFlag: () => number;
  getCompute: (name: string) => LMPModifier;
  getComputeNames: () => CPPArray<string>;
  getFix: (name: string) => LMPModifier;
  getFixNames: () => CPPArray<string>;
  getVariable: (name: string) => LMPModifier;
  getVariableNames: () => CPPArray<string>;
  syncComputes: () => void;
  syncFixes: () => void;
  syncVariables: () => void;
  getMemoryUsage: () => number;

  getPositionsPointer: () => number;
  getIdPointer: () => number;
  getTypePointer: () => number;
  getCellMatrixPointer: () => number;
  getOrigoPointer: () => number;
  getBondsPosition1Pointer: () => number;
  getBondsPosition2Pointer: () => number;
  getBondsDistanceMapPointer: () => number;
  getExceptionMessage: (address: number) => string;

  step: () => void;
  stop: () => boolean;
  start: () => boolean;
  cancel: () => void;
  setPaused: (paused: boolean) => void;
  runCommand: (command: string) => void;
  runFile: (path: string) => void;

  computeBonds: () => number;
  computeParticles: () => number;
};

export enum ModifierType {
  ComputePressure,
  ComputeTemp,
  ComputePE,
  ComputeKE,
  ComputeRDF,
  ComputeMSD,
  ComputeVACF,
  ComputeCOM,
  ComputeGyration,
  ComputeKEAtom,
  ComputePropertyAtom,
  ComputeClusterAtom,
  ComputeCNAAtom,
  ComputeOther,
  FixAveChunk,
  FixAveHisto,
  FixAveTime,
  FixOther,
  VariableOther,
}

type CPPArray<T> = {
  get: (index: number) => T;
  size: () => number;
  delete: () => void;
};

export type LMPModifier = {
  getName: () => string;
  getType: () => ModifierType;
  getPerAtomData: () => number;
  getIsPerAtom: () => boolean;
  hasScalarData: () => boolean;
  getClearPerSync: () => boolean;
  getScalarValue: () => number;
  sync: () => void;
  getXLabel: () => string;
  getYLabel: () => string;
  getData1DNames: () => CPPArray<string>;
  getData1D: () => CPPArray<LMPData1D>;
  execute: () => boolean;
  delete: () => void;
};

export type Data1D = {
  data: number[][];
  labels: string[];
};

export type PlotData = {
  data1D?: Data1D;
  xLabel: string;
  yLabel: string;
  name: string;
  syncDataPoints?: boolean;
};

export type Compute = {
  name: string;
  type: ModifierType;
  isPerAtom: boolean;
  hasScalarData: boolean;
  scalarValue: number;
  data1D?: Data1D;
  xLabel: string;
  yLabel: string;
  clearPerSync: boolean;
  syncDataPoints: boolean;
  hasData1D: boolean;
  lmpCompute: LMPModifier;
};

export type Fix = {
  name: string;
  type: ModifierType;
  isPerAtom: boolean;
  hasScalarData: boolean;
  scalarValue: number;
  data1D?: Data1D;
  xLabel: string;
  yLabel: string;
  clearPerSync: boolean;
  syncDataPoints: boolean;
  hasData1D: boolean;
  lmpFix: LMPModifier;
};

export type Variable = {
  name: string;
  type: ModifierType;
  isPerAtom: boolean;
  hasScalarData: boolean;
  scalarValue: number;
  data1D?: Data1D;
  xLabel: string;
  yLabel: string;
  clearPerSync: boolean;
  syncDataPoints: boolean;
  hasData1D: boolean;
  lmpVariable: LMPModifier;
};

export type LMPData1D = {
  getLabel: () => string;
  getXValuesPointer: () => number;
  getYValuesPointer: () => number;
  getNumPoints: () => number;
  delete: () => void;
};

export type LammpsOutput = {
  // type: LineType
  value: string;
};

export type GithubFile = {
  title: string;
  path: string;
  expanded: boolean;
  key: string;
  download_url?: string;
  size: number;
  type: "dir" | "file";
  isLeaf: boolean;
  children: GithubFile[];
};

/**
 * Configuration options for embedded simulations.
 * These can be passed via base64-encoded JSON in the 'config' URL parameter.
 *
 * Note: When parsed from URL, all properties are guaranteed to have values (defaults applied).
 */
export interface EmbedConfig {
  /** Show the simulation summary overlay (default: true) */
  showSimulationSummary: boolean;
  /** Show the simulation box visualization (default: true) */
  showSimulationBox: boolean;
  /** Enable camera controls (default: true) */
  enableCameraControls: boolean;
  /** Enable particle picking (default: true) */
  enableParticlePicking: boolean;
}

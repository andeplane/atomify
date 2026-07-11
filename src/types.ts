export type LammpsWeb = {
  getNumAtoms: () => number;
  setSyncFrequency: (every: number) => void;
  setBuildNeighborlist: (buildNeighborlist: boolean) => void;
  /** Register a per-type-pair max bond distance for dynamic bond rendering. */
  setBondDistance: (type1: number, type2: number, distance: number) => void;
  /** Clear all registered dynamic-bond distances. */
  clearBondDistances: () => void;
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
  /**
   * Select the per-atom compute whose values are streamed for color-by-compute.
   * Only implemented by the worker proxy (the main-thread adapter reads per-atom
   * data directly, so it has nothing to do); optional for other implementations.
   */
  setPerAtomModifier?: (
    category: "compute" | "fix" | "variable",
    name: string | null,
  ) => void;
  /**
   * Read the files under a wasm-FS directory (the run-outputs data path,
   * ADR-001 §5). Only implemented by the worker proxy; safe mid-run because
   * MEMFS reads never re-enter the suspended module.
   */
  snapshotWorkdir?: (
    dir: string,
    maxBytes?: number,
  ) => Promise<{
    files: { path: string; bytes: Uint8Array }[];
    skipped: { path: string; size: number }[];
  }>;
  getMemoryUsage: () => number;

  getPositionsPointer: () => number;
  getIdPointer: () => number;
  getTypePointer: () => number;
  getCellMatrixPointer: () => number;
  getOrigoPointer: () => number;
  getBondsPosition1Pointer: () => number;
  getBondsPosition2Pointer: () => number;
  getExceptionMessage: (address: number) => string;

  step: () => void;
  stop: () => boolean;
  start: () => boolean;
  cancel: () => void;
  runCommand: (command: string) => void;
  /** Never rejects; run failures are surfaced through getErrorMessage. */
  runFile: (path: string) => Promise<void>;

  computeBonds: () => number;
  computeParticles: () => number;
  getDimension: () => number;
  getWalls: () => CPPArray<Wall>;
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

export type ModifierData<K extends 'lmpCompute' | 'lmpFix' | 'lmpVariable'> = {
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
} & Record<K, LMPModifier>;

export type Compute = ModifierData<'lmpCompute'>;
export type Fix = ModifierData<'lmpFix'>;
export type Variable = ModifierData<'lmpVariable'>;

export interface Wall {
  which: number;    // 0-5 (XLO, XHI, YLO, YHI, ZLO, ZHI)
  style: number;    // 0-3 (NONE, EDGE, CONSTANT, VARIABLE)
  position: number; // current position on axis
  cutoff: number;   // interaction range
}

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

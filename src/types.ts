import type { EngineFrame, EngineSeries } from "./wasm/engineFrame";

/**
 * The main thread's handle on the LAMMPS engine (implemented by
 * LammpsWorkerProxy; the wasm module itself lives in the engine worker).
 */
export type LammpsWeb = {
  /**
   * The latest synced timestep streamed from the engine: particles, bonds,
   * box, computes/fixes/variables. Replaced (never mutated) on every step.
   */
  readonly latestFrame: EngineFrame;
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
  getComputeNames: () => string[];
  getFix: (name: string) => LMPModifier;
  getFixNames: () => string[];
  getVariable: (name: string) => LMPModifier;
  getVariableNames: () => string[];
  /**
   * Select the per-atom compute whose values are streamed (as
   * latestFrame.perAtom) for color-by-compute; null streams none.
   */
  setPerAtomModifier?: (
    category: "compute" | "fix" | "variable",
    name: string | null,
  ) => void;
  /**
   * Read the files under a wasm-FS directory (the run-outputs data path,
   * ADR-001 §5). Safe mid-run because MEMFS reads never re-enter the
   * suspended module.
   */
  snapshotWorkdir?: (
    dir: string,
    maxBytes?: number,
  ) => Promise<{
    files: { path: string; bytes: Uint8Array }[];
    skipped: { path: string; size: number }[];
  }>;
  getMemoryUsage: () => number;
  getExceptionMessage: (address: number) => string;

  // Engine-FS writes, applied in order before any later runFile. Nothing is
  // mirrored on the main thread; read engine files with snapshotWorkdir.
  // mkdir is mkdir -p; writeFile and chdir create missing directories.
  writeFile: (path: string, data: string | Uint8Array) => void;
  mkdir: (path: string) => void;
  chdir: (path: string) => void;

  stop: () => boolean;
  start: () => boolean;
  // Run control. The proxy is its only owner: these methods are the one way
  // to stop, pause or resume a run (see LammpsWorkerProxy).
  cancel: () => void;
  setPaused: (paused: boolean) => void;
  isPaused: () => boolean;
  runCommand: (command: string) => void;
  /** Never rejects; run failures are surfaced through getErrorMessage. */
  runFile: (path: string) => Promise<void>;
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

/**
 * A live view of one compute/fix/variable: every getter reads the engine's
 * latest frame, so the store can keep the object across steps. Per-atom
 * values are read from the frame directly (see perAtomValues).
 */
export type LMPModifier = {
  getName: () => string;
  getType: () => ModifierType;
  getIsPerAtom: () => boolean;
  hasScalarData: () => boolean;
  getClearPerSync: () => boolean;
  getScalarValue: () => number;
  getXLabel: () => string;
  getYLabel: () => string;
  /** The modifier's 1D series in the latest frame. */
  getData1D: () => EngineSeries[];
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

export type ModifierData<K extends "lmpCompute" | "lmpFix" | "lmpVariable"> = {
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

export type Compute = ModifierData<"lmpCompute">;
export type Fix = ModifierData<"lmpFix">;
export type Variable = ModifierData<"lmpVariable">;

export interface Wall {
  which: number; // 0-5 (XLO, XHI, YLO, YHI, ZLO, ZHI)
  style: number; // 0-3 (NONE, EDGE, CONSTANT, VARIABLE)
  position: number; // current position on axis
  cutoff: number; // interaction range
}

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

export type LammpsWeb = {
  getNumAtoms: () => number
  setSyncFrequency: (every: number) => void
  setBuildNeighborlist: (buildNeighborlist: boolean) => void
  getIsRunning: () => boolean
  getErrorMessage: () => string
  getLastCommand: () => string
  getTimesteps: () => number
  getRunTimesteps: () => number
  getRunTotalTimesteps: () => number
  getTimestepsPerSecond: () => number
  getCPURemain: () => number
  getWhichFlag: () => number
  getCompute: (name: string) => LMPCompute
  getComputeNames: () => CPPArray<string>
  getFixes: () => CPPArray<LMPFix>
  syncComputes: () => void

  getPositionsPointer: () => number
  getIdPointer: () => number
  getTypePointer: () => number
  getCellMatrixPointer: () => number
  getOrigoPointer: () => number
  getBondsPosition1Pointer: () => number
  getBondsPosition2Pointer: () => number
  getBondsDistanceMapPointer: () => number
  getExceptionMessage: (address: number) => string
  
  step: () => void
  stop: () => boolean
  start: () => boolean
  cancel: () => void
  setPaused: (paused: boolean) => void
  runCommand: (command: string) => void
  runFile: (path: string) => void
  
  computeBonds: () => number
  computeParticles: () => number
}

enum ComputeType {
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
}

enum FixType {
  FixOther
}

type CPPArray<T> = {
  get: (index: number) => T
  size: () => number
}

export type LMPCompute = {
  getName: () => string
  getType: () => ComputeType
  getPerAtomData: () => number
  getIsPerAtom: () => boolean
  hasScalarData: () => boolean
  getClearPerSync: () => boolean
  getScalarValue: () => number
  sync: () => void
  getXLabel: () => string
  getYLabel: () => string
  getData1DNames: () => CPPArray<string>
  getData1D: () => CPPArray<LMPData1D>
  execute: () => boolean
  delete: () => void
}

export type Data1D = {
  data: number[][]
  labels: string[]
}

export type Compute = {
  name: string
  type: ComputeType
  isPerAtom: boolean
  hasScalarData: boolean
  scalarValue: number
  data1D?: Data1D
  xLabel: string
  yLabel: string
  clearPerSync: boolean
  syncDataPoints: boolean
  hasData1D: boolean
  lmpCompute: LMPCompute
}

export type LMPData1D = {
  getLabel: () => string
  getXValuesPointer: () => number
  getYValuesPointer: () => number
  getNumPoints: () => number
}

export type LMPFix = {
  getName: () => string
  getType: () => FixType
}

export type Fix = {
  name: string
  type: FixType
}

export type LammpsOutput = {
    // type: LineType
    value: string
}

export type GithubFile = {
  title: string
  path: string
  expanded: boolean
  key: string
  download_url?: string
  size: number
  type: "dir" | "file"
  isLeaf: boolean
  children: GithubFile[]
}
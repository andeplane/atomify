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
  getComputes: () => CPPArray<Compute>
  getFixes: () => CPPArray<Fix>

  getPositionsPointer: () => number
  getIdPointer: () => number
  getTypePointer: () => number
  getCellMatrixPointer: () => number
  getOrigoPointer: () => number
  getBondsPosition1Pointer: () => number
  getBondsPosition2Pointer: () => number
  getBondsDistanceMapPointer: () => number
  
  step: () => void
  stop: () => boolean
  start: () => boolean
  cancel: () => void
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

export type Compute = {
  getName: () => string
  getType: () => ComputeType
  getPerAtomData: () => number
  getIsPerAtom: () => boolean
  sync: () => void
  execute: () => boolean
}

export type Fix = {
  getName: () => string
  getType: () => FixType
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
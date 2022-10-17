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
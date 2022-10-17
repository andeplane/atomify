export type LammpsWeb = {
  getPositionsPointer: () => number
  getIdPointer: () => number
  getTypePointer: () => number
  getCellMatrixPointer: () => number
  getOrigoPointer: () => number
  getBondsPosition1Pointer: () => number
  getBondsPosition2Pointer: () => number
  getBondsDistanceMapPointer: () => number
  
  getNumAtoms: () => number
  setSyncFrequency: (every: number) => void
  setBuildNeighborlist: (buildNeighborlist: boolean) => void
  getErrorMessage: () => string
  getIsRunning: () => boolean
  
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
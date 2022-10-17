export type LammpsWeb = {
  getPositionsPointer: () => number
  getIdPointer: () => number
  getTypePointer: () => number
  loadLJ: () => void
  isRunning: () => boolean
  step: () => void
  stop: () => boolean
  start: () => boolean
  runCommand: (command: string) => void
  numAtoms: () => number
  setSyncFrequency: (every: number) => void
  setBuildNeighborlist: (buildNeighborlist: boolean) => void
  getCellMatrixPointer: () => number
  getOrigoPointer: () => number
  getBondsPosition1: () => number
  getBondsPosition2: () => number
  getBondsDistanceMapPointer: () => number
  computeBonds: () => number
  computeParticles: () => number
  numBonds: () => number
  cancel: () => void
  getErrorMessage: () => string
  runFile: (path: string) => void
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
export type LammpsWeb = {
  getPositionsPointer: () => number
  getIdPointer: () => number
  getTypePointer: () => number
  loadLJ: () => void
  step: () => void
  stop: () => boolean
  start: () => boolean
  runCommand: (command: string) => void
  numAtoms: () => number
  setSyncFrequency: (every: number) => void
  load_local: (path: string) => void
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
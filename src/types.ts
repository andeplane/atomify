// import { LineType } from 'react-terminal-ui';

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
}

export type LammpsOutput = {
    // type: LineType
    value: string
}

export type GithubFile = {
  name: string
  path: string
  download_url: string
  size: number
}
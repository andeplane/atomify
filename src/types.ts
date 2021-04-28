import { LineType } from 'react-terminal-ui';

export type LammpsWeb = {
  getPositionsPointer: () => number
  getIdPointer: () => number
  getTypePointer: () => number
  loadLJ: () => void
  step(): () => void
  runCommand: (command: string) => void
  numAtoms: () => number
}

export type LammpsOutput = {
    type: LineType
    value: string
}

export type GithubFile = {
  name: string
  path: string
  download_url: string
  size: number
}
export type LAMMPSWeb = {
  getPositionsPointer: () => number
  getIdPointer: () => number
  getTypePointer: () => number
  loadLJ: () => void
  step(): () => void
  runCommand: (command: string) => void
  numAtoms: () => number
}
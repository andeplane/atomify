import { action, Action } from 'easy-peasy';
import {GithubFile} from '../types'

export type SimulationFile = {
  url: string,
  fileName: string,
  content?: string
}
export type FilesList = {[key: string]: SimulationFile};

export interface FilesModel {
  files: FilesList
  tree: GithubFile[]
  selectedFile?: SimulationFile
  setFiles: Action<FilesModel, FilesList>
  setTree: Action<FilesModel, GithubFile[]>
  setSelectedFile: Action<FilesModel, SimulationFile|undefined>
}

export const filesModel: FilesModel = {
  files: {},
  tree: [],
  selectedFile: undefined, 
  setFiles: action((state, files: FilesList) => {
    state.files = files
  }),
  setTree: action((state, tree: GithubFile[]) => {
    state.tree = tree
  }),
  setSelectedFile: action((state, selectedFile?: SimulationFile) => {
    state.selectedFile = selectedFile
  })
};

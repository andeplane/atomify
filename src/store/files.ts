import { action, Action } from 'easy-peasy';
import {GithubFile} from '../types'
export type File = {
  loading: boolean,
  fileName: string,
  content: string
}
export type FilesList = {[key: string]: File};

export interface FilesModel {
  files: FilesList
  tree: GithubFile[]
  selectedFile?: File
  setFiles: Action<FilesModel, FilesList>
  setTree: Action<FilesModel, GithubFile[]>
  setSelectedFile: Action<FilesModel, File|undefined>
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
  setSelectedFile: action((state, selectedFile?: File) => {
    state.selectedFile = selectedFile
  })
};

import { action, Action } from 'easy-peasy';

export type File = {
  loading: boolean,
  fileName: string,
  content: string
}
export type FilesList = {[key: string]: File};

export interface FilesModel {
  files: FilesList
  selectedFile?: File
  setFiles: Action<FilesModel, FilesList>
  setSelectedFile: Action<FilesModel, File|undefined>
}

export const filesModel: FilesModel = {
  files: {},
  selectedFile: undefined, 
  setFiles: action((state, files: FilesList) => {
    state.files = files
  }),
  setSelectedFile: action((state, selectedFile?: File) => {
    state.selectedFile = selectedFile
  })
};

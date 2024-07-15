import { action, Action, thunk, Thunk } from 'easy-peasy';
import localforage from 'localforage'

localforage.config({
    driver      : localforage.INDEXEDDB,
    name        : 'JupyterLite Storage',
    storeName   : 'files', // Should be alphanumeric, with underscores.
    description : 'some description'
});

export interface AtomifyFile {
    created: Date
    format: string
    last_modified: Date
    mimetype: string
    name: string
    path: string
    type: string
    writeable: boolean
    text: () => Promise<string>
    writeText: (content: string) => Promise<void>
}

export interface FilesModel {
  files: {[key: string]: AtomifyFile}
  setFiles: Action<FilesModel, {[key: string]: AtomifyFile}>
  syncFilesJupyterLite: Thunk<FilesModel, undefined>
}

export const filesModel: FilesModel = {
  files: {},
  setFiles: action((state, render: {[key: string]: AtomifyFile}) => {
    state.files = render
  }),
  syncFilesJupyterLite: thunk(async (actions, dummy: undefined, {getStoreState}) => {
    // @ts-ignore
    const state = getStoreState().files as FilesModel

    const newFiles = {...state.files}
    let anyChanges = false
    
    // First find all files from JupyterLite and sync them in
    const keys = await localforage.keys()
    for (let key of keys) {
      const file = await localforage.getItem(key) as any
      if (!state.files[key]) {
        const dateModified = new Date(file.date_modified)
        // Create AtomifyFile object
        const newFile: AtomifyFile = {
          created: new Date(file.created),
          format: file.format,
          last_modified: new Date(file.last_modified),
          mimetype: file.mimetype,
          name: file.name,
          path: file.path,
          type: file.type,
          writeable: file.writeable,
          text: async () => {
            const file = await localforage.getItem(key) as any
            return file.content
          },
          writeText: async (content: string) => {
            const file = await localforage.getItem(key) as any

            await localforage.setItem(key, {
              ...file,
              content
            })
          }
        }

        newFiles[key] = newFile
        anyChanges = true
      }
    }
    
    // Then remove any files that no longer are there
    Object.keys(state.files).forEach(key => {
      if (keys.indexOf(key) === -1) {
        // This file no longer exists in JupyterLite
        delete newFiles[key]
        anyChanges = true
      }
    })

    if (anyChanges) {
      actions.setFiles(newFiles)
    }
  })
};

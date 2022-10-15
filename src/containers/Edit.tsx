import {useCallback} from 'react'
import {useStoreActions, useStoreState} from '../hooks'
import MonacoEditor from 'react-monaco-editor'

const Edit = () => {
  const selectedFile = useStoreState(state => state.simulation.selectedFile)
  const simulation =  useStoreState(state => state.simulation.simulation)
  const syncFiles = useStoreActions(actions => actions.simulation.syncFiles)
  const options = {
    selectOnLineNumbers: true
  };

  const editorDidMount = useCallback( (editor: any, monaco: any) => {
    editor.focus();
  }, [])

  const onEditorChange = useCallback( (newValue: string, e: any) => {
    // console.log('onChange', newValue, e);
    const file = simulation?.files.filter(file => file.fileName === selectedFile?.fileName)[0]
    if (file) {
      file.content=newValue
      syncFiles(file.fileName)
    }
  }, [selectedFile?.fileName, simulation?.files, syncFiles])

  if (!selectedFile) {
    return (<>No file selected</>)
  } 

  return (
    <MonacoEditor
      height="100vh"
      language="javascript"
      theme="vs-dark"
      value={selectedFile.content}
      options={options}
      onChange={onEditorChange}
      editorDidMount={editorDidMount}
    />
  )
}
export default Edit
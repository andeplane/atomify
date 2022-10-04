import {useCallback} from 'react'
import {useStoreState} from '../hooks'
import MonacoEditor from 'react-monaco-editor'

const Edit = () => {
  const selectedFile = useStoreState(state => state.simulation.selectedFile)
  
  const options = {
    selectOnLineNumbers: true
  };

  const editorDidMount = useCallback( (editor: any, monaco: any) => {
    editor.focus();
  }, [])

  const onEditorChange = useCallback( (newValue: string, e: any) => {
    console.log('onChange', newValue, e);
  }, [])

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
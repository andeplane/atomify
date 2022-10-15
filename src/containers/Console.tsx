import MonacoEditor from 'react-monaco-editor'
import {useEffect, useRef} from 'react'
import { useStoreState } from '../hooks';

const Console = () => {
  const lammpsOutput = useStoreState(state => state.simulation.lammpsOutput)
  const editorRef = useRef<any>(null)
  const options = {
    selectOnLineNumbers: true,
    readOnly: true
  };
  useEffect(() => {
    const editor = editorRef.current?.editor
    if (editor) {
      editor.revealLine(editor.getModel().getLineCount())
    }
  }, [lammpsOutput])

  return (
    <MonacoEditor
      height="100vh"
      language="javascript"
      theme="vs-dark"
      value={lammpsOutput.join("\n")}
      options={options}
      ref={editorRef}
    />
  )
}
export default Console
import MonacoEditor from 'react-monaco-editor'

import { useStoreState } from '../hooks';

const Console = () => {
  const lammpsOutput = useStoreState(state => state.simulation.lammpsOutput)
  const options = {
    selectOnLineNumbers: true,
    domReadOnly: true
  };
  return (
    <MonacoEditor
      height="100vh"
      language="javascript"
      theme="vs-dark"
      value={lammpsOutput.join("\n")}
      options={options}
    />
  )
}
export default Console
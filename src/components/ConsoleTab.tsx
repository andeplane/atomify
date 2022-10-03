import React, {useCallback} from 'react'
import Terminal, { ColorMode, /*LineType*/ } from 'react-terminal-ui';
import {useStoreState, useStoreActions} from '../hooks'

interface ConsoleTabProps {
  lammpsOutput: string[]
}
const ConsoleTab = ({lammpsOutput}: ConsoleTabProps) => {
  const lammps = useStoreState(state => state.lammps.lammps)
  const setRunning = useStoreActions(actions => actions.lammps.setRunning)
  const onInput = useCallback((command: string) => {
    setRunning(true)
    lammps?.runCommand(command)
    setRunning(false)
  }, [lammps, setRunning])
  
  return (
    <Terminal name='LAMMPS console' colorMode={ ColorMode.Light }  onInput={ onInput }> 
      {lammpsOutput.map(output => <>{output}<br /></>)}
    </Terminal>
  )
}

export default ConsoleTab
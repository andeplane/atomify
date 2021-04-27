import React, {useCallback} from 'react'
import Terminal, { ColorMode, LineType } from 'react-terminal-ui';
import {useStoreState} from 'hooks'

interface ConsoleTabProps {
  lammpsOutput: { type: LineType; value: string;}[]
}
const ConsoleTab = ({lammpsOutput}: ConsoleTabProps) => {
  const lammps = useStoreState(state => state.lammps.lammps)
  const onInput = useCallback((command: string) => {
    lammps?.runCommand(command)
  }, [lammps])
  
  return (
    <Terminal name='React Terminal Usage Example' colorMode={ ColorMode.Light }  lineData={ lammpsOutput } onInput={ onInput }/>
  )
}

export default ConsoleTab
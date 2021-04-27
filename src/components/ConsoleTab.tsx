import React from 'react'
import Terminal, { ColorMode, LineType } from 'react-terminal-ui';

interface ConsoleTabProps {
  onInput: (input: string) => void
  lammpsOutput: { type: LineType; value: string;}[]
}
const ConsoleTab = ({onInput, lammpsOutput}: ConsoleTabProps) => {
  return (
    <Terminal name='React Terminal Usage Example' colorMode={ ColorMode.Light }  lineData={ lammpsOutput } onInput={ onInput }/>
  )
}

export default ConsoleTab
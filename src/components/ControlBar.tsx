import React, {useState, useEffect, useCallback} from 'react'
import {Button} from 'antd'
import {CaretRightOutlined, ClearOutlined, FileOutlined, StepForwardOutlined, RedoOutlined, PauseOutlined} from '@ant-design/icons'
import {useStoreState, useStoreActions} from '../hooks'


interface ControlBarProps {
  onClearConsole: () => void
}
const ControlBar = ({onClearConsole}: ControlBarProps) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const lammps = useStoreState(state => state.lammps.lammps)
  const resetLammps = useStoreActions(actions => actions.lammps.resetLammps)

  const onStepClicked = useCallback(() => {
    lammps?.step()
  }, [lammps])


  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        if (lammps != null) {
          lammps.step()
        }
      }, 16);
    }
    return () => clearInterval(interval);
  }, [isPlaying, lammps]);


  return <>
    <Button onClick={() => setIsPlaying(!isPlaying)} icon={isPlaying ? <PauseOutlined /> : <CaretRightOutlined /> }>{isPlaying ? "Pause" : "Play" }</Button>
    <Button onClick={onStepClicked} icon={<StepForwardOutlined />}>Step</Button>
    <Button onClick={() => resetLammps()} icon={<RedoOutlined />}> Reset</Button>
    <Button onClick={() => lammps?.loadLJ()} icon={<FileOutlined />}>Load LJ demo</Button>
    <Button onClick={onClearConsole} icon={<ClearOutlined />}>Clear</Button>
    
  </>
}
export default ControlBar
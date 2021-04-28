import React, {useState, useCallback} from 'react'
import {Button} from 'antd'
import {CaretRightOutlined, FileOutlined, StepForwardOutlined, RedoOutlined, PauseOutlined} from '@ant-design/icons'
import {useStoreState, useStoreActions} from 'hooks'


interface ControlBarProps {
}
const ControlBar = () => {
  const [isPlaying, setIsPlaying] = useState(false)
  const lammps = useStoreState(state => state.lammps.lammps)
  const resetLammps = useStoreActions(actions => actions.lammps.resetLammps)

  const onStepClicked = useCallback(() => {
    lammps?.step()
  }, [lammps])


  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (lammps != null) {
  //       lammps.step()
  //       const numAtoms = lammps.numAtoms()
  //       const particles = getPositions(lammps, wasm)
  //       setParticles(particles)
  //     }
  //   }, 16);
  //   return () => clearInterval(interval);
  // }, [lammps, wasm]);


  return <>
    <Button onClick={() => setIsPlaying(!isPlaying)} icon={isPlaying ? <PauseOutlined /> : <CaretRightOutlined /> }>{isPlaying ? "Pause" : "Play" }</Button>
    <Button onClick={onStepClicked} icon={<StepForwardOutlined />}>Step</Button>
    <Button onClick={() => resetLammps()} icon={<RedoOutlined />}> Reset</Button>
    <Button onClick={() => lammps?.loadLJ()} icon={<FileOutlined />}>Load LJ demo</Button>
  </>
}
export default ControlBar
import React, {useState, useCallback} from 'react'
import {Button} from 'antd'
import {CaretRightOutlined, StepForwardOutlined, RedoOutlined, PauseOutlined} from '@ant-design/icons'
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

  return <>
    <Button onClick={() => setIsPlaying(!isPlaying)} icon={isPlaying ? <PauseOutlined /> : <CaretRightOutlined /> } />
    <Button onClick={onStepClicked} icon={<StepForwardOutlined />} />
    <Button onClick={() => resetLammps()} icon={<RedoOutlined />} />
  </>
}
export default ControlBar
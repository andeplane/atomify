import {useState} from 'react'
import {useStoreState, useStoreActions} from '../hooks'
import {InputNumber} from 'antd'
import {track} from '../utils/metrics'

const SimulationSummary = () => {
  const [isHovering, setIsHovering] = useState(false);
  const simulationSettings = useStoreState(state => state.settings.simulation)
  const setSimulationSettings = useStoreActions(actions => actions.settings.setSimulation)
  const simulation = useStoreState(state => state.simulation.simulation)
  const runType = useStoreState(state => state.simulationStatus.runType)
  const numAtoms = useStoreState(state => state.simulationStatus.numAtoms)
  const remainingTime = useStoreState(state => state.simulationStatus.remainingTime)
  const timestepsPerSecond = useStoreState(state => state.simulationStatus.timestepsPerSecond)
  console.log("numAtoms: ", numAtoms)

  const handleMouseOver = () => {
    setIsHovering(true);
  };

  const handleMouseOut = () => {
    setIsHovering(false);
  };
  const setSyncFrequency = (value: number|null) => {
    if (value && value > 0) {
      track('SimulationSpeed.Change', {speed: value})
      setSimulationSettings({...simulationSettings, speed: value})
    }
  }
  
  return (            
    <div onMouseOver={handleMouseOver} onMouseOut={handleMouseOut} className={"simulationsummary"+(isHovering ? " hover" : "")}>
      {simulation && <>
          <div>
            Type: {runType}<br />
            Number of atoms: {Math.ceil(numAtoms)}<br />
            Remaining time: {Math.ceil(remainingTime)} s<br />
            Timesteps per second: {Math.ceil(timestepsPerSecond)} <br />
            Simulation speed: <InputNumber min={1} max={200} defaultValue={simulationSettings.speed} onChange={(value) => setSyncFrequency(value)} />
          </div>
        </>
      }
    </div>
  )
}
export default SimulationSummary
import {useState} from 'react'
import {useStoreState, useStoreActions} from '../hooks'
import {InputNumber} from 'antd'

const SimulationSummary = () => {
  const [isHovering, setIsHovering] = useState(false);
  const simulationSettings = useStoreState(state => state.settings.simulation)
  const setSimulationSettings = useStoreActions(actions => actions.settings.setSimulation)
  const simulationStatus = useStoreState(state => state.simulation.simulationStatus)

  const handleMouseOver = () => {
    setIsHovering(true);
  };

  const handleMouseOut = () => {
    setIsHovering(false);
  };
  const setSyncFrequency = (value: number|null) => {
    if (value && value > 0) {
      setSimulationSettings({...simulationSettings, speed: value})
    }
  }
  
  return (            
    <div onMouseOver={handleMouseOver} onMouseOut={handleMouseOut} className={"simulationsummary"+(isHovering ? " hover" : "")}>
      {simulationStatus && <>
          <div>
            Type: {simulationStatus.runType}<br />
            Number of atoms: {Math.ceil(simulationStatus.numAtoms)}<br />
            Remaining time: {Math.ceil(simulationStatus.remainingTime)} s<br />
            Timesteps per second: {Math.ceil(simulationStatus.timestepsPerSecond)} <br />
            Simulation speed: <InputNumber min={1} max={200} defaultValue={simulationSettings.speed} onChange={(value) => setSyncFrequency(value)} />
          </div>
        </>
      }
    </div>
  )
}
export default SimulationSummary
import {useState} from 'react'
import {useStoreState, useStoreActions} from '../hooks'
import {InputNumber} from 'antd'

const SimulationSummary = () => {
  const [isHovering, setIsHovering] = useState(false);
  const simulationSettings = useStoreState(state => state.settings.simulation)
  const setSimulationSettings = useStoreActions(actions => actions.settings.setSimulation)

  const handleMouseOver = () => {
    setIsHovering(true);
  };

  const handleMouseOut = () => {
    setIsHovering(false);
  };
  const simulation = useStoreState(state => state.simulation.simulation)
  const setSyncFrequency = (value: number|null) => {
    if (value && value > 0) {
      setSimulationSettings({...simulationSettings, speed: value})
    }
  }
  
  return (            
    <div onMouseOver={handleMouseOver} onMouseOut={handleMouseOut} className={"simulationsummary"+(isHovering ? " hover" : "")}>
      {simulation?.status && <>
          <div>
            Type: {simulation.status.runType}<br />
            Number of atoms: {Math.ceil(simulation?.status.numAtoms)}<br />
            Remaining time: {Math.ceil(simulation?.status.remainingTime)} s<br />
            Timesteps per second: {Math.ceil(simulation?.status.timestepsPerSecond)} <br />
            Simulation speed: <InputNumber min={1} max={200} defaultValue={simulationSettings.speed} onChange={(value) => setSyncFrequency(value)} />
          </div>
        </>
      }
    </div>
  )
}
export default SimulationSummary
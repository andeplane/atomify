import {useState} from 'react'
import {useStoreState} from '../hooks'
import {InputNumber} from 'antd'

const SimulationSummary = () => {
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseOver = () => {
    setIsHovering(true);
  };

  const handleMouseOut = () => {
    setIsHovering(false);
  };
  const simulation = useStoreState(state => state.simulation.simulation)
  const setSyncFrequency = (value?: number) => {
    if (value && value > 0) {
      // @ts-ignore
      window.syncFrequency = value
    }
  }
  // @ts-ignore
  const syncFrequency = window.syncFrequency

  return (            
    <div onMouseOver={handleMouseOver} onMouseOut={handleMouseOut} className={"simulationsummary"+(isHovering ? " hover" : "")}>
      {simulation?.status && <>
          <p>
            Type: {simulation.status.runType}<br />
            Number of atoms: {Math.ceil(simulation?.status.numAtoms)}<br />
            Remaining time: {Math.ceil(simulation?.status.remainingTime)} s<br />
            Timesteps per second: {Math.ceil(simulation?.status.timestepsPerSecond)} <br />
            Simulation speed: <InputNumber min={1} max={200} defaultValue={syncFrequency} onChange={(value) => setSyncFrequency(value)} />
          </p>
        </>
      }
    </div>
  )
}
export default SimulationSummary
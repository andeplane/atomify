import {useStoreState, useStoreActions} from '../hooks'
import {InputNumber} from 'antd'

const SimulationSummary = () => {
  const simulationSettings = useStoreState(state => state.settings.simulation)
  const setSimulationSettings = useStoreActions(actions => actions.settings.setSimulation)

  const simulationStatus = useStoreState(state => state.simulation.simulationStatus)
  const computes = useStoreState(state => state.simulationStatus.computes)
  const fixes = useStoreState(state => state.simulationStatus.fixes)

  const setSyncFrequency = (value: number|null) => {
    if (value && value > 0) {
      setSimulationSettings({...simulationSettings, speed: value})
    }
  }
  
  return (            
    <>
      {simulationStatus && 
          <div>
            Type: {simulationStatus.runType}<br />
            Number of atoms: {Math.ceil(simulationStatus.numAtoms)}<br />
            Remaining time: {Math.ceil(simulationStatus.remainingTime)} s<br />
            Timesteps per second: {Math.ceil(simulationStatus.timestepsPerSecond)} <br />
            Simulation speed: <InputNumber min={1} max={200} defaultValue={simulationSettings.speed} onChange={(value) => setSyncFrequency(value)} /> <br /><br />
            <b>Computes:</b><br />
            {computes.map(c => <div style={{marginLeft: "4px"}}>{c.getName()}<br /></div>)}
            <br /><b>Fixes:</b><br />
            {fixes.map(f => <div style={{marginLeft: "4px"}}>{f.getName()}<br /></div>)}
          </div>
      }
    </>
  )
}
export default SimulationSummary
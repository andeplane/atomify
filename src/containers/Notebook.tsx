import Iframe from 'react-iframe'
import {useEffect, useState} from 'react'
import { useStoreState } from '../hooks';
const Notebook = () => {
  const [initialized, setInitialized] = useState(false)
  const [analysisScriptPath, setAnalysisScriptPath] = useState<string|undefined>()
  const simulation = useStoreState(state => state.simulation.simulation)
  
  useEffect(() => {
    if (!initialized && simulation?.analysisScript != null) {
      setAnalysisScriptPath(`${simulation.id}/${simulation.analysisScript}`)
    }
    setInitialized(true)
  }, [setAnalysisScriptPath, initialized, simulation])
  
  let notebookUrl = `/atomify/jupyter/lab/index.html?path=analyze.ipynb`
  if (analysisScriptPath) {
    notebookUrl = `/atomify/jupyter/lab/index.html?path=${analysisScriptPath}`
  }
  
  return (
    <>
      <div style={{height: '100vh', width: '100%'}}>
      <Iframe sandbox={["allow-scripts", "allow-same-origin"]} url={notebookUrl}
          width="100%"
          height="100%"
          id=""
          className=""
          display="block"
          position="relative"/>
      </div>
    </>
  )
}
export default Notebook
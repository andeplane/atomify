import Iframe from 'react-iframe'
import {useEffect, useState} from 'react'
import { useStoreState } from '../hooks';
const Analyze = () => {
  const [analysisScriptPath, setAnalysisScriptPath] = useState<string|undefined>()
  const preferredView = useStoreState(state => state.simulation.preferredView)
  const simulation = useStoreState(state => state.simulation.simulation)
  
  useEffect(() => {
    if (preferredView === "analyze" && simulation?.analysisScript != null) {
      setAnalysisScriptPath(`${simulation.id}/${simulation.analysisScript}`)
    }
  }, [preferredView, simulation])
  
  let notebookUrl = `/atomify/jupyter/lab/index.html?path=analyze.ipynb`
  if (analysisScriptPath) {
    notebookUrl = `/atomify/jupyter/lab/index.html?path=${analysisScriptPath}`
  }
  console.log("Setting notebook url ", notebookUrl)
  return (
    <>
      <div style={{height: '100vh', width: '100%'}}>
      <Iframe url={notebookUrl}
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
export default Analyze
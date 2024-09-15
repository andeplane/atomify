import Iframe from 'react-iframe'
import { useStoreState } from '../hooks';
const Notebook = () => {
  const simulation = useStoreState(state => state.simulation.simulation)
  
  let notebookUrl = `/atomify/jupyterlite/lab/index.html?path=analyze.ipynb`
  if (simulation?.analysisScript) {
    const analysisScriptPath = `${simulation.id}/${simulation.analysisScript}`
    notebookUrl = `/atomify/jupyterlite/lab/index.html?path=${analysisScriptPath}`
  }
  
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
export default Notebook
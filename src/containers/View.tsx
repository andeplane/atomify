import { useStoreState } from '../hooks';
import {OMOVIVisualizer, Particles} from 'omovi'

const View = () => {
  const particles = useStoreState(state => state.simulation.particles)
  if (particles) {
    return (<OMOVIVisualizer particles={particles}/>)
  } else {
    return (<>No simulation</>)
  }
}
export default View
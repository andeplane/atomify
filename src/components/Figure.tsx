import {Modal, Empty} from 'antd'
import { Compute } from '../types'
import { useEffect, useState } from 'react'
import {useStoreState} from '../hooks'
import Dygraph from 'dygraphs'

interface FigureProps {
  compute: Compute
  onClose: () => void
}
const Figure = ({compute, onClose} : FigureProps) => {
  const [graph, setGraph] = useState<Dygraph>()
  const timesteps = useStoreState(state => state.simulationStatus.timesteps)
  const width = window.innerWidth < 1000 ? window.innerWidth * 0.8 : window.innerWidth * 0.6
  const height = width * 3/4

  useEffect(() => {
    compute.syncDataPoints = true
    return () => {
      compute.syncDataPoints = false
    }
  }, [compute])
  
  useEffect(() => {
    if (compute.data1D && !graph) {
      const g = new Dygraph('graph', compute.data1D.data, {
        labels: compute.data1D.labels,
        xlabel: compute.xLabel,
        ylabel: compute.yLabel,
        title: compute.name,
        width: width-50, // Extra 50 is padding for the figure
        height,
        legend: 'always'
      });
      setGraph(g)
      //@ts-ignore
      window.compute = compute
    }
  }, [compute, graph, height, width])

  useEffect(() => {
    if (graph && compute.data1D) {
      graph.updateOptions( { 'file': compute.data1D.data } );
    }
  }, [graph, compute, timesteps])
  
  return (<Modal open width={width} footer={null} onCancel={onClose}>
      <div id="graph" />
      {!graph && <Empty />}
  </Modal>)
}
export default Figure
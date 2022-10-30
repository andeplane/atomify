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

  useEffect(() => {
    if (compute.data1D && !graph) {
      const g = new Dygraph('graph', compute.data1D.data, {
        labels: compute.data1D.labels,
        xlabel: compute.xLabel,
        ylabel: compute.yLabel,
        title: compute.name,
        legend: 'always',
      });
      setGraph(g)
      //@ts-ignore
      window.compute = compute
    }
  }, [compute, graph])

  useEffect(() => {
    if (graph && compute.data1D) {
      graph.updateOptions( { 'file': compute.data1D.data } );
    }
  }, [graph, compute, timesteps])
  
  return (<Modal open footer={null} onCancel={onClose}>
      <div id="graph" />
      {!graph && <Empty />}
  </Modal>)
}
export default Figure
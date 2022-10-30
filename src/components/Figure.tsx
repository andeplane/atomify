import {Modal} from 'antd'
import { Compute } from '../types'
import { useEffect, useState } from 'react'
import Dygraph from 'dygraphs'

import styled from 'styled-components'
const Container = styled.div`
  #darkbg .dygraph-axis-label { color: white; }
  .dygraph-legend { text-align: right; }
  #darkbg .dygraph-legend { background-color: #101015; }
`

interface FigureProps {
  compute: Compute
}
const Figure = ({compute} : FigureProps) => {
  const [graph, setGraph] = useState<Dygraph>()

  useEffect(() => {
    if (compute.data1D) {
      console.log("Data: ", compute.data1D?.data)
      console.log("Labels: ", compute.data1D.labels)
      const g = new Dygraph('graph', compute.data1D.data, {
        labels: compute.data1D.labels,
        xlabel: compute.xLabel,
        ylabel: compute.yLabel,
        title: compute.name,
        legend: 'always'
      });
      setGraph(g)
    }

  }, [compute])

  return (<Modal open>
    <Container>
    <div id="graph" />
    </Container>
  </Modal>)
}
export default Figure
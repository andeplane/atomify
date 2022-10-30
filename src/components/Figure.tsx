import {Modal} from 'antd'
import { useEffect, useState } from 'react'
import Dygraph from 'dygraphs'

import styled from 'styled-components'
const Container = styled.div`
  #darkbg .dygraph-axis-label { color: white; }
  .dygraph-legend { text-align: right; }
  #darkbg .dygraph-legend { background-color: #101015; }
`

interface FigureProps {
  xValues: Float32Array
  yValues: Float32Array
  xLabel: string
  yLabel: string
  title: string
}
const Figure = ({xValues, yValues, xLabel, yLabel, title} : FigureProps) => {
  const [graph, setGraph] = useState<Dygraph|undefined>()
  
  useEffect(() => { 
    const data: number[][] = []
    xValues.forEach((value, index) => {
      data.push([value, yValues[index]])
    })

    const g = new Dygraph('graph', data, {labels: [xLabel, yLabel], xlabel: xLabel, ylabel: yLabel, title, legend: 'always'});
    setGraph(g)

  }, [xValues, yValues, xLabel, yLabel, title])
  return (<Modal open>
    <Container>
    <div id="graph" />
    </Container>
  </Modal>)
}
export default Figure
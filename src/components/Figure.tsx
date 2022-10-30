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
  // const [graph, setGraph] = useState<Dygraph|undefined>()
  
  // useEffect(() => { 
  //   const data: number[][] = []
  //   xValues.forEach((value, index) => {
  //     data.push([value, yValues[index]])
  //   })

  //   const g = new Dygraph('graph', data, {labels: [xLabel, yLabel], xlabel: xLabel, ylabel: yLabel, title, legend: 'always'});
  //   // setGraph(g)

  // }, [xValues, yValues, xLabel, yLabel, title])
  // return (<Modal open>
  //   <Container>
  //   <div id="graph" />
  //   </Container>
  // </Modal>)
  return (<></>)
}
export default Figure
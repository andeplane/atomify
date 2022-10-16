import {useCallback, useState, useEffect} from 'react'
import { useMeasure } from 'react-use';
import {Simulation, SimulationFile} from '../store/simulation'
import {useStoreActions, useStoreState} from '../hooks'
import { CaretRightOutlined, EditOutlined } from '@ant-design/icons';
import { Card, Layout, Skeleton, Row, Col, notification } from 'antd';
import mixpanel from 'mixpanel-browser';

const { Header } = Layout;
const { Meta } = Card;
interface Example {
  id: string
  title: string
  files: SimulationFile[]
  description: string
  imageUrl: string
  inputScript: string
}

const Examples = () => {
  const [examples, setExamples] = useState<Example[]>([])
  const [myRef, { width }] = useMeasure<HTMLDivElement>();
  const setNewSimulation = useStoreActions(actions => actions.simulation.newSimulation)
  const simulation = useStoreState(state => state.simulation.simulation)
  const setPreferredView = useStoreActions(actions => actions.simulation.setPreferredView)
  const lammps = useStoreState(state => state.simulation.lammps)
    
  useEffect(() => {
    (async () => {
      const examplesUrl = 'examples/examples.json'
      const response = await fetch(examplesUrl)
      const data = await response.json()
      setExamples(data)
    })()
  }, [])

  const onPlay = useCallback((example: Example) => {
    mixpanel.track('Example.Run', {simulationId: example.id})
    const newSimulation: Simulation = {
      files: example.files,
      id: example.id,
      inputScript: example.inputScript,
      start: true
    }
    if (lammps?.isRunning()) {
      notification.info({
        message: 'Simulation already running',
        description: "You can't start a new simulation while another one is running.",
      });
    } else {
      setNewSimulation(newSimulation)
      setPreferredView('view')
    }
  }, [lammps, setNewSimulation, setPreferredView])

  const onEdit = useCallback((example: Example) => {
    mixpanel.track('Example.Edit', {simulationId: example.id})
    const newSimulation: Simulation = {
      files: example.files,
      id: example.id,
      inputScript: example.inputScript,
      start: false
    }
    if (simulation?.id !== newSimulation.id) {
      setNewSimulation(newSimulation)
    } else {
      setPreferredView('file'+newSimulation.inputScript)
    }
  }, [setNewSimulation, setPreferredView, simulation?.id])

  const renderCard = (example: Example) => (
    <Card
      key={example.id}
      style={{ width: 300 }}
      cover={
        <img
          alt="example"
          src={example.imageUrl}
        />
      }
      actions={[
        <CaretRightOutlined key="setting" onClick={() => onPlay(example)} />,
        <EditOutlined key="edit"  onClick={() => onEdit(example)} />,
      ]}
    >
      <Meta
        title={example.title}
        description={example.description}
      />
    </Card>
  )

  const renderChunk = (chunk: Example[], index: number) => (
    <Row key={index.toString()} gutter={8} justify="space-between">
      {chunk.map((example, index2) => (
        <Col key={index.toString()+index2.toString()} className="gutter-row" span={5} style={{marginTop: 10}}>
          {renderCard(example)}
        </Col>
      ))}
    </Row>
  )

  const chunkIt = (array: Example[], chunkSize: number) => {
    const chunks: Example[][] = []

    for (let i = 0; i < array.length; i += chunkSize) {
        const chunk = array.slice(i, i + chunkSize);
        chunks.push(chunk)
    }
    return chunks
  }

  const numChunks = Math.min(Math.max(1, Math.floor(width / 300)), 4)
  const chunks = chunkIt(examples, numChunks)

  return (
    <>
    <Header className="site-layout-background" style={{ fontSize: 25 }}>
      Examples
    </Header>
    <div style={{padding: 10, margin: 10}} ref={myRef}>
    {/* {Object.values(examples).map(renderCard)} */}
    {chunks.map(renderChunk)}
    {examples.length === 0 && <Skeleton active/>}
    </div>
    </>)
}
export default Examples
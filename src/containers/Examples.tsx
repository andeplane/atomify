import {useCallback, useState, useEffect} from 'react'
import {Simulation, SimulationFile} from '../store/simulation'
import {useStoreActions, useStoreState} from '../hooks'
import { CaretRightOutlined, EditOutlined } from '@ant-design/icons';
import { Card, Layout, Skeleton, notification } from 'antd';

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
  const [loading, setLoading] = useState(false)

  const setNewSimulation = useStoreActions(actions => actions.simulation.newSimulation)
  const simulation = useStoreState(state => state.simulation.simulation)
  const setPreferredView = useStoreActions(actions => actions.simulation.setPreferredView)
  const lammps = useStoreState(state => state.simulation.lammps)
    
  useEffect(() => {
    (async () => {
      const examplesUrl = 'examples/examples.json'
      const response = await fetch(examplesUrl)
      console.log("Got response: ", response)
      const data = await response.json()
      console.log("Got examples: ", data)
      setExamples(data)
    })()
  })

  const onPlay = useCallback((example: Example) => {
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
  }, [examples])

  const onEdit = useCallback((example: Example) => {
    const newSimulation: Simulation = {
      files: example.files,
      id: example.id,
      inputScript: example.inputScript,
      start: false
    }
    if (simulation?.id != newSimulation.id) {
      setNewSimulation(newSimulation)
    } else {
      setPreferredView('file'+newSimulation.inputScript)
    }
  }, [examples])
  return (
    <>
    <Header className="site-layout-background" style={{ fontSize: 25 }}>
      Examples
    </Header>
    <div style={{padding: 10, margin: 10}}>
    {Object.values(examples).map(example => (
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
    ))}
    {examples.length == 0 && <Skeleton active/>}
    </div>
    </>)
}
export default Examples
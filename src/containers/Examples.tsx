import {useCallback} from 'react'
import {Simulation, SimulationFile} from '../store/simulation'
import {useStoreActions, useStoreState} from '../hooks'
import { CaretRightOutlined, EditOutlined } from '@ant-design/icons';
import { Card, notification } from 'antd';
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
  const setNewSimulation = useStoreActions(actions => actions.simulation.newSimulation)
  const simulation = useStoreState(state => state.simulation.simulation)
  const setPreferredView = useStoreActions(actions => actions.simulation.setPreferredView)
  const lammps = useStoreState(state => state.simulation.lammps)

  const examples: Example[] = [
    {
      id: 'diffusion',
      title: "Diffusion",
      description: 'Diffusion using the Lennard Jones potential',
      imageUrl: 'https://github.com/ovilab/atomify-lammps-examples/blob/master/examples/diffusion/diffusion/simple_diffusion.png?raw=true',
      inputScript: 'simple_diffusion.in',
      files: [
        {
          fileName: 'simple_diffusion.in',
          url: 'https://raw.githubusercontent.com/ovilab/atomify-lammps-examples/master/examples/diffusion/diffusion/simple_diffusion.in'
        }
      ]
    },
    {
      id: 'vashishtasio2',
      title: "Vashishta SiO2",
      description: 'Silica quartz simulated using the Vashishta potential',
      imageUrl: 'https://github.com/ovilab/atomify-lammps-examples/blob/master/examples/silica/betacristobalite/betacristobalite.png?raw=true',
      inputScript: 'in.vashishta.sio2',
      files: [
        {
          fileName: 'SiO.1990.vashishta',
          url: 'https://raw.githubusercontent.com/lammps/lammps/develop/potentials/SiO.1990.vashishta',
        },
        {
          fileName: 'data.quartz',
          url: 'https://raw.githubusercontent.com/lammps/lammps/develop/examples/vashishta/data.quartz'
        },
        {
          fileName: 'in.vashishta.sio2',
          url: 'https://raw.githubusercontent.com/lammps/lammps/develop/examples/vashishta/in.vashishta.sio2'
        }
      ]
    }
  ]

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

  return (<div style={{padding: 10}}>
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
    </div>)
}
export default Examples
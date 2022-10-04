import {useCallback} from 'react'
import {SimulationFile} from '../store/files'
import {Simulation} from '../store/simulation'
import {useStoreActions} from '../hooks'
import { CaretRightOutlined, EditOutlined } from '@ant-design/icons';
import { Card } from 'antd';
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
  const newSimulation = useStoreActions(actions => actions.simulation.newSimulation)
  const examples: Example[] = [
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
    const simulation: Simulation = {
      files: example.files,
      id: example.id,
      inputScript: example.inputScript
    }
    newSimulation(simulation)
    console.log("Playing ", example.id)
  }, [examples])

  const onEdit = useCallback((example: Example) => {
    console.log("Editing ", example.id)
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
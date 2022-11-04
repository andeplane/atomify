import {useStoreState, useStoreActions} from '../hooks'
import {SettingOutlined} from '@ant-design/icons'
import {Table, Row, Col, Button, Slider} from 'antd'
import type { ColumnsType } from 'antd/es/table';
import type { TableRowSelection } from 'antd/es/table/interface';
import {Compute} from '../types'
import React, {useState} from 'react'
import Modifier from '../modifiers/modifier'
import SyncBondsSettings from '../modifiers/SyncBondsSettings';
import SyncParticlesSettings from '../modifiers/SyncParticlesSettings';
import ColorModifierSettings from '../modifiers/ColorModifierSettings';
import ColorModifier from '../modifiers/colormodifier';
import Figure from '../components/Figure';
import {track} from '../utils/metrics'
interface SimulationSummaryType {
  key: React.ReactNode
  name: string
  value: string|number
}

// const fixesColumns: ColumnsType<Fix> = [
//   {
//     title: 'Name',
//     dataIndex: 'name',
//     key: 'name',
//   }
// ];

const SimulationSummary = () => {
  const [visibleSettings, setVisibleSettings] = useState<string|undefined>()
  const [visibleFigure, setVisibleFigure] = useState<string|undefined>()
  // const [selectedModifiers, setSelectedModifiers] = useState<React.Key[]>(["Particles", "Bonds", "Colors", "Computes"])

  const simulationSettings = useStoreState(state => state.settings.simulation)
  const modifiers = useStoreState(state => state.processing.postTimestepModifiers)
  const postTimestepModifiers = useStoreState(state => state.processing.postTimestepModifiers)
  const colorModifier = postTimestepModifiers.filter(modifier => modifier.name==="Colors")[0] as ColorModifier
  const selectedModifiers = postTimestepModifiers.filter(m => m.active).map(m => m.name)
  const simulation = useStoreState(state => state.simulation.simulation)
  const runType = useStoreState(state => state.simulationStatus.runType)
  const numAtoms = useStoreState(state => state.simulationStatus.numAtoms)
  const numBonds = useStoreState(state => state.simulationStatus.numBonds)
  const timesteps = useStoreState(state => state.simulationStatus.timesteps)
  const remainingTime = useStoreState(state => state.simulationStatus.remainingTime)
  const timestepsPerSecond = useStoreState(state => state.simulationStatus.timestepsPerSecond)

  
  const setSimulationSettings = useStoreActions(actions => actions.settings.setSimulation)

  const computes = useStoreState(state => state.simulationStatus.computes)
  // const fixes = useStoreState(state => state.simulationStatus.fixes)
  const computeForFigure = visibleFigure ? computes[visibleFigure] : undefined
  const setSyncFrequency = (value: number|null) => {
    if (value && value > 0) {
      track('SimulationSpeed.Change', {speed: value})
      setSimulationSettings({...simulationSettings, speed: value})
    }
  }

  const computeColumns: ColumnsType<Compute> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (value, record) => {
        if (record.isPerAtom) {
          return <Button style={{padding: 0}} type="link" onMouseEnter={() => {colorModifier.computeName=value}} onMouseLeave={() => {colorModifier.computeName=undefined}}>{value}</Button>
        } else if (record.hasData1D) {
          return <><Button style={{padding: 0}} type="link" onClick={() => {
            track('Modifier.Show', {type: 'Compute', name: value})
            setVisibleFigure(value)
          }} >{value}</Button> {' ' + (record.hasScalarData ? record.scalarValue.toPrecision(5).toString() : '')}</>
        } else {
          return (<>{value + ' ' + (record.hasScalarData ? record.scalarValue.toPrecision(5).toString() : '')}</>)
        }
      }
    }
  ];

  const modiferColumns: ColumnsType<Modifier> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => <Row justify="space-between"><Col span={8}>{text}</Col> <Col span={2}><SettingOutlined onClick={() => setVisibleSettings(text)} /></Col></Row>
    }
  ];
  
  const rowSelection: TableRowSelection<Modifier> = {
    onChange: (selectedRowKeys, selectedRows) => {
      modifiers.forEach(modifier => {
        modifier.active = selectedRows.indexOf(modifier) >= 0
      })
    },
  };

  const simulationSummaryColumns: ColumnsType<SimulationSummaryType> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '160px'
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (text, record) => {
        if (record.key === "simulationspeed") {
          return <Slider min={1} step={2} max={200} defaultValue={simulationSettings.speed} onChange={(value) => setSyncFrequency(value)} />
        }
        return <>{text}</>
      }
    }
  ];

  let simulationStatusData: SimulationSummaryType[] = []
  
  if (simulation) {
    simulationStatusData = [
      {
        key: "type",
        name: "Run type",
        value: runType
      },
      {
        key: "timesteps",
        name: "Timesteps",
        value: Math.ceil(timesteps)
      },
      {
        key: "numatoms",
        name: "Number of atoms",
        value: Math.ceil(numAtoms)
      },
      {
        key: "numbonds",
        name: "Number of bonds",
        value: Math.ceil(numBonds)
      },
      {
        key: "timeremain",
        name: "Remaining time",
        value: Math.ceil(remainingTime).toString()+' s'
      },
      {
        key: "tsps",
        name: "Timesteps per second",
        value: Math.ceil(timestepsPerSecond)
      },
      {
        key: "simulationspeed",
        name: "Simulation speed",
        value: simulationSettings.speed
      },
    ]
  }

  return (            
    <>
      <Table
        title={() => <b>Modifiers</b>}
        size='small'
        showHeader={false}
        columns={modiferColumns}
        rowSelection={{ ...rowSelection, selectedRowKeys: selectedModifiers}}
        dataSource={modifiers}
        pagination={{hideOnSinglePage: true}}
      />
      {simulation && 
        <>
        <Table
          title={() => <b>Summary</b>}
          size='small'
          showHeader={false}
          columns={simulationSummaryColumns}
          dataSource={simulationStatusData}
          pagination={{hideOnSinglePage: true}}
        />
        <Table
          title={() => <b>Computes</b>}
          size='small'
          rowKey='name'
          showHeader={false}
          columns={computeColumns}
          dataSource={Object.values(computes)}
          pagination={{hideOnSinglePage: true}}
        />
        {/* <Table
          title={() => <b>Fixes</b>}
          size='small'
          rowKey='name'
          showHeader={false}
          columns={fixesColumns}
          dataSource={Object.values(fixes)}
          pagination={{hideOnSinglePage: true}}
        /> */}
        </>
      }
      {visibleSettings==='Bonds' && <SyncBondsSettings onClose={() => setVisibleSettings(undefined)} />}
      {visibleSettings==='Particles' && <SyncParticlesSettings onClose={() => setVisibleSettings(undefined)} />}
      {visibleSettings==='Colors' && <ColorModifierSettings onClose={() => setVisibleSettings(undefined)} />}
      {computeForFigure && <Figure compute={computeForFigure} onClose={() => setVisibleFigure(undefined)} />}
    </>
  )
}
export default SimulationSummary
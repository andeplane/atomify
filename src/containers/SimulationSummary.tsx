import {useStoreState, useStoreActions} from '../hooks'
import {SettingOutlined} from '@ant-design/icons'
import {InputNumber, Table, Row, Col, Button} from 'antd'
import type { ColumnsType } from 'antd/es/table';
import type { TableRowSelection } from 'antd/es/table/interface';
import {Compute, Fix} from '../types'
import React, {useState} from 'react'
import Modifier from '../modifiers/modifier'
import SyncBondsSettings from '../modifiers/SyncBondsSettings';
import SyncParticlesSettings from '../modifiers/SyncParticlesSettings';
import ColorModifierSettings from '../modifiers/ColorModifierSettings';
import ColorModifier from '../modifiers/colormodifier';
import Figure from '../components/Figure';

interface SimulationSummaryType {
  key: React.ReactNode
  name: string
  value: string|number
}

const fixesColumns: ColumnsType<Fix> = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  }
];

const SimulationSummary = () => {
  const [visibleSettings, setVisibleSettings] = useState<string|undefined>()
  const [visibleFigure, setVisibleFigure] = useState<string|undefined>()
  const [selectedModifiers, setSelectedModifiers] = useState<React.Key[]>(["Particles", "Bonds", "Colors", "Computes"])

  const simulationSettings = useStoreState(state => state.settings.simulation)
  const modifiers = useStoreState(state => state.processing.postTimestepModifiers)
  const postTimestepModifiers = useStoreState(state => state.processing.postTimestepModifiers)
  const colorModifier = postTimestepModifiers.filter(modifier => modifier.name==="Colors")[0] as ColorModifier
  
  const simulationStatus = useStoreState(state => state.simulation.simulationStatus)
  const setSimulationSettings = useStoreActions(actions => actions.settings.setSimulation)

  const computes = useStoreState(state => state.simulationStatus.computes)
  const fixes = useStoreState(state => state.simulationStatus.fixes)

  const setSyncFrequency = (value: number|null) => {
    if (value && value > 0) {
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
        } else if (record.data1D != null) {
          return <Button style={{padding: 0}} type="link" onClick={() => {
            setVisibleFigure(value)
          }} >{value}</Button>
        } else {
          return (<>{value}</>)
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
      setSelectedModifiers(selectedRowKeys)
    },
  };

  const simulationSummaryColumns: ColumnsType<SimulationSummaryType> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (text, record) => {
        if (record.key === "simulationspeed") {
          return <InputNumber min={1} max={200} defaultValue={simulationSettings.speed} onChange={(value) => setSyncFrequency(value)} />
        }
        return <>{text}</>
      }
    }
  ];

  let simulationStatusData: SimulationSummaryType[] = []
  
  if (simulationStatus) {
    simulationStatusData = [
      {
        key: "numatoms",
        name: "Number of atoms",
        value: Math.ceil(simulationStatus.numAtoms)
      },
      {
        key: "timeremain",
        name: "Remaining time",
        value: Math.ceil(simulationStatus.remainingTime).toString()+' s'
      },
      {
        key: "tsps",
        name: "Timesteps per second",
        value: Math.ceil(simulationStatus.timestepsPerSecond)
      },
      {
        key: "simulationspeed",
        name: "Simulation speed",
        value: simulationSettings.speed
      },
    ]
  }

  const x = new Float32Array(100)
  const y = new Float32Array(100)
  for (let i = 0; i < x.length; i++) {
    x[i] = 2 * Math.PI * i/x.length
    y[i] = Math.sin(x[i])
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
      {simulationStatus && 
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
          showHeader={false}
          columns={computeColumns}
          dataSource={Object.values(computes)}
          pagination={{hideOnSinglePage: true}}
        />
        <Table
          title={() => <b>Fixes</b>}
          size='small'
          showHeader={false}
          columns={fixesColumns}
          dataSource={Object.values(fixes)}
          pagination={{hideOnSinglePage: true}}
        />
        </>
      }
      {visibleSettings==='Bonds' && <SyncBondsSettings onClose={() => setVisibleSettings(undefined)} />}
      {visibleSettings==='Particles' && <SyncParticlesSettings onClose={() => setVisibleSettings(undefined)} />}
      {visibleSettings==='Colors' && <ColorModifierSettings onClose={() => setVisibleSettings(undefined)} />}
      {visibleFigure && computes[visibleFigure] && <Figure compute={computes[visibleFigure]} />}
    </>
  )
}
export default SimulationSummary
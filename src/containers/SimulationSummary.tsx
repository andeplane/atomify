import {useStoreState, useStoreActions} from '../hooks'
import {SettingOutlined} from '@ant-design/icons'
import {InputNumber, Table, Row, Col} from 'antd'
import type { ColumnsType } from 'antd/es/table';
import type { TableRowSelection } from 'antd/es/table/interface';
import {Compute, Fix} from '../types'
import React, {useState} from 'react'
import Modifier from '../modifiers/modifier'
import SyncBondsSettings from '../modifiers/SyncBondsSettings';
import SyncParticlesSettings from '../modifiers/SyncParticlesSettings';

interface SimulationSummaryType {
  key: React.ReactNode
  name: string
  value: string|number
}

const computeColumns: ColumnsType<Compute> = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  }
];

const fixesColumns: ColumnsType<Fix> = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  }
];

const SimulationSummary = () => {
  const [visibleSettings, setVisibleSettings] = useState<string|undefined>()
  const [selectedModifiers, setSelectedModifiers] = useState<React.Key[]>(["Particles", "Bonds"])
  const simulationSettings = useStoreState(state => state.settings.simulation)
  const modifiers = useStoreState(state => state.processing.postTimestepModifiers)

  const setSimulationSettings = useStoreActions(actions => actions.settings.setSimulation)

  const simulationStatus = useStoreState(state => state.simulation.simulationStatus)
  const computes = useStoreState(state => state.simulationStatus.computes)
  const fixes = useStoreState(state => state.simulationStatus.fixes)

  const setSyncFrequency = (value: number|null) => {
    if (value && value > 0) {
      setSimulationSettings({...simulationSettings, speed: value})
    }
  }

  const modiferColumns: ColumnsType<Modifier> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => <Row justify="space-between"><Col span={8}>{text}</Col> <Col span={2}><SettingOutlined onClick={() => setVisibleSettings(text)} /></Col></Row>
    }
  ];
  
  // rowSelection objects indicates the need for row selection
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
          dataSource={computes}
          pagination={{hideOnSinglePage: true}}
        />
        <Table
          title={() => <b>Fixes</b>}
          size='small'
          showHeader={false}
          columns={fixesColumns}
          dataSource={fixes}
          pagination={{hideOnSinglePage: true}}
        />
        </>
      }
      {visibleSettings==='Bonds' && <SyncBondsSettings onClose={() => setVisibleSettings(undefined)} />}
      {visibleSettings==='Particles' && <SyncParticlesSettings onClose={() => setVisibleSettings(undefined)} />}
    </>
  )
}
export default SimulationSummary
import {useStoreState, useStoreActions} from '../hooks'
import {SettingOutlined} from '@ant-design/icons'
import {InputNumber, Table, Row, Col} from 'antd'
import type { ColumnsType } from 'antd/es/table';
import type { TableRowSelection } from 'antd/es/table/interface';
import React, {useState} from 'react'
import Modifier from '../modifiers/modifier'
import {Modal} from 'antd'

// interface DataType {
//   key: React.ReactNode;
//   name: string;
//   children?: DataType[];
//   onSettingsClicked: () => void
// }

// const data: Modifier[] = [
//   {
//     key: 1,
//     name: 'Particles',
//     onSettingsClicked: () => console.log("Clicked particles")
//   },
//   {
//     key: 1,
//     name: 'Bonds',
//     onSettingsClicked: () => console.log("Clicked bonds")
//   },
// ];

const SimulationSummary = () => {
  const [settingsRenderer, setSettingsRenderer] = useState<() => JSX.Element | undefined>()
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

  const columns: ColumnsType<Modifier> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      // render: (text, record) => <Row justify="space-between"><Col span={8}>{text}</Col> <Col span={2}><SettingOutlined onClick={() => console.log("Clicked thing")} /></Col></Row>
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

  return (            
    <>
      <Table
        title={() => 'Modifiers'}
        size='small'
        showHeader={false}
        columns={columns}
        rowSelection={{ ...rowSelection, selectedRowKeys: selectedModifiers}}
        dataSource={modifiers}
        pagination={{hideOnSinglePage: true}}
      />
      {simulationStatus && 
          <div>
            Type: {simulationStatus.runType}<br />
            Number of atoms: {Math.ceil(simulationStatus.numAtoms)}<br />
            Remaining time: {Math.ceil(simulationStatus.remainingTime)} s<br />
            Timesteps per second: {Math.ceil(simulationStatus.timestepsPerSecond)} <br />
            Simulation speed: <InputNumber min={1} max={200} defaultValue={simulationSettings.speed} onChange={(value) => setSyncFrequency(value)} /> <br /><br />
            <b>Computes:</b><br />
            {computes.map(c => <div style={{marginLeft: "4px"}}>{c.name}<br /></div>)}
            <br /><b>Fixes:</b><br />
            {fixes.map(f => <div style={{marginLeft: "4px"}}>{f.name}<br /></div>)}
          </div>
      }
    </>
  )
}
export default SimulationSummary
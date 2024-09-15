import {useCallback, useState, useEffect} from 'react'
import { useMeasure } from 'react-use';
import { Select, Button, Divider } from 'antd';
import {Simulation} from '../store/simulation'
import {SimulationFile} from '../store/app'
import {useStoreActions, useStoreState} from '../hooks'
import { CaretRightOutlined, EditOutlined } from '@ant-design/icons';
import { Card, Layout, Skeleton, Row, Col, notification } from 'antd';
import {track} from '../utils/metrics'
import { AtomifyFile } from '../store/files';

const {Option} = Select

const { Header } = Layout;
const { Meta } = Card;

const Simulations = () => {
  const files = useStoreState(state => state.files.files)
  const syncFilesJupyterLite = useStoreActions(actions => actions.files.syncFilesJupyterLite)
  const [myRef, { width }] = useMeasure<HTMLDivElement>();

  useEffect(() => {
    setInterval(() => {
      syncFilesJupyterLite()
    }, 1000)
  }, [])
  
  useEffect(() => {
    (async () => {
      const folders = Object.values(files).filter(file => file.type === "directory")
      folders.forEach(folder => {
        const filesInFolder = Object.values(files).filter(file => file.type !== "directory" && file.path.startsWith(folder.name))
        let image: AtomifyFile
        filesInFolder.forEach(file => {
          if (file.mimetype === "image/png") {
            image = file
          }
        })
      })


    })()
  }, [files])

  const renderCard = (simulation: AtomifyFile) => {
    return (
    <Card
      key={simulation.name}
      style={{ width: 300, marginLeft: 'auto', marginRight: 'auto' }}
      actions={[
        <CaretRightOutlined key="setting"/>,
        <EditOutlined key="edit"/>,
      ]}
    >
      <Meta
        title={simulation.name}
        description={"Test"}
      />
    </Card>
  )}

  const chunkIt = (array: Simulation[], chunkSize: number) => {
    const chunks: Simulation[][] = []

    for (let i = 0; i < array.length; i += chunkSize) {
        const chunk = array.slice(i, i + chunkSize);
        chunks.push(chunk)
    }
    return chunks
  }



  return (
    <>
    <Header className="site-layout-background" style={{ fontSize: 25 }}>
      Simulations
    </Header>
    <div style={{padding: 10, margin: 10}} ref={myRef}>
      <h1>Your simulations</h1>
      
      {folders.map(renderCard)}
    </div>
    </>)
}
export default Simulations
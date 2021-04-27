import React, {useRef, useState, useEffect, useCallback} from 'react';
import 'antd/dist/antd.css';
import lammpsWasm from './wasm/lammps'
import {OMOVIVisualizer, Particles} from 'omovi'
import Terminal, { ColorMode, LineType } from 'react-terminal-ui';
import {LAMMPSWeb} from 'types'
import {useListDirectory} from 'hooks/github'
import styled from 'styled-components'
import {useStoreActions, useStoreState} from 'hooks'
import { Layout, Menu } from 'antd';
import TreeView from 'components/TreeView';
import Editor from 'containers/Editor'
import { UploadOutlined, UserOutlined, VideoCameraOutlined } from '@ant-design/icons';
const { Header, Content, Footer, Sider } = Layout;

const Container = styled.div`
  #components-layout-demo-responsive .logo {
    height: 32px;
    margin: 16px;
    background: rgba(255, 255, 255, 0.2);
  }

  .site-layout-sub-header-background {
    background: #fff;
  }

  .site-layout-background {
    background: #fff;
  }

  .ant-layout {
    height: 100%;
  }

  height: 100%;
`

const getPositions = (lammps: any, wasm: any) => {
  const numAtoms = lammps.numAtoms()
  const particles = new Particles(numAtoms);
  const positionsPtr = lammps.getPositionsPointer() / 8;
  const typePtr = lammps.getTypePointer() / 4;
  const idPtr = lammps.getIdPointer() / 4;
  const positionsSubarray = wasm.HEAPF64.subarray(positionsPtr, positionsPtr + 3 * numAtoms) as Float64Array
  // const typeSubarray = obj.HEAP32.subarray(typePtr, typePtr + numAtoms) as Int32Array
  const idSubarray = wasm.HEAP32.subarray(idPtr, idPtr + numAtoms) as Int32Array

  particles.positions = Float32Array.from(positionsSubarray)
  // particles.types = Float32Array.from(typeSubarray)
  particles.indices = Float32Array.from(idSubarray)
  particles.radii.fill(0.25)
  particles.count = numAtoms
  return particles
}

const App = () => {
  const [wasmLoaded, setWasmLoaded] = useState(false)
  const [wasm, setWasm] =  useState<any>()
  const [particles, setParticles] = useState<Particles>()
  const [lammpsOutput, setLammpsOutput] = useState([
    {type: LineType.Output, value: 'LAMMPS'}
  ])

  const setLammps = useStoreActions(actions => actions.lammps.setLammps)
  const lammps = useStoreState(state => state.lammps.lammps)
  
  const user = 'lammps'
  const repository = 'lammps'
  const path = 'examples/melt'
  // const {loading, files} = useListDirectory(user, repository, path)
  const files: string[] =  ['test']
  const fullPath = `${user}/${repository}/${path}`
  const fileNames = files.map(fileName => fileName.replace(path+'/', ''))
  
  const onPrint = useCallback( (text: string) => {
    const newTerminalLineData = {
      type: LineType.Output, value: text
    }
    setLammpsOutput(state => [...state, newTerminalLineData])
  }, [])
  
  useEffect(() => {
    if (!wasmLoaded) {
      setWasmLoaded(true)
      const wasmLoader = lammpsWasm({
        onRuntimeInitialized: async () => {
          wasmLoader.then(async (wasm: any) => {
            setWasm(wasm)
            
            // @ts-ignore
            const lammps = new wasm.LAMMPSWeb() as LAMMPSWeb
            lammps.loadLJ()
            lammps.step()
            const particles = getPositions(lammps, wasm)
            setParticles(particles)
            setLammps(lammps)
          })
        },
        print: onPrint,
        locateFile: () => require("./wasm/lammps.wasm"),
      });
    }
  }, [onPrint, setLammps, wasmLoaded])

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (lammps != null) {
  //       lammps.step()
  //       const numAtoms = lammps.numAtoms()
  //       const particles = getPositions(lammps, wasm)
  //       setParticles(particles)
  //     }
  //   }, 16);
  //   return () => clearInterval(interval);
  // }, [lammps, wasm]);

  // useEffect(() => {
  //   setParticles(p)
  // }, [])

  const onSelect = useCallback( (keys: React.Key[], info: any) => {
    console.log('Trigger Select', keys, info);
  }, []);
  
  return (
    <div className="App">
      <Container>
      <Layout>
      <Sider
        width={300}
        breakpoint="lg"
        collapsedWidth="0"
        onBreakpoint={broken => {
          console.log(broken);
        }}
        onCollapse={(collapsed, type) => {
          console.log(collapsed, type);
        }}
      >
      <TreeView path={fullPath} files={fileNames} onSelect={onSelect}/>
      </Sider>
      <Layout>
        <Content style={{ margin: '24px 16px 0' }}>
            <Editor particles={particles} lammpsOutput={lammpsOutput} onConsoleInput={input => lammps?.runCommand(input)} />
        </Content>
      </Layout>
      </Layout>
      </Container>
    </div>
  );
}

export default App;

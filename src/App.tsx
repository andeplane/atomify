import React, {useState, useEffect, useCallback} from 'react';
import {Particles} from 'omovi'
import 'antd/dist/antd.css';
import lammpsWasm from './wasm/lammps'
import { LineType } from 'react-terminal-ui';
import {useListDirectory} from 'hooks/github'
import styled from 'styled-components'
import {useStoreActions, useStoreState} from 'hooks'
import { Layout } from 'antd';
import TreeView from 'components/TreeView';
import Editor from 'containers/Editor'
const { Content, Sider } = Layout;

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
  // const typePtr = lammps.getTypePointer() / 4;
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
  const [particles, setParticles] = useState<Particles>()
  const [lammpsOutput, setLammpsOutput] = useState([
    {type: LineType.Output, value: 'LAMMPS'}
  ])

  const setWasm = useStoreActions(actions => actions.lammps.setWasm)
  const resetLammps = useStoreActions(actions => actions.lammps.resetLammps)
  const loadLJ = useStoreActions(actions => actions.lammps.loadLJ)
  
  const lammps = useStoreState(state => state.lammps.lammps)
  const wasm = useStoreState(state => state.lammps.wasm)
  
  const user = 'lammps'
  const repository = 'lammps'
  const path = 'examples/melt'
  const {isLoading, files} = useListDirectory(user, repository, path)
  
  const fullPath = `${user}/${repository}/${path}`
  const fileNames = files.map(file => file.name)
  
  const onPrint = useCallback( (text: string) => {
    const output = {
      type: LineType.Output, value: text
    }
    setLammpsOutput(state => [...state, output])
  }, [])

  useEffect(() => {
    if (!wasmLoaded) {
      setWasmLoaded(true)
      const wasmLoader = lammpsWasm({
        onRuntimeInitialized: async () => {
          wasmLoader.then(async (wasm: any) => {
            setWasm(wasm)
          })
        },
        print: onPrint,
        locateFile: () => require("./wasm/lammps.wasm"),
      });
    }
  }, [onPrint, setWasm, wasmLoaded])

  useEffect(() => {
    if (wasm) {
      // resetLammps()
      loadLJ()
    }
  }, [loadLJ, resetLammps, wasm])

  useEffect(() => {
    if (lammps) {
      //@ts-ignore
      window.postStepCallback = () => {
        const particles = getPositions(lammps, wasm)
        setParticles(particles)
      }
      const particles = getPositions(lammps, wasm)
      setParticles(particles)
    }
  }, [lammps, wasm])

  const onSelect = useCallback( (keys: React.Key[], info: any) => {
    console.log('Trigger Select', keys, info);
  }, []);

  const onClearConsole = useCallback( () => {
    setLammpsOutput([])
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
      <TreeView isLoading={isLoading} path={fullPath} files={fileNames} onSelect={onSelect}/>
      </Sider>
      <Layout>
        <Content style={{ margin: '24px 16px 0' }}>
            <Editor lammpsOutput={lammpsOutput} onClearConsole={onClearConsole} particles={particles} />
        </Content>
      </Layout>
      </Layout>
      </Container>
    </div>
  );
}

export default App;

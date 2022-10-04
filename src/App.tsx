import React, {useState, useEffect, useCallback} from 'react';
import {Particles} from 'omovi'
import 'antd/dist/antd.css';
import createModule from "./wasm/lammps.mjs";
import styled from 'styled-components'
import {useStoreActions, useStoreState} from './hooks'
import { Layout } from 'antd';
import GithubBrowser from './components/GithubBrowser';

import Editor from './containers/Editor'
import {File} from './store/files'
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
  const [particles, setParticles] = useState<Particles>()
  const [lammpsOutput, setLammpsOutput] = useState<string[]>([])

  const setWasm = useStoreActions(actions => actions.lammps.setWasm)
  const resetLammps = useStoreActions(actions => actions.lammps.resetLammps)
  const loadLJ = useStoreActions(actions => actions.lammps.loadLJ)
  const setFiles = useStoreActions(actions => actions.files.setFiles)
  const setSelectedFile = useStoreActions(actions => actions.files.setSelectedFile)
  
  const lammps = useStoreState(state => state.lammps.lammps)
  const wasm = useStoreState(state => state.lammps.wasm)
  
  
  
  const onPrint = useCallback( (text: string) => {
    setLammpsOutput(state => [...state, text])
  }, [])

  useEffect(
    () => {
      createModule({print: onPrint, printErr: onPrint}).then((Module: any) => {
        setWasm(Module)
      });
    },
    [setWasm, onPrint]
  );

  useEffect(() => {
    if (wasm) {
      // @ts-ignore
      window.wasm = wasm
      const lj = `# 3d Lennard-Jones melt
      variable    x index 1
      variable    y index 1
      variable    z index 1
      variable    xx equal 20*$x
      variable    yy equal 20*$y
      variable    zz equal 10*$z
      units       lj
      atom_style  atomic
      lattice     fcc 0.8442
      region      box block 0 \${xx} 0 \${yy} 0 \${zz}
      create_box  1 box
      create_atoms    1 box
      mass        1 1.0
      velocity    all create 1.44 87287 loop geom
      pair_style  lj/cut 2.5
      pair_coeff  1 1 1.0 1.0 2.5
      neighbor    0.3 bin
      neigh_modify    delay 0 every 20 check no
      fix     1 all nve`
      wasm.FS_createDataFile("/", "test.lj", lj, true, true, true)
      console.log("Got lj: ", lj)
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
        // @ts-ignore
        lammps.setSyncFrequency(window.syncFrequency)
      }
      // @ts-ignore
      window.syncFrequency = 2
      const particles = getPositions(lammps, wasm)
      setParticles(particles)
    }
  }, [lammps, wasm])

  

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
      <GithubBrowser user='lammps' repository='lammps' path='examples' />
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

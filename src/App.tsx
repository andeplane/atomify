import React, {useState, useEffect, useCallback} from 'react';
import {Particles} from 'omovi'
import 'antd/dist/antd.css';
// import lammpsWasm from './wasm/lammps.mjs'
import createModule from "./wasm/lammps.mjs";
// import { LineType } from 'react-terminal-ui';
import {useListDirectory} from './hooks/github'
import styled from 'styled-components'
import {useStoreActions, useStoreState} from './hooks'
import { Layout } from 'antd';
import TreeView from './components/TreeView';
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
  const [wasmLoaded, setWasmLoaded] = useState(false)
  const [particles, setParticles] = useState<Particles>()
  // const [lammpsOutput, setLammpsOutput] = useState([
  //   {type: LineType.Output, value: 'LAMMPS'}
  // ])

  const setWasm = useStoreActions(actions => actions.lammps.setWasm)
  const resetLammps = useStoreActions(actions => actions.lammps.resetLammps)
  const loadLJ = useStoreActions(actions => actions.lammps.loadLJ)
  const setFiles = useStoreActions(actions => actions.files.setFiles)
  const setSelectedFile = useStoreActions(actions => actions.files.setSelectedFile)
  
  const files = useStoreState(state => state.files.files)
  const lammps = useStoreState(state => state.lammps.lammps)
  const wasm = useStoreState(state => state.lammps.wasm)
  
  const user = 'lammps'
  const repository = 'lammps'
  const path = 'examples/melt'
  const {isLoading, files_metadata} = useListDirectory(user, repository, path)
  
  const fullPath = `${user}/${repository}/${path}`
  const fileNames = files_metadata.map(file => file.name)
  
  const onPrint = useCallback( (text: string) => {
    // const output = {
    //   type: LineType.Output, value: text
    // }
    // setLammpsOutput(state => [...state, output])
  }, [])

  useEffect(
    // useEffect here is roughly equivalent to putting this in componentDidMount for a class component
    () => {
      createModule().then((Module: any) => {
        setWasmLoaded(true)
        setWasm(Module)
        //@ts-ignore
        window.lammps = Module
      });
    },
    []
  );

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
    (async () => {
      const downloadFile = async (fileName: string, url: string) => {
        if (files[fileName] != null) {
          return
        }
        const newFile: File = {
          loading: true,
          fileName: fileName,
          content: ""
        }
        let newFiles = {
          ...files
        }
        newFiles[fileName] = newFile
        setFiles(newFiles)
        const content = await fetch(url)
        newFile.content = await content.text();
        
        newFiles = {
          ...newFiles
        }
        newFiles[fileName] = newFile

        setFiles(newFiles)
        setSelectedFile(newFile)
      }

      const fileName = info.node.title;
      if (files[fileName]) {
        setSelectedFile(files[fileName])
      } else {
        const downloadUrl = files_metadata.filter(file => file.name===fileName)[0].download_url
        await downloadFile(fileName, downloadUrl);
      }
    })()
    
  }, [files, setFiles, files_metadata, setSelectedFile]);

  const onClearConsole = useCallback( () => {
    // setLammpsOutput([])
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
            {/* <Editor lammpsOutput={lammpsOutput} onClearConsole={onClearConsole} particles={particles} /> */}
            <Editor onClearConsole={onClearConsole} particles={particles} />
        </Content>
      </Layout>
      </Layout>
      </Container>
    </div>
  );
}

export default App;

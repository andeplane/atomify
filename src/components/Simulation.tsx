import {useCallback, useEffect} from 'react'
import {useStoreActions, useStoreState} from '../hooks'
import createModule from "../wasm/lammps.mjs";
import {SimulationFile} from '../store/files'
import { LammpsWeb } from '../types';
const Simulation = () => {
  const wasm = useStoreState(state => state.lammps.wasm)
  const files = useStoreState(state => state.files.files)
  const setFiles = useStoreActions(actions => actions.files.setFiles)
  const setWasm = useStoreActions(actions => actions.lammps.setWasm)
  const setStatus = useStoreActions(actions => actions.simulation.setStatus)

  const uploadFiles = async (folder: string, filePaths: string[]) => {
    if (!wasm) {
      console.log("Nah")
      return
    }

    wasm.FS.mkdir(`/${folder}`)
    const fileObjects = filePaths.map(path => files[path])
    const filesToDownload = fileObjects.filter(file => file.content == null)
    for (let i = 0; i < filesToDownload.length; i++) {
      const file = filesToDownload[i]
      setStatus({
        title: `Downloading file (${i+1}/${filesToDownload.length})`,
        text: file.path
      })
      const response = await fetch(file.url)
      const content = await response.text()
      files[file.path].content = content
      wasm.FS.writeFile(`/${folder}/${file.fileName}`, content)
      setFiles({...files})
      console.log(`Wrote /${folder}/${file.fileName}`)
    }
    wasm.FS.chdir(`/${folder}`)
  }

  const onPrint = useCallback( (text: string) => {
    // setLammpsOutput(state => [...state, text])
    console.log(text)
  }, [])

  useEffect(
    () => {
      console.log("Omg...")
      createModule({
        print: onPrint, 
        printErr: onPrint,
      }).then((Module: any) => {
        setWasm(Module)
        // @ts-ignore
        window.wasm = Module
        const lammps = (new Module.LAMMPSWeb()) as LammpsWeb
        // @ts-ignore
        window.lammps = lammps
        // @ts-ignore
        window.syncFrequency = 2
        
        //@ts-ignore
        window.postStepCallback = () => {
          console.log("Doing post step")
          // const particles = getPositions(lammps, wasm)
          // setParticles(particles)
          // @ts-ignore
          lammps.setSyncFrequency(window.syncFrequency)
        }
      });
    },
    [setWasm, onPrint]
  );
  useEffect(() => {
    if (wasm) {
      console.log("Yay, got wasm...")
      setFiles({
        'examples/vashishta/SiO.1990.vashishta': {
          fileName: 'SiO.1990.vashishta',
          url: 'https://raw.githubusercontent.com/lammps/lammps/develop/potentials/SiO.1990.vashishta',
          loading: false,
          path: 'examples/vashishta/SiO.1990.vashishta'
        },
        'examples/vashishta/data.quartz': {
          fileName: 'data.quartz',
          url: 'https://raw.githubusercontent.com/lammps/lammps/develop/examples/vashishta/data.quartz',
          loading: false,
          path: 'examples/vashishta/data.quartz'
        },
        'examples/vashishta/in.vashishta.sio2': {
          fileName: 'in.vashishta.sio2',
          url: 'https://raw.githubusercontent.com/lammps/lammps/develop/examples/vashishta/in.vashishta.sio2',
          loading: false,
          path: 'examples/vashishta/in.vashishta.sio2'
        }
      })
        uploadFiles('simulation', [
          'examples/vashishta/SiO.1990.vashishta',
          'examples/vashishta/data.quartz',
          'examples/vashishta/in.vashishta.sio2'
        ])
    } else {
      console.log("No wasm yet...")
    }
  }, [wasm])
  return (<></>)
}
export default Simulation
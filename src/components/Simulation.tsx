import {useCallback, useEffect} from 'react'
import {useStoreActions, useStoreState} from '../hooks'
import createModule from "../wasm/lammps.mjs";
import {SimulationFile} from '../store/files'
import { LammpsWeb } from '../types';
import {Particles} from 'omovi'

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

const Simulation = () => {
  const wasm = useStoreState(state => state.lammps.wasm)
  const lammps = useStoreState(state => state.lammps.lammps)
  const files = useStoreState(state => state.files.files)
  const particles = useStoreState(state => state.simulation.particles)
  const setParticles = useStoreActions(actions => actions.simulation.setParticles)
  const setFiles = useStoreActions(actions => actions.files.setFiles)
  const setWasm = useStoreActions(actions => actions.lammps.setWasm)
  const setLammps = useStoreActions(actions => actions.lammps.setLammps)
  const setStatus = useStoreActions(actions => actions.simulation.setStatus)

  const uploadFiles = async (folder: string, filePaths: string[]) => {
    if (!wasm) {
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
    }
    wasm.FS.chdir(`/${folder}`)
  }

  const onPrint = useCallback( (text: string) => {
    // setLammpsOutput(state => [...state, text])
    console.log(text)
  }, [])

  useEffect(
    () => {
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

      createModule({
        print: onPrint, 
        printErr: onPrint,
      }).then((Module: any) => {
        setWasm(Module)
        const lammps = (new Module.LAMMPSWeb()) as LammpsWeb
        setLammps(lammps)
        // @ts-ignore
        // window.wasm = Module
        // @ts-ignore
        // window.lammps = lammps
        // @ts-ignore
        window.syncFrequency = 2
        
        //@ts-ignore
        window.postStepCallback = () => {
          const particles = getPositions(lammps, Module)
          setParticles(particles)
          // @ts-ignore
          lammps.setSyncFrequency(window.syncFrequency)
        }
      });
    },
    [setWasm, onPrint]
  );
  useEffect(() => {
    (async() => {
      if (wasm && lammps) {
        console.log("Yay, got wasm...")
        await uploadFiles('simulation', [
          'examples/vashishta/SiO.1990.vashishta',
          'examples/vashishta/data.quartz',
          'examples/vashishta/in.vashishta.sio2'
        ])
        console.log("Will run it with lammps ", lammps)
        lammps.start()
        lammps.load_local('/simulation/in.vashishta.sio2')
      } else {
        console.log("No wasm yet...")
      }
    })()
  }, [wasm, lammps])
  return (<></>)
}
export default Simulation
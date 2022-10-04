import {useCallback, useEffect} from 'react'
import {useStoreActions, useStoreState} from '../hooks'
import createModule from "../wasm/lammps.mjs";
// import {SimulationFile} from '../store/files'
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
  const wasm = useStoreState(state => state.simulation.wasm)
  const lammps = useStoreState(state => state.simulation.lammps)
  // const files = useStoreState(state => state.files.files)
  const particles = useStoreState(state => state.simulation.particles)
  const setParticles = useStoreActions(actions => actions.simulation.setParticles)
  // const setFiles = useStoreActions(actions => actions.files.setFiles)
  const setWasm = useStoreActions(actions => actions.simulation.setWasm)
  const setLammps = useStoreActions(actions => actions.simulation.setLammps)
  const setStatus = useStoreActions(actions => actions.simulation.setStatus)
  
  const onPrint = useCallback( (text: string) => {
    // setLammpsOutput(state => [...state, text])
    console.log(text)
  }, [])

  useEffect(
    () => {
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
  return (<></>)
}
export default Simulation
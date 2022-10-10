import {useCallback, useEffect} from 'react'
import {useStoreActions, useStoreState} from '../hooks'
import * as THREE from 'three'
import createModule from "../wasm/lammps.mjs";
import { LammpsWeb } from '../types';
import {Particles, Bonds} from 'omovi'

const cellMatrix = new THREE.Matrix3()
const origo = new THREE.Vector3()

const getBonds = (lammps: LammpsWeb, wasm: any, bonds?: Bonds) => {
  const numBonds = lammps.computeBonds()

  let newBonds = bonds
  if (!bonds || bonds.capacity < numBonds) {
    let newCapacity = numBonds
    if (bonds) {
      newCapacity = Math.max(numBonds, 2 * bonds.capacity)
      bonds.dispose()
    }

    newBonds = new Bonds(newCapacity);
    newBonds.indices.set(Array.from(Array(newCapacity).keys()))
    newBonds.radii.fill(0.35/4)
  }
  
  if (numBonds === 0) {
    newBonds.count = 0
    return newBonds
  }

  const bonds1Ptr = lammps.getBondsPosition1() / 4
  const bonds2Ptr = lammps.getBondsPosition2() / 4
  const positions1Subarray = wasm.HEAPF32.subarray(bonds1Ptr, bonds1Ptr + 3 * numBonds) as Float32Array
  const positions2Subarray = wasm.HEAPF32.subarray(bonds2Ptr, bonds2Ptr + 3 * numBonds) as Float32Array
  newBonds.positions1.set(positions1Subarray)
  newBonds.positions2.set(positions2Subarray)
  
  newBonds.count = numBonds
  return newBonds
}

const getPositions = (lammps: LammpsWeb, wasm: any, particles?: Particles) => {
  const numParticles = lammps.computeParticles()
  let newParticles = particles
  if (!particles || particles.capacity < numParticles) {
    let newCapacity = numParticles
    if (particles) {
      newCapacity = Math.max(numParticles, 2 * particles.capacity)
      particles.dispose()
    }

    newParticles = new Particles(newCapacity);
    newParticles.types = new Float32Array(newCapacity)
    newParticles.radii.fill(0.25)
  }
  const positionsPtr = lammps.getPositionsPointer() / 4;
  const typePtr = lammps.getTypePointer() / 4;
  const idPtr = lammps.getIdPointer() / 4;
  const positionsSubarray = wasm.HEAPF32.subarray(positionsPtr, positionsPtr + 3 * numParticles) as Float32Array
  const typeSubarray = wasm.HEAP32.subarray(typePtr, typePtr + numParticles) as Int32Array
  const idSubarray = wasm.HEAP32.subarray(idPtr, idPtr + numParticles) as Int32Array
  
  newParticles.positions.set(positionsSubarray)
  newParticles.types.set(typeSubarray)
  newParticles.indices.set(idSubarray)
  newParticles.count = numParticles
  return newParticles
}

const getSimulationBox = (lammps: LammpsWeb, wasm: any) => {
  const cellMatrixPointer = lammps.getCellMatrixPointer() / 8;
  const cellMatrixSubArray = wasm.HEAPF64.subarray(cellMatrixPointer, cellMatrixPointer + 9) as Float64Array
  cellMatrix.set(cellMatrixSubArray[0], cellMatrixSubArray[1], cellMatrixSubArray[2],
                 cellMatrixSubArray[3], cellMatrixSubArray[4], cellMatrixSubArray[5],
                 cellMatrixSubArray[6], cellMatrixSubArray[7], cellMatrixSubArray[8])
  return cellMatrix
}

const getSimulationOrigo = (lammps: LammpsWeb, wasm: any) => {
  const origoPointer = lammps.getOrigoPointer() / 8;
  const origoPointerSubArray = wasm.HEAPF64.subarray(origoPointer, origoPointer + 3) as Float64Array
  origo.set(origoPointerSubArray[0], origoPointerSubArray[1], origoPointerSubArray[2])
  return origo
}

const Simulation = () => {
  const wasm = useStoreState(state => state.simulation.wasm)
  const lammps = useStoreState(state => state.simulation.lammps)
  const particles = useStoreState(state => state.simulation.particles)
  const bonds = useStoreState(state => state.simulation.bonds)
  const setParticles = useStoreActions(actions => actions.simulation.updateParticles)
  const setBonds = useStoreActions(actions => actions.simulation.setBonds)
  const setWasm = useStoreActions(actions => actions.simulation.setWasm)
  const setLammps = useStoreActions(actions => actions.simulation.setLammps)
  const setStatus = useStoreActions(actions => actions.simulation.setStatus)
  const setSimulationBox = useStoreActions(actions => actions.simulation.setSimulationBox)
  const setSimulationOrigo = useStoreActions(actions => actions.simulation.setSimulationOrigo)
  
  const onPrint = useCallback( (text: string) => {
    // setLammpsOutput(state => [...state, text])
    console.log(text)
  }, [])

  useEffect(() => {
    //@ts-ignore
    window.postStepCallback = () => {
      if (lammps && wasm) {
        let newBonds = getBonds(lammps, wasm, bonds)
        newBonds.markNeedsUpdate()
        if (newBonds !== bonds) {
          setBonds(newBonds)
        }

        let newParticles = getPositions(lammps, wasm, particles)
        newParticles.markNeedsUpdate()
        if (newParticles !== particles) {
          setParticles(newParticles)
        }

        const simulationBox = getSimulationBox(lammps, wasm)
        const origo = getSimulationOrigo(lammps, wasm)
        setSimulationBox(simulationBox)
        setSimulationOrigo(origo)
        // @ts-ignore
        lammps.setSyncFrequency(window.syncFrequency)
      }
    }
  }, [wasm, lammps, particles, bonds, setBonds, setParticles, setSimulationBox, setSimulationOrigo])

  useEffect(
    () => {
      setStatus({
        title: 'Downloading LAMMPS ...',
        text: '',
        progress: 0.3
      })

      createModule({
        print: onPrint, 
        printErr: onPrint,
      }).then((Module: any) => {
        setStatus({
          title: 'Downloading LAMMPS ...',
          text: '',
          progress: 0.6
        })
        setWasm(Module)
        const lammps = (new Module.LAMMPSWeb()) as LammpsWeb
        setLammps(lammps)
        // @ts-ignore
        window.wasm = Module
        // @ts-ignore
        window.lammps = lammps
        // @ts-ignore
        window.syncFrequency = 2
        setStatus(undefined)
      });
    },
    [setWasm, onPrint]
  );
  return (<></>)
}
export default Simulation
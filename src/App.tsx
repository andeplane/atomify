import React, {useState, useEffect, useCallback} from 'react';
import logo from './logo.svg';
import lammpsWasm from './wasm/lammps'
import {OMOVIVisualizer, Particles} from 'omovi'

const p = new Particles(5)
p.add({x: 0.0, y: 0.0, z: 0.0, id: 1, radius: 1.0, type: 'H', r: 255, g: 0, b: 0})
p.add({x: 0.0, y: 1.0, z: 0.0, id: 2, radius: 1.0, type: 'H', r: 255, g: 0, b: 0})
p.add({x: 0.0, y: 0.0, z: 1.0, id: 3, radius: 1.0, type: 'H', r: 255, g: 0, b: 0})
p.add({x: 0.0, y: 1.0, z: 1.0, id: 4, radius: 1.0, type: 'H', r: 255, g: 0, b: 0})
p.add({x: 1.0, y: 1.0, z: 1.0, id: 5, radius: 1.0, type: 'H', r: 255, g: 0, b: 0})

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

function App() {
  const [lammps, setLammps] = useState<any>()
  const [wasm, setWasm] = useState<any>()
  const [particles, setParticles] = useState<Particles>()

  useEffect(() => {
    const wasm = lammpsWasm({
      onRuntimeInitialized: async () => {
        wasm.then(async (obj: any) => {
          // @ts-ignore
          const lmp = new obj.Atomify()
          lmp.loadLJ()
          lmp.step()

          setWasm(obj)
          setLammps(lmp)
          // const pos = getPositions(lmp, wasm)
          // const numAtoms = lmp.numAtoms()
          // const particles = new Particles(numAtoms);
          // const positionsPtr = lmp.getPositionsPointer() / 8;
          // const typePtr = lmp.getTypePointer() / 4;
          // const idPtr = lmp.getIdPointer() / 4;
          // const positionsSubarray = obj.HEAPF64.subarray(positionsPtr, positionsPtr + 3 * numAtoms) as Float64Array
          // // const typeSubarray = obj.HEAP32.subarray(typePtr, typePtr + numAtoms) as Int32Array
          // const idSubarray = obj.HEAP32.subarray(idPtr, idPtr + numAtoms) as Int32Array

          // particles.positions = Float32Array.from(positionsSubarray)
          // // particles.types = Float32Array.from(typeSubarray)
          // particles.indices = Float32Array.from(idSubarray)
          // particles.radii.fill(0.25)
          // particles.count = numAtoms
          // //@ts-ignore
          // window.findThing = (value: number) => {
          //   for (let i = 0; i < obj.HEAPF64.length; i++) {
          //     if ( Math.abs(obj.HEAPF64[i] - value) < 1e-8) {
          //       console.log(`Found ${value} at index ${i}`)
          //     }
          //   }
          // }
          
          // setParticles(particles)
        })
      },
      locateFile: () => require("./wasm/lammps.wasm"),
    });
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (lammps != null) {
        lammps.step()
        const numAtoms = lammps.numAtoms()
        const particles = getPositions(lammps, wasm)
        setParticles(particles)
      }
    }, 16);
    return () => clearInterval(interval);
  }, [lammps, wasm]);

  // useEffect(() => {
  //   setParticles(p)
  // }, [])
  return (
    <div className="App">
      <header className="App-header">
      {particles && <OMOVIVisualizer particles={particles}/>}
      </header>
    </div>
  );
}

export default App;

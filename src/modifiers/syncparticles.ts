import Modifier from './modifier'
import { ModifierInput, ModifierOutput } from './types'
import {StoreModel} from '../store/model'
import {Particles} from 'omovi'

interface SyncParticlesModifierProps {
  name: string
}

class SyncParticlesModifier extends Modifier {
  constructor({name}: SyncParticlesModifierProps) {
    super({name})
  }

  run = (state: StoreModel, input: ModifierInput, output: ModifierOutput) => {
    const numParticles = input.lammps.computeParticles()
    let newParticles = output.particles
    if (!newParticles || newParticles.capacity < numParticles) {
      let newCapacity = numParticles
      if (newParticles) {
        newCapacity = Math.max(numParticles, 2 * newParticles.capacity)
        newParticles.dispose()
      }

      newParticles = new Particles(newCapacity);
      newParticles.types = new Float32Array(newCapacity)
      newParticles.radii.fill(0.25)
      output.particles = newParticles
    }

    const positionsPtr = input.lammps.getPositionsPointer() / 4;
    const typePtr = input.lammps.getTypePointer() / 4;
    const idPtr = input.lammps.getIdPointer() / 4;
    const positionsSubarray = input.wasm.HEAPF32.subarray(positionsPtr, positionsPtr + 3 * numParticles) as Float32Array
    const typeSubarray = input.wasm.HEAP32.subarray(typePtr, typePtr + numParticles) as Int32Array
    const idSubarray = input.wasm.HEAP32.subarray(idPtr, idPtr + numParticles) as Int32Array
    
    newParticles.positions.set(positionsSubarray)
    newParticles.types.set(typeSubarray)
    newParticles.indices.set(idSubarray)
    newParticles.count = numParticles
    const atomTypes = state.simulation.atomTypes
    if (atomTypes) {
      newParticles.types.forEach( (type: number, index: number) => {
        // @ts-ignore
        if (type > Object.keys(atomTypes).length) {
          // If we have lots of atom types, just wrap around
          type = (type % Object.keys(atomTypes).length) + 1
        }
        
        let atomType = atomTypes[type]
        if (atomType == null) {
          // Fallback to default
          atomType = atomTypes[1]
        }

        newParticles.radii[index] = atomType.radius * 0.3
      })
    }
    
    if (newParticles.mesh) {
      newParticles.mesh.count = numParticles
      newParticles.geometry.setDrawRange(0, numParticles)
    }
    newParticles.markNeedsUpdate()
    return newParticles
  }
}

export default SyncParticlesModifier
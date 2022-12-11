import Modifier from './modifier'
import { ModifierInput, ModifierOutput } from './types'
import {Particles} from 'omovi'

interface SyncParticlesModifierProps {
  name: string
  active: boolean
}

class SyncParticlesModifier extends Modifier {
  constructor({name, active}: SyncParticlesModifierProps) {
    super({name, active})
  }

  run = (input: ModifierInput, output: ModifierOutput, everything: boolean = false) => {
    if (!this.active) {
      if (output.particles) {
        output.particles.count = 0
        if (output.particles.mesh) {
          output.particles.mesh.count = 0
        }
      }
      return
    }
    
    const numParticles = input.lammps.computeParticles()
    let newParticles = output.particles
    if (!newParticles || newParticles.capacity < numParticles) {
      let newCapacity = numParticles
      if (newParticles) {
        newCapacity = Math.max(numParticles, 2 * newParticles.capacity)
        newParticles.dispose()
      }

      newParticles = new Particles(newCapacity);
      output.particles = newParticles
      output.colorsDirty = true
    } else {
      if (numParticles !== newParticles.count) {
        // Need to update colors and radius
        output.colorsDirty = true
      }
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
    if (newParticles.count !== numParticles) {
      output.colorsDirty = true
    }
    newParticles.count = numParticles
    
    if (newParticles.mesh) {
      newParticles.mesh.count = numParticles
    }
    
    newParticles.markNeedsUpdate()
    return newParticles
  }
}

export default SyncParticlesModifier
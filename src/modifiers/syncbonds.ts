import Modifier from './modifier'
import { ModifierInput, ModifierOutput } from './types'
import {StoreModel} from '../store/model'
import {Bonds} from 'omovi'

interface SyncBondsModifierProps {
  name: string
  active: boolean
}

class SyncBondsModifier extends Modifier {
  constructor({name, active}: SyncBondsModifierProps) {
    super({name, active})
  }

  run = (state: StoreModel, input: ModifierInput, output: ModifierOutput) => {
    const numBonds = input.lammps.computeBonds()

    let newBonds = output.bonds
    if (!newBonds || newBonds.capacity < numBonds) {
      let newCapacity = numBonds
      if (newBonds) {
        newBonds.dispose()
      }

      newBonds = new Bonds(newCapacity);
      newBonds.indices.set(Array.from(Array(newCapacity).keys()))
      newBonds.radii.fill(0.25)
      output.bonds = newBonds
    }
    
    if (numBonds === 0) {
      newBonds.count = 0
      if (newBonds.mesh) {
        newBonds.mesh.count = numBonds
      }
      return newBonds
    }

    const bonds1Ptr = input.lammps.getBondsPosition1Pointer() / 4
    const bonds2Ptr = input.lammps.getBondsPosition2Pointer() / 4
    const positions1Subarray = input.wasm.HEAPF32.subarray(bonds1Ptr, bonds1Ptr + 3 * numBonds) as Float32Array
    const positions2Subarray = input.wasm.HEAPF32.subarray(bonds2Ptr, bonds2Ptr + 3 * numBonds) as Float32Array
    newBonds.positions1.set(positions1Subarray)
    newBonds.positions2.set(positions2Subarray)
    
    newBonds.count = numBonds
    if (newBonds.mesh) {
      newBonds.mesh.count = numBonds
    }
    newBonds.markNeedsUpdate()

    return newBonds
  }
}

export default SyncBondsModifier
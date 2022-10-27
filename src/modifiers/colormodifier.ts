import Modifier from './modifier'
import { ModifierInput, ModifierOutput } from './types'
import {StoreModel} from '../store/model'
import colormap from 'colormap'

interface ColorModifierProps {
  name: string
  computeName: string
}

class ColorModifier extends Modifier {
  public computeName: string

  constructor({name, computeName}: ColorModifierProps) {
    super({name})
    this.computeName = computeName
  }

  run = (state: StoreModel, input: ModifierInput, output: ModifierOutput) => {
    let colors = colormap({
      colormap: 'jet',
      nshades: 72,
      format: 'float',
      alpha: 1
    })
    const computes = state.simulationStatus.computes
    console.log("computes: ", computes)
    const compute = computes.filter(c => c.getName() === this.computeName)[0]
    if (!compute || !compute.getIsPerAtom()) {
      console.log("No compute, or it is not per atom")
      return
    }

    const didCompute = compute.execute()
    if (!didCompute) {
      console.log("Did not compute. I do not know why!")
      return
    }
    compute.sync()
    const perAtomDataPtr = compute.getPerAtomData() / 4
    //@ts-ignore
    const perAtomArray = wasm.HEAPF32.subarray(perAtomDataPtr, perAtomDataPtr + output.particles.count ) as Float32Array
    //@ts-ignore
    window.perAtomArray = perAtomArray
    // @ts-ignore
    const minValue = Math.max.apply(null, perAtomArray)
    // @ts-ignore
    const maxValue = Math.min.apply(null, perAtomArray)
    console.log("Min, max, size ", minValue, maxValue, perAtomArray.length)
    perAtomArray.forEach( (value, index) => {
      const realIndex = output.particles.indices[index]
      const colorIndex = Math.floor((value - minValue) / (maxValue - minValue) * (colors.length-1))
      
      const color = colors[colorIndex]
      // @ts-ignore
      if (window.visualizer) {
        // @ts-ignore
        window.visualizer.setColor(realIndex, {r: 255*color[0], g: 255*color[1], b: 255*color[2]})
      }
    })
  }
}

export default ColorModifier
import Modifier from './modifier'
import { ModifierInput, ModifierOutput } from './types'
import {StoreModel} from '../store/model'
import colormap from 'colormap'
import {AtomTypes} from '../utils/atomtypes'
import {Visualizer} from 'omovi'

interface ColorModifierProps {
  name: string
  active: boolean
  computeName: string
}

class ColorModifier extends Modifier {
  public computeName: string

  constructor({name, active, computeName}: ColorModifierProps) {
    super({name, active})
    this.computeName = computeName
  }

  runByProperty = (state: StoreModel, input: ModifierInput, output: ModifierOutput) => {
    let colors = colormap({
      colormap: 'jet',
      nshades: 72,
      format: 'float',
      alpha: 1
    })
    const computes = state.simulationStatus.computes
    const compute = computes.filter(c => c.name === this.computeName)[0]
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

  runByType = (state: StoreModel, input: ModifierInput, output: ModifierOutput) => {
    if (!state.render.particleStylesUpdated) {
      return
    }
    const particleStyles = state.render.particleStyles
    // @ts-ignore
    const visualizer: Visualizer = window.visualizer
    for(let i = 0; i < output.particles.count; i++) {
      const realIndex = output.particles.indices[i]
      const type = output.particles.types[i]
      let atomType = particleStyles[type]
      if (!atomType) {
        atomType = AtomTypes[type % AtomTypes.length]
      }
      output.particles.radii[i] = 0.25 * state.render.particleRadius * atomType.radius
      visualizer.setColor(realIndex, {r: atomType.color.r, g: atomType.color.g, b: atomType.color.b})
    }
  }

  run = (state: StoreModel, input: ModifierInput, output: ModifierOutput) => {
    this.runByType(state, input, output)
    // this.runByProperty(state, input, output)
  }
}

export default ColorModifier
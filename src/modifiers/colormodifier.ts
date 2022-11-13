import Modifier from './modifier'
import { ModifierInput, ModifierOutput } from './types'
import colormap from 'colormap'
import {AtomType} from '../utils/atomtypes'
import * as THREE from 'three'

const defaultAtomTypes: AtomType[] = [
  { shortname: "1", fullname: "1", radius: 1.20, color: new THREE.Color(255, 102, 102 ) },
  { shortname: "2", fullname: "2", radius: 1.20, color: new THREE.Color(102, 102, 255 )},
  { shortname: "3", fullname: "3", radius: 1.20, color: new THREE.Color(255, 255, 0 )},
  { shortname: "4", fullname: "4", radius: 1.20, color: new THREE.Color(255, 102, 255 )},
  { shortname: "5", fullname: "5", radius: 1.20, color: new THREE.Color(102, 255, 51 )},
  { shortname: "6", fullname: "6", radius: 1.20, color: new THREE.Color(204, 255, 179 )},
  { shortname: "7", fullname: "7", radius: 1.20, color: new THREE.Color(179, 0, 255 )},
  { shortname: "8", fullname: "8", radius: 1.20, color: new THREE.Color(51, 255, 255 )},
  { shortname: "9", fullname: "9", radius: 1.20, color: new THREE.Color(247, 247, 247)},
  { shortname: "10", fullname: "10", radius: 1.20, color: new THREE.Color(255, 102, 102 ) },
  { shortname: "11", fullname: "11", radius: 1.20, color: new THREE.Color(102, 102, 255 )},
  { shortname: "12", fullname: "12", radius: 1.20, color: new THREE.Color(255, 255, 0 )},
  { shortname: "13", fullname: "13", radius: 1.20, color: new THREE.Color(255, 102, 255 )},
  { shortname: "14", fullname: "14", radius: 1.20, color: new THREE.Color(102, 255, 51 )},
  { shortname: "15", fullname: "15", radius: 1.20, color: new THREE.Color(204, 255, 179 )},
  { shortname: "16", fullname: "16", radius: 1.20, color: new THREE.Color(179, 0, 255 )},
  { shortname: "17", fullname: "17", radius: 1.20, color: new THREE.Color(51, 255, 255 )},
  { shortname: "18", fullname: "18", radius: 1.20, color: new THREE.Color(247, 247, 247)},
]

interface ColorModifierProps {
  name: string
  active: boolean
}

class ColorModifier extends Modifier {
  public computeName?: string
  private previousColoringMethod?: string

  constructor({name, active}: ColorModifierProps) {
    super({name, active})
    this.computeName = undefined
  }

  runByProperty = (input: ModifierInput, output: ModifierOutput) => {
    if (!input.renderState.visualizer) {
      return
    }
    const visualizer = input.renderState.visualizer

    let colors = colormap({
      colormap: 'jet',
      nshades: 72,
      format: 'float',
      alpha: 1
    })
    const computes = input.computes
    const compute = this.computeName ? computes[this.computeName] : undefined
    if (!compute || !compute.isPerAtom) {
      return
    }
    
    const didCompute = compute.lmpCompute.execute()
    if (!didCompute) {
      return
    }
    compute.lmpCompute.sync()
    const perAtomDataPtr = compute.lmpCompute.getPerAtomData() / 4
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
      visualizer.setColor(realIndex, {r: 255*color[0], g: 255*color[1], b: 255*color[2]})
    })
    this.previousColoringMethod = 'property'
    return
  }

  runByType = (input: ModifierInput, output: ModifierOutput, everything: boolean = false) => {
    if ( (this.previousColoringMethod === 'type' && !output.colorsDirty) || !input.renderState.visualizer) {
      return
    }
    console.log("Will update colors")
    const particleStyles = input.renderState.particleStyles
    const visualizer = input.renderState.visualizer
    
    for(let i = 0; i < output.particles.count; i++) {
      const realIndex = output.particles.indices[i]
      const type = output.particles.types[i]
      let atomType = particleStyles[type]
      if (!atomType) {
        atomType = defaultAtomTypes[ type % defaultAtomTypes.length]
      }
      const radius = 0.33 * input.renderState.particleRadius * atomType.radius
      visualizer.setRadius(realIndex, radius)
      visualizer.setColor(realIndex, {r: atomType.color.r, g: atomType.color.g, b: atomType.color.b})
    }
    
    this.previousColoringMethod = 'type'
  }

  run = (input: ModifierInput, output: ModifierOutput) => {
    if (this.computeName) {
      this.runByProperty(input, output)
    } else {
      this.runByType(input, output)
    } 
  }
}

export default ColorModifier
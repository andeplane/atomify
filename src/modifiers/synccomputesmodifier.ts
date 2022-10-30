import Modifier from './modifier'
import { ModifierInput, ModifierOutput } from './types'

interface SyncComputesModifierProps {
  name: string
  active: boolean
}

class SyncComputesModifier extends Modifier {
  private previousColoringMethod?: string

  constructor({name, active}: SyncComputesModifierProps) {
    super({name, active})
  }

  run = (input: ModifierInput, output: ModifierOutput) => {
    if (!this.active) {
      return
    }

    const lmpComputes = input.lammps.getComputes()

    for (let i = 0; i < lmpComputes.size(); i++) {
      const lmpCompute = lmpComputes.get(i)
      const name = lmpCompute.getName()
      let compute = input.computes[name]
      if (compute == null) {
        // Need to create a new one 
        compute = {
          name: lmpCompute.getName(),
          type: lmpCompute.getType(),
          isPerAtom: lmpCompute.getIsPerAtom(),
          data1D: {},
          xLabel: lmpCompute.getXLabel(),
          yLabel: lmpCompute.getYLabel(),
          lmpCompute,
        }
      }
      compute.xLabel = lmpCompute.getXLabel()
      compute.yLabel = lmpCompute.getYLabel()
      if (compute.lmpCompute.execute()) {
        compute.lmpCompute.sync()
        const data1DNames = compute.lmpCompute.getData1DNames()
        const data1DVector =  compute.lmpCompute.getData1D()
        for (let j = 0; j < data1DNames.size(); j++) {
          const dataName = data1DNames.get(j)
          const lmpData = data1DVector.get(j)
          if (compute.data1D[dataName] == null) {
            compute.data1D[dataName] = {
              data: [],
              label: lmpData.getLabel()
            }
          }

          const data = compute.data1D[dataName]
          
          const xValuesPointer = lmpData.getXValuesPointer() / 4
          const yValuesPointer = lmpData.getYValuesPointer() / 4
          const xValues = input.wasm.HEAPF32.subarray(xValuesPointer, xValuesPointer + lmpData.getNumPoints()) as Float32Array
          const yValues = input.wasm.HEAPF32.subarray(yValuesPointer, yValuesPointer + lmpData.getNumPoints()) as Float32Array
          for (let k = data.data.length; k < xValues.length; k++) {
            data.data.push([xValues[k], yValues[k]])
          }
        }
      }
      
      output.computes[name] = compute
    }
  }
}

export default SyncComputesModifier
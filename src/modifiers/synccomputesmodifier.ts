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
          xLabel: lmpCompute.getXLabel(),
          yLabel: lmpCompute.getYLabel(),
          hasScalarData: lmpCompute.hasScalarData(),
          scalarValue: 0,
          lmpCompute,
        }
      } else {
        // @ts-ignore
        lmpCompute.delete()
      }

      if (compute.lmpCompute.execute()) {
        compute.lmpCompute.sync()
        compute.xLabel = compute.lmpCompute.getXLabel()
        compute.yLabel = compute.lmpCompute.getYLabel()
        compute.scalarValue = compute.lmpCompute.getScalarValue()
        const data1DNames = compute.lmpCompute.getData1DNames()
        const data1DVector =  compute.lmpCompute.getData1D()
        if (data1DNames.size() > 0) {
          if (compute.data1D == null) {
            compute.data1D = {
              data: [],
              labels: []
            }
          }
        }

        if (compute.data1D) {
          if (compute.data1D.labels.length === 0) {
            compute.data1D.labels.push('x')
          }
          for (let j = 0; j < data1DNames.size(); j++) {
            const lmpData = data1DVector.get(j)
            
            if (compute.data1D.labels.length-1 === j) {
              compute.data1D.labels.push(lmpData.getLabel())
            }
            
            const xValuesPointer = lmpData.getXValuesPointer() / 4
            const yValuesPointer = lmpData.getYValuesPointer() / 4
            const xValues = input.wasm.HEAPF32.subarray(xValuesPointer, xValuesPointer + lmpData.getNumPoints()) as Float32Array
            const yValues = input.wasm.HEAPF32.subarray(yValuesPointer, yValuesPointer + lmpData.getNumPoints()) as Float32Array
            for (let k = compute.data1D.data.length; k < xValues.length; k++) {
              if (j === 0) {
                compute.data1D.data.push([xValues[k]])
              }
              compute.data1D.data[k].push(yValues[k])
            }
          }
        }
      }
      
      output.computes[name] = compute
      //@ts-ignore
      window.output = output
    }
  }
}

export default SyncComputesModifier
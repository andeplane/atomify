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

  run = (input: ModifierInput, output: ModifierOutput, everything: boolean = false) => {
    if (!this.active) {
      return
    }

    input.lammps.syncComputes()
    const computeNames = input.lammps.getComputeNames()
    for (let i = 0; i < computeNames.size(); i++) {
      const name = computeNames.get(i)
      let compute = input.computes[name]
      
      if (compute == null) {
        const lmpCompute = input.lammps.getCompute(name)
        
        // Need to create a new one 
        compute = {
          name: lmpCompute.getName(),
          type: lmpCompute.getType(),
          isPerAtom: lmpCompute.getIsPerAtom(),
          xLabel: lmpCompute.getXLabel(),
          yLabel: lmpCompute.getYLabel(),
          hasScalarData: lmpCompute.hasScalarData(),
          clearPerSync: lmpCompute.getClearPerSync(),
          scalarValue: 0,
          syncDataPoints: false,
          hasData1D: false,
          lmpCompute,
        }
      }

      if (compute.lmpCompute.execute()) {
        compute.lmpCompute.sync()
        compute.xLabel = compute.lmpCompute.getXLabel()
        compute.yLabel = compute.lmpCompute.getYLabel()
        compute.scalarValue = compute.lmpCompute.getScalarValue()
        
        const data1DNames = compute.lmpCompute.getData1DNames()
        compute.hasData1D = data1DNames.size() > 0

        if (data1DNames.size() > 0) {
          compute.clearPerSync = compute.lmpCompute.getClearPerSync()
          const data1DVector = compute.lmpCompute.getData1D()
          
          if (compute.data1D == null) {
            compute.data1D = {
              data: [],
              labels: []
            }
          }

          if ( (everything || compute.syncDataPoints) && compute.data1D) { // Data points is only for plotting figures
            if (compute.clearPerSync) {
              // For histograms (compute rdf etc) we don't have time as x axis, so we clear every time
              compute.data1D.data = []
            }

            const lengthBeforeWeStart = compute.data1D.data.length // Used to avoid coping all data every time

            if (compute.data1D.labels.length === 0) {
              // First label is never visible
              compute.data1D.labels.push('x')
            }
            
            for (let j = 0; j < data1DNames.size(); j++) {
              const lmpData = data1DVector.get(j)
              
              if (compute.data1D.labels.length-1 === j) {
                // Add missing labels
                compute.data1D.labels.push(lmpData.getLabel())
              }
              
              const xValuesPointer = lmpData.getXValuesPointer() / 4
              const yValuesPointer = lmpData.getYValuesPointer() / 4
              const xValues = input.wasm.HEAPF32.subarray(xValuesPointer, xValuesPointer + lmpData.getNumPoints()) as Float32Array
              const yValues = input.wasm.HEAPF32.subarray(yValuesPointer, yValuesPointer + lmpData.getNumPoints()) as Float32Array
              for (let k = lengthBeforeWeStart; k < xValues.length; k++) {
                if (j === 0) {
                  compute.data1D.data.push([xValues[k]])
                }
                compute.data1D.data[k].push(yValues[k])
              }
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
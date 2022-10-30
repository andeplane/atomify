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
      
      output.computes[name] = compute
    }
  }
}

export default SyncComputesModifier
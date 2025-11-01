import Modifier from "./modifier";
import { processData1D } from "./modifier";
import { ModifierInput, ModifierOutput } from "./types";

interface SyncComputesModifierProps {
  name: string;
  active: boolean;
}

class SyncComputesModifier extends Modifier {
  constructor({ name, active }: SyncComputesModifierProps) {
    super({ name, active });
  }

  run = (
    input: ModifierInput,
    output: ModifierOutput,
    everything: boolean = false,
  ) => {
    if (!this.active || !input.hasSynchronized) {
      return;
    }

    input.lammps.syncComputes();
    const computeNames = input.lammps.getComputeNames();

    for (let i = 0; i < computeNames.size(); i++) {
      const name = computeNames.get(i);
      let compute = input.computes[name];

      if (compute == null) {
        const lmpCompute = input.lammps.getCompute(name);

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
        };
      }

      if (compute.lmpCompute.execute()) {
        compute.lmpCompute.sync();
        compute.xLabel = compute.lmpCompute.getXLabel();
        compute.yLabel = compute.lmpCompute.getYLabel();
        compute.scalarValue = compute.lmpCompute.getScalarValue();
        compute.clearPerSync = compute.lmpCompute.getClearPerSync();

        const { data1D, hasData1D } = processData1D(
          compute.lmpCompute,
          compute.data1D,
          input,
          everything,
          compute.syncDataPoints,
          compute.clearPerSync,
        );
        compute.data1D = data1D;
        compute.hasData1D = hasData1D;
      }
      output.computes[name] = compute;
    }
  };
}

export default SyncComputesModifier;

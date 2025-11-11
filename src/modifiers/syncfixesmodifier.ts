import Modifier from "./modifier";
import { ModifierInput, ModifierOutput } from "./types";
import { processData1D } from "./modifier";

interface SyncFixesModifierProps {
  name: string;
  active: boolean;
}

class SyncFixesModifier extends Modifier {
  constructor({ name, active }: SyncFixesModifierProps) {
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

    input.lammps.syncFixes();
    const fixNames = input.lammps.getFixNames();

    for (let i = 0; i < fixNames.size(); i++) {
      const name = fixNames.get(i);
      let fix = input.fixes[name];
      if (fix == null) {
        const lmpFix = input.lammps.getFix(name);

        // Need to create a new one
        fix = {
          name: lmpFix.getName(),
          type: lmpFix.getType(),
          isPerAtom: lmpFix.getIsPerAtom(),
          xLabel: lmpFix.getXLabel(),
          yLabel: lmpFix.getYLabel(),
          hasScalarData: lmpFix.hasScalarData(),
          clearPerSync: lmpFix.getClearPerSync(),
          scalarValue: 0,
          syncDataPoints: false,
          hasData1D: false,
          lmpFix,
        };
      }
      fix.lmpFix.sync();
      fix.xLabel = fix.lmpFix.getXLabel();
      fix.yLabel = fix.lmpFix.getYLabel();
      fix.scalarValue = fix.lmpFix.getScalarValue();

      const processed = processData1D(
        fix.lmpFix,
        fix.data1D,
        input,
        everything,
        fix.syncDataPoints,
      );
      fix.data1D = processed.data1D;
      fix.hasData1D = processed.hasData1D;
      fix.clearPerSync = processed.clearPerSync;
      output.fixes[name] = fix;
    }
  };
}

export default SyncFixesModifier;

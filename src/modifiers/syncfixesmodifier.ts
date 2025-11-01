import Modifier from "./modifier";
import { processData1D } from "./modifier";
import { ModifierInput, ModifierOutput } from "./types";

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
      fix.clearPerSync = fix.lmpFix.getClearPerSync();

      const { data1D, hasData1D } = processData1D(
        fix.lmpFix,
        fix.data1D,
        input,
        everything,
        fix.syncDataPoints,
        fix.clearPerSync,
      );
      fix.data1D = data1D;
      fix.hasData1D = hasData1D;

      output.fixes[name] = fix;
    }
  };
}

export default SyncFixesModifier;

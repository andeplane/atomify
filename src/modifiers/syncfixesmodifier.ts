import Modifier, { ModifierProps } from "./modifier";
import { ModifierInput, ModifierOutput } from "./types";
import { createModifierEntry, syncModifierEntry } from "./syncModifierData";

class SyncFixesModifier extends Modifier {
  constructor({ name, active }: ModifierProps) {
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

    for (const name of input.lammps.getFixNames()) {
      let fix = input.fixes[name];
      if (fix == null) {
        fix = createModifierEntry(input.lammps.getFix(name), "lmpFix");
      }

      syncModifierEntry(fix, "lmpFix", everything);
      output.fixes[name] = fix;
    }
  };
}

export default SyncFixesModifier;

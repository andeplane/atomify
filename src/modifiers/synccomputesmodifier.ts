import Modifier, { ModifierProps } from "./modifier";
import { ModifierInput, ModifierOutput } from "./types";
import { createModifierEntry, syncModifierEntry } from "./syncModifierData";

class SyncComputesModifier extends Modifier {
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

    for (const name of input.lammps.getComputeNames()) {
      let compute = input.computes[name];

      if (compute == null) {
        compute = createModifierEntry(
          input.lammps.getCompute(name),
          "lmpCompute",
        );
      }

      syncModifierEntry(compute, "lmpCompute", everything);
      output.computes[name] = compute;
    }
  };
}

export default SyncComputesModifier;

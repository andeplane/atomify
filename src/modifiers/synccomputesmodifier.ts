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

    input.lammps.syncComputes();
    const computeNames = input.lammps.getComputeNames();

    for (let i = 0; i < computeNames.size(); i++) {
      const name = computeNames.get(i);
      let compute = input.computes[name];

      if (compute == null) {
        compute = createModifierEntry(
          input.lammps.getCompute(name),
          "lmpCompute",
        );
      }

      if (compute.lmpCompute.execute()) {
        syncModifierEntry(compute, "lmpCompute", input.wasm, everything);
      }
      output.computes[name] = compute;
    }
  };
}

export default SyncComputesModifier;

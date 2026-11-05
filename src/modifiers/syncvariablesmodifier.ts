import Modifier, { ModifierProps } from "./modifier";
import { ModifierInput, ModifierOutput } from "./types";
import { createModifierEntry, syncModifierEntry } from "./syncModifierData";

class SyncVariablesModifier extends Modifier {
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

    for (const name of input.lammps.getVariableNames()) {
      let variable = input.variables[name];
      if (variable == null) {
        variable = createModifierEntry(
          input.lammps.getVariable(name),
          "lmpVariable",
        );
      }

      syncModifierEntry(variable, "lmpVariable", everything, {
        refreshHasScalarData: true,
      });
      output.variables[name] = variable;
    }
  };
}

export default SyncVariablesModifier;

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

    input.lammps.syncVariables();
    const variableNames = input.lammps.getVariableNames();

    for (let i = 0; i < variableNames.size(); i++) {
      const name = variableNames.get(i);
      let variable = input.variables[name];
      if (variable == null) {
        variable = createModifierEntry(
          input.lammps.getVariable(name),
          "lmpVariable",
        );
      }

      syncModifierEntry(variable, "lmpVariable", input.wasm, everything, {
        refreshHasScalarData: true,
      });
      output.variables[name] = variable;
    }
  };
}

export default SyncVariablesModifier;

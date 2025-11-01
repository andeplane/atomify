import Modifier from "./modifier";
import { ModifierInput, ModifierOutput } from "./types";
import { processData1D } from "./modifier";

interface SyncVariablesModifierProps {
  name: string;
  active: boolean;
}

class SyncVariablesModifier extends Modifier {
  constructor({ name, active }: SyncVariablesModifierProps) {
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
        const lmpVariable = input.lammps.getVariable(name);

        // Need to create a new one
        variable = {
          name: lmpVariable.getName(),
          type: lmpVariable.getType(),
          isPerAtom: lmpVariable.getIsPerAtom(),
          xLabel: lmpVariable.getXLabel(),
          yLabel: lmpVariable.getYLabel(),
          hasScalarData: lmpVariable.hasScalarData(),
          clearPerSync: lmpVariable.getClearPerSync(),
          scalarValue: 0,
          syncDataPoints: false,
          hasData1D: false,
          lmpVariable,
        };
      }
      variable.lmpVariable.sync();

      variable.xLabel = variable.lmpVariable.getXLabel();
      variable.yLabel = variable.lmpVariable.getYLabel();
      variable.scalarValue = variable.lmpVariable.getScalarValue();
      variable.hasScalarData = variable.lmpVariable.hasScalarData();

      Object.assign(variable, processData1D(
        variable.lmpVariable,
        variable.data1D,
        input,
        everything,
        variable.syncDataPoints,
      ));
      output.variables[name] = variable;
    }
  };
}

export default SyncVariablesModifier;

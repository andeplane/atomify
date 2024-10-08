import Modifier from "./modifier";
import { ModifierInput, ModifierOutput } from "./types";

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

      const data1DNames = variable.lmpVariable.getData1DNames();
      variable.hasData1D = data1DNames.size() > 0;
      if (data1DNames.size() > 0) {
        variable.clearPerSync = variable.lmpVariable.getClearPerSync();
        const data1DVector = variable.lmpVariable.getData1D();
        if (variable.data1D == null) {
          variable.data1D = {
            data: [],
            labels: [],
          };
        }

        if ((everything || variable.syncDataPoints) && variable.data1D) {
          // Data points is only for plotting figures
          if (variable.clearPerSync) {
            // For histograms (compute rdf etc) we don't have time as x axis, so we clear every time
            variable.data1D.data = [];
          }

          const lengthBeforeWeStart = variable.data1D.data.length; // Used to avoid coping all data every time

          if (variable.data1D.labels.length === 0) {
            // First label is never visible
            variable.data1D.labels.push("x");
          }

          for (let j = 0; j < data1DNames.size(); j++) {
            const lmpData = data1DVector.get(j);

            if (variable.data1D.labels.length - 1 === j) {
              // Add missing labels
              variable.data1D.labels.push(lmpData.getLabel());
            }

            const xValuesPointer = lmpData.getXValuesPointer() / 4;
            const yValuesPointer = lmpData.getYValuesPointer() / 4;
            const xValues = input.wasm.HEAPF32.subarray(
              xValuesPointer,
              xValuesPointer + lmpData.getNumPoints(),
            ) as Float32Array;
            const yValues = input.wasm.HEAPF32.subarray(
              yValuesPointer,
              yValuesPointer + lmpData.getNumPoints(),
            ) as Float32Array;
            for (let k = lengthBeforeWeStart; k < xValues.length; k++) {
              if (j === 0) {
                variable.data1D.data.push([xValues[k]]);
              }
              variable.data1D.data[k].push(yValues[k]);
            }
          }
        }
      }
      output.variables[name] = variable;
    }
  };
}

export default SyncVariablesModifier;

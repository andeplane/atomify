import Modifier from "./modifier";
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

      const data1DNames = fix.lmpFix.getData1DNames();
      fix.hasData1D = data1DNames.size() > 0;

      if (data1DNames.size() > 0) {
        fix.clearPerSync = fix.lmpFix.getClearPerSync();
        const data1DVector = fix.lmpFix.getData1D();
        if (fix.data1D == null) {
          fix.data1D = {
            data: [],
            labels: [],
          };
        }

        if ((everything || fix.syncDataPoints) && fix.data1D) {
          // Data points is only for plotting figures
          if (fix.clearPerSync) {
            // For histograms (compute rdf etc) we don't have time as x axis, so we clear every time
            fix.data1D.data = [];
          }

          const lengthBeforeWeStart = fix.data1D.data.length; // Used to avoid coping all data every time

          if (fix.data1D.labels.length === 0) {
            // First label is never visible
            fix.data1D.labels.push("x");
          }

          for (let j = 0; j < data1DNames.size(); j++) {
            const lmpData = data1DVector.get(j);

            if (fix.data1D.labels.length - 1 === j) {
              // Add missing labels
              fix.data1D.labels.push(lmpData.getLabel());
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
                fix.data1D.data.push([xValues[k]]);
              }
              fix.data1D.data[k].push(yValues[k]);
            }
          }
        }
      }
      output.fixes[name] = fix;
    }
  };
}

export default SyncFixesModifier;

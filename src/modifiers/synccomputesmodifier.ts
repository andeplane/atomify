import Modifier from "./modifier";
import type { ModifierInput, ModifierOutput } from "./types";

interface SyncComputesModifierProps {
  name: string;
  active: boolean;
}

class SyncComputesModifier extends Modifier {
  constructor({ name, active }: SyncComputesModifierProps) {
    super({ name, active });
  }

  run = (input: ModifierInput, output: ModifierOutput, everything: boolean = false) => {
    if (!this.active || !input.hasSynchronized) {
      return;
    }

    input.lammps.syncComputes();
    const computeNames = input.lammps.getComputeNames();

    for (let i = 0; i < computeNames.size(); i++) {
      const name = computeNames.get(i);
      let compute = input.computes[name];

      if (compute == null) {
        const lmpCompute = input.lammps.getCompute(name);

        // Need to create a new one
        compute = {
          name: lmpCompute.getName(),
          type: lmpCompute.getType(),
          isPerAtom: lmpCompute.getIsPerAtom(),
          xLabel: lmpCompute.getXLabel(),
          yLabel: lmpCompute.getYLabel(),
          hasScalarData: lmpCompute.hasScalarData(),
          clearPerSync: lmpCompute.getClearPerSync(),
          scalarValue: 0,
          syncDataPoints: false,
          hasData1D: false,
          lmpCompute,
        };
      }

      if (compute.lmpCompute.execute()) {
        compute.lmpCompute.sync();
        compute.xLabel = compute.lmpCompute.getXLabel();
        compute.yLabel = compute.lmpCompute.getYLabel();
        compute.scalarValue = compute.lmpCompute.getScalarValue();

        // Get data1DNamesWrapper and extract size, then delete immediately
        const data1DNamesWrapper = compute.lmpCompute.getData1DNames();
        compute.hasData1D = data1DNamesWrapper.size() > 0;
        const data1DNamesSize = data1DNamesWrapper.size();
        data1DNamesWrapper.delete(); // Delete WASM wrapper to prevent memory leak

        if (data1DNamesSize > 0) {
          compute.clearPerSync = compute.lmpCompute.getClearPerSync();

          if (compute.data1D == null) {
            compute.data1D = {
              data: [],
              labels: [],
            };
          }

          if ((everything || compute.syncDataPoints) && compute.data1D) {
            // Data points is only for plotting figures
            if (compute.clearPerSync) {
              // For histograms (compute rdf etc) we don't have time as x axis, so we clear every time
              compute.data1D.data = [];
            }

            const lengthBeforeWeStart = compute.data1D.data.length; // Used to avoid coping all data every time

            if (compute.data1D.labels.length === 0) {
              // First label is never visible
              compute.data1D.labels.push("x");
            }

            // Get data1DVector once before the loop for better performance
            const data1DVector = compute.lmpCompute.getData1D();

            for (let j = 0; j < data1DNamesSize; j++) {
              const lmpData = data1DVector.get(j);

              if (compute.data1D.labels.length - 1 === j) {
                // Add missing labels
                compute.data1D.labels.push(lmpData.getLabel());
              }

              const xValuesPointer = lmpData.getXValuesPointer() / 4;
              const yValuesPointer = lmpData.getYValuesPointer() / 4;
              const xValues = input.wasm.HEAPF32.subarray(
                xValuesPointer,
                xValuesPointer + lmpData.getNumPoints()
              ) as Float32Array;
              const yValues = input.wasm.HEAPF32.subarray(
                yValuesPointer,
                yValuesPointer + lmpData.getNumPoints()
              ) as Float32Array;
              for (let k = lengthBeforeWeStart; k < xValues.length; k++) {
                if (j === 0) {
                  compute.data1D.data.push([xValues[k]]);
                }
                compute.data1D.data[k].push(yValues[k]);
              }

              // Delete the Data1D copy to prevent memory leak
              lmpData.delete();
            }

            // Delete the vector wrapper after the loop to prevent memory leak
            data1DVector.delete();
          }
        }
      }
      output.computes[name] = compute;
    }
  };
}

export default SyncComputesModifier;

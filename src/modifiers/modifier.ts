import { ModifierInput, ModifierOutput } from "./types";
import { LMPModifier, Data1D } from "../types";

interface ModifierProps {
  name: string;
  active: boolean;
}

export interface ProcessedData1D {
  data1D: Data1D | undefined;
  hasData1D: boolean;
  clearPerSync: boolean;
}

/**
 * Shared helper function to process Data1D from LMPModifier.
 * Extracts common logic for syncing computes, fixes, and variables.
 */
export function processData1D(
  lmpModifier: LMPModifier,
  data1D: Data1D | undefined,
  input: ModifierInput,
  everything: boolean,
  syncDataPoints: boolean
): ProcessedData1D {
  // Get data1DNamesWrapper and extract size, then delete immediately
  const data1DNamesWrapper = lmpModifier.getData1DNames();
  const data1DNamesSize = data1DNamesWrapper.size();
  const hasData1D = data1DNamesSize > 0;
  data1DNamesWrapper.delete(); // Delete WASM wrapper to prevent memory leak

  if (data1DNamesSize === 0) {
    return { data1D, hasData1D, clearPerSync: false };
  }

  const clearPerSync = lmpModifier.getClearPerSync();

  if (data1D == null) {
    data1D = {
      data: [],
      labels: [],
    };
  }

  if (everything || syncDataPoints) {
    // Data points is only for plotting figures
    if (clearPerSync) {
      // For histograms (compute rdf etc) we don't have time as x axis, so we clear every time
      data1D.data = [];
    }

    const lengthBeforeWeStart = data1D.data.length; // Used to avoid copying all data every time

    if (data1D.labels.length === 0) {
      // First label is never visible
      data1D.labels.push("x");
    }

    // Get data1DVector once before the loop for better performance
    const data1DVector = lmpModifier.getData1D();

    for (let j = 0; j < data1DNamesSize; j++) {
      const lmpData = data1DVector.get(j);

      if (data1D.labels.length - 1 === j) {
        // Add missing labels
        data1D.labels.push(lmpData.getLabel());
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
          data1D.data.push([xValues[k]]);
        }
        data1D.data[k].push(yValues[k]);
      }

      // Delete the Data1D copy to prevent memory leak
      lmpData.delete();
    }

    // Delete the vector wrapper after the loop to prevent memory leak
    data1DVector.delete();
  }

  return { data1D, hasData1D, clearPerSync };
}

class Modifier {
  public name: string;
  public key: string;
  public active: boolean;

  constructor({ name, active }: ModifierProps) {
    this.name = name;
    this.key = name;
    this.active = active;
  }

  run = (
    input: ModifierInput,
    output: ModifierOutput,
    everything: boolean = false,
  ) => {};
}
export default Modifier;

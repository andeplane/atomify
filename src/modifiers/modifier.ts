import { ModifierInput, ModifierOutput } from "./types";
import { LMPModifier, Data1D } from "../types";

interface ModifierProps {
  name: string;
  active: boolean;
}

/**
 * Shared function to process Data1D from LMPModifier.
 * Handles Data1D extraction, processing, and WASM memory cleanup.
 */
export function processData1D(
  lmpModifier: LMPModifier,
  data1D: Data1D | undefined,
  input: ModifierInput,
  everything: boolean,
  syncDataPoints: boolean,
  clearPerSync: boolean,
): { data1D: Data1D | undefined; hasData1D: boolean } {
  // Get data1DNamesWrapper and extract size, then delete immediately
  const data1DNamesWrapper = lmpModifier.getData1DNames();
  const hasData1D = data1DNamesWrapper.size() > 0;
  const data1DNamesSize = data1DNamesWrapper.size();
  data1DNamesWrapper.delete(); // Delete WASM wrapper to prevent memory leak

  if (data1DNamesSize === 0) {
    return { data1D, hasData1D: false };
  }

  // Initialize data1D if needed
  let currentData1D = data1D;
  if (currentData1D == null) {
    currentData1D = {
      data: [],
      labels: [],
    };
  }

  if ((everything || syncDataPoints) && currentData1D) {
    // Data points is only for plotting figures
    if (clearPerSync) {
      // For histograms (compute rdf etc) we don't have time as x axis, so we clear every time
      currentData1D.data = [];
    }

    const lengthBeforeWeStart = currentData1D.data.length; // Used to avoid copying all data every time

    if (currentData1D.labels.length === 0) {
      // First label is never visible
      currentData1D.labels.push("x");
    }

    // Get data1DVector once before the loop for better performance
    const data1DVector = lmpModifier.getData1D();

    for (let j = 0; j < data1DNamesSize; j++) {
      const lmpData = data1DVector.get(j);

      if (currentData1D.labels.length - 1 === j) {
        // Add missing labels
        currentData1D.labels.push(lmpData.getLabel());
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
          currentData1D.data.push([xValues[k]]);
        }
        currentData1D.data[k].push(yValues[k]);
      }

      // Delete the Data1D copy to prevent memory leak
      lmpData.delete();
    }

    // Delete the vector wrapper after the loop to prevent memory leak
    data1DVector.delete();
  }

  return { data1D: currentData1D, hasData1D };
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

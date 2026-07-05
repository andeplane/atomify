import { LMPModifier, ModifierData } from "../types";
import { AtomifyWasmModule } from "../wasm/types";

type ModifierKey = "lmpCompute" | "lmpFix" | "lmpVariable";

/**
 * Builds the initial ModifierData entry for a newly discovered
 * compute/fix/variable, reading its static properties once.
 */
export function createModifierEntry<K extends ModifierKey>(
  lmp: LMPModifier,
  key: K,
): ModifierData<K> {
  return {
    name: lmp.getName(),
    type: lmp.getType(),
    isPerAtom: lmp.getIsPerAtom(),
    xLabel: lmp.getXLabel(),
    yLabel: lmp.getYLabel(),
    hasScalarData: lmp.hasScalarData(),
    clearPerSync: lmp.getClearPerSync(),
    scalarValue: 0,
    syncDataPoints: false,
    hasData1D: false,
    [key]: lmp,
  } as unknown as ModifierData<K>;
}

/**
 * Refreshes an existing ModifierData entry from its LMPModifier and, when
 * requested, copies new 1D data points into entry.data1D. Shared by
 * SyncComputesModifier / SyncFixesModifier / SyncVariablesModifier, which
 * differ only in which LAMMPS accessors they call before/around this.
 */
export function syncModifierEntry<K extends ModifierKey>(
  entry: ModifierData<K>,
  key: K,
  wasm: AtomifyWasmModule,
  everything: boolean,
  options: { refreshHasScalarData?: boolean } = {},
): void {
  const lmp = entry[key] as LMPModifier;
  lmp.sync();
  entry.xLabel = lmp.getXLabel();
  entry.yLabel = lmp.getYLabel();
  entry.scalarValue = lmp.getScalarValue();
  if (options.refreshHasScalarData) {
    entry.hasScalarData = lmp.hasScalarData();
  }

  // Get data1DNamesWrapper and extract size, then delete immediately
  const data1DNamesWrapper = lmp.getData1DNames();
  entry.hasData1D = data1DNamesWrapper.size() > 0;
  const data1DNamesSize = data1DNamesWrapper.size();
  data1DNamesWrapper.delete(); // Delete WASM wrapper to prevent memory leak

  if (data1DNamesSize === 0) {
    return;
  }

  entry.clearPerSync = lmp.getClearPerSync();
  if (entry.data1D == null) {
    entry.data1D = {
      data: [],
      labels: [],
    };
  }

  if (!(everything || entry.syncDataPoints) || !entry.data1D) {
    return;
  }

  // Data points is only for plotting figures
  if (entry.clearPerSync) {
    // For histograms (compute rdf etc) we don't have time as x axis, so we clear every time
    entry.data1D.data = [];
  }

  const lengthBeforeWeStart = entry.data1D.data.length; // Used to avoid coping all data every time

  if (entry.data1D.labels.length === 0) {
    // First label is never visible
    entry.data1D.labels.push("x");
  }

  // Get data1DVector once before the loop for better performance
  const data1DVector = lmp.getData1D();

  for (let j = 0; j < data1DNamesSize; j++) {
    const lmpData = data1DVector.get(j);

    if (entry.data1D.labels.length - 1 === j) {
      // Add missing labels
      entry.data1D.labels.push(lmpData.getLabel());
    }

    const xValuesPointer = lmpData.getXValuesPointer() / 4;
    const yValuesPointer = lmpData.getYValuesPointer() / 4;
    const xValues = wasm.HEAPF32.subarray(
      xValuesPointer,
      xValuesPointer + lmpData.getNumPoints(),
    ) as Float32Array;
    const yValues = wasm.HEAPF32.subarray(
      yValuesPointer,
      yValuesPointer + lmpData.getNumPoints(),
    ) as Float32Array;
    for (let k = lengthBeforeWeStart; k < xValues.length; k++) {
      if (j === 0) {
        entry.data1D.data.push([xValues[k]]);
      }
      entry.data1D.data[k].push(yValues[k]);
    }

    // Delete the Data1D copy to prevent memory leak
    lmpData.delete();
  }

  // Delete the vector wrapper after the loop to prevent memory leak
  data1DVector.delete();
}

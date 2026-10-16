/**
 * Module-level mutable engine flags. Replaces window globals with importable,
 * mockable getters/setters.
 *
 * These values live outside the Redux store intentionally — cancel/syncFrequency
 * are written from store actions but read inside a high-frequency WASM callback
 * where stale closures would be a problem.
 */

// --- Cancel flag ---
// Written by UI (stop button), consumed by the adapter's between-step wait
// loop (LammpsAdapter.onStep), which aborts the run.

let cancelFlag = false;

export function getCancel(): boolean {
  return cancelFlag;
}

export function setCancel(value: boolean): void {
  cancelFlag = value;
}

// --- Paused flag ---
// Mirrors the store's paused state so the adapter's pause-wait loop can read
// it without touching React/easy-peasy state from inside the step callback.

let pausedFlag = false;

export function getPausedFlag(): boolean {
  return pausedFlag;
}

export function setPausedFlag(value: boolean): void {
  pausedFlag = value;
}

// --- Sync frequency ---
// Written by settings store action, read by the per-timestep step listener
// in Simulation.tsx

let syncFrequencyValue: number | undefined;

export function getSyncFrequency(): number | undefined {
  return syncFrequencyValue;
}

export function setSyncFrequency(value: number): void {
  syncFrequencyValue = value;
}

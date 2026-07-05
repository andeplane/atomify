import { AtomifyWasmModule } from "./types";

/**
 * Module-level singleton for the WASM module instance and related mutable state.
 * Replaces window globals with importable, mockable getters/setters.
 *
 * These values live outside the Redux store intentionally — the WASM module is
 * too large for Redux DevTools, and cancel/syncFrequency are written from store
 * actions but read inside a high-frequency WASM callback where stale closures
 * would be a problem.
 */

let wasmInstance: AtomifyWasmModule | undefined;

export function getWasm(): AtomifyWasmModule {
  if (!wasmInstance) {
    throw new Error("WASM module is not initialized");
  }
  return wasmInstance;
}

export function getWasmOrNull(): AtomifyWasmModule | undefined {
  return wasmInstance;
}

export function setWasm(module: AtomifyWasmModule): void {
  wasmInstance = module;
}

// --- Cancel flag ---
// Written by UI (stop button), read by WASM postStepCallback

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
// Written by settings store action, read by WASM postStepCallback

let syncFrequencyValue: number | undefined;

export function getSyncFrequency(): number | undefined {
  return syncFrequencyValue;
}

export function setSyncFrequency(value: number): void {
  syncFrequencyValue = value;
}

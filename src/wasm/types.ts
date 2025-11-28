import { LammpsWeb } from "../types";

/**
 * Extended Emscripten module interface for Atomify's LAMMPS WASM module.
 * Adds filesystem access and LAMMPS class to the standard EmscriptenModule.
 */
export interface AtomifyWasmModule {
  FS: any;
  LAMMPSWeb: new () => LammpsWeb;
  HEAPF32: Float32Array;
  HEAPF64: Float64Array;
  HEAP32: Int32Array;
  print?: (text: string) => void;
  printErr?: (text: string) => void;
}


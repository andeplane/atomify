import { LammpsWeb } from "../types";

/**
 * Extended Emscripten module interface for Atomify's LAMMPS WASM module.
 * Adds filesystem access and LAMMPS class to the standard EmscriptenModule.
 */
export interface AtomifyWasmModule extends EmscriptenModule {
  FS: typeof FS;
  LAMMPSWeb: new () => LammpsWeb;
}



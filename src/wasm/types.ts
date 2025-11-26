/**
 * Extended Emscripten module interface for Atomify's LAMMPS WASM module.
 * Adds filesystem access to the standard EmscriptenModule.
 */
export interface AtomifyWasmModule extends EmscriptenModule {
  FS: typeof FS;
}


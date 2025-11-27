import { AtomifyWasmModule } from "./types";

/**
 * Creates and initializes the LAMMPS WebAssembly module.
 * @param options - Configuration options for the module
 * @returns Promise that resolves to the initialized WASM module
 */
declare function createModule(options?: Partial<EmscriptenModule>): Promise<AtomifyWasmModule>;

export default createModule;

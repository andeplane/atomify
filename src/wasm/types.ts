import type { LammpsModule } from "lammps.js";

/**
 * The Emscripten module produced by lammps.js, extended with the filesystem
 * methods Atomify uses that are missing from lammps.js's FS typings.
 */
// TODO(lammps.js-#fs-types): upstream these FS method typings to lammps.js.
export interface AtomifyWasmModule extends LammpsModule {
  FS: LammpsModule["FS"] & {
    readdir(path: string): string[];
    analyzePath(path: string): { exists: boolean };
  };
}

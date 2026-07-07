// Runtime resolution of the atomify wasm variant is handled by the bundler
// via lammps.js's "./wasm-atomify" export. Atomify's tsconfig uses
// moduleResolution: "node", which ignores package exports maps, so declare
// the subpath's types here — identical to the default lammps.js entry.
declare module "lammps.js/wasm-atomify" {
  import type { LammpsModule, ModuleOptions } from "lammps.js";
  const createModule: (options?: ModuleOptions) => Promise<LammpsModule>;
  export default createModule;
}

declare module "../wasm/lammps.mjs" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createModule: () => Promise<any>;
  export default createModule;
}
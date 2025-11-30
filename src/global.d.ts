import { AtomifyWasmModule } from "./wasm/types";
import { Simulation } from "./store/simulation";
import { LammpsWeb } from "./types";
import * as LocalForage from "localforage";

declare global {
  interface Window {
    wasm: AtomifyWasmModule;
    simulation?: Simulation;
    localforage?: typeof LocalForage;
    lammps?: LammpsWeb;
    syncFrequency?: number;
  }
}

export {};


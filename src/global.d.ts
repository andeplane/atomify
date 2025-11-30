import { AtomifyWasmModule } from "./wasm/types";
import { Simulation } from "./store/simulation";
import * as LocalForage from "localforage";

declare global {
  interface Window {
    wasm: AtomifyWasmModule;
    simulation?: Simulation;
    localforage?: typeof LocalForage;
  }
}

export {};


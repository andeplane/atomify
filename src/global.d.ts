import { AtomifyWasmModule } from "./wasm/types";
import { Simulation } from "./store/simulation";
import { LammpsWeb } from "./types";
import { SimulationFile } from "./store/app";
import { Visualizer } from "omovi";
import * as LocalForage from "localforage";

declare global {
  interface Window {
    wasm: AtomifyWasmModule;
    simulation?: Simulation;
    localforage?: typeof LocalForage;
    lammps?: LammpsWeb;
    syncFrequency?: number;
    visualizer?: Visualizer;
    cancel?: boolean;
    postStepCallback?: () => boolean | undefined;
    files?: SimulationFile[];
  }
}

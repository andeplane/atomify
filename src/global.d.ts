import { Visualizer } from "omovi";
import { SimulationFile } from "./store/app";

declare global {
  interface Window {
    visualizer?: Visualizer;
    postStepCallback?: () => boolean | void;
    files?: SimulationFile[];
  }
}

export {};

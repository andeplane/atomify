import { AtomifyWasmModule } from "./wasm/types";

declare global {
  interface Window {
    wasm: AtomifyWasmModule;
  }
}

export {};


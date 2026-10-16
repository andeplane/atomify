import { createStore } from "easy-peasy";
import { storeModel, StoreModel } from "./model";
import type { StoreInjections } from "./projects";
import {
  createIndexedDbProjectStorage,
  createMemoryProjectStorage,
} from "../storage";
import { EngineRegistry } from "../engine/EngineRegistry";

/**
 * The app's live engine objects (engine proxy, visualizer, particles, bonds,
 * modifiers). The store's thunks get it as an injection and React through
 * EngineContext (index.tsx); e2e specs read it from this module.
 */
export const engine = new EngineRegistry();

const injections: StoreInjections = {
  libraryStorage: createIndexedDbProjectStorage(),
  scratchStorage: createMemoryProjectStorage(),
  engine,
};

const store = createStore<StoreModel>(storeModel, { injections });

// Added support for hot reloading
// Vite uses import.meta.hot instead of module.hot
if (import.meta.env.DEV) {
  if (import.meta.hot) {
    import.meta.hot.accept("./model", () => {
      store.reconfigure(storeModel); // 👈 Here is the magic
    });
  }
}

export default store;

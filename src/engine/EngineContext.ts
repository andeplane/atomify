/**
 * React access to the app's EngineRegistry (see EngineRegistry.ts).
 *
 * index.tsx provides the same registry the store's thunks get as an
 * injection, so components and the processing pipeline see the same engine,
 * visualizer and particles.
 */

import { createContext, useContext, useSyncExternalStore } from "react";
import type { EngineObjects, EngineRegistry } from "./EngineRegistry";

export const EngineContext = createContext<EngineRegistry | null>(null);

/** The registry itself: its setters and the modifier instances. */
export function useEngine(): EngineRegistry {
  const engine = useContext(EngineContext);
  if (!engine) {
    throw new Error("useEngine must be used inside an EngineContext provider");
  }
  return engine;
}

/**
 * Select one of the live objects; the component re-renders when the
 * selected object is replaced (a new visualizer, particles that outgrew
 * their buffers), like useStoreState does for store state. The selector must
 * return a registered object, not build a new one per call.
 */
export function useEngineState<T>(selector: (objects: EngineObjects) => T): T {
  const engine = useEngine();
  return useSyncExternalStore(engine.subscribe, () =>
    selector(engine.getSnapshot()),
  );
}

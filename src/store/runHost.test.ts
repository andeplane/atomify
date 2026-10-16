import { describe, it, expect, vi } from "vitest";
import { createStore } from "easy-peasy";
import type { Particles, Bonds } from "omovi";

vi.mock("../utils/metrics", () => ({ track: vi.fn(), time_event: vi.fn() }));

import { storeModel } from "./model";
import { createStoreRunHost } from "./runHost";
import { EngineRegistry } from "../engine/EngineRegistry";
import { createMemoryProjectStorage } from "../storage";
import type { AtomType } from "../utils/atomtypes";

function fixture() {
  const engine = new EngineRegistry();
  const store = createStore(storeModel, {
    injections: {
      libraryStorage: createMemoryProjectStorage(),
      scratchStorage: createMemoryProjectStorage(),
      engine,
    },
  });
  const host = createStoreRunHost(store.getState, store.getActions, engine);
  return { engine, store, host };
}

describe("store run host", () => {
  it("drops the previous run's rendering when a fresh run loads", () => {
    const { engine, store, host } = fixture();
    const particles = { count: 8, markNeedsUpdate: vi.fn() };
    const bonds = { count: 4, markNeedsUpdate: vi.fn() };
    engine.setParticles(particles as unknown as Particles);
    engine.setBonds(bonds as unknown as Bonds);
    engine.colorModifier!.computeName = "c_ke";
    store.getActions().render.addParticleStyle({
      index: 1,
      atomType: { shortname: "H" } as AtomType,
    });
    store.getActions().simulation.addLammpsOutput("previous run");

    host.beginFreshRun("proj/runs/run-002");

    expect(store.getState().simulation.loadedWorkdir).toBe("proj/runs/run-002");
    expect(store.getState().simulation.lammpsOutput).toEqual([]);
    expect(store.getState().render.particleStyles).toEqual([]);
    expect(engine.colorModifier!.computeName).toBeUndefined();
    expect(particles.count).toBe(0);
    expect(bonds.count).toBe(0);
    // The buffers stay registered for the new run's frames to refill.
    expect(engine.particles).toBe(particles);
  });
});

import { describe, expect, it, vi } from "vitest";
import { action, createStore } from "easy-peasy";
import { processingModel } from "./processing";
import { simulationStatusModel } from "./simulationstatus";
import type { StoreModel } from "./model";
import { emptyEngineFrame, type EngineFrame } from "../wasm/engineFrame";
import { EngineRegistry } from "../engine/EngineRegistry";
import type { LammpsWeb } from "../types";

// Row-major triclinic cell matrix and origin, as the engine streams them.
const BOX = [3, 0.5, 0.2, 0, 4, 0.7, 0, 0, 5];
const ORIGIN = [1, 2, 3];

// Stands in for the proxy registered in the EngineRegistry.
class FakeEngine {
  latestFrame: EngineFrame = {
    ...emptyEngineFrame(),
    boxMatrix: new Float32Array(BOX),
    origin: new Float32Array(ORIGIN),
    dimension: 3,
    unitStyle: "metal",
    walls: [{ which: 1, style: 1, position: 10, cutoff: 2.5 }],
  };
  getTimesteps = () => 42;
  getNumAtoms = () => 256;
  getRunTimesteps = () => 40;
  getRunTotalTimesteps = () => 100;
  getLastCommand = () => "run 100";
  getMemoryUsage = () => 8192;
  getWhichFlag = vi.fn(() => 1);
  getTimestepsPerSecond = () => 80;
  getCPURemain = () => 0.75;
}

function fixture() {
  const lammps = new FakeEngine();
  // No modifiers: only the status snapshot is under test.
  const engine = new EngineRegistry([]);
  engine.setLammps(lammps as unknown as LammpsWeb);
  const store = createStore(
    {
      simulationStatus: simulationStatusModel,
      processing: processingModel,
      app: { liveViewportVisible: false },
      render: { setParticleStylesUpdated: action(() => {}) },
    } as unknown as StoreModel,
    { injections: { engine } },
  );
  /** Stream a new step, the way the proxy replaces its latest frame. */
  const stream = (overrides: Partial<EngineFrame>) => {
    lammps.latestFrame = { ...lammps.latestFrame, ...overrides };
  };
  return { store, lammps, stream };
}

describe("post-timestep status publication", () => {
  it("publishes one coherent status frame instead of notifying per field", async () => {
    const { store } = fixture();
    let previous = store.getState().simulationStatus;
    const observed: unknown[] = [];
    store.subscribe(() => {
      const status = store.getState().simulationStatus;
      if (status !== previous) {
        observed.push({
          timesteps: status.timesteps,
          numAtoms: status.numAtoms,
          memoryUsage: status.memoryUsage,
          runType: status.runType,
          unitStyle: status.unitStyle,
        });
        previous = status;
      }
    });
    await store.getActions().processing.runPostTimestep(false);
    expect(observed).toEqual([
      {
        timesteps: 42,
        numAtoms: 256,
        memoryUsage: 8192,
        runType: "Dynamics",
        unitStyle: "metal",
      },
    ]);
    expect(store.getState().simulationStatus).toMatchObject({
      runTimesteps: 40,
      runTotalTimesteps: 100,
      remainingTime: 0.75,
      timestepsPerSecond: 80,
      numBonds: 0,
      dimension: 3,
      lastCommand: "run 100",
      walls: [{ which: 1, style: 1, position: 10, cutoff: 2.5 }],
    });
  });

  it("reads actual float32 geometry and preserves unchanged triclinic box references", async () => {
    const { store, stream } = fixture();
    const f32 = new Float32Array(BOX);
    await store.getActions().processing.runPostTimestep(false);
    const { box, origo } = store.getState().simulationStatus;
    expect(box!.elements).toEqual([3, 0, 0, 0.5, 4, 0, f32[2], f32[5], 5]);
    expect(origo!.toArray()).toEqual([1, 2, 3]);
    // A new frame with the same geometry keeps the existing references.
    stream({
      boxMatrix: new Float32Array(BOX),
      origin: new Float32Array(ORIGIN),
    });
    await store.getActions().processing.runPostTimestep(false);
    expect(store.getState().simulationStatus.box).toBe(box);
    expect(store.getState().simulationStatus.origo).toBe(origo);
    const tilted = new Float32Array(BOX);
    tilted[1] = 1.5;
    stream({ boxMatrix: tilted });
    await store.getActions().processing.runPostTimestep(false);
    expect(store.getState().simulationStatus.box).not.toBe(box);
    expect(store.getState().simulationStatus.box!.elements[3]).toBe(1.5);
  });

  it("does not replace the last timing estimates with meaningless idle values", async () => {
    const { store, lammps } = fixture();
    await store.getActions().processing.runPostTimestep(false);
    lammps.getWhichFlag.mockReturnValue(0);
    await store.getActions().processing.runPostTimestep(false);
    expect(store.getState().simulationStatus).toMatchObject({
      runType: "",
      timestepsPerSecond: 80,
      remainingTime: 0.75,
    });
  });
});

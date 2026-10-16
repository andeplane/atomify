import { beforeEach, describe, expect, it, vi } from "vitest";
import { action, createStore } from "easy-peasy";
import { processingModel } from "./processing";
import { simulationStatusModel } from "./simulationstatus";
import type { StoreModel } from "./model";

const { heap } = vi.hoisted(() => ({ heap: new Float32Array(32) }));
vi.mock("../wasm/wasmInstance", () => ({ getWasm: () => ({ HEAPF32: heap }) }));

function fixture() {
  const wallsDelete = vi.fn();
  const lammps = {
    getCellMatrixPointer: () => 0,
    getOrigoPointer: () => 48,
    getUnitStyle: vi.fn(() => "metal"),
    getDimension: () => 3,
    getTimesteps: () => 42,
    getNumAtoms: () => 256,
    getRunTimesteps: () => 40,
    getRunTotalTimesteps: () => 100,
    getLastCommand: () => "run 100",
    getMemoryUsage: () => 8192,
    getWhichFlag: vi.fn(() => 1),
    getTimestepsPerSecond: () => 80,
    getCPURemain: () => 0.75,
    getWalls: () => ({ size: () => 0, delete: wallsDelete }),
  };
  const store = createStore({
    simulationStatus: simulationStatusModel,
    processing: { ...processingModel, postTimestepModifiers: [] },
    simulation: { lammps },
    app: { selectedMenu: "shell" },
    render: { setParticleStylesUpdated: action(() => {}) },
  } as unknown as StoreModel);
  return { store, lammps, wallsDelete };
}

beforeEach(() => {
  heap.fill(0);
  heap.set([3, 0.5, 0.2, 0, 4, 0.7, 0, 0, 5]);
  heap.set([1, 2, 3], 12);
});

describe("post-timestep status publication", () => {
  it("publishes one coherent status frame instead of notifying per field", async () => {
    const { store, wallsDelete } = fixture();
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
    });
    expect(wallsDelete).toHaveBeenCalledOnce();
  });

  it("reads actual float32 geometry and preserves unchanged triclinic box references", async () => {
    const { store } = fixture();
    await store.getActions().processing.runPostTimestep(false);
    const { box, origo } = store.getState().simulationStatus;
    expect(box!.elements).toEqual([3, 0, 0, 0.5, 4, 0, heap[2], heap[5], 5]);
    expect(origo!.toArray()).toEqual([1, 2, 3]);
    await store.getActions().processing.runPostTimestep(false);
    expect(store.getState().simulationStatus.box).toBe(box);
    expect(store.getState().simulationStatus.origo).toBe(origo);
    heap[1] = 1.5;
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

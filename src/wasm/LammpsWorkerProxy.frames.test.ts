import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LammpsWorkerProxy } from "./LammpsWorkerProxy";
import { emptyEngineFrame, type EngineFrame } from "./engineFrame";
import type { WorkerCommand, WorkerEvent } from "./workerMessages";
import { ModifierType } from "../types";
import { GROUP_LABEL_PREFIX } from "../utils/lammpsGroups";

/** Stand-in for the engine Web Worker: records commands, emits events. */
class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((ev: MessageEvent<WorkerEvent>) => void) | null = null;
  readonly posted: WorkerCommand[] = [];

  constructor() {
    FakeWorker.instances.push(this);
  }
  postMessage(command: WorkerCommand) {
    this.posted.push(command);
  }
  addEventListener() {}
  removeEventListener() {}
  emit(data: WorkerEvent) {
    this.onmessage?.({ data } as MessageEvent<WorkerEvent>);
  }
}

const rdfFrame = (step: number, y: number[]): EngineFrame => ({
  ...emptyEngineFrame(),
  step,
  count: 2,
  positions: new Float32Array([0, 0, 0, 1, 1, 1]),
  types: new Int32Array([1, 2]),
  ids: new Int32Array([5, 9]),
  runMode: 1,
  runStepsDone: step,
  runStepsTotal: 100,
  memoryUsage: 4096,
  modifiers: [
    {
      name: "rdf",
      category: "compute",
      type: ModifierType.ComputeRDF,
      style: "rdf",
      isPerAtom: false,
      hasScalar: false,
      clearPerSync: true,
      xLabel: "r",
      yLabel: "g(r)",
      scalar: 0,
      series: [
        {
          name: "g",
          label: "g(r)",
          x: new Float32Array([0.5, 1.5]),
          y: new Float32Array(y),
        },
      ],
    },
  ],
});

let worker: FakeWorker;
let proxy: LammpsWorkerProxy;

beforeEach(() => {
  FakeWorker.instances = [];
  vi.stubGlobal("Worker", FakeWorker);
  proxy = new LammpsWorkerProxy();
  worker = FakeWorker.instances[0];
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LammpsWorkerProxy streamed frames", () => {
  it("starts from an empty frame", () => {
    expect(proxy.latestFrame.count).toBe(0);
    expect(proxy.getNumAtoms()).toBe(0);
    expect(proxy.getComputeNames()).toEqual([]);
  });

  it("keeps the streamed frame as-is (no copy) and backs the status getters with it", () => {
    const frame = rdfFrame(40, [0, 2]);
    const seen: EngineFrame[] = [];
    proxy.setStepListener(() => seen.push(proxy.latestFrame));

    worker.emit({ type: "step", frame });

    expect(proxy.latestFrame).toBe(frame);
    expect(proxy.latestFrame.positions).toBe(frame.positions);
    expect(seen).toEqual([frame]);
    expect(proxy.getTimesteps()).toBe(40);
    expect(proxy.getNumAtoms()).toBe(2);
    expect(proxy.getWhichFlag()).toBe(1);
    expect(proxy.getRunTimesteps()).toBe(40);
    expect(proxy.getRunTotalTimesteps()).toBe(100);
    expect(proxy.getMemoryUsage()).toBe(4096);
  });

  it("serves modifier views that follow the latest frame", () => {
    worker.emit({ type: "step", frame: rdfFrame(1, [0, 2]) });
    expect(proxy.getComputeNames()).toEqual(["rdf"]);
    expect(proxy.getFixNames()).toEqual([]);
    const rdf = proxy.getCompute("rdf");
    expect(rdf.getType()).toBe(ModifierType.ComputeRDF);
    expect(rdf.getClearPerSync()).toBe(true);
    expect(Array.from(rdf.getData1D()[0].y)).toEqual([0, 2]);

    // The same (store-cached) view reads the next step's data.
    worker.emit({ type: "step", frame: rdfFrame(2, [0, 3]) });
    expect(Array.from(rdf.getData1D()[0].y)).toEqual([0, 3]);
    expect(proxy.getCompute("missing").getData1D()).toEqual([]);
  });

  it("forwards engine-FS writes to the worker in order, ahead of the run", () => {
    const bytes = new Uint8Array([1, 2, 3]);
    proxy.mkdir("/proj/runs/run-001");
    proxy.writeFile("/proj/runs/run-001/in.lmp", "run 10\n");
    proxy.writeFile("/proj/runs/run-001/data.bin", bytes);
    proxy.chdir("/proj/runs/run-001");
    void proxy.runFile("/proj/runs/run-001/in.lmp");

    expect(worker.posted).toEqual([
      { type: "mkdir", path: "/proj/runs/run-001" },
      {
        type: "writeFile",
        path: "/proj/runs/run-001/in.lmp",
        content: "run 10\n",
      },
      {
        type: "writeFile",
        path: "/proj/runs/run-001/data.bin",
        content: bytes,
      },
      { type: "chdir", path: "/proj/runs/run-001" },
      { type: "runFile", requestId: 1, path: "/proj/runs/run-001/in.lmp" },
    ]);
  });

  it("streams no per-atom values for group labels (their bitsets are in every frame)", () => {
    proxy.setPerAtomModifier("compute", `${GROUP_LABEL_PREFIX}mobile`);
    proxy.setPerAtomModifier("compute", "ke");
    expect(worker.posted).toEqual([
      { type: "setPerAtomModifier", category: "compute", name: null },
      { type: "setPerAtomModifier", category: "compute", name: "ke" },
    ]);
  });
});

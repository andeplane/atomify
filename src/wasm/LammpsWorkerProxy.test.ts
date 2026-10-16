import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LammpsWorkerProxy } from "./LammpsWorkerProxy";
import { emptyEngineFrame } from "./engineFrame";
import {
  LAMMPS_JS_VERSION,
  WORKER_PROTOCOL_VERSION,
  type WorkerCommand,
  type WorkerEvent,
} from "./workerMessages";

/**
 * Minimal stand-in for the engine Web Worker: records posted commands and
 * lets a test emit events or simulate a crash via the handlers the proxy set.
 */
class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((ev: MessageEvent<WorkerEvent>) => void) | null = null;
  onerror: ((ev: ErrorEvent) => void) | null = null;
  onmessageerror: ((ev: MessageEvent) => void) | null = null;
  readonly posted: WorkerCommand[] = [];
  readonly terminate = vi.fn();
  private readonly listeners = new Set<(ev: MessageEvent) => void>();

  constructor() {
    FakeWorker.instances.push(this);
  }
  postMessage(command: WorkerCommand) {
    this.posted.push(command);
  }
  addEventListener(_type: "message", listener: (ev: MessageEvent) => void) {
    this.listeners.add(listener);
  }
  removeEventListener(_type: "message", listener: (ev: MessageEvent) => void) {
    this.listeners.delete(listener);
  }
  emit(data: WorkerEvent) {
    const ev = { data } as MessageEvent<WorkerEvent>;
    for (const listener of [...this.listeners]) listener(ev);
    this.onmessage?.(ev);
  }
  crash(message: string) {
    this.onerror?.({ message, preventDefault: vi.fn() } as unknown as ErrorEvent);
  }
}

let worker: FakeWorker;
let proxy: LammpsWorkerProxy;

beforeEach(() => {
  FakeWorker.instances = [];
  vi.stubGlobal("Worker", FakeWorker);
  vi.spyOn(console, "error").mockImplementation(() => {});
  proxy = new LammpsWorkerProxy();
  worker = FakeWorker.instances[0];
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("LammpsWorkerProxy worker crash handling", () => {
  it("rejects a pending run, reports the error and stops running", async () => {
    const onError = vi.fn();
    const onCrash = vi.fn();
    proxy.onError(onError);
    proxy.onCrash(onCrash);
    const run = proxy.runFile("/sim/in.lmp");
    expect(proxy.getIsRunning()).toBe(true);

    worker.crash("RuntimeError: Aborted(OOM)");

    await expect(run).rejects.toThrow(
      "The simulation engine crashed: RuntimeError: Aborted(OOM)",
    );
    expect(proxy.getIsRunning()).toBe(false);
    expect(proxy.crashed).toBe(true);
    expect(worker.terminate).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      "The simulation engine crashed: RuntimeError: Aborted(OOM)",
    );
    expect(onCrash).toHaveBeenCalledTimes(1);
  });

  it("rejects later runs immediately without posting to the dead worker", async () => {
    worker.crash("boom");
    const before = worker.posted.length;

    await expect(proxy.runFile("/sim/in.lmp")).rejects.toThrow(
      "The simulation engine crashed: boom",
    );
    proxy.runCommand("run 10");
    proxy.writeFile("/sim/x", "data");
    expect(proxy.start()).toBe(false);
    expect(worker.posted.length).toBe(before);
    expect(proxy.getIsRunning()).toBe(false);
  });

  it("rejects pending and subsequent snapshots", async () => {
    vi.useFakeTimers();
    try {
      const pending = proxy.snapshotWorkdir("/sim");
      worker.crash("boom");
      await expect(pending).rejects.toThrow(
        "The simulation engine crashed: boom",
      );
      await expect(proxy.snapshotWorkdir("/sim")).rejects.toThrow(
        "The simulation engine crashed: boom",
      );
      // The 60s fallback timer was cleared, not left to fire later.
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("treats an undeliverable message as fatal", async () => {
    const run = proxy.runFile("/sim/in.lmp");
    worker.onmessageerror?.({} as MessageEvent);
    await expect(run).rejects.toThrow(
      "The simulation engine crashed: a worker message could not be deserialized",
    );
  });

  it("rejects load() if the worker crashes before it is ready", async () => {
    const load = proxy.load();
    worker.crash("failed to fetch wasm");
    await expect(load).rejects.toThrow(
      "The simulation engine crashed: failed to fetch wasm",
    );
  });

  it("still resolves runs normally when the worker is healthy", async () => {
    const run = proxy.runFile("/sim/in.lmp");
    const command = worker.posted.find((c) => c.type === "runFile");
    expect(command).toBeDefined();
    worker.emit({
      type: "runFinished",
      requestId: (command as { requestId: number }).requestId,
      error: "",
    });
    await expect(run).resolves.toBeUndefined();
    expect(proxy.crashed).toBe(false);
  });
});

const readyEvent = (
  overrides: Partial<Extract<WorkerEvent, { type: "ready" }>> = {},
): WorkerEvent => ({
  type: "ready",
  protocolVersion: WORKER_PROTOCOL_VERSION,
  engineVersion: LAMMPS_JS_VERSION,
  ...overrides,
});

const runFileId = () =>
  (worker.posted.find((c) => c.type === "runFile") as { requestId: number })
    .requestId;

describe("LammpsWorkerProxy protocol handshake", () => {
  it("resolves load() for a worker of this build and records its engine version", async () => {
    const load = proxy.load();
    expect(worker.posted).toEqual([{ type: "load" }]);
    worker.emit(readyEvent());
    await expect(load).resolves.toBeUndefined();
    expect(proxy.engineVersion).toBe(LAMMPS_JS_VERSION);
    expect(proxy.crashed).toBe(false);
  });

  it.each([
    {
      name: "protocol",
      event: { protocolVersion: WORKER_PROTOCOL_VERSION + 1 },
      reported: `protocol ${WORKER_PROTOCOL_VERSION + 1}, lammps.js ${LAMMPS_JS_VERSION}`,
    },
    {
      name: "lammps.js",
      event: { engineVersion: "0.0.1" },
      reported: `protocol ${WORKER_PROTOCOL_VERSION}, lammps.js 0.0.1`,
    },
  ])(
    "treats a $name version mismatch like a crash",
    async ({ event, reported }) => {
      const onError = vi.fn();
      const onCrash = vi.fn();
      proxy.onError(onError);
      proxy.onCrash(onCrash);
      const load = proxy.load();
      worker.emit(readyEvent(event));

      const message = `The simulation engine does not match this version of Atomify (engine: ${reported}; expected: protocol ${WORKER_PROTOCOL_VERSION}, lammps.js ${LAMMPS_JS_VERSION})`;
      await expect(load).rejects.toThrow(message);
      expect(onError).toHaveBeenCalledWith(message);
      expect(onCrash).toHaveBeenCalledWith(message);
      expect(proxy.crashed).toBe(true);
      expect(proxy.engineVersion).toBeUndefined();
      expect(worker.terminate).toHaveBeenCalled();
      await expect(proxy.runFile("/sim/in.lmp")).rejects.toThrow(message);
    },
  );

  it("rejects a worker from before the handshake (no versions in ready)", async () => {
    const load = proxy.load();
    worker.emit({ type: "ready" } as WorkerEvent);
    await expect(load).rejects.toThrow(
      "engine: protocol unknown, lammps.js unknown",
    );
  });

  it("rejects load() with the worker's message when loading fails", async () => {
    const load = proxy.load();
    worker.emit({ type: "error", message: "failed to fetch wasm" });
    await expect(load).rejects.toThrow("failed to fetch wasm");
    expect(proxy.crashed).toBe(false);
  });
});

describe("LammpsWorkerProxy run control", () => {
  const runControl = () =>
    worker.posted.filter((c) =>
      ["cancel", "pause", "setSyncFrequency"].includes(c.type),
    );

  it("forwards pause/resume to the worker and owns the paused state", () => {
    void proxy.runFile("/sim/in.lmp");
    expect(proxy.isPaused()).toBe(false);

    proxy.setPaused(true);
    proxy.setPaused(true); // no change, nothing sent
    expect(proxy.isPaused()).toBe(true);
    proxy.setPaused(false);

    expect(runControl()).toEqual([
      { type: "pause", paused: true },
      { type: "pause", paused: false },
    ]);
    expect(proxy.isPaused()).toBe(false);
  });

  it("cancels the active run immediately and releases a pause", () => {
    void proxy.runFile("/sim/in.lmp");
    proxy.setPaused(true);
    proxy.cancel();
    expect(proxy.isPaused()).toBe(false);
    expect(runControl()).toEqual([
      { type: "pause", paused: true },
      { type: "cancel" },
    ]);
  });

  it("ignores a cancel when nothing is running, so it can't stop the next run", () => {
    proxy.cancel();
    void proxy.runFile("/sim/in.lmp");
    worker.emit({ type: "runFinished", requestId: runFileId(), error: "" });
    proxy.stop();
    expect(runControl()).toEqual([]);
  });

  it("starts every run unpaused and ends it unpaused", () => {
    proxy.setPaused(true);
    void proxy.runFile("/sim/in.lmp");
    expect(proxy.isPaused()).toBe(false);

    proxy.setPaused(true);
    worker.emit({ type: "runFinished", requestId: runFileId(), error: "" });
    expect(proxy.isPaused()).toBe(false);
  });

  it("forwards sync-frequency changes once and ignores invalid values", () => {
    expect(proxy.getSyncFrequency()).toBe(1);
    proxy.setSyncFrequency(1); // the worker's default already
    proxy.setSyncFrequency(10);
    proxy.setSyncFrequency(10);
    proxy.setSyncFrequency(0);
    proxy.setSyncFrequency(-5);
    expect(proxy.getSyncFrequency()).toBe(10);
    expect(runControl()).toEqual([{ type: "setSyncFrequency", every: 10 }]);
  });

  it("sends no run control to a crashed worker", () => {
    void proxy.runFile("/sim/in.lmp").catch(() => {});
    worker.crash("boom");
    const before = worker.posted.length;
    proxy.setPaused(true);
    proxy.cancel();
    proxy.setSyncFrequency(5);
    expect(worker.posted.length).toBe(before);
  });
});

describe("LammpsWorkerProxy frame acknowledgements", () => {
  const acks = () => worker.posted.filter((c) => c.type === "frameAck");

  it("acks each frame after the step listener has consumed it", () => {
    const acksSeenByListener: number[] = [];
    proxy.setStepListener(() => acksSeenByListener.push(acks().length));
    worker.emit({ type: "step", frame: { ...emptyEngineFrame(), step: 1 } });
    worker.emit({ type: "step", frame: { ...emptyEngineFrame(), step: 2 } });
    // Each frame's listener ran before that frame's ack was sent.
    expect(acksSeenByListener).toEqual([0, 1]);
    expect(acks()).toHaveLength(2);
    expect(proxy.getTimesteps()).toBe(2);
  });

  it("acks without a step listener (viewport hidden or not mounted)", () => {
    worker.emit({ type: "step", frame: emptyEngineFrame() });
    expect(acks()).toHaveLength(1);
  });

  it("still acks when the step listener throws, so the stream can't stall", () => {
    proxy.setStepListener(() => {
      throw new Error("render failed");
    });
    worker.emit({ type: "step", frame: emptyEngineFrame() });
    expect(acks()).toHaveLength(1);
  });
});

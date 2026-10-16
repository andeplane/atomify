import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LammpsWorkerProxy } from "./LammpsWorkerProxy";
import type { WorkerCommand, WorkerEvent } from "./workerMessages";

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
    proxy.getModule().FS.writeFile("/sim/x", "data");
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

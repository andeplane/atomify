import { afterEach, describe, expect, it, vi } from "vitest";
import { LammpsWorkerProxy } from "./LammpsWorkerProxy";

class FakeWorker extends EventTarget {
  postMessage = vi.fn();
  onmessage = null;
}

afterEach(() => vi.unstubAllGlobals());

describe("worker startup", () => {
  function setup() {
    const worker = new FakeWorker();
    vi.stubGlobal("Worker", class { constructor() { return worker; } });
    return { worker, proxy: new LammpsWorkerProxy() };
  }
  it("resolves when the engine reports ready", async () => {
    const { worker, proxy } = setup();
    const ready = proxy.load();
    worker.dispatchEvent(new MessageEvent("message", { data: { type: "ready" } }));
    await expect(ready).resolves.toBeUndefined();
  });
  it("rejects on native worker errors instead of waiting forever", async () => {
    const { worker, proxy } = setup();
    const ready = proxy.load();
    worker.dispatchEvent(new ErrorEvent("error", { message: "Cannot clone shared memory" }));
    await expect(ready).rejects.toThrow("Cannot clone shared memory");
  });
  it("rejects on message deserialization failure", async () => {
    const { worker, proxy } = setup();
    const ready = proxy.load();
    worker.dispatchEvent(new MessageEvent("messageerror"));
    await expect(ready).rejects.toThrow("could not receive a message");
  });
  it("rejects on explicit engine startup failures", async () => {
    const { worker, proxy } = setup();
    const ready = proxy.load();
    worker.dispatchEvent(new MessageEvent("message", { data: { type: "error", message: "WASM failed" } }));
    await expect(ready).rejects.toThrow("WASM failed");
  });
});

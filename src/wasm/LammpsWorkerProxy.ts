import { LammpsWeb, LMPModifier, Wall } from "../types";
import { AtomifyWasmModule } from "./types";
import { getCancel, setCancel } from "./wasmInstance";
import type {
  WorkerCommand,
  WorkerEvent,
  WorkerStepData,
} from "./workerMessages";

/**
 * Main-thread facade over the LAMMPS Web Worker.
 *
 * The worker owns the real (KOKKOS/pthreads) wasm module — it cannot run on the
 * main thread. This proxy never touches wasm: instead it keeps a plain-JS
 * "bridge heap" (regular ArrayBuffers) that it fills from the particle/box
 * snapshots streamed by the worker each step, and exposes:
 *
 *  - the {@link LammpsWeb} interface (so it can be the store's `lammps`), with
 *    pointer getters that index into the bridge heap, and
 *  - a wasm-module-shaped bridge ({@link getModule}) whose HEAPF32/HEAP32 views
 *    are that same bridge heap and whose FS forwards writes to the worker.
 *
 * Together these let the existing modifier/render pipeline and store thunks run
 * unchanged, reading the streamed data through the familiar heap-pointer path.
 */

const CANCEL_MESSAGE = "Atomify::canceled";

/** Wrap a plain array in the CPPArray shape Atomify's embind-era code reads. */
const cppArray = <T>(items: T[]) => ({
  get: (index: number): T => items[index],
  size: () => items.length,
  delete: () => {},
});

interface RunResolver {
  resolve: () => void;
}

export class LammpsWorkerProxy implements LammpsWeb {
  private readonly worker: Worker;

  // --- Bridge heap: plain ArrayBuffers the modifiers read via pointer math ---
  private capacity = 0;
  private heapBuffer = new ArrayBuffer(0);
  private heapF32 = new Float32Array(0);
  private heap32 = new Int32Array(0);
  private posPtr = 0;
  private typePtr = 0;
  private idPtr = 0;
  private boxPtr = 0;
  private origPtr = 0;

  // --- Cached state, refreshed from worker step / runFinished events ---
  private cCount = 0;
  private cStep = 0;
  private cDimension = 3;
  private cRunMode = 0;
  private cRunStepsDone = 0;
  private cRunStepsTotal = 0;
  private cRunning = false;
  private cError = "";
  private syncFrequency = 1;

  private nextRequestId = 1;
  private readonly pendingRuns = new Map<number, RunResolver>();

  private readyPromise?: Promise<void>;
  private stepListener?: () => void;
  private printListener?: (text: string) => void;
  private errorListener?: (message: string) => void;

  private readonly moduleBridge: AtomifyWasmModule;

  constructor() {
    this.worker = new Worker(
      new URL("./lammps.worker.ts", import.meta.url),
      { type: "module" },
    );
    this.worker.onmessage = (ev: MessageEvent<WorkerEvent>) =>
      this.handleEvent(ev.data);
    this.allocate(4096);
    this.moduleBridge = this.buildModuleBridge();
  }

  // --- Worker plumbing ---------------------------------------------------

  private send(command: WorkerCommand, transfer?: Transferable[]) {
    this.worker.postMessage(command, transfer ?? []);
  }

  private handleEvent(event: WorkerEvent) {
    switch (event.type) {
      case "ready":
        break;
      case "step":
        this.ingestStep(event);
        // A stop press sets the main-thread cancel flag; forward it to the
        // worker's adapter, which owns the run's abort logic.
        if (getCancel()) {
          setCancel(false);
          this.send({ type: "cancel" });
        }
        try {
          this.stepListener?.();
        } catch (error) {
          console.error("Step listener failed:", error);
        }
        break;
      case "printed":
        this.printListener?.(event.text);
        break;
      case "error":
        this.cError = event.message;
        this.errorListener?.(event.message);
        console.error("LAMMPS worker error:", event.message);
        break;
      case "runFinished": {
        this.cRunning = false;
        this.cError = event.error;
        const pending = this.pendingRuns.get(event.requestId);
        if (pending) {
          this.pendingRuns.delete(event.requestId);
          pending.resolve();
        }
        break;
      }
    }
  }

  // --- Bridge heap management -------------------------------------------

  private allocate(capacity: number) {
    this.capacity = capacity;
    const posBytes = 3 * capacity * 4;
    const typeBytes = capacity * 4;
    const idBytes = capacity * 4;
    const total = posBytes + typeBytes + idBytes + 9 * 4 + 3 * 4;
    this.heapBuffer = new ArrayBuffer(total);
    this.heapF32 = new Float32Array(this.heapBuffer);
    this.heap32 = new Int32Array(this.heapBuffer);
    this.posPtr = 0;
    this.typePtr = posBytes;
    this.idPtr = posBytes + typeBytes;
    this.boxPtr = posBytes + typeBytes + idBytes;
    this.origPtr = this.boxPtr + 9 * 4;
  }

  private ingestStep(step: WorkerStepData) {
    if (step.count > this.capacity) {
      this.allocate(Math.max(step.count, 2 * this.capacity));
    }
    this.heapF32.set(new Float32Array(step.positions), this.posPtr / 4);
    this.heap32.set(new Int32Array(step.types), this.typePtr / 4);
    this.heap32.set(new Int32Array(step.ids), this.idPtr / 4);
    this.heapF32.set(new Float32Array(step.boxMatrix), this.boxPtr / 4);
    this.heapF32.set(new Float32Array(step.origin), this.origPtr / 4);

    this.cCount = step.count;
    this.cStep = step.step;
    this.cDimension = step.dimension;
    this.cRunMode = step.runMode;
    this.cRunStepsDone = step.runStepsDone;
    this.cRunStepsTotal = step.runStepsTotal;
  }

  private buildModuleBridge(): AtomifyWasmModule {
    const files = new Map<string, string | Uint8Array>();
    const dirs = new Set<string>(["/"]);
    let cwd = "/";
    const proxy = this;

    const basename = (path: string) => {
      const trimmed = path.replace(/\/+$/, "");
      return trimmed.slice(trimmed.lastIndexOf("/") + 1);
    };

    const fs = {
      writeFile(path: string, data: string | Uint8Array) {
        files.set(path, data);
        proxy.send({ type: "writeFile", path, content: data });
      },
      mkdir(path: string) {
        dirs.add(path.replace(/\/+$/, ""));
        proxy.send({ type: "mkdir", path });
      },
      rmdir(path: string) {
        dirs.delete(path.replace(/\/+$/, ""));
      },
      chdir(path: string) {
        cwd = path;
        proxy.send({ type: "chdir", path });
      },
      cwd: () => cwd,
      unlink(path: string) {
        files.delete(path);
      },
      readFile(path: string, _opts?: { encoding: "utf8" }) {
        const data = files.get(path);
        if (data === undefined) {
          throw new Error(`File not found: ${path}`);
        }
        return typeof data === "string" ? data : new TextDecoder().decode(data);
      },
      readdir(path: string) {
        const prefix = path.replace(/\/+$/, "") + "/";
        const entries = new Set<string>([".", ".."]);
        for (const key of [...files.keys(), ...dirs]) {
          if (key.startsWith(prefix)) {
            const rest = key.slice(prefix.length);
            if (rest && !rest.includes("/")) entries.add(rest);
          }
        }
        return [...entries];
      },
      analyzePath(path: string) {
        const clean = path.replace(/\/+$/, "") || "/";
        return {
          exists: files.has(path) || dirs.has(clean),
          isRoot: clean === "/",
          path,
          name: basename(path),
          error: 0,
        };
      },
      stat: () => ({ size: 0, mode: 0, mtime: new Date() }),
      isDir: () => false,
      isFile: () => true,
    };

    const bridge = {
      get HEAPF32() {
        return proxy.heapF32;
      },
      get HEAP32() {
        return proxy.heap32;
      },
      HEAPF64: new Float64Array(0),
      HEAP64: new BigInt64Array(0),
      FS: fs,
      LAMMPSWeb: class {
        constructor() {
          throw new Error("LAMMPSWeb runs only inside the worker");
        }
      },
      ScalarType: { Float32: 0, Float64: 1, Int32: 2, Int64: 3 },
    };
    return bridge as unknown as AtomifyWasmModule;
  }

  // --- Public wiring -----------------------------------------------------

  /** The wasm-module-shaped bridge for `setWasm()` / `getWasm()`. */
  getModule(): AtomifyWasmModule {
    return this.moduleBridge;
  }

  /** Load the module in the worker and start Kokkos. Idempotent. */
  load(): Promise<void> {
    if (!this.readyPromise) {
      this.readyPromise = new Promise<void>((resolve) => {
        const onMessage = (ev: MessageEvent<WorkerEvent>) => {
          if (ev.data.type === "ready") {
            this.worker.removeEventListener("message", onMessage);
            resolve();
          }
        };
        this.worker.addEventListener("message", onMessage);
        this.send({ type: "load" });
      });
    }
    return this.readyPromise;
  }

  onPrint(listener: (text: string) => void) {
    this.printListener = listener;
  }

  onError(listener: (message: string) => void) {
    this.errorListener = listener;
  }

  /**
   * Runs synchronously once per streamed timestep, after the bridge heap has
   * been refreshed — the main-thread analogue of the adapter's step listener.
   */
  setStepListener(listener: (() => void) | undefined) {
    this.stepListener = listener;
  }

  // --- LammpsWeb: lifecycle ---------------------------------------------

  start(): boolean {
    this.cRunning = true;
    this.cError = "";
    setCancel(false);
    this.send({ type: "start" });
    return true;
  }

  stop(): boolean {
    this.send({ type: "cancel" });
    return true;
  }

  cancel() {
    this.send({ type: "cancel" });
  }

  step() {
    // Stepping is driven by runFile inside the worker; unused here.
  }

  runCommand(command: string) {
    this.send({ type: "runCommand", command });
  }

  runFile(path: string): Promise<void> {
    const requestId = this.nextRequestId++;
    this.cRunning = true;
    this.cError = "";
    return new Promise<void>((resolve) => {
      this.pendingRuns.set(requestId, { resolve });
      this.send({ type: "runFile", requestId, path });
    });
  }

  setSyncFrequency(every: number) {
    if (every <= 0) return;
    this.syncFrequency = every;
    this.send({ type: "setSyncFrequency", every });
  }

  // --- LammpsWeb: status -------------------------------------------------

  getIsRunning() {
    return this.cRunning;
  }
  getTimesteps() {
    return this.cStep;
  }
  getNumAtoms() {
    return this.cCount;
  }
  getErrorMessage() {
    return this.cError;
  }
  getExceptionMessage() {
    return this.cError || "Unknown LAMMPS error";
  }
  getLastCommand() {
    return "";
  }
  getWhichFlag() {
    return this.cRunMode;
  }
  getRunTimesteps() {
    return this.cRunStepsDone;
  }
  getRunTotalTimesteps() {
    return this.cRunStepsTotal;
  }
  getTimestepsPerSecond() {
    return 0;
  }
  getCPURemain() {
    return 0;
  }
  getMemoryUsage() {
    return 0;
  }

  // --- LammpsWeb: particles (via the bridge heap) -----------------------

  computeParticles() {
    return this.cCount;
  }
  getPositionsPointer() {
    return this.posPtr;
  }
  getTypePointer() {
    return this.typePtr;
  }
  getIdPointer() {
    return this.idPtr;
  }
  getCellMatrixPointer() {
    return this.boxPtr;
  }
  getOrigoPointer() {
    return this.origPtr;
  }
  getDimension() {
    return this.cDimension;
  }
  getWalls() {
    return cppArray<Wall>([]);
  }

  // --- LammpsWeb: bonds (slice 1: not streamed yet) ---------------------

  computeBonds() {
    return 0;
  }
  getBondsPosition1Pointer() {
    return 0;
  }
  getBondsPosition2Pointer() {
    return 0;
  }
  setBondDistance(type1: number, type2: number, distance: number) {
    this.send({ type: "setBondDistance", type1, type2, distance });
  }
  clearBondDistances() {
    this.send({ type: "clearBondDistances" });
  }
  setBuildNeighborlist(build: boolean) {
    this.send({ type: "setBuildNeighborlist", build });
  }

  // --- LammpsWeb: computes / fixes / variables (later slice) ------------

  syncComputes() {}
  syncFixes() {}
  syncVariables() {}
  getComputeNames() {
    return cppArray<string>([]);
  }
  getFixNames() {
    return cppArray<string>([]);
  }
  getVariableNames() {
    return cppArray<string>([]);
  }
  getCompute(): LMPModifier {
    throw new Error("Computes are not streamed yet (later slice)");
  }
  getFix(): LMPModifier {
    throw new Error("Fixes are not streamed yet (later slice)");
  }
  getVariable(): LMPModifier {
    throw new Error("Variables are not streamed yet (later slice)");
  }
}

export { CANCEL_MESSAGE };

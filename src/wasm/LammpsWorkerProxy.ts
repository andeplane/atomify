import { LammpsWeb, LMPModifier, LMPData1D, ModifierType, Wall } from "../types";
import type { ModifierCategory } from "lammps.js";
import { AtomifyWasmModule } from "./types";
import { getCancel, setCancel } from "./wasmInstance";
import type {
  WorkerCommand,
  WorkerEvent,
  WorkerStepData,
  WorkerModifierData,
} from "./workerMessages";

/** Byte offsets of one streamed series' x/y arrays in the bridge heap. */
interface SeriesPointers {
  name: string;
  label: string;
  xPtr: number;
  yPtr: number;
  numPoints: number;
}

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
  private bondCapacity = 0;
  private heapBuffer = new ArrayBuffer(0);
  private heapF32 = new Float32Array(0);
  private heap32 = new Int32Array(0);
  private seriesCapacity = 0;
  private posPtr = 0;
  private typePtr = 0;
  private idPtr = 0;
  private boxPtr = 0;
  private origPtr = 0;
  private bondFirstPtr = 0;
  private bondSecondPtr = 0;
  private seriesBasePtr = 0;

  // Per-atom float64 data for the active coloring compute lives in its own
  // buffer (the module bridge's HEAPF64); colormodifier reads it via ptr/8.
  private heapF64Buffer = new ArrayBuffer(0);
  private heapF64 = new Float64Array(0);
  private perAtomCount = 0;

  // Latest streamed compute/fix/variable snapshots + where each modifier's
  // series data landed in the bridge heap this step.
  private cModifiers: WorkerModifierData[] = [];
  private seriesPointers = new Map<string, SeriesPointers[]>();

  // --- Cached state, refreshed from worker step / runFinished events ---
  private cCount = 0;
  private cBondCount = 0;
  private cStep = 0;
  private cDimension = 3;
  private cRunMode = 0;
  private cRunStepsDone = 0;
  private cRunStepsTotal = 0;
  private cRunning = false;
  private cError = "";
  private cMemoryUsage = 0;
  private cTimestepsPerSecond = 0;
  private cCPURemain = 0;
  private cWalls: Wall[] = [];
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
    this.allocate(4096, 4096, 4096);
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

  private allocate(
    capacity: number,
    bondCapacity: number,
    seriesCapacity: number,
  ) {
    this.capacity = capacity;
    this.bondCapacity = bondCapacity;
    this.seriesCapacity = seriesCapacity;
    const posBytes = 3 * capacity * 4;
    const typeBytes = capacity * 4;
    const idBytes = capacity * 4;
    const bondBytes = 3 * bondCapacity * 4;
    const seriesBytes = seriesCapacity * 4;
    const total =
      posBytes +
      typeBytes +
      idBytes +
      9 * 4 +
      3 * 4 +
      2 * bondBytes +
      seriesBytes;
    this.heapBuffer = new ArrayBuffer(total);
    this.heapF32 = new Float32Array(this.heapBuffer);
    this.heap32 = new Int32Array(this.heapBuffer);
    this.posPtr = 0;
    this.typePtr = posBytes;
    this.idPtr = posBytes + typeBytes;
    this.boxPtr = posBytes + typeBytes + idBytes;
    this.origPtr = this.boxPtr + 9 * 4;
    this.bondFirstPtr = this.origPtr + 3 * 4;
    this.bondSecondPtr = this.bondFirstPtr + bondBytes;
    this.seriesBasePtr = this.bondSecondPtr + bondBytes;
  }

  private ingestStep(step: WorkerStepData) {
    // Total float32 slots needed for all modifiers' series (x + y each).
    let seriesFloats = 0;
    for (const modifier of step.modifiers) {
      for (const series of modifier.series) {
        seriesFloats += series.x.length + series.y.length;
      }
    }
    if (
      step.count > this.capacity ||
      step.bondCount > this.bondCapacity ||
      seriesFloats > this.seriesCapacity
    ) {
      // Grow with headroom (double) so steadily growing counts/series (e.g.
      // deposit examples, accumulating plots) don't reallocate every step.
      const newCapacity =
        step.count > this.capacity
          ? Math.max(step.count, 2 * this.capacity)
          : this.capacity;
      const newBondCapacity =
        step.bondCount > this.bondCapacity
          ? Math.max(step.bondCount, 2 * this.bondCapacity)
          : this.bondCapacity;
      const newSeriesCapacity =
        seriesFloats > this.seriesCapacity
          ? Math.max(seriesFloats, 2 * this.seriesCapacity)
          : this.seriesCapacity;
      this.allocate(newCapacity, newBondCapacity, newSeriesCapacity);
    }
    this.heapF32.set(new Float32Array(step.positions), this.posPtr / 4);
    this.heap32.set(new Int32Array(step.types), this.typePtr / 4);
    this.heap32.set(new Int32Array(step.ids), this.idPtr / 4);
    this.heapF32.set(new Float32Array(step.boxMatrix), this.boxPtr / 4);
    this.heapF32.set(new Float32Array(step.origin), this.origPtr / 4);
    if (step.bondCount > 0) {
      this.heapF32.set(new Float32Array(step.bondFirst), this.bondFirstPtr / 4);
      this.heapF32.set(
        new Float32Array(step.bondSecond),
        this.bondSecondPtr / 4,
      );
    }
    this.ingestModifiers(step);

    this.cCount = step.count;
    this.cBondCount = step.bondCount;
    this.cStep = step.step;
    this.cDimension = step.dimension;
    this.cRunMode = step.runMode;
    this.cRunStepsDone = step.runStepsDone;
    this.cRunStepsTotal = step.runStepsTotal;
    this.cMemoryUsage = step.memoryUsage;
    this.cTimestepsPerSecond = step.timestepsPerSecond;
    this.cCPURemain = step.cpuRemain;
    this.cWalls = step.walls;
  }

  /**
   * Lay each streamed modifier's 1D series into the bridge heap's series
   * region (so syncModifierEntry can read them through HEAPF32 pointers) and
   * copy the active coloring compute's per-atom values into the HEAPF64
   * bridge. Runs inside ingestStep, after any reallocation.
   */
  private ingestModifiers(step: WorkerStepData) {
    this.cModifiers = step.modifiers;
    this.seriesPointers.clear();
    let offset = this.seriesBasePtr / 4; // float index into heapF32

    for (const modifier of step.modifiers) {
      const pointers: SeriesPointers[] = [];
      for (const series of modifier.series) {
        const xPtr = offset * 4;
        this.heapF32.set(series.x, offset);
        offset += series.x.length;
        const yPtr = offset * 4;
        this.heapF32.set(series.y, offset);
        offset += series.y.length;
        pointers.push({
          name: series.name,
          label: series.label,
          xPtr,
          yPtr,
          numPoints: series.x.length,
        });
      }
      this.seriesPointers.set(`${modifier.category}:${modifier.name}`, pointers);
    }

    // Per-atom float64 values for the active coloring compute.
    if (step.perAtom) {
      const values = new Float64Array(step.perAtom.values);
      if (values.length > this.heapF64.length) {
        this.heapF64Buffer = new ArrayBuffer(values.length * 8);
        this.heapF64 = new Float64Array(this.heapF64Buffer);
      }
      this.heapF64.set(values);
      this.perAtomCount = values.length;
    } else {
      this.perAtomCount = 0;
    }
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
      get HEAPF64() {
        return proxy.heapF64;
      },
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

  /** Load the module in the worker and start LAMMPS. Idempotent. */
  load(): Promise<void> {
    if (!this.readyPromise) {
      this.readyPromise = new Promise<void>((resolve, reject) => {
        const onMessage = (ev: MessageEvent<WorkerEvent>) => {
          if (ev.data.type === "ready") {
            this.worker.removeEventListener("message", onMessage);
            resolve();
          } else if (ev.data.type === "error") {
            // A failure during load() posts `error` instead of `ready`; reject
            // so the caller can show it, rather than hanging forever at
            // "Downloading LAMMPS…".
            this.worker.removeEventListener("message", onMessage);
            reject(new Error(ev.data.message));
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

  /**
   * Forward the paused state to the worker, whose LammpsAdapter owns the
   * between-step wait loop. Setting the main thread's paused flag alone has no
   * effect because the adapter runs in the worker with its own flag.
   */
  setPaused(paused: boolean) {
    this.send({ type: "pause", paused });
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
    if (every <= 0 || every === this.syncFrequency) return;
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
    return this.cTimestepsPerSecond;
  }
  getCPURemain() {
    return this.cCPURemain;
  }
  getMemoryUsage() {
    return this.cMemoryUsage;
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
    return cppArray<Wall>(this.cWalls);
  }

  // --- LammpsWeb: bonds (streamed from the worker each step) ------------

  computeBonds() {
    return this.cBondCount;
  }
  getBondsPosition1Pointer() {
    return this.bondFirstPtr;
  }
  getBondsPosition2Pointer() {
    return this.bondSecondPtr;
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

  // --- LammpsWeb: computes / fixes / variables (streamed snapshots) ------

  // Data is already streamed each step, so the sync* calls are no-ops.
  syncComputes() {}
  syncFixes() {}
  syncVariables() {}

  private modifierNames(category: ModifierCategory) {
    return cppArray(
      this.cModifiers
        .filter((modifier) => modifier.category === category)
        .map((modifier) => modifier.name),
    );
  }

  getComputeNames() {
    return this.modifierNames("compute");
  }
  getFixNames() {
    return this.modifierNames("fix");
  }
  getVariableNames() {
    return this.modifierNames("variable");
  }

  /** Latest streamed snapshot for a modifier (read live so persisted
   *  LMPModifier objects always reflect the current step). */
  private modifierData(
    category: ModifierCategory,
    name: string,
  ): WorkerModifierData | undefined {
    return this.cModifiers.find(
      (modifier) => modifier.category === category && modifier.name === name,
    );
  }

  /**
   * Build an LMPModifier-shaped view backed by the streamed snapshot. It reads
   * the proxy's live data by category+name every call, so the same object can
   * be cached across cycles by the store and still reflect the latest step.
   */
  private makeModifier(category: ModifierCategory, name: string): LMPModifier {
    const proxy = this;
    const data = () => proxy.modifierData(category, name);
    const series = () => proxy.seriesPointers.get(`${category}:${name}`) ?? [];
    return {
      getName: () => name,
      getType: () => data()?.type ?? ModifierType.ComputeOther,
      getIsPerAtom: () => data()?.isPerAtom ?? false,
      hasScalarData: () => data()?.hasScalar ?? false,
      getClearPerSync: () => data()?.clearPerSync ?? false,
      getScalarValue: () => data()?.scalar ?? 0,
      getXLabel: () => data()?.xLabel ?? "Time",
      getYLabel: () => data()?.yLabel ?? "Value",
      // Data is refreshed by the streamed step, so execute/sync are no-ops.
      execute: () => true,
      sync: () => {},
      getData1DNames: () => cppArray(series().map((s) => s.name)),
      getData1D: () =>
        cppArray<LMPData1D>(
          series().map((s) => ({
            getLabel: () => s.label,
            getXValuesPointer: () => s.xPtr,
            getYValuesPointer: () => s.yPtr,
            getNumPoints: () => s.numPoints,
            delete: () => {},
          })),
        ),
      // Per-atom values for the active coloring compute are streamed into the
      // HEAPF64 bridge starting at offset 0 (see ingestModifiers).
      getPerAtomData: () => 0,
      delete: () => {},
    };
  }

  getCompute(name: string): LMPModifier {
    return this.makeModifier("compute", name);
  }
  getFix(name: string): LMPModifier {
    return this.makeModifier("fix", name);
  }
  getVariable(name: string): LMPModifier {
    return this.makeModifier("variable", name);
  }

  /** Tell the worker which per-atom compute to stream values for (coloring). */
  setPerAtomModifier(category: ModifierCategory, name: string | null) {
    this.send({ type: "setPerAtomModifier", category, name });
  }
}

export { CANCEL_MESSAGE };

import { GROUP_LABEL_PREFIX } from "../utils/lammpsGroups";
import { LammpsWeb, LMPModifier, ModifierType } from "../types";
import type { ModifierCategory } from "lammps.js";
import { getCancel, setCancel } from "./wasmInstance";
import { emptyEngineFrame, type EngineFrame } from "./engineFrame";
import type { WorkerCommand, WorkerEvent, WorkdirFile } from "./workerMessages";

/** One file from a workdir snapshot, as delivered to callers. */
export interface WorkdirSnapshotFile {
  /** Path relative to the requested dir. */
  path: string;
  bytes: Uint8Array;
}

export interface WorkdirSnapshot {
  files: WorkdirSnapshotFile[];
  /** Files present but over the requested maxBytes. */
  skipped: { path: string; size: number }[];
}

/**
 * Main-thread facade over the LAMMPS Web Worker.
 *
 * The worker owns the real (KOKKOS/pthreads) wasm module — it cannot run on the
 * main thread. This proxy never touches wasm: it keeps the latest
 * {@link EngineFrame} the worker streamed (typed arrays whose buffers were
 * transferred, so they are read in place) and exposes it through the
 * {@link LammpsWeb} interface the store holds as `lammps`: `latestFrame` for
 * the modifier/render pipeline, status getters backed by that frame, and
 * explicit commands (run control, worker-FS writes) forwarded to the worker.
 */

const CANCEL_MESSAGE = "Atomify::canceled";

interface RunResolver {
  resolve: () => void;
  reject: (error: Error) => void;
}

interface SnapshotResolver {
  resolve: (snapshot: WorkdirSnapshot) => void;
  reject: (error: Error) => void;
}

export class LammpsWorkerProxy implements LammpsWeb {
  private readonly worker: Worker;

  // Latest streamed timestep, replaced wholesale by every `step` event. Holds
  // the previous run's last frame until the next run streams one.
  private frame: EngineFrame = emptyEngineFrame();

  // --- Run state, refreshed from worker runFinished / error events ---
  private cRunning = false;
  private cError = "";
  private syncFrequency = 1;

  private nextRequestId = 1;
  private readonly pendingRuns = new Map<number, RunResolver>();
  private readonly pendingSnapshots = new Map<number, SnapshotResolver>();

  // Set once the worker has crashed (uncaught error / wasm abort / OOM, or an
  // undeliverable message). The worker cannot be recovered in place, so every
  // later call fails fast instead of waiting on a reply that will never come.
  private crashError?: Error;
  private rejectLoad?: (error: Error) => void;

  private readyPromise?: Promise<void>;
  private stepListener?: () => void;
  private printListener?: (text: string) => void;
  private errorListener?: (message: string) => void;
  private crashListener?: (message: string) => void;

  constructor() {
    this.worker = new Worker(new URL("./lammps.worker.ts", import.meta.url), {
      type: "module",
    });
    this.worker.onmessage = (ev: MessageEvent<WorkerEvent>) =>
      this.handleEvent(ev.data);
    // Without these, a crashed worker leaves runFile/snapshotWorkdir promises
    // pending forever and the UI stuck on "running".
    this.worker.onerror = (ev: ErrorEvent) => {
      ev.preventDefault();
      this.handleCrash(ev.message || "unknown worker error");
    };
    this.worker.onmessageerror = () =>
      this.handleCrash("a worker message could not be deserialized");
  }

  // --- Worker plumbing ---------------------------------------------------

  private send(command: WorkerCommand, transfer?: Transferable[]) {
    // A dead worker can't answer; dropping fire-and-forget commands is safe,
    // and request/reply callers check crashError before getting here.
    if (this.crashError) return;
    this.worker.postMessage(command, transfer ?? []);
  }

  /**
   * The worker died: fail everything waiting on it, surface the message
   * through the usual onError path (console output), and notify the crash
   * listener so the app can tell the user to reload.
   */
  private handleCrash(detail: string) {
    if (this.crashError) return;
    const error = new Error(`The simulation engine crashed: ${detail}`);
    this.crashError = error;
    this.cRunning = false;
    this.cError = error.message;
    console.error("LAMMPS worker crashed:", detail);
    this.rejectLoad?.(error);
    this.rejectLoad = undefined;
    const runs = [...this.pendingRuns.values()];
    const snapshots = [...this.pendingSnapshots.values()];
    this.pendingRuns.clear();
    this.pendingSnapshots.clear();
    for (const run of runs) run.reject(error);
    for (const snapshot of snapshots) snapshot.reject(error);
    this.worker.terminate();
    this.errorListener?.(error.message);
    this.crashListener?.(error.message);
  }

  /** True once the worker has crashed; the proxy must be replaced (reload). */
  get crashed(): boolean {
    return this.crashError !== undefined;
  }

  private handleEvent(event: WorkerEvent) {
    switch (event.type) {
      case "ready":
        break;
      case "step":
        this.frame = event.frame;
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
      case "workdirSnapshot": {
        const pending = this.pendingSnapshots.get(event.requestId);
        if (pending) {
          this.pendingSnapshots.delete(event.requestId);
          pending.resolve({
            files: event.files.map((file: WorkdirFile) => ({
              path: file.path,
              bytes: new Uint8Array(file.bytes),
            })),
            skipped: event.skipped,
          });
        }
        break;
      }
    }
  }

  // --- Public wiring -----------------------------------------------------

  /** Load the module in the worker and start LAMMPS. Idempotent. */
  load(): Promise<void> {
    if (!this.readyPromise) {
      this.readyPromise = new Promise<void>((resolve, reject) => {
        if (this.crashError) {
          reject(this.crashError);
          return;
        }
        this.rejectLoad = reject;
        const onMessage = (ev: MessageEvent<WorkerEvent>) => {
          if (ev.data.type === "ready") {
            this.worker.removeEventListener("message", onMessage);
            this.rejectLoad = undefined;
            resolve();
          } else if (ev.data.type === "error") {
            // A failure during load() posts `error` instead of `ready`; reject
            // so the caller can show it, rather than hanging forever at
            // "Downloading LAMMPS…".
            this.worker.removeEventListener("message", onMessage);
            this.rejectLoad = undefined;
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
   * Called once if the worker crashes (after onError has received the same
   * message). The engine is unusable from then on; the page must be reloaded.
   */
  onCrash(listener: (message: string) => void) {
    this.crashListener = listener;
  }

  /**
   * Runs synchronously once per streamed timestep, after `latestFrame` has
   * been replaced — the main-thread analogue of the adapter's step listener.
   */
  setStepListener(listener: (() => void) | undefined) {
    this.stepListener = listener;
  }

  // --- LammpsWeb: the streamed frame ------------------------------------

  get latestFrame(): EngineFrame {
    return this.frame;
  }

  // --- LammpsWeb: worker filesystem -------------------------------------
  // Fire-and-forget: commands reach the worker in order, so a file written
  // before runFile is in place when the run starts. Nothing is mirrored on
  // the main thread; read worker files back with snapshotWorkdir.

  writeFile(path: string, data: string | Uint8Array) {
    this.send({ type: "writeFile", path, content: data });
  }

  /** mkdir -p in the worker FS; an existing directory is fine. */
  mkdir(path: string) {
    this.send({ type: "mkdir", path });
  }

  /** chdir in the worker FS, creating the directory first if needed. */
  chdir(path: string) {
    this.send({ type: "chdir", path });
  }

  // --- LammpsWeb: lifecycle ---------------------------------------------

  start(): boolean {
    if (this.crashError) return false;
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

  runCommand(command: string) {
    this.send({ type: "runCommand", command });
  }

  runFile(path: string): Promise<void> {
    if (this.crashError) return Promise.reject(this.crashError);
    const requestId = this.nextRequestId++;
    this.cRunning = true;
    this.cError = "";
    return new Promise<void>((resolve, reject) => {
      this.pendingRuns.set(requestId, { resolve, reject });
      this.send({ type: "runFile", requestId, path });
    });
  }

  /**
   * Read the files under `dir` out of the worker's wasm FS — the run-outputs
   * data path (ADR-001 §5). Safe to call mid-run: MEMFS reads are pure JS and
   * never re-enter the suspended module. Pass maxBytes for the throttled
   * mid-run copy; omit it for the complete end-of-run snapshot.
   */
  snapshotWorkdir(dir: string, maxBytes?: number): Promise<WorkdirSnapshot> {
    if (this.crashError) return Promise.reject(this.crashError);
    const requestId = this.nextRequestId++;
    return new Promise<WorkdirSnapshot>((resolve, reject) => {
      // Belt-and-braces against a dead/wedged worker: resolve empty after
      // 60s rather than stranding the run pipeline on this await forever.
      const timeout = setTimeout(() => {
        if (this.pendingSnapshots.delete(requestId)) {
          console.error("snapshotWorkdir timed out; returning empty snapshot");
          resolve({ files: [], skipped: [] });
        }
      }, 60_000);
      this.pendingSnapshots.set(requestId, {
        resolve: (snapshot) => {
          clearTimeout(timeout);
          resolve(snapshot);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });
      this.send({ type: "snapshotWorkdir", requestId, dir, maxBytes });
    });
  }

  setSyncFrequency(every: number) {
    if (every <= 0 || every === this.syncFrequency) return;
    this.syncFrequency = every;
    this.send({ type: "setSyncFrequency", every });
  }

  // --- LammpsWeb: status (backed by the latest frame) -------------------

  getIsRunning() {
    return this.cRunning;
  }
  getTimesteps() {
    return this.frame.step;
  }
  getNumAtoms() {
    return this.frame.count;
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
    return this.frame.runMode;
  }
  getRunTimesteps() {
    return this.frame.runStepsDone;
  }
  getRunTotalTimesteps() {
    return this.frame.runStepsTotal;
  }
  getTimestepsPerSecond() {
    return this.frame.timestepsPerSecond;
  }
  getCPURemain() {
    return this.frame.cpuRemain;
  }
  getMemoryUsage() {
    return this.frame.memoryUsage;
  }

  // --- LammpsWeb: bonds -------------------------------------------------

  setBondDistance(type1: number, type2: number, distance: number) {
    this.send({ type: "setBondDistance", type1, type2, distance });
  }
  clearBondDistances() {
    this.send({ type: "clearBondDistances" });
  }
  setBuildNeighborlist(build: boolean) {
    this.send({ type: "setBuildNeighborlist", build });
  }

  // --- LammpsWeb: computes / fixes / variables (from the frame) ---------

  private modifierNames(category: ModifierCategory) {
    return this.frame.modifiers
      .filter((modifier) => modifier.category === category)
      .map((modifier) => modifier.name);
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

  /**
   * Build an LMPModifier view over the streamed frame. It looks the modifier
   * up by category+name in the latest frame on every call, so the same object
   * can be cached across cycles by the store and still reflect the latest step.
   */
  private makeModifier(category: ModifierCategory, name: string): LMPModifier {
    const data = () =>
      this.frame.modifiers.find(
        (modifier) => modifier.category === category && modifier.name === name,
      );
    return {
      getName: () => name,
      getType: () => data()?.type ?? ModifierType.ComputeOther,
      getIsPerAtom: () => data()?.isPerAtom ?? false,
      hasScalarData: () => data()?.hasScalar ?? false,
      getClearPerSync: () => data()?.clearPerSync ?? false,
      getScalarValue: () => data()?.scalar ?? 0,
      getXLabel: () => data()?.xLabel ?? "Time",
      getYLabel: () => data()?.yLabel ?? "Value",
      getData1D: () => data()?.series ?? [],
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

  /**
   * Tell the worker which per-atom compute to stream values for (coloring).
   * Group labels need nothing streamed: their membership is already in every
   * frame's group bitsets.
   */
  setPerAtomModifier(category: ModifierCategory, name: string | null) {
    this.send({
      type: "setPerAtomModifier",
      category,
      name:
        category === "compute" && name?.startsWith(GROUP_LABEL_PREFIX)
          ? null
          : name,
    });
  }
}

export { CANCEL_MESSAGE };

import type {
  LAMMPSWeb as NativeLammps,
  ParticleSnapshot,
  BondSnapshot,
  ModifierCategory,
  ModifierInfo,
  ModifierSnapshot,
} from "lammps.js";
import { LammpsWeb, LMPModifier, LMPData1D, ModifierType, Wall } from "../types";
import { KOKKOS_THREADS } from "../utils/kokkos";
import { AtomifyWasmModule } from "./types";
import { getCancel, setCancel, getPausedFlag } from "./wasmInstance";
import type { WorkerModifierData, WorkerPerAtomData } from "./workerMessages";

/**
 * Adapts the lammps.js native LAMMPSWeb API to the LammpsWeb interface the
 * rest of Atomify consumes. Data still flows through raw heap views: lammps.js
 * snapshots carry BufferView { ptr, length, ... } into the wasm heap, and the
 * pointer getters below hand those to the existing HEAPF32/HEAP32 subarray
 * readers in the modifiers.
 */

export const SYNC_FIX_ID = "atomify_sync";
const CANCEL_MESSAGE = "Atomify::canceled";
const PAUSE_POLL_MS = 100;

/** Wrap a plain array in the CPPArray shape Atomify's embind-era code reads. */
const cppArray = <T>(items: T[]) => ({
  get: (index: number): T => items[index],
  size: () => items.length,
  delete: () => {},
});

const COMPUTE_TYPES: Record<string, ModifierType> = {
  pressure: ModifierType.ComputePressure,
  temp: ModifierType.ComputeTemp,
  pe: ModifierType.ComputePE,
  ke: ModifierType.ComputeKE,
  rdf: ModifierType.ComputeRDF,
  msd: ModifierType.ComputeMSD,
  vacf: ModifierType.ComputeVACF,
  com: ModifierType.ComputeCOM,
  gyration: ModifierType.ComputeGyration,
  "ke/atom": ModifierType.ComputeKEAtom,
  "property/atom": ModifierType.ComputePropertyAtom,
  "cluster/atom": ModifierType.ComputeClusterAtom,
  "cna/atom": ModifierType.ComputeCNAAtom,
};

const FIX_TYPES: Record<string, ModifierType> = {
  "ave/chunk": ModifierType.FixAveChunk,
  "ave/histo": ModifierType.FixAveHisto,
  "ave/time": ModifierType.FixAveTime,
};

function modifierType(category: ModifierCategory, style: string): ModifierType {
  if (category === "compute") {
    return COMPUTE_TYPES[style] ?? ModifierType.ComputeOther;
  }
  if (category === "fix") {
    return FIX_TYPES[style] ?? ModifierType.FixOther;
  }
  return ModifierType.VariableOther;
}

/** Resolve on the next macrotask without setTimeout's nested 4ms clamp. */
const yieldToEventLoop = (() => {
  if (typeof MessageChannel === "undefined") {
    return () => new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  const channel = new MessageChannel();
  let pending: (() => void)[] = [];
  channel.port1.onmessage = () => {
    const callbacks = pending;
    pending = [];
    callbacks.forEach((callback) => callback());
  };
  return () =>
    new Promise<void>((resolve) => {
      pending.push(resolve);
      channel.port2.postMessage(null);
    });
})();

/**
 * Presents one lammps.js modifier (compute/fix/variable) through Atomify's
 * LMPModifier interface. Data is fetched lazily from the native side; the
 * embind-era delete() methods are no-ops since everything here is plain JS.
 */
class ModifierAdapter implements LMPModifier {
  private snapshot: ModifierSnapshot | null = null;

  constructor(
    private readonly native: NativeLammps,
    private readonly category: ModifierCategory,
    private readonly name: string,
    private info: {
      style: string;
      isPerAtom: boolean;
      hasScalar: boolean;
      clearPerSync: boolean;
      xLabel: string;
      yLabel: string;
    },
  ) {}

  getName = () => this.name;
  getType = () => modifierType(this.category, this.info.style);
  getIsPerAtom = () => this.snapshot?.isPerAtom ?? this.info.isPerAtom;
  hasScalarData = () => this.snapshot?.hasScalar ?? this.info.hasScalar;
  getClearPerSync = () => this.snapshot?.clearPerSync ?? this.info.clearPerSync;
  getScalarValue = () => this.snapshot?.scalar ?? 0;
  getXLabel = () => this.snapshot?.xLabel ?? this.info.xLabel;
  getYLabel = () => this.snapshot?.yLabel ?? this.info.yLabel;

  // The native syncModifier both invokes the underlying compute (respecting
  // LAMMPS' invocation rules) and refreshes scalar/series data, so execute()
  // has nothing separate to do.
  execute = () => true;

  sync = () => {
    this.snapshot = this.native.syncModifier(this.category, this.name);
  };

  getData1DNames = () =>
    cppArray((this.snapshot?.series ?? []).map((series) => series.name));

  getData1D = () =>
    cppArray<LMPData1D>(
      (this.snapshot?.series ?? []).map((series) => ({
        getLabel: () => series.label,
        getXValuesPointer: () => series.x.ptr,
        getYValuesPointer: () => series.y.ptr,
        getNumPoints: () => series.x.length,
        delete: () => {},
      })),
    );

  getPerAtomData = () =>
    this.native.getModifierPerAtom(this.category, this.name).ptr;

  delete = () => {};
}

export class LammpsAdapter implements LammpsWeb {
  private readonly module: AtomifyWasmModule;
  private readonly native: NativeLammps;

  private particleSnapshot?: ParticleSnapshot;
  private bondSnapshot?: BondSnapshot;
  // Refreshed once per sync cycle in syncComputes; modifierNames/makeModifier
  // read it instead of crossing the wasm boundary per call.
  private modifierInfos: ModifierInfo[] | null = null;
  private syncFrequency = 1;
  // KOKKOS threads for the constant startup args. Fixed for the session:
  // Kokkos::initialize is one-shot per wasm module and the pthread pool is
  // sized at load (PTHREAD_POOL_SIZE 8). Kept at 4 so the New Run modal's
  // Multithreading toggle ("-k on t 4") matches what actually runs.
  private readonly kokkosThreads = KOKKOS_THREADS;
  private cancelRequested = false;
  private lastError = "";
  private stepListener?: () => void;
  // Single-shot resolver for the active runFile promise. Cancellation resolves
  // it directly (see requestGracefulStop) because native.stop()'s asyncify
  // unwind can leave native.runFile()'s own promise permanently unsettled.
  private runFinishResolve: (() => void) | null = null;
  private runFinished = true;

  constructor(module: AtomifyWasmModule, native: NativeLammps) {
    this.module = module;
    this.native = native;
    this.installStepCallback();
  }

  private installStepCallback() {
    const waiter = (
      promise: Promise<unknown>,
      donePtr: number,
      errPtr: number,
    ) => {
      promise.then(
        () => {
          this.module.HEAP32[donePtr / 4] = 1;
        },
        () => {
          this.module.HEAP32[errPtr / 4] = 1;
          this.module.HEAP32[donePtr / 4] = 1;
        },
      );
    };
    this.native.setAsyncStepCallback(() => this.onStep(), waiter);
  }

  /**
   * Called synchronously once per synced timestep, while the wasm is in a
   * normal (non-suspended) state. This is the only window where reading the
   * heap or calling back into the module is safe — the returned promise is
   * awaited inside emscripten_sleep, and re-entering the module while it is
   * asyncify-suspended returns garbage. The listener must therefore do all
   * of its wasm work synchronously.
   */
  setStepListener(listener: (() => void) | undefined) {
    this.stepListener = listener;
  }

  /**
   * Runs once per synced timestep (from fix js/async): first the synchronous
   * step listener (rendering + UI sync), then a promise that yields to the
   * event loop and waits while paused.
   *
   * Stopping does NOT reject the promise. Rejecting makes fix js/async raise a
   * LAMMPS error, and on the atomify KOKKOS build the error-reporting glue
   * (lammpsweb_throw_error -> UTF8ToString) crashes on a BigInt pointer,
   * corrupting the asyncify state machine so the run never settles and no
   * further simulation can start. Instead, cancellation issues LAMMPS'
   * `timer timeout 0` here in the safe (non-suspended) window, which ends the
   * active run cleanly at the next timestep with no thrown error. The wait
   * loop itself must never touch the wasm module (see setStepListener).
   */
  private onStep(): Promise<void> {
    try {
      this.stepListener?.();
    } catch (error) {
      // A rendering/UI failure should not abort the simulation.
      console.error("Step listener failed:", error);
    }

    // Safe synchronous window: if a stop was requested, gracefully halt the
    // active run here rather than rejecting later (which would throw in wasm).
    if (this.cancelRequested || getCancel()) {
      setCancel(false);
      this.cancelRequested = false;
      this.lastError = CANCEL_MESSAGE;
      this.requestGracefulStop();
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const wait = () => {
        // A stop pressed while paused: unblock so the next (safe, synchronous)
        // step can issue the graceful stop; leave the cancel flag set for it.
        if (this.cancelRequested || getCancel()) {
          resolve();
          return;
        }
        if (getPausedFlag()) {
          setTimeout(wait, PAUSE_POLL_MS);
          return;
        }
        resolve();
      };
      // Always yield one macrotask so the browser can paint between steps.
      void yieldToEventLoop().then(wait);
    });
  }

  /**
   * Ask LAMMPS to end the currently running command. native.stop() sets the
   * run's early-termination flag, so the run loop breaks out at the next
   * timestep and LAMMPS returns normally (unlike rejecting the fix js/async
   * promise, which throws and crashes this build's error glue). Safe to call
   * only from the synchronous step window.
   *
   * On this ASYNCIFY build, native.stop()'s unwind surfaces a "function
   * signature mismatch" that leaves native.runFile()'s promise permanently
   * unsettled — but the wasm run itself has finished (LAMMPS prints its run
   * summary). So after a short grace period we resolve the runFile promise
   * ourselves, letting the next run start; finishRun() is idempotent, so a
   * late settle of the original promise is harmless.
   */
  private requestGracefulStop() {
    try {
      this.native.stop();
    } catch (error) {
      console.error("Failed to request graceful stop:", error);
    }
    setTimeout(() => this.finishRun(), 300);
  }

  /** Resolve the active runFile promise exactly once. */
  private finishRun() {
    if (this.runFinished) return;
    this.runFinished = true;
    const resolve = this.runFinishResolve;
    this.runFinishResolve = null;
    resolve?.();
  }

  start(): boolean {
    this.lastError = "";
    this.cancelRequested = false;
    // Startup args are CONSTANT for the module's whole life: Kokkos::initialize
    // is one-shot per wasm module, so the mode can never change between runs
    // (changing it deadlocks/crashes the next run). With `-sf kk` always on,
    // per-simulation acceleration is decided by the SCRIPT instead: opted-in
    // scripts (a `suffix kk` line) run fully accelerated as-is, and all other
    // scripts are preprocessed with `suffix off` + a kk-wrapped atom_style so
    // their styles run serially (measured: same speed as a true serial build).
    // See src/utils/kokkos.ts.
    this.native.startWithArgs([
      "-k",
      "on",
      "t",
      String(this.kokkosThreads),
      "-sf",
      "kk",
    ]);
    return true;
  }

  stop(): boolean {
    this.native.stop();
    return true;
  }

  step() {
    this.native.advance(1, false, false);
  }

  cancel() {
    this.cancelRequested = true;
  }

  /**
   * Reset LAMMPS to a pristine state between runs without re-initializing the
   * process-wide Kokkos runtime. The LAMMPS `clear` command destroys and
   * recreates the internal LAMMPS object (deleting all atoms, computes, fixes
   * and the simulation box) while preserving the mode start() chose (KOKKOS
   * `-k on -sf kk`, or serial), so the next run is fresh in the same mode.
   * Kokkos::initialize is only called once (in start()); calling it twice
   * would crash, which is why we reset via `clear` rather than re-running
   * startWithArgs.
   */
  reset() {
    // Re-open LAMMPS from scratch via startWithArgs (the same call start()
    // makes). This recreates the LAMMPS instance with the same Kokkos/suffix
    // command-line args — Kokkos::initialize is guarded, so the thread pool is
    // reused, not re-initialized — and, crucially, clears native.stop()'s
    // latched stop flag so the next run actually advances. (LAMMPS `clear`
    // does not reset that wrapper-level flag, leaving the next run to
    // terminate immediately at step 0.) The async step callback lives on the
    // persistent wrapper and survives, so it must NOT be re-registered here —
    // doing so traps the next run with a "function signature mismatch".
    this.start();
    this.particleSnapshot = undefined;
    this.bondSnapshot = undefined;
    this.modifierInfos = null;
    this.lastError = "";
    this.cancelRequested = false;
  }

  runCommand(command: string) {
    this.native.runCommand(command);
  }

  /**
   * Never rejects: run failures (including cancellation) are stored and
   * surfaced through getErrorMessage, which the run thunk checks after
   * awaiting — rethrowing here would lose the Atomify::canceled marker that
   * routes stop-button aborts away from the error path.
   */
  runFile(path: string): Promise<void> {
    this.lastError = "";
    this.cancelRequested = false;
    this.runFinished = false;
    // A stop press that landed after the previous run's last synced step
    // leaves the global cancel flag set; don't let it abort this run.
    setCancel(false);

    // Installed globally (works before the box exists), so every run in
    // every include'd file fires the step callback — no script injection.
    this.native.installAsyncFix(SYNC_FIX_ID, this.syncFrequency);

    return new Promise<void>((resolve) => {
      this.runFinishResolve = resolve;
      // Under ASYNCIFY the embind call returns a promise when it suspends.
      // A normal completion resolves here; a cancellation is resolved early
      // by requestGracefulStop (the promise below may never settle then).
      Promise.resolve(
        this.native.runFile(path) as unknown as Promise<void> | undefined,
      ).then(
        () => this.finishRun(),
        (error) => {
          // Cancellation surfaces as the fix js/async abort error; keep the
          // canceled marker the store logic looks for in that case.
          if (this.lastError !== CANCEL_MESSAGE) {
            this.lastError =
              error instanceof Error ? error.message : String(error);
          }
          this.finishRun();
        },
      );
    });
  }

  setSyncFrequency(every: number) {
    if (every <= 0) {
      return;
    }
    this.syncFrequency = every;
    this.native.setAsyncStepFrequency(SYNC_FIX_ID, every);
  }

  getIsRunning(): boolean {
    return this.native.getIsRunning();
  }

  getTimesteps(): number {
    return this.native.getCurrentStep();
  }

  getNumAtoms(): number {
    if (this.particleSnapshot) {
      return this.particleSnapshot.count;
    }
    return this.native.isReady() ? this.native.syncParticlesWrapped().count : 0;
  }

  getErrorMessage(): string {
    return this.lastError || this.native.getLastErrorMessage();
  }

  getExceptionMessage(_address: number): string {
    return this.getErrorMessage() || "Unknown LAMMPS error";
  }

  getLastCommand(): string {
    return this.native.getLastInputLine();
  }

  // --- Particles ---

  computeParticles(): number {
    this.particleSnapshot = this.native.syncParticlesWrapped();
    return this.particleSnapshot.count;
  }

  getPositionsPointer(): number {
    return this.particleSnapshot?.positions.ptr ?? 0;
  }

  getTypePointer(): number {
    return this.particleSnapshot?.types.ptr ?? 0;
  }

  getIdPointer(): number {
    return this.particleSnapshot?.ids.ptr ?? 0;
  }

  // --- Bonds (topology + distance-derived from the neighborlist) ---

  computeBonds(): number {
    this.bondSnapshot = this.native.syncBondsWrapped();
    return this.bondSnapshot.count;
  }

  getBondsPosition1Pointer(): number {
    return this.bondSnapshot?.first.ptr ?? 0;
  }

  getBondsPosition2Pointer(): number {
    return this.bondSnapshot?.second.ptr ?? 0;
  }

  setBondDistance(type1: number, type2: number, distance: number) {
    this.native.setBondDistance(type1, type2, distance);
  }

  clearBondDistances() {
    this.native.clearBondDistances();
  }

  setBuildNeighborlist(buildNeighborlist: boolean) {
    this.native.setBuildNeighborlist(buildNeighborlist);
  }

  // --- Simulation box (float32 views, unlike the old wasm's float64) ---

  getCellMatrixPointer(): number {
    return this.native.syncSimulationBox().matrix.ptr;
  }

  getOrigoPointer(): number {
    return this.native.syncSimulationBox().origin.ptr;
  }

  getDimension(): number {
    return this.native.syncSimulationBox().dimension;
  }

  getWalls() {
    return cppArray<Wall>(this.native.getWalls());
  }

  // --- Run status / metrics ---

  getWhichFlag(): number {
    return this.native.getRunMode();
  }

  getRunTimesteps(): number {
    return this.native.getRunStepsDone();
  }

  getRunTotalTimesteps(): number {
    return this.native.getRunStepsTotal();
  }

  getTimestepsPerSecond(): number {
    return this.native.getThermo("spcpu");
  }

  getCPURemain(): number {
    return this.native.getThermo("cpuremain");
  }

  getMemoryUsage(): number {
    return this.native.getMemoryUsage();
  }

  // --- Computes / fixes / variables ---

  syncComputes() {
    this.native.syncModifiers();
    this.modifierInfos = this.native.listModifiers();
  }

  syncFixes() {
    // syncComputes already refreshed the shared registry this cycle.
  }

  syncVariables() {
    // syncComputes already refreshed the shared registry this cycle.
  }

  private listModifiers(): ModifierInfo[] {
    if (!this.modifierInfos) {
      this.modifierInfos = this.native.listModifiers();
    }
    return this.modifierInfos;
  }

  private modifierNames(category: ModifierCategory) {
    return cppArray(
      this.listModifiers()
        .filter((info) => info.category === category)
        .map((info) => info.name),
    );
  }

  private makeModifier(category: ModifierCategory, name: string): LMPModifier {
    const info = this.listModifiers().find(
      (entry) => entry.category === category && entry.name === name,
    );
    return new ModifierAdapter(this.native, category, name, {
      style: info?.style ?? "",
      isPerAtom: info?.isPerAtom ?? false,
      hasScalar: info?.hasScalar ?? false,
      clearPerSync: info?.clearPerSync ?? false,
      xLabel: info?.xLabel ?? "Time",
      yLabel: info?.yLabel ?? "Value",
    });
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
   * Snapshot every tracked compute/fix/variable — invoking each and copying
   * its scalar and 1D series out of the wasm heap — plus, when a per-atom
   * coloring target is set, that compute's per-atom float64 values. Used by
   * the worker to stream analysis + coloring data to the main thread, where
   * the proxy replays it through lightweight LMPModifier-shaped objects.
   * Must run in the synchronous step window (touches the heap).
   */
  snapshotModifiers(
    perAtomTarget: { category: ModifierCategory; name: string } | null,
  ): { modifiers: WorkerModifierData[]; perAtom: WorkerPerAtomData | null } {
    this.native.syncModifiers();
    const infos = this.native.listModifiers();
    this.modifierInfos = infos;

    const modifiers: WorkerModifierData[] = infos.map((info) => {
      const snap = this.native.syncModifier(info.category, info.name);
      const series = (snap?.series ?? []).map((s) => {
        const xBase = s.x.ptr / 4;
        const yBase = s.y.ptr / 4;
        return {
          name: s.name,
          label: s.label,
          x: Array.from(this.module.HEAPF32.subarray(xBase, xBase + s.x.length)),
          y: Array.from(this.module.HEAPF32.subarray(yBase, yBase + s.y.length)),
        };
      });
      return {
        name: info.name,
        category: info.category,
        type: modifierType(info.category, info.style),
        style: info.style,
        isPerAtom: snap?.isPerAtom ?? info.isPerAtom,
        hasScalar: snap?.hasScalar ?? info.hasScalar,
        clearPerSync: snap?.clearPerSync ?? info.clearPerSync,
        xLabel: snap?.xLabel ?? info.xLabel,
        yLabel: snap?.yLabel ?? info.yLabel,
        scalar: snap?.scalar ?? 0,
        series,
      };
    });

    let perAtom: WorkerPerAtomData | null = null;
    if (perAtomTarget) {
      const info = infos.find(
        (i) =>
          i.category === perAtomTarget.category &&
          i.name === perAtomTarget.name,
      );
      if (info?.isPerAtom) {
        const view = this.native.getModifierPerAtom(
          perAtomTarget.category,
          perAtomTarget.name,
        );
        const base = view.ptr / 8;
        const values = new Float64Array(
          this.module.HEAPF64.subarray(base, base + view.length),
        );
        perAtom = {
          category: perAtomTarget.category,
          name: perAtomTarget.name,
          values: values.buffer,
        };
      }
    }

    return { modifiers, perAtom };
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
}

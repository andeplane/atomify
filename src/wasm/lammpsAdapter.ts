import { GROUP_LABEL_PREFIX } from "../utils/lammpsGroups";
import {
  modifierAxisLabels,
  parseUnitStyle,
  type UnitStyle,
} from "../utils/units";
import { v4 as uuidv4 } from "uuid";
import type {
  LAMMPSWeb as NativeLammps,
  LammpsModule,
  ModifierCategory,
  ModifierSnapshot,
} from "lammps.js";
import { ModifierType } from "../types";
import { KOKKOS_THREADS } from "../utils/kokkos";
import type { EngineModifier, EnginePerAtom } from "./engineFrame";

/**
 * Drives the lammps.js native LAMMPSWeb inside the engine worker: the run
 * lifecycle (start/reset/runFile/cancel), the async step callback, and
 * copying compute/fix/variable data out of the wasm heap into the typed
 * arrays of each streamed EngineFrame. Only the worker uses it; the main
 * thread talks to LammpsWorkerProxy.
 */

export const SYNC_FIX_ID = "atomify_sync";
const CANCEL_MESSAGE = "Atomify::canceled";
const PAUSE_POLL_MS = 100;

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

export class LammpsAdapter {
  private readonly module: LammpsModule;
  private readonly native: NativeLammps;

  private unitStyle?: UnitStyle;
  observeOutput(line: string) {
    const units = parseUnitStyle(line);
    if (units) this.unitStyle = units;
  }
  getUnitStyle() {
    return this.unitStyle;
  }
  // Private atom variables expose optional native properties without parsing
  // atom_style commands (hybrid styles and read_restart work too).
  private readonly radiusFlagName = `atomify_radius_flag_${uuidv4().replaceAll("-", "")}`;
  private readonly radiusName = `${this.radiusFlagName}_values`;

  private readonly groupPrefix = `atomify_groups_${uuidv4().replaceAll("-", "")}_`;
  private groups = new Map<string, { flag: string; values: string }>();

  /** Build variable commands in JS; the input interpreter executes them. */
  prepareGroupVariables(names: string[]): string {
    this.groups.clear();
    return names
      .map((name, i) => {
        const flag = `${this.groupPrefix}${i}_exists`;
        const values = `${this.groupPrefix}${i}_mask`;
        this.groups.set(`${GROUP_LABEL_PREFIX}${name}`, { flag, values });
        return `variable ${flag} equal is_defined(group,${name})\nvariable ${values} atom gmask(${name})\n`;
      })
      .join("");
  }

  private syncFrequency = 1;
  // KOKKOS threads for the constant startup args. Fixed for the session:
  // Kokkos::initialize is one-shot per wasm module and the pthread pool is
  // sized at load (PTHREAD_POOL_SIZE 8). Kept at 4 so the New Run modal's
  // Multithreading toggle ("-k on t 4") matches what actually runs.
  private readonly kokkosThreads = KOKKOS_THREADS;
  // Run control, set by the worker from LammpsWorkerProxy's commands (the
  // proxy is its only owner) and read by onStep's between-step wait loop.
  private cancelRequested = false;
  private paused = false;
  private lastError = "";
  private stepListener?: () => void;
  // Single-shot resolver for the active runFile promise. Cancellation resolves
  // it directly (see requestGracefulStop) because native.stop()'s asyncify
  // unwind can leave native.runFile()'s own promise permanently unsettled.
  private runFinishResolve: (() => void) | null = null;
  private runFinished = true;

  constructor(module: LammpsModule, native: NativeLammps) {
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
    if (this.cancelRequested) {
      this.cancelRequested = false;
      this.lastError = CANCEL_MESSAGE;
      this.requestGracefulStop();
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const wait = () => {
        // A stop pressed while paused: unblock so the next (safe, synchronous)
        // step can issue the graceful stop; leave the cancel flag set for it.
        if (this.cancelRequested) {
          resolve();
          return;
        }
        if (this.paused) {
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
    this.groups.clear();
    this.unitStyle = undefined;
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

  /** Stop the active run at its next synced step (unpausing it first). */
  cancel() {
    this.cancelRequested = true;
    this.paused = false;
  }

  /** Hold (or release) the run in the between-step wait loop. */
  setPaused(paused: boolean) {
    this.paused = paused;
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
    // Every run starts unpaused, and a stop press that landed after the
    // previous run's last synced step must not abort this one.
    this.lastError = "";
    this.cancelRequested = false;
    this.paused = false;
    this.runFinished = false;

    // Definitions survive LAMMPS clear and evaluate against the current atom
    // style. Define them before execution: commands are forbidden mid-run.
    this.native.runCommand(
      `variable ${this.radiusFlagName} equal extract_setting(radius_flag)`,
    );
    this.native.runCommand(`variable ${this.radiusName} atom radius`);

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

  getErrorMessage(): string {
    return this.lastError || this.native.getLastErrorMessage();
  }

  // --- Bonds (topology + distance-derived from the neighborlist) ---

  setBondDistance(type1: number, type2: number, distance: number) {
    this.native.setBondDistance(type1, type2, distance);
  }

  clearBondDistances() {
    this.native.clearBondDistances();
  }

  setBuildNeighborlist(buildNeighborlist: boolean) {
    this.native.setBuildNeighborlist(buildNeighborlist);
  }

  // --- Computes / fixes / variables ---

  /**
   * Invoke and sync one modifier, treating a LAMMPS error as "no data yet".
   *
   * The final snapshot the worker takes after every script (so `run 0`
   * structure views get a frame) can reach computes LAMMPS never
   * initialized: a script without any run/minimize never calls init(), so
   * e.g. `compute rdf` has no neighbor list and invoking it throws "Trying
   * to build an occasional neighbor list before initialization is
   * complete". LAMMPS errors are recoverable exceptions in library mode, so
   * skip that modifier (the caller falls back to its static info) instead of
   * failing the whole snapshot — and with it the run.
   */
  private trySyncModifier(
    category: ModifierCategory,
    name: string,
  ): ModifierSnapshot | null {
    try {
      return this.native.syncModifier(category, name);
    } catch {
      return null;
    }
  }

  /**
   * Snapshot every tracked compute/fix/variable — invoking each and copying
   * its scalar and 1D series out of the wasm heap — plus, when a per-atom
   * coloring target is set, that compute's per-atom float64 values. Used by
   * the worker to fill each streamed EngineFrame; every array is a fresh copy
   * the worker can transfer. Must run in the synchronous step window
   * (touches the heap).
   */
  snapshotModifiers(
    perAtomTarget: { category: ModifierCategory; name: string } | null,
    particleCount: number,
  ): {
    modifiers: EngineModifier[];
    perAtom: EnginePerAtom | null;
    radii: Float32Array | null;
    groups: { names: string[]; masks: Uint32Array };
  } {
    this.native.syncModifiers();
    let infos = this.native.listModifiers();
    const hasNativeRadii =
      this.trySyncModifier("variable", this.radiusFlagName)?.scalar === 1;
    let radii: Float32Array | null = null;
    if (hasNativeRadii && this.trySyncModifier("variable", this.radiusName)) {
      const view = this.native.getModifierPerAtom("variable", this.radiusName);
      radii = new Float32Array(
        this.module.HEAPF64.subarray(view.ptr / 8, view.ptr / 8 + view.length),
      );
    }
    infos = infos.filter(
      (i) =>
        i.name !== this.radiusFlagName &&
        i.name !== this.radiusName &&
        !i.name.startsWith(this.groupPrefix),
    );

    const modifiers: EngineModifier[] = infos.map((info) => {
      const snap = this.trySyncModifier(info.category, info.name);
      const series = (snap?.series ?? []).map((s) => {
        const xBase = s.x.ptr / 4;
        const yBase = s.y.ptr / 4;
        return {
          name: s.name,
          label: s.label,
          x: new Float32Array(
            this.module.HEAPF32.subarray(xBase, xBase + s.x.length),
          ),
          y: new Float32Array(
            this.module.HEAPF32.subarray(yBase, yBase + s.y.length),
          ),
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
        ...modifierAxisLabels(
          info.category,
          info.style,
          snap?.xLabel ?? info.xLabel,
          snap?.yLabel ?? info.yLabel,
          this.unitStyle,
        ),
        scalar: snap?.scalar ?? 0,
        series,
      };
    });

    const activeGroups = new Map(
      [...this.groups].filter(
        ([, group]) =>
          this.trySyncModifier("variable", group.flag)?.scalar === 1,
      ),
    );
    for (const [name] of activeGroups) {
      modifiers.push({
        name,
        category: "compute",
        type: ModifierType.ComputeOther,
        style: "group/membership",
        isPerAtom: true,
        hasScalar: false,
        clearPerSync: false,
        xLabel: "",
        yLabel: "Membership",
        scalar: 0,
        series: [],
      });
    }
    let perAtom: EnginePerAtom | null = null;
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
        perAtom = {
          category: perAtomTarget.category,
          name: perAtomTarget.name,
          values: new Float64Array(
            this.module.HEAPF64.subarray(base, base + view.length),
          ),
        };
      }
    }

    // One compact bitset per atom supports changing the selected group while
    // paused without entering the asyncify-suspended engine.
    const names = [...activeGroups.keys()];
    const masks = new Uint32Array(names.length ? particleCount : 0);
    for (let bit = 0; bit < names.length; bit++) {
      const flag = 1 << bit;
      if (names[bit] === `${GROUP_LABEL_PREFIX}all`) {
        for (let i = 0; i < particleCount; i++) masks[i] |= flag;
        continue;
      }
      const group = activeGroups.get(names[bit])!;
      if (!this.trySyncModifier("variable", group.values)) continue;
      const view = this.native.getModifierPerAtom("variable", group.values);
      const values = this.module.HEAPF64.subarray(
        view.ptr / 8,
        view.ptr / 8 + view.length,
      );
      for (let i = 0; i < particleCount; i++) if (values[i]) masks[i] |= flag;
    }
    return { modifiers, perAtom, radii, groups: { names, masks } };
  }
}

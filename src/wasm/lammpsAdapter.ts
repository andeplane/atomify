import type {
  LAMMPSWeb as NativeLammps,
  ParticleSnapshot,
  BondSnapshot,
} from "lammps.js";
import { LammpsWeb, LMPModifier, Wall } from "../types";
import { AtomifyWasmModule } from "./types";
import { getCancel, setCancel, getPausedFlag } from "./wasmInstance";

/**
 * Adapts the lammps.js native LAMMPSWeb API to the LammpsWeb interface the
 * rest of Atomify consumes. Data still flows through raw heap views: lammps.js
 * snapshots carry BufferView { ptr, length, ... } into the wasm heap, and the
 * pointer getters below hand those to the existing HEAPF32/HEAP32 subarray
 * readers in the modifiers.
 *
 * Where lammps.js has no equivalent yet, methods degrade gracefully and carry
 * a TODO(lammps.js-#…) marker referencing the tracking issue on
 * https://github.com/lammps/lammps.js.
 */

export const SYNC_FIX_ID = "atomify_sync";
const CANCEL_MESSAGE = "Atomify::canceled";
const PAUSE_POLL_MS = 100;

/** Marker returned while a lammps.js capability gap makes a value meaningless. */
const emptyCppArray = <T>() => ({
  get: (): T => {
    throw new Error("empty array");
  },
  size: () => 0,
  delete: () => {},
});

/**
 * Insert `fix <id> all js/async <every>` before the first run/minimize
 * command so the per-step callback fires. Mirrors the injection logic in
 * lammps.js client.ts.
 *
 * TODO(lammps.js-58): scripts whose first run/minimize
 * lives in an include'd file (or after a jump) get no callback and block the
 * UI for the whole run. Atomify's own build solved this with a patched
 * LAMMPS that allows installing the fix before the box exists.
 */
export function injectSyncFix(script: string, every: number): string {
  const lines = script.split("\n");
  const runIndex = lines.findIndex((line) =>
    /^\s*(run|minimize)(\s|$)/.test(line),
  );
  if (runIndex === -1) {
    return script;
  }
  const alreadyDefined = lines
    .slice(0, runIndex)
    .some((line) => /^\s*fix\s+\S+\s+\S+\s+js\/async(\s|$)/.test(line));
  if (alreadyDefined) {
    return script;
  }
  lines.splice(runIndex, 0, `fix ${SYNC_FIX_ID} all js/async ${every}`);
  return lines.join("\n");
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

export class LammpsAdapter implements LammpsWeb {
  private readonly module: AtomifyWasmModule;
  private readonly native: NativeLammps;

  private particleSnapshot?: ParticleSnapshot;
  private bondSnapshot?: BondSnapshot;
  private syncFrequency = 1;
  private cancelRequested = false;
  private lastError = "";
  private stepListener?: () => void;
  // TODO(lammps.js-53): neighborlist-based bonds with per-type-pair
  // distances are not supported by lammps.js; distances are collected here so
  // they can be forwarded once the API exists.
  private bondDistances = new Map<string, number>();

  constructor(module: AtomifyWasmModule, native: NativeLammps) {
    this.module = module;
    this.native = native;
    this.installStepCallback();
  }

  /** Feed LAMMPS console output back in; errors are only visible there. */
  // TODO(lammps.js-56): lammps.js swallows LAMMPS errors inside
  // lammps_commands_string/lammps_file (LAMMPS_EXCEPTIONS). Until it exposes
  // the stored last error, recover it from the printed "ERROR: ..." lines.
  noteOutput(text: string) {
    if (text.startsWith("ERROR") && !this.lastError) {
      this.lastError = text;
    }
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
   * event loop, waits while paused, and rejects on cancel — a rejected
   * promise makes fix js/async raise a LAMMPS error, aborting the run.
   * The wait loop must not touch the wasm module (see setStepListener).
   */
  private onStep(): Promise<void> {
    try {
      this.stepListener?.();
    } catch (error) {
      // A rendering/UI failure should not abort the simulation.
      console.error("Step listener failed:", error);
    }
    return new Promise<void>((resolve, reject) => {
      const wait = () => {
        if (this.cancelRequested || getCancel()) {
          setCancel(false);
          this.cancelRequested = false;
          this.lastError = CANCEL_MESSAGE;
          reject(new Error(CANCEL_MESSAGE));
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

  start(): boolean {
    this.lastError = "";
    this.cancelRequested = false;
    this.native.start();
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

  setPaused(_paused: boolean) {
    // Pausing is handled by the pause flag in wasmInstance (see onStep).
  }

  runCommand(command: string) {
    this.native.runCommand(command);
  }

  async runFile(path: string): Promise<void> {
    this.lastError = "";
    this.cancelRequested = false;

    const content = this.module.FS.readFile(path, { encoding: "utf8" });
    const injected = injectSyncFix(content, this.syncFrequency);
    let target = path;
    if (injected !== content) {
      // Outside the simulation directory so it never shows up as a user file.
      target = "/.atomify_run.in";
      this.module.FS.writeFile(target, injected);
    }
    // Under ASYNCIFY the embind call returns a promise when it suspends.
    await Promise.resolve(
      this.native.runFile(target) as unknown as Promise<void> | undefined,
    );
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
    return this.lastError;
  }

  getExceptionMessage(_address: number): string {
    // TODO(lammps.js-56): the old wasm exposed the C++
    // exception message behind the thrown pointer. lammps.js has no
    // equivalent, so exceptions thrown as numbers stay opaque.
    return this.lastError || "Unknown LAMMPS error";
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

  // --- Bonds ---

  computeBonds(): number {
    // TODO(lammps.js-53): only bond-topology bonds; the old wasm
    // also derived bonds from the neighborlist using the distance map.
    // TODO(lammps.js-54): wrapped bond endpoints are not
    // minimum-imaged, so bonds crossing a periodic boundary span the box.
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
    // TODO(lammps.js-53): forward to lammps.js once supported.
    this.bondDistances.set(`${type1}-${type2}`, distance);
  }

  clearBondDistances() {
    this.bondDistances.clear();
  }

  setBuildNeighborlist(_buildNeighborlist: boolean) {
    // TODO(lammps.js-53): no neighborlist access in lammps.js.
  }

  // --- Simulation box (float32 views, unlike the old wasm's float64) ---

  getCellMatrixPointer(): number {
    return this.native.syncSimulationBox().matrix.ptr;
  }

  getOrigoPointer(): number {
    return this.native.syncSimulationBox().origin.ptr;
  }

  getDimension(): number {
    // TODO(lammps.js-57): lammps.js does not expose
    // domain->dimension; 2D simulations render as 3D.
    return 3;
  }

  getWalls() {
    // TODO(lammps.js-57): no FixWall introspection in lammps.js, so wall
    // geometry is never rendered.
    return emptyCppArray<Wall>();
  }

  // --- Run status / metrics ---

  getWhichFlag(): number {
    // TODO(lammps.js-55): whichflag (1 = dynamics, 2 = minimize) is
    // not exposed; minimization is indistinguishable from dynamics.
    return this.native.getIsRunning() ? 1 : 0;
  }

  getRunTimesteps(): number {
    // TODO(lammps.js-55): run progress is not exposed.
    return 0;
  }

  getRunTotalTimesteps(): number {
    // TODO(lammps.js-55): run progress is not exposed.
    return 0;
  }

  getTimestepsPerSecond(): number {
    // TODO(lammps.js-55): thermo "spcpu" is not exposed.
    return 0;
  }

  getCPURemain(): number {
    // TODO(lammps.js-55): thermo "cpuremain" is not exposed.
    return 0;
  }

  getMemoryUsage(): number {
    // TODO(lammps.js-55): memory usage is not exposed.
    return 0;
  }

  getLastCommand(): string {
    // TODO(lammps.js-56): input->line is not exposed.
    return "";
  }

  // --- Computes / fixes / variables ---
  // TODO(lammps.js-51): lammps.js only exposes global compute
  // scalars (getComputeScalar). Enumeration, classification, per-atom data
  // and 1D plot series (compute rdf/msd/vacf, fix ave/time & friends,
  // variables) all need an introspection API before these panels can work.

  syncComputes() {}

  syncFixes() {}

  syncVariables() {}

  getComputeNames() {
    return emptyCppArray<string>();
  }

  getFixNames() {
    return emptyCppArray<string>();
  }

  getVariableNames() {
    return emptyCppArray<string>();
  }

  getCompute(name: string): LMPModifier {
    throw new Error(`Compute introspection not supported yet (${name})`);
  }

  getFix(name: string): LMPModifier {
    throw new Error(`Fix introspection not supported yet (${name})`);
  }

  getVariable(name: string): LMPModifier {
    throw new Error(`Variable introspection not supported yet (${name})`);
  }
}

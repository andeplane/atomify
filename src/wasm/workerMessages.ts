/**
 * Typed message protocol between the main thread (LammpsWorkerProxy) and the
 * LAMMPS Web Worker (lammps.worker.ts).
 *
 * The atomify wasm build is a KOKKOS/pthreads + ASYNCIFY emscripten module. It
 * CANNOT initialize on the browser main thread (its thread-pool handshake needs
 * Atomics.wait blocking, which is forbidden off a Worker), so the module lives
 * entirely inside the worker. omovi's WebGL objects live only on the main
 * thread, so the worker never touches them — it streams plain typed arrays,
 * copied out of the wasm heap inside the (asyncify-safe) step callback, and the
 * main thread renders them.
 */

import type { ModifierCategory, WallInfo } from "lammps.js";
import type { ModifierType } from "../types";

/** Commands sent from the main thread to the worker. */
export type WorkerCommand =
  // kokkos=false starts LAMMPS serially (no Kokkos runtime) for A/B testing.
  | { type: "load"; kokkos: boolean }
  | { type: "writeFile"; path: string; content: string | Uint8Array }
  | { type: "mkdir"; path: string }
  | { type: "chdir"; path: string }
  // Reset per-run flags before a run. Kokkos itself is started once at load.
  | { type: "start" }
  | { type: "runFile"; requestId: number; path: string }
  | { type: "cancel" }
  // Pause/resume the run. The worker owns the LammpsAdapter whose between-step
  // wait loop reads the (worker-local) paused flag, so pausing must be sent as
  // a command — setting the main thread's flag alone does nothing.
  | { type: "pause"; paused: boolean }
  | { type: "setSyncFrequency"; every: number }
  | { type: "setBuildNeighborlist"; build: boolean }
  | { type: "setBondDistance"; type1: number; type2: number; distance: number }
  | { type: "clearBondDistances" }
  // Which per-atom compute (if any) the main thread is coloring by. The worker
  // streams that compute's per-atom values each step so color-by-compute works;
  // null streams none (the common case), avoiding needless per-atom invocation.
  | { type: "setPerAtomModifier"; category: ModifierCategory; name: string | null }
  | { type: "runCommand"; command: string };

/** One compute/fix/variable's streamed snapshot (scalar + 1D series). */
export interface WorkerModifierData {
  name: string;
  category: ModifierCategory;
  /** Atomify's UI classification, derived from category + LAMMPS style. */
  type: ModifierType;
  style: string;
  isPerAtom: boolean;
  hasScalar: boolean;
  clearPerSync: boolean;
  xLabel: string;
  yLabel: string;
  scalar: number;
  series: { name: string; label: string; x: number[]; y: number[] }[];
}

/** Per-atom float64 values for the active coloring compute. */
export interface WorkerPerAtomData {
  category: ModifierCategory;
  name: string;
  /** count float64 values, one per atom (ordered like the particle snapshot). */
  values: ArrayBuffer;
}

/**
 * A single synced timestep streamed from the worker. All arrays are freshly
 * allocated copies whose ArrayBuffers are transferred (zero-copy) to the main
 * thread; the main thread owns them after receipt.
 */
export interface WorkerStepData {
  type: "step";
  step: number;
  count: number;
  /** 3 * count float32 xyz positions. */
  positions: ArrayBuffer;
  /** count int32 atom types. */
  types: ArrayBuffer;
  /** count int32 atom ids. */
  ids: ArrayBuffer;
  /** Number of rendered bonds this step (0 when none). */
  bondCount: number;
  /** 3 * bondCount float32 xyz of each bond's first endpoint. */
  bondFirst: ArrayBuffer;
  /** 3 * bondCount float32 xyz of each bond's second endpoint. */
  bondSecond: ArrayBuffer;
  /** 9 float32 row-major cell matrix. */
  boxMatrix: ArrayBuffer;
  /** 3 float32 box origin. */
  origin: ArrayBuffer;
  dimension: number;
  runMode: number;
  runStepsDone: number;
  runStepsTotal: number;
  /** Snapshot of every tracked compute/fix/variable this step. */
  modifiers: WorkerModifierData[];
  /** Per-atom values for the active coloring compute, or null. */
  perAtom: WorkerPerAtomData | null;
  /** LAMMPS memory usage estimate in bytes. */
  memoryUsage: number;
  /** Timesteps/second (thermo "spcpu"). */
  timestepsPerSecond: number;
  /** Estimated CPU seconds remaining (thermo "cpuremain"). */
  cpuRemain: number;
  /** Renderable wall fixes (EDGE/CONSTANT). */
  walls: WallInfo[];
}

/** Events sent from the worker to the main thread. */
export type WorkerEvent =
  | { type: "ready" }
  | WorkerStepData
  | { type: "printed"; text: string }
  | { type: "error"; message: string }
  | { type: "runFinished"; requestId: number; error: string };

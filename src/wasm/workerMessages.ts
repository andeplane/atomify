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

import type { ModifierCategory } from "lammps.js";
import type { EngineFrame } from "./engineFrame";

/** Commands sent from the main thread to the worker. */
export type WorkerCommand =
  | { type: "load" }
  // Worker-FS writes. Commands are delivered in order, so a file written
  // before runFile is in place when the run starts. mkdir is mkdir -p;
  // writeFile and chdir create missing directories too.
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
  | {
      type: "setPerAtomModifier";
      category: ModifierCategory;
      name: string | null;
    }
  | { type: "runCommand"; command: string }
  // Read the files under `dir` out of the worker's wasm FS (the run-outputs
  // data path, ADR-001 §5). MEMFS reads are pure JS, so this is safe even
  // while the module is asyncify-suspended mid-run; files larger than
  // maxBytes are listed in `skipped` instead of transferred (the caller sends
  // maxBytes: undefined for the final end-of-run snapshot).
  | {
      type: "snapshotWorkdir";
      requestId: number;
      dir: string;
      maxBytes?: number;
    };

/**
 * A single synced timestep streamed from the worker. Every array in the frame
 * is a fresh copy whose buffer is transferred (zero-copy) to the main thread,
 * which owns it after receipt (see engineFrame.ts).
 */
export interface WorkerStepData {
  type: "step";
  frame: EngineFrame;
}

/** One file read out of the worker FS by snapshotWorkdir. */
export interface WorkdirFile {
  /** Path relative to the snapshot's `dir`. */
  path: string;
  /** Raw bytes; the ArrayBuffer is transferred to the main thread. */
  bytes: ArrayBuffer;
}

/** Events sent from the worker to the main thread. */
export type WorkerEvent =
  | { type: "ready" }
  | WorkerStepData
  | { type: "printed"; text: string }
  | { type: "error"; message: string }
  | { type: "runFinished"; requestId: number; error: string }
  | {
      type: "workdirSnapshot";
      requestId: number;
      files: WorkdirFile[];
      /** Files present but over maxBytes: relative path + size. */
      skipped: { path: string; size: number }[];
    };

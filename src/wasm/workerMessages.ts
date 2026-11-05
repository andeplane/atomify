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
import { dependencies } from "../../package.json";

/**
 * Version of this message protocol. The worker reports it in its `ready`
 * event and the proxy refuses to drive a worker that speaks another version
 * (e.g. a stale worker script cached from a different deploy). Bump it on
 * any incompatible change to WorkerCommand / WorkerEvent.
 */
export const WORKER_PROTOCOL_VERSION = 2;

/**
 * The lammps.js release the app is built against (pinned exactly in
 * package.json). The worker reports it in `ready` alongside the protocol
 * version; both sides read this one constant, so a mismatch means the worker
 * script and the page come from different builds.
 */
export const LAMMPS_JS_VERSION: string = dependencies["lammps.js"];

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
  // Run control. LammpsWorkerProxy is its only owner: it keeps the cancel /
  // paused / sync-frequency state and forwards each change here, and the
  // worker's LammpsAdapter applies it in its between-step wait loop. A cancel
  // ends the active run (and unpauses it).
  | { type: "cancel" }
  | { type: "pause"; paused: boolean }
  | { type: "setSyncFrequency"; every: number }
  // Frame backpressure: the main thread has consumed a streamed `step` frame.
  // The worker posts no new frame while one is unacknowledged (see
  // frameGate.ts).
  | { type: "frameAck" }
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
  // The module is loaded. Carries the worker's protocol and lammps.js versions
  // so the proxy can refuse a worker from another build.
  | { type: "ready"; protocolVersion: number; engineVersion: string }
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

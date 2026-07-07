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

/** Commands sent from the main thread to the worker. */
export type WorkerCommand =
  | { type: "load" }
  | { type: "writeFile"; path: string; content: string | Uint8Array }
  | { type: "mkdir"; path: string }
  | { type: "chdir"; path: string }
  // Reset per-run flags before a run. Kokkos itself is started once at load.
  | { type: "start" }
  | { type: "runFile"; requestId: number; path: string }
  | { type: "cancel" }
  | { type: "setSyncFrequency"; every: number }
  | { type: "setBuildNeighborlist"; build: boolean }
  | { type: "setBondDistance"; type1: number; type2: number; distance: number }
  | { type: "clearBondDistances" }
  | { type: "runCommand"; command: string };

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
  /** 9 float32 row-major cell matrix. */
  boxMatrix: ArrayBuffer;
  /** 3 float32 box origin. */
  origin: ArrayBuffer;
  dimension: number;
  runMode: number;
  runStepsDone: number;
  runStepsTotal: number;
}

/** Events sent from the worker to the main thread. */
export type WorkerEvent =
  | { type: "ready" }
  | WorkerStepData
  | { type: "printed"; text: string }
  | { type: "error"; message: string }
  | { type: "runFinished"; requestId: number; error: string };

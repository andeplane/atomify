/// <reference lib="webworker" />
/**
 * LAMMPS Web Worker entry.
 *
 * The atomify wasm build is a multithreaded KOKKOS/pthreads + ASYNCIFY module.
 * A pthreads module cannot initialize on the browser main thread (its
 * thread-pool handshake blocks on Atomics.wait, forbidden off a Worker), so the
 * module is created and driven entirely here, inside a Worker, where pthreads
 * and SharedArrayBuffer work. This worker owns the wasm module and the
 * LammpsAdapter; it streams particle/box snapshots (copied out of the heap
 * inside the asyncify-safe step callback) to the main thread, which renders
 * them with omovi.
 */
import { LammpsAdapter } from "./lammpsAdapter";
import { setPausedFlag } from "./wasmInstance";
import type { AtomifyWasmModule } from "./types";
import type { WorkerCommand, WorkerEvent } from "./workerMessages";
import type {
  LAMMPSWeb as NativeLammps,
  ParticleSnapshot,
  BondSnapshot,
  BoxSnapshot,
  ModifierCategory,
} from "lammps.js";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

let module: AtomifyWasmModule | undefined;
let native: NativeLammps | undefined;
let adapter: LammpsAdapter | undefined;
// True once a run has been started in this worker. Kokkos is initialized once
// at load; every subsequent run must `clear` LAMMPS to a fresh state first.
let hasStartedARun = false;
// Which per-atom compute (if any) the main thread is coloring by. Its per-atom
// values are streamed each step; null streams none.
let perAtomTarget: { category: ModifierCategory; name: string } | null = null;

function post(event: WorkerEvent, transfer?: Transferable[]) {
  ctx.postMessage(event, transfer ?? []);
}

// Commands that call into compiled wasm must NOT run while a run is active:
// between step callbacks the module is asyncify-suspended (emscripten_sleep),
// and re-entering a suspended module corrupts the asyncify state — the run's
// final rewind is then lost, runFile never settles, and the app wedges after
// the run completes (reproduced deterministically with setAsyncStepFrequency
// landing between steps). Defer such commands to the next safe step window
// (streamStep runs inside the step callback) or to run end.
let runActive = false;
const deferredNativeCalls: Array<() => void> = [];
function callNativeSafely(fn: () => void) {
  if (runActive) {
    deferredNativeCalls.push(fn);
  } else {
    fn();
  }
}
function flushDeferredNativeCalls() {
  while (deferredNativeCalls.length) {
    try {
      deferredNativeCalls.shift()!();
    } catch (error) {
      post({
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

// Stopping a run via native.stop() ends the run cleanly (LAMMPS prints its
// summary and the adapter resolves runFile), but this build's ASYNCIFY unwind
// then rejects an internal promise with "function signature mismatch". That
// rejection is benign — swallow it so it doesn't surface as an uncaught error.
ctx.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
  const reason = e.reason;
  const message =
    reason instanceof Error ? reason.message : String(reason ?? "");
  if (message.includes("function signature mismatch")) {
    e.preventDefault();
  }
});

/** mkdir -p: create every missing parent, ignoring "already exists". */
function mkdirp(path: string) {
  if (!module) return;
  const parts = path.split("/").filter(Boolean);
  let current = "";
  for (const part of parts) {
    current += "/" + part;
    if (!module.FS.analyzePath(current).exists) {
      try {
        module.FS.mkdir(current);
      } catch {
        // Racing/duplicate mkdir — the path exists, which is all we need.
      }
    }
  }
}

/**
 * Read the current particle + box state out of the wasm heap and stream it to
 * the main thread. Runs synchronously inside the adapter's step listener, the
 * only window where touching the (otherwise asyncify-suspended) module is safe.
 * Every array is copied into a fresh transferable buffer.
 */
function streamStep() {
  if (!module || !native) return;
  // Safe window: the wasm is not suspended here. Apply any commands that
  // arrived (deferred) while it was.
  flushDeferredNativeCalls();
  const particles: ParticleSnapshot = native.syncParticlesWrapped();
  const count = particles.count;

  const posBase = particles.positions.ptr / 4;
  const positions = new Float32Array(
    module.HEAPF32.subarray(posBase, posBase + 3 * count),
  );
  const typeBase = particles.types.ptr / 4;
  const types = new Int32Array(
    module.HEAP32.subarray(typeBase, typeBase + count),
  );
  const idBase = particles.ids.ptr / 4;
  const ids = new Int32Array(module.HEAP32.subarray(idBase, idBase + count));

  // Bonds: topology + neighborlist-distance derived. Built per synced step by
  // fix js/async (needs setBuildNeighborlist / setBondDistance), so this must
  // run here in the safe step window. count is 0 for non-molecular sims.
  const bonds: BondSnapshot = native.syncBondsWrapped();
  const bondCount = bonds.count;
  const firstBase = bonds.first.ptr / 4;
  const bondFirst = new Float32Array(
    module.HEAPF32.subarray(firstBase, firstBase + 3 * bondCount),
  );
  const secondBase = bonds.second.ptr / 4;
  const bondSecond = new Float32Array(
    module.HEAPF32.subarray(secondBase, secondBase + 3 * bondCount),
  );

  const box: BoxSnapshot = native.syncSimulationBox();
  const matrixBase = box.matrix.ptr / 4;
  const boxMatrix = new Float32Array(
    module.HEAPF32.subarray(matrixBase, matrixBase + 9),
  );
  const originBase = box.origin.ptr / 4;
  const origin = new Float32Array(
    module.HEAPF32.subarray(originBase, originBase + 3),
  );

  // Computes / fixes / variables (+ per-atom coloring data). Also runs inside
  // this safe step window, since it invokes computes and reads the heap.
  const { modifiers, perAtom } = adapter
    ? adapter.snapshotModifiers(perAtomTarget)
    : { modifiers: [], perAtom: null };

  const transfer: Transferable[] = [
    positions.buffer,
    types.buffer,
    ids.buffer,
    bondFirst.buffer,
    bondSecond.buffer,
    boxMatrix.buffer,
    origin.buffer,
  ];
  if (perAtom) transfer.push(perAtom.values);

  post(
    {
      type: "step",
      step: native.getCurrentStep(),
      count,
      positions: positions.buffer,
      types: types.buffer,
      ids: ids.buffer,
      bondCount,
      bondFirst: bondFirst.buffer,
      bondSecond: bondSecond.buffer,
      boxMatrix: boxMatrix.buffer,
      origin: origin.buffer,
      dimension: box.dimension,
      runMode: native.getRunMode(),
      runStepsDone: native.getRunStepsDone(),
      runStepsTotal: native.getRunStepsTotal(),
      modifiers,
      perAtom,
      memoryUsage: native.getMemoryUsage(),
      timestepsPerSecond: native.getThermo("spcpu"),
      cpuRemain: native.getThermo("cpuremain"),
      walls: native.getWalls(),
    },
    transfer,
  );
}

async function load() {
  if (module) {
    post({ type: "ready" });
    return;
  }
  const printLine = (...args: unknown[]) =>
    post({ type: "printed", text: args.join(" ") });

  // Fetch the atomify emscripten glue (embedded wasm, ~50 MB) once and keep it
  // as a Blob. Load createModule from that same blob URL (?url + @vite-ignore
  // keeps Vite from bundling/splitting the giant asset). Passing the Blob as
  // `mainScriptUrlOrBlob` is essential for this KOKKOS/pthreads build: without
  // it, emscripten spawns each of the 8 pthread workers via
  // `new Worker(new URL("lammps-atomify.js", import.meta.url))`, and 8
  // concurrent 50 MB fetches overflow Chromium's disk cache
  // (net::ERR_CACHE_WRITE_FAILURE), aborting the module. With the Blob, every
  // pthread instantiates from the in-memory blob URL — no per-worker fetch.
  const moduleUrl: string = (
    (await import("lammps.js/wasm-atomify?url")) as { default: string }
  ).default;
  const blob = await (await fetch(moduleUrl)).blob();
  const blobUrl = URL.createObjectURL(blob);
  const createModule = (
    (await import(/* @vite-ignore */ blobUrl)) as {
      default: typeof import("lammps.js/wasm-atomify").default;
    }
  ).default;

  module = (await createModule({
    print: printLine,
    printErr: printLine,
    mainScriptUrlOrBlob: blob,
  })) as AtomifyWasmModule;
  native = new module.LAMMPSWeb();
  adapter = new LammpsAdapter(module, native);
  // Start the Kokkos runtime once, here in the worker where the pthread
  // handshake can block. Startup args are constant for the module's life;
  // per-simulation acceleration is decided by the script (see utils/kokkos.ts).
  adapter.start();
  adapter.setStepListener(streamStep);
  post({ type: "ready" });
}

ctx.onmessage = async (ev: MessageEvent<WorkerCommand>) => {
  const cmd = ev.data;
  try {
    switch (cmd.type) {
      case "load":
        await load();
        break;
      case "writeFile":
        if (module) {
          const slash = cmd.path.lastIndexOf("/");
          if (slash > 0) mkdirp(cmd.path.slice(0, slash));
          module.FS.writeFile(cmd.path, cmd.content);
        }
        break;
      case "mkdir":
        mkdirp(cmd.path);
        break;
      case "chdir":
        if (module) {
          mkdirp(cmd.path);
          module.FS.chdir(cmd.path);
        }
        break;
      case "start":
        // Kokkos is already running. The first run starts from the freshly
        // loaded module; every later run must reset LAMMPS state with `clear`
        // so a new script doesn't collide with the previous run's box/atoms.
        if (hasStartedARun) {
          adapter?.reset();
        }
        hasStartedARun = true;
        adapter?.setStepListener(streamStep);
        break;
      case "runFile": {
        // Always answer with runFinished (even on throw) so the proxy's
        // runFile promise — and the store's `await lammps.runFile` — can never
        // strand if something on the run path unexpectedly rejects.
        const { requestId } = cmd;
        runActive = true;
        try {
          if (adapter) {
            await adapter.runFile(cmd.path);
          }
        } catch (error) {
          post({
            type: "error",
            message: error instanceof Error ? error.message : String(error),
          });
        } finally {
          runActive = false;
          // Run is over (wasm no longer suspended): apply commands that
          // arrived after the last step callback.
          flushDeferredNativeCalls();
          post({
            type: "runFinished",
            requestId,
            error: adapter
              ? adapter.getErrorMessage()
              : "LAMMPS module not loaded",
          });
        }
        break;
      }
      case "cancel":
        adapter?.cancel();
        break;
      case "pause":
        // The adapter's between-step wait loop reads this worker-local flag.
        setPausedFlag(cmd.paused);
        break;
      case "setSyncFrequency":
        callNativeSafely(() => adapter?.setSyncFrequency(cmd.every));
        break;
      case "setBuildNeighborlist":
        callNativeSafely(() => adapter?.setBuildNeighborlist(cmd.build));
        break;
      case "setBondDistance":
        callNativeSafely(() =>
          adapter?.setBondDistance(cmd.type1, cmd.type2, cmd.distance),
        );
        break;
      case "clearBondDistances":
        callNativeSafely(() => adapter?.clearBondDistances());
        break;
      case "setPerAtomModifier":
        perAtomTarget = cmd.name
          ? { category: cmd.category, name: cmd.name }
          : null;
        break;
      case "runCommand":
        callNativeSafely(() => adapter?.runCommand(cmd.command));
        break;
    }
  } catch (error) {
    post({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

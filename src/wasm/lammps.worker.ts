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
import type { AtomifyWasmModule } from "./types";
import type { WorkerCommand, WorkerEvent } from "./workerMessages";
import type {
  LAMMPSWeb as NativeLammps,
  ParticleSnapshot,
  BoxSnapshot,
} from "lammps.js";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

let module: AtomifyWasmModule | undefined;
let native: NativeLammps | undefined;
let adapter: LammpsAdapter | undefined;

function post(event: WorkerEvent, transfer?: Transferable[]) {
  ctx.postMessage(event, transfer ?? []);
}

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

  const box: BoxSnapshot = native.syncSimulationBox();
  const matrixBase = box.matrix.ptr / 4;
  const boxMatrix = new Float32Array(
    module.HEAPF32.subarray(matrixBase, matrixBase + 9),
  );
  const originBase = box.origin.ptr / 4;
  const origin = new Float32Array(
    module.HEAPF32.subarray(originBase, originBase + 3),
  );

  post(
    {
      type: "step",
      step: native.getCurrentStep(),
      count,
      positions: positions.buffer,
      types: types.buffer,
      ids: ids.buffer,
      boxMatrix: boxMatrix.buffer,
      origin: origin.buffer,
      dimension: box.dimension,
      runMode: native.getRunMode(),
      runStepsDone: native.getRunStepsDone(),
      runStepsTotal: native.getRunStepsTotal(),
    },
    [positions.buffer, types.buffer, ids.buffer, boxMatrix.buffer, origin.buffer],
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
  // Start the Kokkos runtime (thread pool + kk suffix) once, here in the
  // worker where the pthread handshake can block.
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
        // Kokkos is already running and runFile() clears its own cancel state,
        // so a run-start just needs the step listener installed (idempotent).
        adapter?.setStepListener(streamStep);
        break;
      case "runFile":
        if (adapter) {
          await adapter.runFile(cmd.path);
          post({
            type: "runFinished",
            requestId: cmd.requestId,
            error: adapter.getErrorMessage(),
          });
        } else {
          post({
            type: "runFinished",
            requestId: cmd.requestId,
            error: "LAMMPS module not loaded",
          });
        }
        break;
      case "cancel":
        adapter?.cancel();
        break;
      case "setSyncFrequency":
        adapter?.setSyncFrequency(cmd.every);
        break;
      case "setBuildNeighborlist":
        adapter?.setBuildNeighborlist(cmd.build);
        break;
      case "setBondDistance":
        adapter?.setBondDistance(cmd.type1, cmd.type2, cmd.distance);
        break;
      case "clearBondDistances":
        adapter?.clearBondDistances();
        break;
      case "runCommand":
        adapter?.runCommand(cmd.command);
        break;
    }
  } catch (error) {
    post({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Which lammps.js wasm build the engine worker loads.
 *
 * - "threaded": the atomify build (lammps.js/wasm-atomify), a multithreaded
 *   KOKKOS/pthreads module. It needs SharedArrayBuffer, so the page must be
 *   cross-origin isolated (COOP/COEP, see index.html).
 * - "serial": the atomify-serial build (lammps.js/wasm-atomify-serial), the
 *   same package set without KOKKOS or pthreads. It needs no
 *   SharedArrayBuffer, so it runs where isolation is unavailable: Safari,
 *   which does not support the COEP credentialless policy Atomify uses, or a
 *   browser that blocks the isolation service worker.
 */
export type EngineVariant = "threaded" | "serial";

/** Pick the build the current context can run: threaded when isolated. */
export function pickEngineVariant(
  scope: {
    crossOriginIsolated?: boolean;
    SharedArrayBuffer?: unknown;
  } = globalThis,
): EngineVariant {
  return scope.crossOriginIsolated === true &&
    typeof scope.SharedArrayBuffer === "function"
    ? "threaded"
    : "serial";
}

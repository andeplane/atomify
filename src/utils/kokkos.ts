/**
 * Per-simulation KOKKOS opt-in.
 *
 * LAMMPS is always started with constant args `-k on t <threads> -sf kk`
 * (constant, because Kokkos::initialize is one-shot per wasm module — the
 * startup mode can never change within a session; see lammpsAdapter). With the
 * `kk` suffix globally on, an opted-in script runs fully accelerated with no
 * modification.
 *
 * A script opts in by containing a `suffix kk` line (a self-documenting no-op
 * under the global `-sf kk`). Scripts WITHOUT the marker must run their styles
 * serially — forcing `/kk` on everything breaks e.g. hybrid bonded styles
 * ("Must use only Kokkos-enabled dihedral styles with dihedral_style
 * hybrid/kk"). For those, the files written to the wasm filesystem are
 * preprocessed:
 *
 *  - `suffix off` is prepended to the main input script, so every style uses
 *    its plain serial implementation (measured: identical speed to a true
 *    serial build), and
 *  - every `atom_style` command (main script or include files) is wrapped in
 *    `suffix kk` / `suffix off`, because `-k on` requires a Kokkos-enabled
 *    atom container regardless of which styles run, and
 *  - every `pair_style hybrid...` command is wrapped the same way, because
 *    KOKKOS refuses a plain pair hybrid ("Must use pair_style hybrid/kk") —
 *    unlike the bonded hybrids, pair hybrid/kk accepts serial sub-styles.
 *    (`run_style verlet/kk` and `min_style cg/kk` are the defaults under
 *    `-sf kk`, so they need no handling.)
 *
 * The preprocessing is write-time only — the store/editor keep the original
 * script text.
 */

/**
 * KOKKOS thread count for the constant startup args (`-k on t 4`). The value
 * is fixed for the whole session: Kokkos::initialize is one-shot per wasm
 * module (first startWithArgs, at engine load in the worker), and the
 * module's pthread pool itself is sized at load (PTHREAD_POOL_SIZE 8). 4 is
 * the sweet spot measured for the wasm build and is what the New Run modal's
 * Multithreading toggle promises.
 */
export const KOKKOS_THREADS = 4;

/** True if the script opts into KOKKOS acceleration via a `suffix kk` line. */
export function scriptOptsIntoKokkos(content: string): boolean {
  return /^\s*suffix\s+kk\b/im.test(content);
}

/**
 * Opt a script into KOKKOS acceleration (the Multithreading toggle): prepend
 * the `suffix kk` marker unless the script already carries it. Applied to the
 * materialized run copy only — the working tree and the run snapshot keep the
 * user's original text.
 */
export function injectKokkosOptIn(content: string): string {
  if (scriptOptsIntoKokkos(content)) {
    return content;
  }
  return "suffix kk # injected by the Multithreading toggle\n" + content;
}

/**
 * Rewrite a command file so its styles run serially under the global
 * `-sf kk`: wrap `atom_style` and `pair_style hybrid...` lines in
 * `suffix kk`/`suffix off` (both are required to be Kokkos-enabled by
 * `-k on`; everything else may stay serial) and, for the main input script,
 * prepend `suffix off`. Safe on non-command files: the anchored regexes only
 * match literal command lines, which data/potential files never have.
 */
export function prepareScriptForSerialStyles(
  content: string,
  options: { isMainScript: boolean },
): string {
  let result = content.replace(
    /^([ \t]*)((?:atom_style\b|pair_style[ \t]+hybrid\b).*)$/gm,
    "$1suffix kk\n$1$2\n$1suffix off",
  );
  if (options.isMainScript) {
    result = "suffix off\n" + result;
  }
  return result;
}

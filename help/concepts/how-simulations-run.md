# How simulations run

## LAMMPS in a worker

Atomify's engine is LAMMPS compiled to WebAssembly, a format browsers run at close to native speed. It runs in a **web worker**, a background thread, so the page stays responsive while it computes.

The first time you open Atomify, the browser downloads the engine (tens of megabytes) and compiles it; the sidebar shows **Engine loading… NN%**. Later visits use the cached copy.

## Cross-origin isolation

The engine uses several threads that share memory (`SharedArrayBuffer`). Browsers only allow that on pages that are **cross-origin isolated**. GitHub Pages can't send the headers that turn this on, so Atomify installs a small service worker that adds them, which is why the page reloads once on your first visit. If isolation fails, the engine reports **The simulation engine requires cross-origin isolation.** See [Troubleshooting](/faq/troubleshooting).

## What happens when you click run

1. Atomify makes the run's folder and snapshot ([Projects and runs](/concepts/projects-and-runs)).
2. It hands the files to the engine and starts LAMMPS on the input script.
3. Every few timesteps, LAMMPS pauses briefly while Atomify copies the atom positions and the analysis values to the page: a **sync**. The 3D view and plots update. See [Sync, speed and live analysis](/concepts/sync-and-speed).
4. Output files are copied into the run folder as they're written, and all of them at the end, along with `log.lammps` and a picture of the final frame.

## One simulation at a time

There is one engine, so one simulation runs at a time. Further runs (from a sweep, or from another project) wait in a queue.

After a run completes, its atoms stay loaded in the engine until the next run starts. That's what makes [Continue simulation](/guide/continue-a-run) possible, and why it isn't available after a reload or another run.

## Multithreading

The engine is a KOKKOS build. Scripts that say `suffix kk` use 4 threads; others run on one. See [Multithreading](/guide/multithreading).

## If the engine crashes

If the engine runs out of memory or hits an internal error, Atomify shows **The simulation engine crashed** and asks you to reload the page. Your projects and completed runs are safe; the run that was going stops.

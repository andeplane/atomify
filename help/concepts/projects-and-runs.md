# Projects and runs

Atomify organizes work the way a careful researcher would: **every result can be traced back to exactly what produced it.**

## A project is a folder

A project is a folder of files: input scripts, data files, potentials, notebooks. These top-level files are the **working tree**, and they're what you edit. The project also has a permanent **folder name**, chosen when you create it, which the notebook uses in paths. Renaming the project changes only its display name, so notebook code never breaks.

## A run is a snapshot plus results

When you run a script, Atomify:

1. creates a new folder, `runs/run-001`, then `run-002`, and so on;
2. copies the working tree into it, a **snapshot** of the inputs at that moment;
3. runs LAMMPS inside that folder, so its log and output files land next to the snapshot;
4. records what happened in `.atomify/run.json`: status, parameters, timing, errors.

![The Runs tab](/screenshots/runs-tab.webp)

Because of this:

- **Editing during a run is safe.** The run has its own copy.
- **Old results stay explainable.** Open `runs/run-004/in.melt` to see exactly the script that produced run #004, even if you've changed it twenty times since.
- **Runs are easy to compare.** They all have the same layout, so the notebook can loop over `runs/*/log.lammps`.

See [Project and run folders](/reference/run-directory) for the details.

## Sweeps are just runs

A [sweep](/guide/sweeps) creates several ordinary runs, each with its own parameter values recorded in `run.json`, plus a shared sweep id that groups them. Nothing about a sweep is special afterwards: each run can be opened, deleted or analyzed like any other.

## Quick runs are throwaway projects

A [quick run](/guide/quick-runs) is a project kept only in memory. It works the same way, with runs and snapshots, but it disappears when you reload. **Save as project** turns it into a real one.

## The input script

A project can contain many scripts, but one is its **input script**: what **Save & run simulation** runs. Scripts are files with `.in` in their name, like `in.melt`, `melt.in` or `run.in.npt`. This keeps the main action one click, while **Run this file** lets you try other scripts without changing it.

# Known limitations

Things Atomify doesn't do (yet), so you can plan around them.

## Browsers and devices

- **No Safari, iPhone or iPad.** Desktop Chrome, Firefox, Edge and other Chromium browsers only.
- **Projects live in one browser.** No sync between browsers or computers; use download and import.

## Simulations

- **Performance.** About half of native single-threaded speed; at most 4 threads; at most 4 GB of memory.
- **A fixed set of LAMMPS packages.** See [The LAMMPS engine](/reference/lammps-engine).
- **No commands during a run.** You can pause and stop, but not change the simulation while it runs.
- **One simulation at a time.** Further runs queue.
- **Script names.** Only files with `in.` or `.in` in their name (`in.melt`, `melt.in`, `run.in.npt`) are recognized as scripts.
- **Top-level files only.** Files in subfolders aren't copied into a run, so scripts can't read them.
- **Continue** works only right after a run, before a reload or another run.
- **Directives** (`#/atom`, `#/bond`, `#/camera`) are read from the input script only, not from included files.

## Results

- **Live analysis only.** Plots of computes, fixes and variables exist while the run is live. Keep what you need in `log.lammps` or output files.
- **No trajectory replay.** A finished run shows its final frame. Write a dump file to keep a trajectory.
- **No image or movie export.** Use full screen and a screenshot or screen recorder.
- **Large outputs** (over 4 MB) arrive in the run folder only when the run ends.

## Interface

- **No pause indicator.** Watch the step counter.
- **Browser Back leaves the app.** Use the in-app navigation.
- **Color atoms and Slice reset** at every run.
- **Custom example libraries fail silently** and show the bundled examples instead.
- **No search in the Example library screen.** Search is in **New project → From example**.

Have an idea or need one of these? [Open an issue](https://github.com/andeplane/atomify/issues).

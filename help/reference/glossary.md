# Glossary

**Computes, Fixes and Variables lists**
: The lists in the run's side panel, which you can plot while the run is live. See [Live plots](/guide/live-plots).

**Continuation**
: A run that continues where a completed run left off, made with **Continue simulation**. See [Continue a simulation](/guide/continue-a-run).

**Directive**
: A comment line starting with `#/` in an input script, which tells Atomify how to draw atoms, bonds or the camera. See [Script directives](/reference/directives).

**Engine**
: LAMMPS compiled to WebAssembly, running in your browser.

**External run**
: A folder under `runs/` that Atomify didn't create, for example one written from the notebook.

**Folder name**
: The project's permanent folder, like `lj-melt/`. The notebook sees files under it. Renaming a project changes its display name, not its folder.

**Input script**
: The script a project runs when you click **Save & run simulation**, marked **Input script** in the Files tab. Scripts are files with `.in` in their name, like `in.melt`, `melt.in` or `run.in.npt`.

**Parameter**
: A variable defined with a plain number in the input script (`variable T equal 1.44`), which you can change per run or sweep.

**Project**
: A folder with your input files (the working tree) and the history of every run. See [Projects and runs](/concepts/projects-and-runs).

**Quick run**
: A temporary run of an example, without a project. See [Quick runs](/guide/quick-runs).

**Run**
: One execution of a script, numbered #001, #002, …, with its own folder `runs/run-NNN/`.

**Snapshot**
: The copy of the project's files a run takes when it starts. It's read-only.

**Structure view**
: A run that only shows a structure without integrating any steps, made with **View structure** or a script without `run`. See [View a data file](/guide/data-files).

**Sweep**
: Several runs of the same script with different parameter values, queued together. See [Sweep parameters](/guide/sweeps).

**Sync**
: The moment the engine pauses to send atom positions and analysis values to the screen. It happens every **Simulation speed** timesteps. See [Sync, speed and live analysis](/concepts/sync-and-speed).

**Working tree**
: The project's own files at the top level of its folder, which you edit. Runs take snapshots of it.

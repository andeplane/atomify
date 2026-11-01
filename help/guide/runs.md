# Run simulations

Every time you run a project's script, Atomify creates a **run**: a numbered record (#001, #002, …) with its own folder under `runs/` holding a snapshot of the inputs, the LAMMPS log and any output files. This page covers starting, stopping and managing runs.

## Start a run

Click **Save & run simulation** in the project header. Atomify saves any pending edits, then runs the project's **input script** and takes you to the new run's detail screen.

How Atomify picks the script:

- If the project has an input script (marked **Input script** in the Files tab), it runs that.
- If it has no input script but exactly one script (a file with `.in` in its name, like `in.melt`), it makes that the input script and runs it.
- If it has several scripts and none is the input script, it asks you to choose. If it has no scripts at all, it says so and offers **Go to Files**.

![Choosing an input script](/screenshots/script-chooser.webp)

The button is disabled while the engine is loading and while the project already has a run going.

## Run options

The arrow next to **Save & run simulation** opens **Run options**:

![Run options](/screenshots/run-menu.webp)

- **Save & run simulation**: the same as the main button; it uses the variable values in the script.
- **Sweep variables…**: opens the **New run** dialog, where you can set a variable to a different value for this run, or [sweep](/guide/sweeps) it over several values. The dialog also has the [Multithreading](/guide/multithreading) switch.
- **Choose input script…**: pick which script is the project's input script.

To run one script once without changing the input script, use its ▶ **Run this file** button in the [Files tab](/guide/files#row-actions).

## The Runs tab

![The Runs tab](/screenshots/runs-tab.webp)

Every run of the project, newest first. Each row shows the run number, its status, the script, its parameters (for example **T = 1.5**), when it ran, its atoms, how long it took and how many steps, and its folder. Click a row to open the run.

### Statuses

| Status           | Meaning                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Running**      | In progress, with a progress bar.                                                                                |
| **Queued**       | Waiting for the current run to finish (part of a sweep).                                                         |
| **Completed**    | LAMMPS finished the script.                                                                                      |
| **Failed**       | LAMMPS stopped with an error. Open the run to see it in the status panel and the console.                        |
| **Canceled**     | You stopped it.                                                                                                  |
| **Interrupted**  | The page was closed or reloaded during the run. Its partial outputs are kept.                                    |
| **External run** | A folder under `runs/` that Atomify didn't create (for example one written by the notebook). It has no metadata. |

![A failed run](/screenshots/run-failed.webp)

## Stop a run

Click **Stop** in the run header (it's also available in full screen). The simulation stops at its next update, and everything it wrote so far is kept.

## When a run finishes

If you're on another screen when a run finishes, a notification such as **Run #002 finished** appears, with buttons to **View** the run or **Analyze in notebook**. When the outcome is already known it says so instead: completed, failed, canceled or interrupted.

![A run-finished notification](/screenshots/run-finished-toast.webp)

## Run one at a time

Atomify runs one simulation at a time, across all projects. Runs that can't start yet wait in a queue: the rest of a sweep, or a run you start in another project while a simulation is going. They start automatically, in order, as soon as the current run finishes. Within one project, **Save & run simulation** is disabled while that project has a run going.

## Delete a run

In the Runs tab, hover over a run, click its trash icon and confirm **Delete run**. This deletes `runs/run-NNN` with its snapshot and outputs, and can't be undone.

## Reloading during a run

If you reload or close the tab while a simulation runs, it stops. Next time you open the project, Atomify marks the run **Interrupted** and tells you how many interrupted runs it found. Partial outputs are kept.

## If storage is full

A run fails with **Browser storage is full — free space in Settings > Storage.** if there's no room for its outputs. See [Manage browser storage](/guide/storage).

## Related

- [Watch a run](/guide/watch-a-run)
- [Sweep parameters](/guide/sweeps)
- [Continue a simulation](/guide/continue-a-run)
- [Project and run folders](/reference/run-directory)

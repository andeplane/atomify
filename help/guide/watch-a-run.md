# Watch a run

The run detail screen opens when you start a run, or when you click a run in the Runs tab.

![A live run](/screenshots/run-detail-live.webp)

## The header

From left to right: **Runs** (back to the list), the run number and status, its parameters (if any), and its folder, `runs/run-NNN`. Then the buttons that apply to this run:

| Button                      | When                          | Guide                                                                                 |
| --------------------------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| **Color atoms**             | live runs and structure views | [Color atoms](/guide/color-atoms)                                                     |
| **Images 1×1×1**            | live runs and structure views | [Periodic images](/guide/periodic-images)                                             |
| **Slice**                   | live runs and structure views | [Slice](/guide/slice)                                                                 |
| **Stop**                    | while running                 | [Run simulations](/guide/runs#stop-a-run)                                             |
| **Continue simulation**     | completed runs                | [Continue a simulation](/guide/continue-a-run)                                        |
| **Run full sequence again** | continued runs                | [Continue a simulation](/guide/continue-a-run#after-a-reload-run-full-sequence-again) |
| **Analyze in notebook**     | projects (not quick runs)     | [Notebook analysis](/guide/notebook)                                                  |

## The 3D view

While the run is live, the 3D view shows the atoms as LAMMPS moves them. The top-left corner shows the script name, a progress bar and **step X of Y**.

- Move the camera with the mouse or keyboard: see [Move the camera](/guide/camera).
- Click atoms to select and measure them: see [Select atoms and measure](/guide/select-atoms).

When the run is over, the view shows the **final frame**, a picture of the last state. Atomify doesn't store trajectories, so you can't scrub through a finished run; run it again to watch it live. If no frame was captured (for example because you left the run screen before it finished), the view says **No frame was captured for this run** and offers **Run again**.

### Full screen

The button in the top-right corner of the view makes it fill the screen. Press <kbd>Esc</kbd> or click **Exit full screen** to leave. **Stop** is available in full screen, and full screen ends by itself when the run finishes.

![Full screen](/screenshots/fullscreen.webp)

## Pause and speed

- <kbd>Space</kbd> pauses and resumes. There's no on-screen pause indicator: if the step counter isn't moving, the simulation is paused.
- **Simulation speed** in the side panel (1 to 200), or the keys <kbd>1</kbd>–<kbd>9</kbd>:

  | Key   | <kbd>1</kbd> | <kbd>2</kbd> | <kbd>3</kbd> | <kbd>4</kbd> | <kbd>5</kbd> | <kbd>6</kbd> | <kbd>7</kbd> | <kbd>8</kbd> | <kbd>9</kbd> |
  | ----- | ------------ | ------------ | ------------ | ------------ | ------------ | ------------ | ------------ | ------------ | ------------ |
  | Speed | 1            | 2            | 4            | 6            | 10           | 20           | 50           | 100          | 200          |

The speed is the number of timesteps LAMMPS computes between two screen updates. Higher means the run finishes sooner, but the motion is choppier and live plots get fewer points. See [Sync, speed and live analysis](/concepts/sync-and-speed).

::: tip Shortcuts not responding?
Keyboard shortcuts are ignored while you're typing in a field or when a button has keyboard focus. Click the 3D view, then press the key.
:::

## The console

The bar under the 3D view, **console — log.lammps**, expands to show LAMMPS's output. While the run is live it says **following** and scrolls along. Click the bar to expand or collapse it; Atomify remembers your choice for this browser tab.

![The console](/screenshots/run-console.webp)

The console shows the last 2000 lines while running. The complete output is always saved to the run's `log.lammps`.

## The side panel

![The side panel during a run](/screenshots/side-panel-live.webp)

**Status.** While running: **Run type** (Dynamics or Minimization), **Atoms**, **Step**, **Remaining**, **Steps / second** and **Memory**. After the run: **Status**, **Atoms**, **Total steps**, **Duration** and **Output files**. If the run failed, the error message is shown here.

**Simulation speed.** The slider described above, while the run is live.

**Output files.** Files the run writes (dumps, `fix print` files, `log.lammps`) appear as they're written, refreshing every few seconds. Click a text file to open it read-only.

**Computes, Fixes and Variables.** While the run is live, every quantity you can plot. See [Live plots](/guide/live-plots).

## Related

- [Move the camera](/guide/camera)
- [Keyboard and mouse reference](/reference/keyboard-shortcuts)

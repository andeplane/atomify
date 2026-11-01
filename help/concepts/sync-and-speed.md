# Sync, speed and live analysis

To show a simulation live, Atomify regularly pauses LAMMPS to copy the atoms' positions and the values of your computes, fixes and variables to the page. Each of these pauses is a **sync**.

## Simulation speed

**Simulation speed** (the slider in the side panel, or keys <kbd>1</kbd>–<kbd>9</kbd>) is the number of timesteps between two syncs.

| Speed | Syncs                | Motion on screen | Run time | Plot resolution |
| ----- | -------------------- | ---------------- | -------- | --------------- |
| 1     | every timestep       | smoothest        | slowest  | every timestep  |
| 10    | every 10th timestep  | faster, jumpier  | faster   | every 10 steps  |
| 200   | every 200th timestep | fast-forward     | fastest  | every 200 steps |

A sync costs time: copying data and drawing a frame. For small systems that's most of the time, so raising the speed makes the run finish much sooner. For large systems the computation dominates and speed matters less.

The default is 1. A good habit: watch the start at speed 1, then press <kbd>7</kbd> or <kbd>8</kbd> to get through the rest.

## What else syncs affect

- **Live plots** get one point per sync. To resolve fast changes, lower the speed.
- **Pause** (<kbd>Space</kbd>) and **Stop** take effect at the next sync. At speed 200 on a large system that can take a moment.
- **Selected-atom measurements** update at each sync.

## Why analysis is live-only

The **Computes**, **Fixes** and **Variables** lists read values straight from the running engine. Nothing is stored except what LAMMPS itself writes. That keeps runs light, but it means:

- After a run ends, these lists are gone. Use `thermo_style` or `fix ave/time … file` to keep values, and the [notebook](/guide/notebook) to analyze them.
- A finished run shows its final frame, not a replay. Atomify doesn't store trajectories unless your script writes a dump file.

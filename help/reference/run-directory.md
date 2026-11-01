# Project and run folders

A project is a folder. Everything Atomify knows about it is in files you can see in the Files tab and the notebook.

```
lj-melt/                       the project folder (its name never changes)
├── in.melt                    your files: the "working tree"
├── data.lmp
├── analysis.ipynb             the starter notebook
├── .atomify/
│   └── project.json           name, color, input script
└── runs/
    ├── run-001/               one folder per run
    │   ├── in.melt            snapshot of the inputs when the run started
    │   ├── data.lmp
    │   ├── log.lammps         the complete LAMMPS output
    │   ├── dump.lammpstrj     whatever the script wrote
    │   └── .atomify/
    │       ├── run.json       status, parameters, timing
    │       └── frame.png      the final frame
    └── run-002/
```

## What a run folder contains

**The snapshot.** When a run starts, Atomify copies the project's **top-level** files into the run folder. Not copied: subfolders, `runs/`, `.atomify/` and notebooks. Files larger than 64 MB are not copied; the run records their name, size and checksum instead.

Because the run works on its own copy, you can edit files during a run without affecting it, and you can always see exactly what produced a result.

**Outputs.** Files the script writes appear in the run folder. Files up to 4 MB are copied while the run is going, every few seconds; everything is copied when it ends. Internal helper files are left out.

**`log.lammps`** holds the full console output, without the 2000-line limit of the live console.

**`.atomify/frame.png`** is a picture of the final state, shown when you open a finished run and as the project's thumbnail on Home. It's only captured if the run screen was open when the run ended.

## run.json

`runs/run-NNN/.atomify/run.json` describes the run:

| Field                     | Meaning                                                        |
| ------------------------- | -------------------------------------------------------------- |
| `id`                      | The run's folder name, for example `run-002`.                  |
| `status`                  | `running`, `completed`, `failed`, `canceled` or `interrupted`. |
| `inputScript`             | The script that ran.                                           |
| `vars`                    | Parameter values set for this run, for example `{"T": 1.5}`.   |
| `sweepId`                 | Shared by all runs of one sweep.                               |
| `startedAt`, `finishedAt` | Timestamps (ISO 8601).                                         |
| `stats`                   | `timesteps`, `numAtoms` and `wallSeconds`.                     |
| `error`                   | The LAMMPS error message, if it failed.                        |
| `viewOnly`                | `true` for a structure view (no dynamics).                     |
| `continuationOf`          | The run this one continued, for continued runs.                |
| `continuedFromTimestep`   | The step it continued from.                                    |
| `replayOf`                | The run a **Run full sequence again** replayed.                |
| `snapshotGaps`            | Files left out of the snapshot because of their size.          |
| `origin`                  | `app`, `sweep` or `notebook`.                                  |

The starter notebook reads `vars` to label runs. A folder under `runs/` without `run.json` is listed as an **External run**.

## project.json

`.atomify/project.json` stores the project's display name, color, creation time, its input script, and where it came from (blank, an example, an upload). It's included when you download the project, so an imported zip keeps its name and color.

# What is Atomify?

Atomify runs [LAMMPS](https://www.lammps.org), the widely used molecular dynamics code, directly in your web browser. You write (or pick) a LAMMPS input script, press run, and watch the atoms move in a 3D view while plots of temperature, energy and anything else you compute update live.

There is nothing to install and no account to create. Open [andeplane.github.io/atomify](https://andeplane.github.io/atomify/) and you are ready.

![A live simulation in Atomify](/screenshots/run-detail-live.webp)

_A live simulation: the 3D view on the left, the status panel and live analysis on the right, and the LAMMPS console underneath._

## What runs where

Everything happens on your own computer, inside the browser tab:

| Part                  | What it is                                                                                                      |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Simulation engine** | LAMMPS compiled to WebAssembly, running in a background worker so the page stays responsive.                    |
| **3D view**           | A WebGL renderer that draws atoms, bonds, the simulation box and walls, with ambient occlusion and lighting.    |
| **Projects and runs** | Files stored in your browser's own database (IndexedDB). Each run gets its own folder with inputs and outputs.  |
| **Notebook**          | JupyterLite: a full Jupyter notebook with a Python kernel (Pyodide) that reads the same files as your projects. |

Nothing is uploaded to a server. See [Where your data lives](/concepts/where-your-data-lives).

## Who it is for

- **Teaching.** Students can run real simulations from a link, on any laptop, without installing anything. Teachers can publish their own [example library](/tutorials/example-library).
- **Trying out and debugging scripts.** See immediately what a script does to the atoms, catch a wrong lattice or a missing fix in seconds, and iterate.
- **Quick visual checks** of a data file or a structure (see [View a data file](/guide/data-files)).
- **Small studies.** Sweep a parameter over a few values and compare the runs in the notebook.

## What it is not

Atomify is not a replacement for running LAMMPS on a workstation or a cluster:

- It runs at roughly half the speed of native, single-threaded LAMMPS. [Multithreading](/guide/multithreading) uses up to 4 threads.
- The engine can use at most 4 GB of memory.
- It includes a fixed set of LAMMPS packages. See [The LAMMPS engine](/reference/lammps-engine).

A good rule of thumb: systems up to tens of thousands of atoms run comfortably; much larger ones work but slowly.

## Free and open source

Atomify is made by Anders Hafreager and is free and open source. The code is on [GitHub](https://github.com/andeplane/atomify). See [Getting help](/faq/getting-help) to report a bug or ask a question.

## Next steps

- Check the [browser requirements](/getting-started/requirements).
- Do the [two-minute quick start](/getting-started/quick-start).
- Take [a tour of the interface](/getting-started/interface-tour).

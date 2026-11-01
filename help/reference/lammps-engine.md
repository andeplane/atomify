# The LAMMPS engine

Atomify runs real [LAMMPS](https://www.lammps.org), compiled to WebAssembly with Emscripten, through the [lammps.js](https://www.npmjs.com/package/lammps.js) package. The LAMMPS version is printed on the first line of every run's console and `log.lammps`.

## Included packages

Besides the LAMMPS core, the engine includes these packages:

| Package        | Gives you, for example                                                        |
| -------------- | ----------------------------------------------------------------------------- |
| MOLECULE       | Bonds, angles, dihedrals; `atom_style full` and `molecular`                   |
| EXTRA-MOLECULE | More bond, angle and dihedral styles                                          |
| KSPACE         | Long-range electrostatics: Ewald, PPPM                                        |
| MANYBODY       | Tersoff, Stillinger-Weber, Vashishta, EAM-like and other many-body potentials |
| REAXFF         | Reactive force field ReaxFF                                                   |
| QEQ            | Charge equilibration                                                          |
| RIGID          | Rigid bodies                                                                  |
| GRANULAR       | Granular materials                                                            |
| CLASS2         | COMPASS-type class 2 force fields                                             |
| MC             | Monte Carlo moves, `fix gcmc`, `fix bond/create`                              |
| SHOCK          | Shock simulations                                                             |
| MISC           | Miscellaneous styles                                                          |
| VORONOI        | Voronoi tessellation (`compute voronoi/atom`)                                 |
| COLVARS        | Collective variables                                                          |
| KOKKOS         | Multithreading (see below)                                                    |

Plus the extra pair styles used by moltemplate's examples. A command from a package that isn't included stops the run with an "Unrecognized … style" error.

## Threads and memory

- **Multithreading.** The engine is a KOKKOS build with 4 threads. Scripts use it when they include `suffix kk` (or with the **Multithreading** switch in the New run dialog); otherwise they run single-threaded. See [Multithreading](/guide/multithreading). On a 13,500-atom Lennard-Jones melt, 4 threads are about 3× faster than one.
- **Memory.** The engine starts with 256 MB and can grow to 4 GB.
- **Speed.** Single-threaded, expect roughly half the speed of native LAMMPS on the same computer.

## Files

LAMMPS runs in its own folder containing the run's snapshot, so your script reads files by their plain names (`read_data data.lmp`, `pair_coeff * * SiO2.vashishta Si O`) and writes files the same way. See [Project and run folders](/reference/run-directory).

## No commands during a run

The engine runs one simulation at a time, and LAMMPS doesn't accept new commands while a `run` is going. To change something, stop the run, edit the script and run again, or use [Continue simulation](/guide/continue-a-run) after it finishes.

## In the notebook

The notebook can run LAMMPS too, with the `lammps-js` Python package. That engine is smaller: it includes the MOLECULE and KOKKOS packages only. See [Notebook analysis](/guide/notebook#run-lammps-from-python).

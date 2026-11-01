# Tracked computes, fixes and variables

While a run is live, Atomify reads these from LAMMPS at every screen update and lists them under **Computes**, **Fixes** and **Variables** in the side panel ([Live plots](/guide/live-plots)).

## Computes

| Style           | Shown as                                               |
| --------------- | ------------------------------------------------------ |
| `temp`          | Temperature over time                                  |
| `pressure`      | Pressure over time                                     |
| `pe`            | Potential energy over time                             |
| `ke`            | Kinetic energy over time                               |
| `msd`           | Mean square displacement (x, y, z and total) over time |
| `vacf`          | Velocity autocorrelation over time                     |
| `com`           | Center of mass over time                               |
| `gyration`      | Radius of gyration over time                           |
| `rdf`           | Radial distribution function, replaced at every update |
| `ke/atom`       | Per-atom; can color atoms                              |
| `property/atom` | Per-atom; can color atoms                              |
| `cluster/atom`  | Per-atom; can color atoms                              |
| `cna/atom`      | Per-atom; can color atoms                              |

LAMMPS defines `thermo_temp`, `thermo_press` and `thermo_pe` for every script, so these always appear. The `/kk` variants of these styles (with [multithreading](/guide/multithreading)) work the same.

## Fixes

| Style       | Shown as                                       |
| ----------- | ---------------------------------------------- |
| `ave/time`  | Its values over time                           |
| `ave/histo` | The latest histogram, replaced at every update |
| `ave/chunk` | The latest profile, replaced at every update   |

## Variables

| Style   | Shown as                  |
| ------- | ------------------------- |
| `equal` | Its value over time       |
| `atom`  | Per-atom; can color atoms |

## Coloring atoms

**Color atoms** offers per-atom computes and groups. See [Color atoms by a quantity](/guide/color-atoms).

## Everything else

Other computes and fixes work in LAMMPS as usual; they just don't appear in these lists. Print them with `thermo_style custom` or write them with `fix ave/time … file`, and analyze the output in the [notebook](/guide/notebook).

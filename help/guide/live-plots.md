# Live plots

While a run is live, the side panel lists every quantity Atomify can follow: computes, fixes and variables from your script. Click one to plot it.

![Computes, fixes and variables in the side panel](/screenshots/analysis-panel.webp)

## What appears

Entries are grouped under **Computes**, **Fixes** and **Variables**. Single numbers show their current value (to 5 significant digits) right in the list; click any entry to open its plot.

- **Computes**: `temp`, `pressure`, `pe`, `ke`, `rdf`, `msd`, `vacf`, `com`, `gyration` and the per-atom computes `ke/atom`, `property/atom`, `cluster/atom` and `cna/atom`. LAMMPS always defines `thermo_temp`, `thermo_press` and `thermo_pe`, so those appear for every script.
- **Fixes**: `ave/time`, `ave/histo` and `ave/chunk`.
- **Variables**: `equal`-style variables (one number) and `atom`-style variables.

Until the run sends its first update, the section says **Computes, fixes and variables appear once the run synchronizes.** See the [full list](/reference/tracked-quantities).

## Plot a quantity

Click an entry. A plot opens, titled with the entry's name:

![A live plot](/screenshots/analysis-figure-temp.webp)

- It starts from the beginning of the run, not from when you opened it, and keeps growing while it's open.
- The axes are labeled with units from the script's `units` command, for example **Time (τ)** and **Temperature** for `units lj`. See [Units on plot axes](/reference/units).
- Quantities with several values, like the four components of `msd`, are drawn as several lines with a legend.
- Histograms and profiles, like `rdf`, `fix ave/histo` and `fix ave/chunk`, show the latest result and are replaced at every update.

## Export CSV

Click **Export CSV** in the plot to download the data. The first column is `x` (time, or the bin coordinate for histograms) and each other column is one series. The file is named after the entry, for example `msd.csv`.

## How often points are added

Atomify collects a point every time the engine updates the screen, which is every **Simulation speed** timesteps. At speed 1 you get a point every step; at speed 100, one every hundred. Lower the speed for finer plots, raise it for faster runs. See [Sync, speed and live analysis](/concepts/sync-and-speed).

## After the run

Live plots exist only while the run is live. After it ends, the data is in the run's files. To keep a quantity, print it with `thermo_style custom` (it goes to `log.lammps`) or write it with `fix ave/time … file out.txt`, and analyze it in the [notebook](/guide/notebook).

## Related

- [Tutorial 3: Measure a diffusion coefficient](/tutorials/measure-diffusion)
- [Notebook analysis](/guide/notebook)

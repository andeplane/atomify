# Tutorial 3: Measure a diffusion coefficient

**Time:** 20 minutes. **You need:** the **LJ melt** project from [Tutorial 2](/tutorials/write-a-script).

In a liquid, each atom wanders away from where it started. Its mean square displacement (MSD) grows linearly in time, and the slope gives the diffusion coefficient: in three dimensions, MSD ≈ 6 D t. You will compute the MSD in LAMMPS, watch it live, export it, and fit D in the notebook.

## 1. Add the MSD to the script

In the **LJ melt** project, create a new file `in.diffusion` (Files → **New file**) and paste:

<<< @/snippets/in.diffusion{lammps}

Compared with `in.melt`, the end is new:

- `compute msd all msd` tracks the mean square displacement of all atoms. Its fourth value, `c_msd[4]`, is the total MSD.
- `variable D equal …` is a running estimate of D = MSD / (6 t). Early on it is meaningless; it converges as the run goes on.
- `thermo_style custom … c_msd[4] v_D` prints both in the log every 100 steps, so they are saved for later analysis.
- The run is longer, 20000 steps, to get a good straight line.

## 2. Make it the input script and run

The project now has two scripts, so tell Atomify which one to run. In the Files tab, hover over the `in.diffusion` row and click its target icon, **Set as input script**. The **Input script** chip moves to it. Click **Save & run simulation**.

::: tip Run a file without changing the input script
To try a script once without changing the input script, use the play icon on its row, **Run this file (doesn't change the input script)**, instead.
:::

## 3. Watch the MSD live

While the run is going, look at the lists under the speed slider in the side panel. You'll see:

- **Computes:** `msd`, plus the thermo computes `thermo_temp`, `thermo_press` and `thermo_pe` that LAMMPS always defines.
- **Variables:** `T` and `D`.

![Computes, fixes and variables in the side panel](/screenshots/analysis-panel.webp)

Click **msd**. The plot shows the MSD components against time in τ. After a short curved start (the atoms rattle in their cages before they escape), the total MSD rises in a straight line.

Close it and click **D** to watch the estimate of the diffusion coefficient settle.

::: warning Live plots exist only during the run
These lists are available while the run is live. After it finishes, the numbers are still in `log.lammps`, because the `thermo_style` line prints them, and that's what the notebook reads.
:::

## 4. Export the data

Open the **msd** plot again and click **Export CSV**. You get `msd.csv` with one column per series, ready for a spreadsheet or your own scripts.

## 5. Fit D in the notebook

When the run completes, click **Analyze in notebook** in the run header. The **Notebook** tab opens the project's `analysis.ipynb` in JupyterLite, a Jupyter notebook that runs in your browser and sees the project's files.

![The notebook](/screenshots/notebook.webp)

Run all cells (**Run → Run All Cells**). The starter notebook lists your runs and plots every thermo column of the latest one, including `c_msd[4]` and `v_D`. The first run takes a little while because it installs `lammps-logfile` and `pandas`.

Add a new cell at the end and run it:

```python
import glob
import numpy as np
import lammps_logfile

# The newest run's log. Each run has its own folder under runs/.
log = lammps_logfile.File(sorted(glob.glob("runs/run-*/log.lammps"))[-1])
t = log.get("Step") * 0.005          # LJ units: the default timestep is 0.005 τ
msd = log.get("c_msd[4]")

half = len(t) // 2                   # fit the second half, well into the linear regime
slope = np.polyfit(t[half:], msd[half:], 1)[0]
print("D =", slope / 6)
```

You should get a value close to the last `D` in the live plot, around 0.1 in LJ units for this hot liquid.

## What you learned

- Any `compute`, `fix ave/time` or `variable` you define shows up in the side panel and can be plotted and exported live.
- Put quantities you want to keep in `thermo_style`, so they end up in `log.lammps`.
- The notebook reads each run's files from `runs/run-NNN/`.

**Alternative:** the bundled example **2D diffusion coefficient MSD** does the same in two dimensions.

**Next:** [Tutorial 4: Sweep a parameter](/tutorials/parameter-sweep).

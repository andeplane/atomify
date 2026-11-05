# Notebook analysis

Every project has a **Notebook** tab with a full Jupyter notebook, JupyterLite, running in your browser. Its Python kernel sees the project's files, so it can read every run's log and outputs directly.

![The notebook](/screenshots/notebook.webp)

## Open it

- The **Notebook** tab of a project.
- **Analyze in notebook** in a run's header, or in the notification when a run finishes.

The first time, JupyterLite takes a little while to start. After that it stays alive while you switch between tabs and screens, so your variables and plots are still there when you come back. Opening another project's notebook starts a new session for that project.

**Open in new tab** opens the same notebook in its own browser tab, with JupyterLab's full menus and file browser.

Quick runs don't have a notebook. Save the quick run as a project first.

## The starter notebook

New projects come with `analysis.ipynb`. Its cells:

1. A title and a short explanation.
2. `%pip install -q lammps-logfile pandas` installs the libraries it uses.
3. Lists every run with its status and parameters.
4. Plots every thermo column of the newest run.
5. Compares one thermo quantity across all runs, labeled by their parameters. Set `quantity = "Temp"` to any column name, like `"PotEng"` or `"Press"`. Great for [sweeps](/guide/sweeps).
6. An optional, commented-out cell that runs LAMMPS from Python.

Choose **Run → Run All Cells** to run them all.

## Read a run's files

The notebook's working folder is the project folder. Each run's files are in `runs/run-NNN/`:

```python
import glob
import lammps_logfile

logs = sorted(glob.glob("runs/run-*/log.lammps"))   # every run, oldest first
log = lammps_logfile.File(logs[-1])                   # the newest
print(log.keywords)                                   # the thermo columns
temp = log.get("Temp")
```

Output files your script writes, like `fix ave/time … file profile.txt` or dump files, are next to the log, for example `runs/run-003/profile.txt`. Each run's parameters are in `runs/run-NNN/.atomify/run.json`.

## Install packages

Use `%pip install` in a cell. Packages come from PyPI and must be pure Python or available for Pyodide. NumPy, Matplotlib and pandas work.

## Theme

The notebook uses JupyterLab's dark theme by default. Change it in the notebook's **Settings → Theme** menu; it keeps its own theme separately from Atomify's.

## Files the notebook writes

Files you save from the notebook appear in the project's Files tab. A folder the notebook creates under `runs/` shows up in the Runs tab as an **External run**.

## Run LAMMPS from Python

The last cell of the starter notebook shows how to run LAMMPS inside the notebook with the `lammps-js` package. This engine is more limited than Atomify's: it includes the MOLECULE and KOKKOS packages only, so use Atomify's runs for anything else.

## Related

- [Tutorial 3: Measure a diffusion coefficient](/tutorials/measure-diffusion)
- [Project and run folders](/reference/run-directory)

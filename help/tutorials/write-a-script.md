# Tutorial 2: Write your own script

**Time:** 15 minutes. **You need:** to have done [Tutorial 1](/tutorials/first-simulation), or know how to move the camera.

You will create an empty project, write a LAMMPS script that melts a small Lennard-Jones crystal, run it, save a camera view into the script, and see how every run keeps a snapshot of the inputs that produced it.

## 1. Create a project

Click **New project** in the sidebar. Type the name **LJ melt**.

![The New project dialog](/screenshots/new-project-blank.webp)

Under the name, Atomify shows the project's folder name, `lj-melt/`. The notebook sees your files under that folder. You can rename the project later, but the folder name never changes, so notebook paths never break.

Keep **Blank** selected, pick a color if you like, and click **Create project**.

## 2. Create the script

You're on the **Files** tab of the new project. It is empty except for `analysis.ipynb`, the project's starter notebook.

Click **New file**, type `in.melt` and click **Create**.

::: warning Put .in in the script's name
Atomify recognizes a file as a LAMMPS input script when its name starts with `in.`, ends with `.in`, or contains `.in.`: `in.melt`, `melt.in` and `run.in.npt` all work. Other names, like `melt.lmp`, are treated as data files: they don't get a run button or LAMMPS highlighting.
:::

Click `in.melt` to open it in the editor and paste this script:

<<< @/snippets/in.melt{lammps}

What it does, line by line:

- `#/atom 1 0.6 #3F6EFF` is an Atomify directive, a comment LAMMPS ignores, that draws type 1 atoms with radius 0.6 in blue. See [Atom colors, sizes and bonds](/guide/atom-appearance).
- `variable T equal 1.44` defines the starting temperature. The `# initial temperature` comment becomes its label if you ever [sweep](/tutorials/parameter-sweep) it.
- `units lj` … `create_atoms 1 box` build a 6 × 6 × 6 fcc lattice: 4 atoms per cell, so 864 atoms.
- `velocity all create ${T} …` gives the atoms random velocities at temperature T.
- `pair_style` and `pair_coeff` set up the Lennard-Jones interaction, `fix 1 all nve` integrates Newton's equations, and `run 5000` runs 5000 timesteps.

The editor saves as you type. The indicator in the editor header shows **Saving…** and then **Saved**.

![The editor](/screenshots/editor.webp)

## 3. Run it

Click **Save & run simulation** in the project header. Because `in.melt` is the only script, it becomes the project's **input script** automatically: the Files tab marks it with an **Input script** chip from now on.

Watch the crystal melt. In the console, LAMMPS reports `Created 864 atoms`. When the run completes, the **Status** panel shows **Atoms** 864 and **Total steps** 5000.

![The completed run](/screenshots/run-detail-completed.webp)

## 4. Save the camera view in the script

Rotate and zoom to a view you like. Click the 3D view once (so it has keyboard focus) and press <kbd>c</kbd>. A notification says **Copied camera position and target to clipboard.**

Click **Runs** (top left) to go back, open the **Files** tab and open `in.melt`. Paste at the top of the script. You get two lines like:

```lammps
#/camera position 24.1 18.3 30.6
#/camera target 5.0 5.0 5.0
```

While you're there, change the color in the `#/atom` line, for example to `#F43F5E` (pink). Click **Save & run simulation**: run #002 starts from your camera view, with the new color.

## 5. Look at the run history

Open the **Runs** tab. Both runs are listed, newest first, with their status, number of atoms, duration and steps.

Now open the **Files** tab and click the `runs` folder, then `run-001`. It contains a copy of `in.melt` _as it was when run #001 started_, plus `log.lammps`. Open that copy of `in.melt`: it has no camera lines, and the editor says **Read-only — snapshot of run #001. Edit the working-tree copy instead.**

![A run's read-only snapshot](/screenshots/editor-snapshot.webp)

This is the most important idea in Atomify: **every run keeps an exact copy of its inputs**. You can keep editing your scripts, even during a run, without ever losing track of what produced a result. See [Projects and runs](/concepts/projects-and-runs).

## 6. Tidy up (optional)

To delete a run, hover over it in the **Runs** tab, click the trash icon and confirm with **Delete run**. Deleting can't be undone.

## What you learned

- Script names contain `in.` or `.in` (`in.melt`, `melt.in`); the project's **input script** is what **Save & run simulation** runs.
- The editor autosaves; `#/atom` and `#/camera` directives control how the system looks.
- Press <kbd>c</kbd> to copy the current camera as directives.
- Each run is a folder under `runs/` with a read-only snapshot of its inputs.

**Next:** [Tutorial 3: Measure a diffusion coefficient](/tutorials/measure-diffusion).

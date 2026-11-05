# A tour of the interface

This page names every part of Atomify and links to the guide for each. Atomify has four main screens: **Home**, the **Example library**, a **project workspace** with Files, Runs and Notebook tabs, and the **run detail** screen where you watch a simulation.

## The guided tour

On your first visit, a guided tour walks you through running your first simulation, step by step, following your real clicks. To replay it later, click **Take the tour** in the sidebar.

## Sidebar

The sidebar on the left is always visible.

![The sidebar](/screenshots/sidebar.webp){width=300}

From top to bottom:

- **Atomify logo** goes to Home. The small arrow next to it collapses the sidebar to a narrow icon rail, which gives the simulation more room. Atomify remembers your choice.
- **Home** and **Example library**.
- **Projects**: one row per project, with its color dot. The dot pulses while the project is running. The **+** button and the dashed **New project** button both create a project.
- **Examples**: every example in the library, in a scrollable list. Click a title to use it as a new project; click the play button to quick-run it.
- The **Engine loading…** chip, only while the engine loads.
- **Help** opens this documentation in a new tab. **About** shows the source code, author and how to get help.
- The **dark/light** theme switch and **Settings**.

![The sidebar collapsed to an icon rail](/screenshots/sidebar-collapsed.webp){width=90}

## Home

![Home, with recent projects](/screenshots/home-returning.webp)

- **Continue where you left off** reopens the project you used last (or the one that is running), with thumbnails of its latest runs.
- **Create new project** and **Quick-run an example**.
- **Recent projects** (up to 8) with run counts, size and when they were last changed.
- **Start from an example** shows four examples. Each has **Use as project** and a play button to quick-run it. **Browse the library** opens the full Example library.

See [Create and manage projects](/guide/projects) and [Quick runs](/guide/quick-runs).

## Example library

![The Example library](/screenshots/example-library.webp)

Every bundled example, with a picture, a short description and two buttons: **Use as project** copies its files into a new project, and **Quick run** starts it immediately as a temporary run. See [Use the example library](/guide/examples).

## Project workspace

When you open a project, the header shows its name, its folder name and the run controls:

- **Save & run simulation** saves any open edits and runs the project's input script. The arrow next to it opens **Run options** ([Run simulations](/guide/runs)).
- The **⋯** project menu: rename, duplicate, download and delete ([Create and manage projects](/guide/projects)).

Below the header are three tabs.

### Files

![The Files tab](/screenshots/files-tab.webp)

The project's working tree: your input scripts, data files and potentials, plus the `runs/` folder with one subfolder per run. Upload, create, edit, rename and delete files here. See [Manage files](/guide/files) and [Edit scripts](/guide/editor).

### Runs

![The Runs tab](/screenshots/runs-tab.webp)

Every run of this project, newest first, with its status, parameters, atoms, duration and steps. Runs of a sweep are grouped under a sweep header. Click a run to open its detail screen. See [Run simulations](/guide/runs).

### Notebook

A Jupyter notebook (JupyterLite) that runs in your browser and sees the project's files, including every run's log and outputs. See [Notebook analysis](/guide/notebook).

## Run detail

![The run detail screen during a run](/screenshots/run-detail-live.webp)

Where you watch a simulation and look at its results:

- **Header**: run number, status, parameters, and buttons for **Color atoms**, periodic **Images**, **Slice**, **Stop**, **Continue simulation** and **Analyze in notebook**.
- **Viewport**: the 3D view, with the script name and progress in the top-left corner and a full-screen button. See [Watch a run](/guide/watch-a-run) and [Move the camera](/guide/camera).
- **Console** underneath: the LAMMPS output (`log.lammps`). Click its header to expand it.
- **Side panel** on the right: live **Status**, **Simulation speed**, **Output files** and, while the run is live, the **Computes**, **Fixes** and **Variables** you can plot. See [Live plots](/guide/live-plots).

## Settings

![Settings](/screenshots/settings-general.webp)

Click **Settings** at the bottom of the sidebar. **General** sets the theme, **Rendering** controls the 3D view's quality and lighting, and **Storage** shows how much browser storage your projects use. See the [Settings reference](/reference/settings).

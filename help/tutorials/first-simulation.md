# Tutorial 1: Watch your first simulation

**Time:** 10 minutes. **You need:** nothing but the browser.

You will quick-run a bundled example, a two-dimensional fluid of small and large particles, learn to read the screen while it runs, plot its temperature, and keep it as a project.

## 1. Open Atomify and wait for the engine

Open [Atomify](https://andeplane.github.io/atomify/) in desktop Chrome or Firefox. The first visit reloads the page once; that's expected ([why](/getting-started/requirements#the-first-visit-reloads-once)).

At the bottom of the sidebar, **Engine loading… NN%** counts up while the LAMMPS engine downloads and compiles. When it disappears, you can run simulations.

## 2. Quick-run the example

Click **Example library** in the sidebar and find **2D Lennard Jones fluid**. Click its **Quick run** button.

![The Example library](/screenshots/example-library.webp)

A _quick run_ starts the example immediately without creating a project. You land on the run screen:

![A quick run of the 2D Lennard Jones fluid](/screenshots/quick-run-live.webp)

Take a moment to read it:

- The banner at the top says **This is a quick run — files are temporary and will be discarded.** You'll fix that in step 8.
- The top-left corner of the 3D view shows the script name, a progress bar and **step X of Y**.
- The **Status** panel on the right shows the **Run type**. It starts as **Minimization** (the script first relaxes the randomly placed atoms) and switches to **Dynamics** when the actual simulation starts.

## 3. Move around

- **Rotate:** drag with the left mouse button.
- **Pan:** drag with the right mouse button.
- **Zoom:** scroll, towards the mouse pointer.

The view is 2D here, so try rotating to see that the atoms lie in a thin slab. More in [Move the camera](/guide/camera).

## 4. Pause and resume

Press <kbd>Space</kbd>. The step counter stops: the simulation is paused. Rotate the view while paused, then press <kbd>Space</kbd> again to resume.

::: info No pause indicator
Atomify doesn't show a "paused" badge. If the step counter isn't moving, press <kbd>Space</kbd>.
:::

## 5. Change the speed

Press <kbd>5</kbd>. A notification says **Setting simulation speed to 10.** The atoms now jump further between frames and the simulation finishes sooner. Press <kbd>1</kbd> to go back to the smoothest setting.

The number is how many timesteps LAMMPS computes between two screen updates. Higher is faster, but the motion is choppier and live plots get fewer points. [Sync, speed and live analysis](/concepts/sync-and-speed) explains the trade-off. You can also drag the **Simulation speed** slider in the side panel.

## 6. Read the console

Click the **console — log.lammps** bar under the 3D view to expand it. It shows what LAMMPS prints, as it prints it: the setup, then a line of thermodynamic output (`thermo`) every 10 steps. While the run is live the console says **following** and scrolls along.

![The console](/screenshots/run-console.webp)

Click the bar again to collapse it.

## 7. Plot the temperature

In the side panel, under **Computes**, click **thermo_temp**. A plot opens with the temperature from the start of the run until now, and keeps growing while it's open.

![A live plot of the temperature](/screenshots/analysis-figure-temp.webp)

The axes carry units: this script uses `units lj`, so time is in τ. The Langevin thermostat in the script (`fix langevin 1.0 1.0 …`) holds the temperature near 1.0, and you can see it settle there. **Export CSV** downloads the data. Close the plot.

## 8. Keep it as a project

Wait for the status to change to **Completed**. The viewport now shows the final frame, and **Output files** lists `log.lammps`.

![The completed quick run](/screenshots/quick-run-completed.webp)

Click **Save as project** in the banner. Atomify creates a project called **2D Lennard Jones fluid**, copies the script and the run into it, and opens it. It appears in the sidebar under **Projects**.

## 9. Run it again

Click **Save & run simulation**. A second run starts. Open the **Runs** tab: both runs are listed, #001 (the quick run you saved) and #002.

## What you learned

- **Quick runs** start an example instantly; **Save as project** keeps it.
- The 3D view is controlled with the mouse; <kbd>Space</kbd> pauses and <kbd>1</kbd>–<kbd>9</kbd> set the speed.
- The **console** shows LAMMPS's output; the **Computes**, **Fixes** and **Variables** lists plot live.
- Every run is recorded in the project's **Runs** tab.

**Next:** [Tutorial 2: Write your own script](/tutorials/write-a-script).

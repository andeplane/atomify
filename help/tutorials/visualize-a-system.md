# Tutorial 5: Make a great-looking view

**Time:** 20 minutes. **You need:** nothing; this tutorial stands on its own.

You will build a liquid with a sticky ball of atoms in the middle and use every visualization tool in Atomify on it: coloring by a compute and by a group, slicing, periodic images, measuring distances, and rendering settings.

## 1. Create the project

Create a project named **Nanoball** (sidebar → **New project** → **Blank** → **Create project**). Add a file `in.ball` (**New file**) with this script:

<<< @/snippets/in.ball{lammps}

Things to notice:

- `#/camera position` and `#/camera target` set the starting view. `#/atom 1 0.5 #7D9BE8` and `#/atom 2 0.6 #F43F5E` make the liquid light blue and the ball pink. See [script directives](/reference/directives).
- `group ball type 2` defines a group you can color by.
- `compute ke all ke/atom` computes each atom's kinetic energy. Per-atom computes like this one are what **Color atoms** can use.
- `run 200000` is long on purpose; you'll stop it when you're done.

Click **Save & run simulation**. Once the atoms are moving, press <kbd>Space</kbd> to pause. Pausing makes it easier to compare settings, but everything below also works while running.

![The Nanoball simulation](/screenshots/run-detail-live.webp)

## 2. Color by a group

Click **Color atoms** in the run header. In **Color by**, choose **ball** under **Groups**. Members of the group are colored as 1 and everything else as 0, so the ball stands out.

![Colored by the ball group](/screenshots/color-by-group.webp)

## 3. Color by kinetic energy

Open **Color atoms** again. In **Color by**, choose **ke** under **Computes**. Set **Colormap** to **Viridis**.

![The color settings](/screenshots/color-settings.webp)

By default the colors span the lowest and highest value present. A few very fast atoms can squeeze everyone else into one color, so check **Use custom range** and set **Minimum value** 0 and **Maximum value** 3. Close the dialog.

![Atoms colored by kinetic energy](/screenshots/colored-by-ke.webp)

The legend in the bottom-left corner shows the quantity, the colormap and the range. Its gear icon reopens the settings.

## 4. Slice through the ball

Click **Slice** and turn on **Show only a slab**. Keep **Normal** at **z** and drag **Position** through the box: you see a thin slab of atoms, and the inside of the ball. **Width** sets how thick the slab is. **Invert (hide the slab)** does the opposite and cuts a gap.

![A slice through the system](/screenshots/slice.webp)

Turn **Show only a slab** off again.

## 5. Show periodic images

The box is periodic: atoms leaving one side come back on the other. Click **Images 1×1×1** and set **2** along x, y and z. You now see 8 copies of the box, 32,000 atoms drawn. The copies are only drawn; they don't change the simulation.

![Periodic images](/screenshots/periodic-images.webp)

Set the images back to 1.

## 6. Measure a distance

Click an atom: it is highlighted and the **Selected Atoms** panel shows its id and position. Hold <kbd>Shift</kbd> and click a second atom. The panel now shows the distance between them. Click the distance to plot it over time (resume with <kbd>Space</kbd> to see it change). Shift-click a third atom to get three distances and three angles.

![Two selected atoms and their distance](/screenshots/selection.webp)

Press <kbd>Esc</kbd> to clear the selection.

## 7. Tune the rendering

Open **Settings** (bottom of the sidebar) → **Rendering**:

- Turn on **Orthographic camera** to remove perspective, and **Show scale bar** to get a length scale in the bottom-right corner.
- Check that **Occlusion quality** is **Detailed** for the softest shadows.
- Adjust **Ambient light intensity** and **Point light intensity** to taste.

![An orthographic view with a scale bar](/screenshots/ortho-scale-bar.webp)

These settings are saved in your browser and apply to every run.

## 8. Keep the view

Press <kbd>c</kbd> (click the 3D view first) to copy the camera, and paste the two `#/camera` lines over the old ones in `in.ball`. Then press <kbd>Space</kbd> to resume and **Stop** to end the run.

::: info What persists
**Color atoms** and **Slice** reset at the start of every run; periodic images stay for the browser session; rendering settings are saved permanently. To keep atom colors and sizes, put them in the script with `#/atom`.
:::

The run's final frame is saved with it and shown on Home as the project's thumbnail. To save a picture yourself, use full screen (the button in the viewport's corner) and your system's screenshot tool.

## What you learned

- **Color atoms** colors by type, by any per-atom compute, or by group, with 14 colormaps and an optional fixed range.
- **Slice** shows or hides a slab; **Images** draws periodic copies.
- Click and <kbd>Shift</kbd>-click atoms to measure distances and angles.
- **Settings → Rendering** controls projection, scale bar, ambient occlusion and lights.

**Next:** [Tutorial 6: Share an example library](/tutorials/example-library).

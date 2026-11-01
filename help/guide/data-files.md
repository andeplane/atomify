# View a data file

You can look at the atoms in a LAMMPS data file without writing a script, for example to check a structure you built elsewhere.

1. Upload the data file to a project (Files → **Upload**).
2. Hover over its row and click ▶ **View structure**.
3. In the **View data file** dialog, check the **Atom style** and **Units**:
   - **Atom style** is filled in from the `Atoms # style` comment in the file, if there is one (for example `Atoms # full`). Otherwise pick the style the file was written with.
   - **Units** only affect labels; the default is `real`.
4. Click **View structure**.

![The View data file dialog](/screenshots/view-data-modal.webp)

Atomify writes a tiny script, `in.view-data`, into the project and runs it: it reads the file with `read_data … nocoeff` and runs zero timesteps. You get a run whose 3D view shows the structure; you can rotate it, color it, slice it and show periodic images like any other run.

![A data file viewed as a structure](/screenshots/view-data-structure.webp)

Things to know:

- Force-field coefficients in the file are ignored, so no potential is needed.
- Each view adds a script (`in.view-data`, then `in.view-data-2`, …) to the project. Delete them when you don't need them.
- A file whose path contains quotes, `$` or line breaks can't be viewed. Rename it first.
- A script with no `run` command also finishes as a structure view, so you can view a system built with `create_atoms` the same way.

## Related

- [Manage files](/guide/files)
- [Color atoms](/guide/color-atoms), [Slice](/guide/slice), [Periodic images](/guide/periodic-images)

# Download, share and import projects

Projects live in your browser. To back one up, move it to another computer or browser, or send it to someone, download it as a zip and import the zip on the other side.

## Download a project

Open the project, click **⋯** (**Project actions**) in the header and choose:

- **Download project**: a zip of the working tree (your input files) and notebook. Small, and enough to reproduce your work.
- **Download with runs**: the same, plus the `runs/` folder with every run's snapshot, log and outputs. Can be large.

The zip is named after the project folder, for example `lj-melt.zip`. It contains your files plus `.atomify/project.json`, which stores the project's name and color.

You can also download single files from the Files tab (the download icon on each row).

## Import a project

1. Click **New project**.
2. Choose **Upload**.
3. Drop the `.zip` on the box (or click to browse to it).
4. Click **Create project**.

When you upload a single zip, Atomify imports it as a whole project:

- The name and color come from the zip's `.atomify/project.json`, if it has one.
- If everything in the zip is inside one top folder (which happens when you zip a folder), that folder is stripped.
- macOS's `__MACOSX` folders are skipped.
- The import is all or nothing: if any file can't be imported, nothing is created and you see why, for example **The zip contains no files.**

A zip made by **Download with runs** brings its run history along.

## Share a project with someone

Send them the zip; they import it as above. There is no link that carries a project, because projects are stored only in your browser.

::: info Old share links
Older versions of Atomify could put a script in the link (`?script=`, `?data=` or `embed=`). These parameters are no longer supported and are ignored.
:::

To share many simulations as ready-to-run examples, publish an [example library](/tutorials/example-library) instead.

## Back up your work

Browsers can clear site data, and projects only exist in this browser. Download projects you care about, and consider **Protect from eviction** in [Settings → Storage](/guide/storage).

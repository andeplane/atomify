# Manage files

The **Files** tab shows the project's **working tree**: the input scripts, data files and potentials you run with, and the `runs/` folder that holds every run.

![The Files tab](/screenshots/files-tab.webp)

The list shows each file's **Name**, **Size** and when it was **Modified**, with folders first. Use **Search files** to filter it. The `runs` folder shows how many runs it holds; click it to go to the Runs tab.

## Add files

- **Upload**: click **Upload** and pick one or more files, or drag files from your computer anywhere onto the Files tab.
- **New file**: click **New file**, type a name like `in.equilibrate`, and click **Create**. It's created empty; open it to start editing.

![Creating a new file](/screenshots/new-file-prompt.webp)

## Scripts and the input script

Atomify recognizes a file as a LAMMPS **script** when its name starts with `in.`, ends with `.in`, or contains `.in.` (the convention moltemplate uses). The project's input script always counts as a script, whatever its name.

| Script       | Not a script |
| ------------ | ------------ |
| `in.melt`    | `melt.lmp`   |
| `melt.in`    | `run.lammps` |
| `run.in.npt` | `melt.txt`   |

Scripts get a play button and LAMMPS syntax highlighting. Other files are data files: you can edit them, view them as structures, and your scripts can read them.

One script is the project's **input script**, marked with an **Input script** chip. **Save & run simulation** runs it. If a project has exactly one script, it becomes the input script automatically.

## Row actions

Hover over a row to see its buttons:

| Button                                                | Appears on            | What it does                                                                                       |
| ----------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------- |
| ▶ **Run this file (doesn't change the input script)** | scripts               | Runs this script once. The project's input script stays what it was.                               |
| ◎ **Set as input script**                             | other scripts         | Makes this the script **Save & run simulation** runs.                                              |
| ▶ **View structure**                                  | non-script text files | Shows a data file's atoms without running a simulation. See [View a data file](/guide/data-files). |
| ✎ **Edit**                                            | text files            | Opens the [editor](/guide/editor).                                                                 |
| ⤓ **Download**                                        | files                 | Downloads the file.                                                                                |
| ⋯ **More**                                            | files                 | **Rename…** and **Delete…**.                                                                       |

![A file row's buttons and menu](/screenshots/file-row-menu.webp)

Clicking the row itself opens text files in the editor, notebooks in the Notebook tab, and downloads binary files.

## Rename and delete

- **Rename…**: renaming the input script keeps it the input script. Atomify does **not** update references to the file inside your scripts (for example a `read_data` line), so update those yourself.
- **Delete…**: removes the file from the working tree. Copies inside existing runs are not affected. Deleting can't be undone. Deleting the input script leaves the project without one until you set another.

## Binary and text files

Files ending in `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.pdf`, `.zip`, `.gz`, `.npy`, `.npz`, `.bin`, `.restart`, `.dcd` or `.xtc` are stored as binary files: they can be downloaded and read by LAMMPS but not edited. Everything else is text.

## Subfolders

Files in subfolders are stored, but **only top-level files are copied into a run**. Keep everything a script reads (data files, potentials, included scripts) at the top level of the project.

## Related

- [Edit scripts](/guide/editor)
- [Run simulations](/guide/runs)
- [Project and run folders](/reference/run-directory)

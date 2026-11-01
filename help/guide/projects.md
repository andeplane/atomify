# Create and manage projects

A **project** is a folder of input files (your scripts, data files and potentials) plus the history of every run you made with them. This page covers creating, renaming, duplicating and deleting projects. To move projects between browsers or share them, see [Download, share and import](/guide/import-export).

## Create a project

Click **New project** in the sidebar (or the **+** next to **Projects**, or **Create new project** on Home).

![The New project dialog](/screenshots/new-project-blank.webp)

1. **Project name.** Anything you like, for example _Silica fracture study_.
2. Check the **folder name** shown under it, like `silica-fracture-study/`. This is what the notebook's file browser shows. _The name can change later; the folder can't._
3. **Start from**, one of:
   - **Blank**: an empty project.
   - **From example**: copies an example's files in. A search box filters the examples by title, description or keyword.
   - **Upload**: bring your own scripts and data files. Drop files on the box or click to browse. Drop a single `.zip` to import a whole project ([details](/guide/import-export#import-a-project)).
4. **Color**: one of six colors, used for the project's dot in the sidebar. If you don't pick one, Atomify picks the next color in turn.
5. Click **Create project**.

![Creating a project from an example](/screenshots/new-project-example.webp)

Every new project includes a starter notebook, `analysis.ipynb`, that shares the project's files (unless your files already include a notebook). See [Notebook analysis](/guide/notebook).

::: details How the folder name is made
The folder name is the project name in lowercase, with accents removed and anything other than letters and digits replaced by `-`. If that folder already exists, Atomify adds `-2`, `-3` and so on. A name with no usable characters becomes `project`.
:::

### Other ways to start a project

- **Use as project** on any example (Home or the Example library).
- **Save as project** on a [quick run](/guide/quick-runs).

## Open a project

Click it in the sidebar under **Projects**, or on Home under **Recent projects** or **Continue where you left off**. The sidebar shows every project; its dot pulses while it has a run going.

## The project menu

The **⋯** button in the project header (**Project actions**) has:

![The project menu](/screenshots/project-menu.webp)

| Item                   | What it does                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| **Rename…**            | Changes the display name. The folder name stays the same, so notebook paths never break.        |
| **Duplicate**          | Creates "_name_ (copy)" with the same files and notebook, but no runs.                          |
| **Download project**   | A zip of the working tree and notebook. See [Download, share and import](/guide/import-export). |
| **Download with runs** | The same, plus the whole `runs/` history.                                                       |
| **Delete project…**    | Deletes the project and all its runs.                                                           |

Quick runs don't have this menu: save them as a project first.

## Delete a project

Choose **Delete project…** in the project menu. The dialog tells you how many runs and how much storage will be freed. Deleting can't be undone, so download the project first if you might want it back.

![Deleting a project](/screenshots/delete-project-modal.webp)

You can't delete a project while it has a run in progress. Stop the run first.

You can also delete projects from **Settings → Storage**, which lists every project with its size.

## Related

- [Projects and runs](/concepts/projects-and-runs): why projects work the way they do.
- [Manage files](/guide/files).
- [Download, share and import](/guide/import-export).

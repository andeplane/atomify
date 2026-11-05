# Edit scripts

Click a text file in the **Files** tab (or its ✎ **Edit** button) to open it in the editor.

![The editor](/screenshots/editor.webp)

The editor is the same one as in VS Code (Monaco). Scripts get LAMMPS syntax highlighting and a **LAMMPS script** chip; other files are shown as **Text file**. It follows the app's light or dark theme.

## Saving

Your edits **save automatically** half a second after you stop typing. The header shows the state:

- **Saving…** while a save is in progress.
- **Saved** when everything is stored ("Autosaved — changes persist as you type").
- **Couldn't save — retry** if the browser refused to store it, for example because storage is full. Click it to try again.

You can also click **Save** or press <kbd>Ctrl</kbd> <kbd>S</kbd> (<kbd>⌘</kbd> <kbd>S</kbd> on a Mac) to save right away.

## Run from the editor

Click **Save & run simulation** in the project header. It saves any pending edits first, then runs the project's **input script**.

::: warning It runs the input script, not necessarily the open file
If you are editing a different script, **Save & run simulation** still runs the project's input script. To run the file you're editing, set it as the input script in the Files tab, or use its ▶ **Run this file** button.
:::

## Snapshots are read-only

Files inside `runs/` are snapshots of what a run used or produced. They open read-only, with a banner:

![A read-only snapshot](/screenshots/editor-snapshot.webp)

> Read-only — snapshot of run #001. Edit the working-tree copy instead.

Edit the file at the top level of the project instead; the next run picks up your change.

## Editing during a run

You can edit freely while a simulation runs. The run uses the snapshot taken when it started, so your edits only affect the next run.

## Go back

Click **Files** at the top left to return to the file list.

## Related

- [Script directives](/reference/directives): the `#/` comments that control how atoms look.
- [Manage files](/guide/files)

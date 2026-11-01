# Troubleshooting

## The engine doesn't load

**"Engine loading…" never finishes.** The engine is a large download. On a slow connection give it a minute. If the percentage stops moving, reload the page.

**"Safari is not supported for simulations."** Use Chrome, Firefox or Edge on a desktop computer. See [Browser requirements](/getting-started/requirements).

**"The simulation engine requires cross-origin isolation."** The helper that enables isolation didn't take effect.

1. Reload the page.
2. Open [andeplane.github.io/atomify/?sw-reset](https://andeplane.github.io/atomify/?sw-reset). This removes Atomify's service worker and cached files and reloads. Your projects are kept.
3. Make sure you're not in a mode that blocks service workers (some privacy extensions or strict privacy settings do). Try a normal window or another browser.

**"Failed to load LAMMPS" or "Engine unavailable: …".** Reload. If it keeps happening, try `?sw-reset` as above, then [report it](/faq/getting-help) with the message.

**"The simulation engine crashed".** Usually out of memory. Reload the page to restart the engine. Your projects are safe. Try a smaller system.

## Atomify looks stuck or outdated after an update

Open [andeplane.github.io/atomify/?sw-reset](https://andeplane.github.io/atomify/?sw-reset). It clears cached files and reloads. Projects are kept.

## Running

**Save & run simulation asks me to choose a script, or says there are no scripts.** Atomify only treats files with `.in` in their name (`in.melt`, `melt.in`, `run.in.npt`) as scripts. Rename your script (for example `melt.lmp` → `in.melt`), or pick the input script in the dialog. See [Manage files](/guide/files#scripts-and-the-input-script).

**It runs the wrong script.** **Save & run simulation** runs the project's input script, not the file open in the editor. Set the right one with the target icon in the Files tab, or use **Run this file**.

**The run failed.** Open it: the error is shown in the status panel, and the console shows LAMMPS's output up to the error.

![A failed run](/screenshots/run-failed.webp)

Common causes:

- `ERROR: All pair coeffs are not set`: add `pair_coeff` lines for every pair of types.
- `ERROR: Cannot open file …`: the file isn't in the project, is in a subfolder (only top-level files are available to a run), or the name doesn't match exactly (it's case-sensitive).
- `Unrecognized … style`: the style is in a package that isn't included. See [The LAMMPS engine](/reference/lammps-engine).

**"Browser storage is full — free space in Settings > Storage."** Delete old runs or projects. See [Manage browser storage](/guide/storage).

**Runs show "Interrupted".** The page was reloaded or closed during the run. Partial outputs are kept. Run again.

**The keyboard shortcuts don't work.** Click the 3D view first; shortcuts are ignored while a text field or button has keyboard focus.

**It's slow.** Raise the [simulation speed](/concepts/sync-and-speed), try `suffix kk` for [multithreading](/guide/multithreading) on large systems, and turn off ambient occlusion on slow GPUs.

## Viewing results

**No computes, fixes or variables are listed.** It appears once the run synchronizes, and only while the run is live. For finished runs, use `log.lammps` and the notebook.

**"No frame was captured for this run."** The final frame is only saved if the run screen is open when the run ends. Click **Run again** to watch it.

**Continue simulation isn't available.** You can only continue a completed run that is still loaded in the engine: not after a reload or another run. Use **Run full sequence again**, or run the script again. See [Continue a simulation](/guide/continue-a-run).

**Color atoms doesn't offer my compute.** Only per-atom computes (like `ke/atom`) can color atoms. Fixes, global computes and variables can't.

## Examples and libraries

**My custom library doesn't show; I see the bundled examples.** Atomify couldn't load your `examples.json` and fell back silently. Check the address, that it's encoded in the link, and that the server sends CORS headers. See [Tutorial 6, step 6](/tutorials/example-library#_6-if-your-examples-don-t-show-up).

## Notebook

**The notebook can't find `log.lammps`.** Each run's log is in `runs/run-NNN/log.lammps`, not in the project folder. Use `glob.glob("runs/run-*/log.lammps")`.

**The notebook is slow to start.** JupyterLite downloads a Python environment the first time. It stays alive while you switch tabs afterwards.

## Still stuck?

See [Getting help](/faq/getting-help).

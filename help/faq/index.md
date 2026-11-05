# FAQ

## Does it work on iPad, iPhone or Safari?

No. Safari's engine can't run the multithreaded simulation engine, and every browser on iPhone and iPad uses Safari's engine. Use Chrome, Firefox, Edge or another Chromium-based browser on a desktop or laptop. See [Browser requirements](/getting-started/requirements).

## Do I need an account? Does it cost anything?

No and no. Atomify is free and open source, and runs entirely in your browser.

## Where are my files stored?

In your browser's own database, on your computer. Nothing is uploaded. See [Where your data lives](/concepts/where-your-data-lives).

## Is my data sent anywhere?

No. Your scripts and results stay on your computer. Atomify collects anonymous usage statistics (which buttons are used), not your files.

## Can I send someone a link to my project?

Not directly, because projects only exist in your browser. Download the project (**⋯ → Download project**) and send the zip; they import it with **New project → Upload**. To share many simulations, publish an [example library](/tutorials/example-library) and share its link.

## Why did the page reload on my first visit?

Atomify installs a helper that enables cross-origin isolation, which the multithreaded engine needs. It takes one reload, once. See [How simulations run](/concepts/how-simulations-run#cross-origin-isolation).

## Can I run my own LAMMPS scripts and potentials?

Yes. Create a project, upload your script, data files and potential files, and run. Name the script like `in.something` or `something.in`, keep all files at the top level of the project, and check that the commands you use are in the [included packages](/reference/lammps-engine#included-packages).

## Which LAMMPS version and packages are included?

The version is printed on the first line of every run's console. For the packages, see [The LAMMPS engine](/reference/lammps-engine).

## Is it as fast as LAMMPS on my computer?

About half as fast single-threaded. With `suffix kk` it uses 4 threads, which helps a lot for larger systems. It's great for systems up to tens of thousands of atoms; for big production runs, use native LAMMPS. See [Multithreading](/guide/multithreading).

## Can I use a restart file or a data file?

Yes. Upload it and refer to it in your script (`read_restart file.restart`, `read_data data.lmp`). To just look at a data file, use [View structure](/guide/data-files).

## Can I edit the script while it runs?

Yes. The run uses a snapshot taken when it started, so your edits apply to the next run. LAMMPS itself can't take new commands during a run, so the running simulation doesn't change.

## Can I change parameters while the simulation runs?

Not the script's commands. You can pause, change the speed, and change everything about how it's drawn. To change physics, stop, edit and run again, or [continue](/guide/continue-a-run) a completed run.

## How do I get a picture or a movie?

Each run saves a picture of its final frame (`runs/run-NNN/.atomify/frame.png`; download it from the Files tab). For a nicer picture, use [full screen](/guide/watch-a-run#full-screen) and your system's screenshot tool. For a movie, use a screen recorder, or write a dump file with LAMMPS and render it with OVITO or VMD.

## Where is the trajectory?

Atomify doesn't store trajectories. Add a `dump` command to your script; the dump file lands in the run's folder.

## Why does the Back button leave Atomify?

Atomify updates the address bar without adding history entries, so Back goes to the page you were on before Atomify. Use the sidebar and the in-app back buttons instead.

## How do I cite Atomify?

Link to [github.com/andeplane/atomify](https://github.com/andeplane/atomify), and cite LAMMPS as described on [lammps.org](https://www.lammps.org/cite.html).

## More questions?

See [Troubleshooting](/faq/troubleshooting), [Known limitations](/faq/known-limitations) and [Getting help](/faq/getting-help).

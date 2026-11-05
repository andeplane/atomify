# Manage browser storage

Your projects, files and runs are stored in your browser. Open **Settings → Storage** to see how much space they take and to free some.

![Storage settings](/screenshots/settings-storage.webp)

## See how much is used

**Browser storage used** shows the space used and roughly how much the browser allows this site. Below it, **Per project** lists every project with its number of runs and its size.

Runs are usually what takes space, especially runs that write dump files.

## Free space

- Delete runs you don't need: in the project's Runs tab, the trash icon on a run.
- Delete output files you don't need from the run's folder.
- Delete whole projects: the trash icon next to a project in **Per project**, or **Delete project…** in the project menu.

Download anything you want to keep first ([Download, share and import](/guide/import-export)).

If storage runs out during a run, it fails with **Browser storage is full — free space in Settings > Storage.**

## Protect from eviction

Browsers may clear a site's storage when the disk is nearly full, or after a long time without visits. Turn on **Protect from eviction** to ask the browser to never clear Atomify's storage. The browser decides whether to grant it; some ask you, some decide on their own. Once granted, it can't be turned off from Atomify (you can reset it in the browser's site settings).

## What clears your projects

- Clearing your browser's history or site data for andeplane.github.io.
- Closing a private/incognito window.
- Browser eviction, if storage isn't protected.

Projects aren't shared between browsers or computers. To move them, download and import them. See [Where your data lives](/concepts/where-your-data-lives).

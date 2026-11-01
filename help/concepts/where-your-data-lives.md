# Where your data lives

**In your browser, and nowhere else.** Atomify has no server and no accounts. Your projects, files and runs are stored in your browser's built-in database (IndexedDB) for the site andeplane.github.io.

## What that means

- **Private.** Your scripts and results never leave your computer. Atomify collects anonymous usage statistics (which features are used), not your files.
- **Per browser.** Projects in Chrome aren't visible in Firefox, or on another computer, or in another browser profile. Move them with [download and import](/guide/import-export).
- **Shared with the notebook.** JupyterLite uses the same database, which is why the notebook can read your runs directly and why files it writes appear in the project.
- **Can be cleared.** Clearing browsing data for the site, closing a private window, or the browser freeing up disk space can delete everything.

## Keep your work safe

1. **Download** projects that matter (**⋯ → Download project** or **Download with runs**).
2. Turn on **Protect from eviction** in **Settings → Storage**, which asks the browser not to clear Atomify's data on its own.
3. Use a normal window, not a private one.

## How much space you have

Browsers give each site a share of your free disk space, often many gigabytes. **Settings → Storage** shows how much Atomify uses and roughly how much it may use. See [Manage browser storage](/guide/storage).

## Settings

Your preferences (theme, rendering settings, sidebar state) are stored in the browser too. Some, like the simulation speed and console state, only last for the browser tab. See the [settings reference](/reference/settings#other-things-atomify-remembers).

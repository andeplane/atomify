# URL parameters

Atomify keeps the address bar in sync with what you're looking at, so you can bookmark a project, a run or a file and come back to it. You can also build links with these parameters.

| Parameter                   | Example                         | Effect                                                                                                                    |
| --------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `project=<folder>`          | `?project=lj-melt`              | Opens the project with that folder name.                                                                                  |
| `tab=files\|runs\|notebook` | `?project=lj-melt&tab=runs`     | Opens that tab of the project.                                                                                            |
| `run=<run id>`              | `?project=lj-melt&run=run-002`  | Opens that run's detail screen.                                                                                           |
| `file=<path>`               | `?project=lj-melt&file=in.melt` | Opens that file in the editor.                                                                                            |
| `screen=examples`           | `?screen=examples`              | Opens the Example library.                                                                                                |
| `examplesUrl=<url>`         | `?examplesUrl=https%3A%2F%2F…`  | Loads a [custom example library](/guide/custom-library). Encode the URL.                                                  |
| `sw-reset`                  | `?sw-reset`                     | Resets Atomify's service worker and caches, then reloads. Projects are kept. See [Troubleshooting](/faq/troubleshooting). |

Notes:

- Project links only work in the browser where the project exists: projects aren't stored online.
- A link to a project that doesn't exist shows **Project … was not found.**
- `examplesUrl` is kept in the address as you navigate, so the library stays loaded.
- Atomify updates the address without adding history entries, so the browser's **Back** button leaves Atomify rather than going to the previous screen. Use the in-app navigation (sidebar, **Runs**, **Files**) instead.
- The old parameters `script`, `data` and `embed` are no longer supported and are ignored.

## Full examples

```
https://andeplane.github.io/atomify/?project=lj-melt&run=run-002
https://andeplane.github.io/atomify/?screen=examples&examplesUrl=https%3A%2F%2Fyou.github.io%2Fphysics101%2Fexamples.json
```

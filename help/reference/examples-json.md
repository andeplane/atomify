# examples.json format

An example library is described by one JSON file. Atomify's own library is [examples/examples.json](https://github.com/andeplane/atomify/blob/main/public/examples/examples.json); to publish your own, see [Tutorial 6](/tutorials/example-library).

## A minimal library

```json
{
  "title": "Physics 101 simulations",
  "examples": [
    {
      "id": "lj-melt",
      "title": "LJ melt",
      "description": "864 Lennard-Jones atoms melting from an fcc crystal.",
      "imageUrl": "lj-melt/lj-melt.png",
      "inputScript": "in.melt",
      "keywords": ["beginner", "lennard jones"],
      "files": [{ "fileName": "in.melt", "url": "lj-melt/in.melt" }]
    }
  ]
}
```

## Top level

| Field      | Required | Meaning                                                                                                  |
| ---------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `title`    | no       | The library's name, shown as the Example library heading.                                                |
| `examples` | yes      | The list of examples, in the order they're shown. The first is used by **Quick-run an example** on Home. |
| `baseUrl`  | no       | A base for relative paths (see below). Usually leave it out.                                             |

## Each example

| Field            | Required    | Meaning                                                                                                                                                |
| ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`             | yes         | Unique within the library. Used in links and project metadata.                                                                                         |
| `title`          | yes         | Shown on the card and in the sidebar.                                                                                                                  |
| `description`    | recommended | Shown on the card (first two lines) and searchable.                                                                                                    |
| `imageUrl`       | recommended | A picture for the card, about 4:3.                                                                                                                     |
| `inputScript`    | yes         | The file name (from `files`) to run. Atomify always treats it as a script; name it like `in.melt` or `melt.in` so it's also recognized after renaming. |
| `files`          | yes         | The files to copy into the project: `{ "fileName": "...", "url": "..." }` or `{ "fileName": "...", "content": "..." }`.                                |
| `keywords`       | no          | Searchable; the first is shown as a badge.                                                                                                             |
| `analysisScript` | no          | A notebook (`.ipynb`) to open with **Analyze in notebook**. List it in `files` too.                                                                    |

Fields Atomify currently ignores: `author`, `authorUrl`, `analysisDescription` and the top-level `descriptionFile`.

## How paths are resolved

- Relative paths (`url`, `imageUrl`, `analysisScript`) are relative to the `examples.json` file itself. A library works wherever you host it.
- Absolute URLs (`https://…`) are used as they are.
- If `baseUrl` is set, relative paths are resolved against it instead. A relative `baseUrl` is relative to the Atomify page (this is how the bundled library uses it).

## Hosting

The server must send `Access-Control-Allow-Origin` (CORS). GitHub Pages and raw.githubusercontent.com do. If loading fails, Atomify silently shows its bundled examples instead.

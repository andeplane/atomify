# Tutorial 6: Share an example library

**Time:** 20 minutes. **You need:** a place to host a few static files, such as a GitHub repository.

Atomify can load a different example library from any web address. A teacher can publish the simulations for a course, a researcher the scripts behind a paper, and share them as one link that opens Atomify with that library. You will write an `examples.json`, host it, and open Atomify with it.

## 1. Start from the template

The quickest start is the template repository [andeplane/atomify-examples-template](https://github.com/andeplane/atomify-examples-template). Click **Use this template** on GitHub to make your own copy. It has an example library ready to edit, a check that validates it, and instructions for publishing it with GitHub Pages.

You can also start from an empty folder. A library is just:

```
my-library/
├── examples.json
└── lj-melt/
    ├── in.melt
    └── lj-melt.png
```

## 2. Write examples.json

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

- `title` is shown as the library's heading.
- Each example needs a unique `id`, a `title`, a `description`, an image, the `inputScript` to run, and its `files`. The first keyword is shown as a badge on its card.
- Paths are relative to `examples.json` itself, so the library works wherever you host it.
- A file can be written inline instead of linked: `{ "fileName": "in.melt", "content": "units lj\n..." }`.
- To ship a notebook with an example, add it to `files` and name it in `"analysisScript": "lj-melt.ipynb"`. It opens when someone clicks **Analyze in notebook**.

For a picture, run the example in Atomify, take a screenshot and crop it to roughly 4:3. All fields are listed in the [examples.json reference](/reference/examples-json).

## 3. Host it

The files must be reachable over HTTPS from a browser on another site, which means the server must send the CORS header `Access-Control-Allow-Origin`. These work out of the box:

- **GitHub Pages** (recommended): `https://<you>.github.io/<repo>/examples.json`.
- **raw.githubusercontent.com**: `https://raw.githubusercontent.com/<you>/<repo>/main/examples.json`.

For testing on your own computer, use a local server that sends CORS headers, for example `npx http-server --cors -p 8080`. Python's plain `python -m http.server` does not send them, so Atomify can't read from it. The template repository includes a script for this.

## 4. Open Atomify with your library

Add `?examplesUrl=` and the address of your `examples.json` to the Atomify link. Encode the address (replace `:` with `%3A` and `/` with `%2F`; most languages have a function for this, like `encodeURIComponent` in JavaScript):

```
https://andeplane.github.io/atomify/?examplesUrl=https%3A%2F%2Fyou.github.io%2Fphysics101%2Fexamples.json
```

Open it. The **Example library** now shows your examples under your title, the sidebar's **Examples** list shows them too, and **Quick-run an example** on Home runs your first one.

## 5. Share the link

Send the link to your students or colleagues, or put it on a course page. Anyone who opens it gets your library. Projects they create from your examples are theirs to keep, in their own browser.

The library is part of the link: the `examplesUrl` parameter stays in the address while you use the app, but opening Atomify without it shows the bundled examples again.

## 6. If your examples don't show up

If Atomify shows its own bundled examples instead of yours, it couldn't load your `examples.json`. Atomify falls back silently, so check:

1. Open the `examples.json` address directly in your browser. Does it load, and is it valid JSON? (Paste it into a JSON validator if unsure.)
2. Open the browser's developer tools (<kbd>F12</kbd>), go to the **Network** tab and reload. A red `examples.json` entry with a CORS error means the server doesn't send `Access-Control-Allow-Origin`; a 404 means the address is wrong.
3. Check that the address in `examplesUrl` is encoded.

If an example appears but fails to run, look for 404 errors on its files in the Network tab: a path in `files` is probably wrong.

## What you learned

- An example library is an `examples.json` plus files, hosted anywhere with CORS.
- `?examplesUrl=<encoded address>` opens Atomify with that library.

See also: [Load a custom library](/guide/custom-library), [examples.json reference](/reference/examples-json).

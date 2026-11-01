# Load a custom library

Atomify can show a different example library, described by an `examples.json` file hosted anywhere on the web. Add its address to the Atomify link:

```
https://andeplane.github.io/atomify/?examplesUrl=<encoded address of examples.json>
```

For example:

```
https://andeplane.github.io/atomify/?examplesUrl=https%3A%2F%2Fyou.github.io%2Fphysics101%2Fexamples.json
```

The **Example library**, the sidebar's **Examples** list, the examples on Home and **Quick-run an example** then use that library, and the library's `title` becomes the heading. The parameter stays in the address as you move around the app, so the link can be bookmarked and shared.

## Requirements

- The server must allow other sites to read the files (CORS: `Access-Control-Allow-Origin`). GitHub Pages and raw.githubusercontent.com do.
- Paths in `examples.json` are relative to the `examples.json` file.
- Encode the address in the link (`encodeURIComponent` in JavaScript).

## If it doesn't load

Atomify falls back to its bundled examples **without an error message** when it can't load the file. Open the browser's developer tools, look at the Network tab for a failed `examples.json` request, and see [Tutorial 6, step 6](/tutorials/example-library#_6-if-your-examples-don-t-show-up).

## Related

- [Tutorial 6: Share an example library](/tutorials/example-library)
- [examples.json reference](/reference/examples-json)
- The template repository: [andeplane/atomify-examples-template](https://github.com/andeplane/atomify-examples-template)

# Browser requirements

## Supported browsers

Use **Chrome**, **Firefox** or another Chromium-based browser (**Edge**, **Opera**, **Brave**) on a **desktop or laptop computer**.

::: danger Safari and iPhone/iPad are not supported
Safari, and every browser on iPhone and iPad (they all use Safari's engine), cannot run the simulation engine. You can still browse the app, but running shows:

> Safari is not supported for simulations. Use Chrome or Firefox on a desktop computer.
> :::

![The engine status in the sidebar on an unsupported browser](/screenshots/safari-unsupported.webp)

## The first visit reloads once

The first time you open Atomify, the page reloads itself once. This is expected. Atomify installs a small helper (a service worker) that turns on _cross-origin isolation_, a browser security mode the multithreaded engine needs (it uses `SharedArrayBuffer`). After that first reload you will not see it again.

## Waiting for the engine

The LAMMPS engine is a large download (tens of megabytes) that the browser then compiles. While it loads, the sidebar shows **Engine loading… NN%**:

![The Engine loading chip in the sidebar](/screenshots/engine-loading.webp)

You can browse examples, create projects and edit files while it loads. Buttons that start a simulation (**Save & run simulation**, **Quick run**) stay disabled until the chip disappears. The download is cached, so later visits start much faster.

If something goes wrong, the chip turns into an error message instead, for example **Engine unavailable: …**. See [Troubleshooting](/faq/troubleshooting) for what each message means.

## Other things that help

- **Memory.** A few GB of free RAM. Large systems use more.
- **A GPU.** Any integrated graphics works for the 3D view. Turn off ambient occlusion in [Settings → Rendering](/reference/settings#rendering) on a slow machine.
- **Normal browsing mode.** In a private/incognito window, your projects disappear when you close the window. See [Where your data lives](/concepts/where-your-data-lives).

## If it doesn't load

1. Reload the page.
2. If you have used Atomify before and it got stuck after an update, open [andeplane.github.io/atomify/?sw-reset](https://andeplane.github.io/atomify/?sw-reset). This resets the helper and the cached files. Your projects are kept.
3. Try another supported browser.

More in [Troubleshooting](/faq/troubleshooting).

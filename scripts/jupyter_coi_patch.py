#!/usr/bin/env python3
"""Make the built JupyterLite site cross-origin isolated on static hosting.

Ported from lammps.js `examples/notebook/coi_patch.py` (ADR-002 §5) and run
against Atomify's built site (`public/jupyter`).

GitHub Pages cannot send the COOP/COEP headers that SharedArrayBuffer (and
therefore the KOKKOS multithreaded wasm build) requires. The standard
workaround is coi-serviceworker: a service worker that re-serves every
response with the headers added, plus a one-time page reload so the document
itself goes through the service worker. JupyterLite already owns the Jupyter
scope's service worker (its contents API — and the DriveFS mount — depend on
it), so instead of a second worker this script folds the header logic into
JupyterLite's own service worker:

1. service-worker.js: wrap ``maybeFromCache`` — the function that answers
   every plain GET the worker intercepts (documents, assets, and cross-origin
   fetches alike) — so its responses carry COOP/COEP, plus CORP so the
   assets remain embeddable under the policy they themselves impose.
2. every app page (lab/, notebooks/, tree/, …): inject a bootstrap that
   reloads the page once, the first time the service worker takes control.
   First visit: plain page registers the worker and reloads into an isolated
   page. Later visits are isolated from the start. If isolation still fails
   (e.g. an old worker version), the sessionStorage guard stops the loop and
   the site simply runs single-threaded, as before.

The upstream request for this is jupyterlite/jupyterlite#1409; if JupyterLite
grows a supported flag for it, this script can be replaced by that flag.
Pinned to the service-worker internals of jupyterlite-core 0.8.0 — the
asserts below fail the build loudly if a version bump changes them.
"""
import argparse
from pathlib import Path

parser = argparse.ArgumentParser(
    description="Patch a built JupyterLite site for cross-origin isolation."
)
parser.add_argument(
    "site_dir",
    type=Path,
    help="the built JupyterLite site directory (e.g. public/jupyter)",
)
out = parser.parse_args().site_dir

# --- 1. teach the service worker to add the isolation headers -------------

sw_path = out / "service-worker.js"
sw = sw_path.read_text()

HOOK = "async function maybeFromCache(e){"
assert sw.count(HOOK) == 1, (
    "jupyterlite service-worker.js changed shape (expected maybeFromCache); "
    "update jupyter_coi_patch.py for this jupyterlite-core version"
)
assert "_lammpsCoiHeaders" not in sw, "service worker already patched"

sw = sw.replace(
    HOOK,
    "async function maybeFromCache(e){"
    "return _lammpsCoiHeaders(await _lammpsMaybeFromCache(e))}"
    "async function _lammpsMaybeFromCache(e){",
    1,
)
sw += (
    "\nfunction _lammpsCoiHeaders(r){"
    "if(!r||r.status===0){return r}"
    "const h=new Headers(r.headers);"
    'h.set("Cross-Origin-Embedder-Policy","require-corp");'
    'h.set("Cross-Origin-Opener-Policy","same-origin");'
    'h.set("Cross-Origin-Resource-Policy","cross-origin");'
    "return new Response(r.body,{status:r.status,statusText:r.statusText,headers:h})"
    "}\n"
)
sw_path.write_text(sw)

# --- 2. reload app pages once, when the service worker takes control ------

BOOTSTRAP = """<script>
    (() => {
      if (window.crossOriginIsolated || !('serviceWorker' in navigator)) return;
      const KEY = 'lammps-coi-reload';
      if (sessionStorage.getItem(KEY)) return; // never loop
      const reload = () => {
        sessionStorage.setItem(KEY, '1');
        window.location.reload();
      };
      if (navigator.serviceWorker.controller) {
        // Controlled but not isolated: an older worker without the header
        // patch is running; one reload picks up the updated worker.
        navigator.serviceWorker.ready.then(reload);
      } else {
        // First visit: JupyterLite registers the worker during boot; as
        // soon as it claims this page, reload into an isolated document.
        navigator.serviceWorker.addEventListener('controllerchange', reload);
      }
    })();
    </script>"""

patched = 0
for page in sorted(out.glob("*/index.html")):
    html = page.read_text()
    if "jupyter-config-data" not in html:
        continue  # not an app page
    assert "lammps-coi-reload" not in html, f"{page} already patched"
    page.write_text(html.replace("<head>", "<head>\n    " + BOOTSTRAP, 1))
    patched += 1

assert patched >= 1, "no app pages found to patch"
print(f"jupyter_coi_patch: service worker patched, {patched} app pages bootstrapped")

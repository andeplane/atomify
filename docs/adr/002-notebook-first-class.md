# ADR-002: The notebook as a first-class analysis and scripting surface

- **Status**: Proposed (rev 2 — after integration review)
- **Date**: 2026-07-11
- **Deciders**: Anders Hafreager, Claude
- **Depends on**: ADR-001 (projects, runs, single project filesystem)

## Context

Atomify embeds JupyterLite (pyodide kernel) in an iframe
(`src/containers/Notebook.tsx`). The intended integration — push run
outputs into the notebook — is shallower than it looks: since the engine
moved into a Web Worker, `syncFilesJupyterLite` only round-trips **input**
files (the main-thread FS bridge is write-only; see ADR-001 Context #5).
Run outputs (`log.lammps`, dumps) never reach the notebook today. Beyond
that: the generated `analyze.ipynb` is flat and global, successive runs
overwrite each other, and the notebook can only look at results — it
cannot run LAMMPS.

The upstream **lammps.js** repo ships a proven deeper integration
(deployed at editor.lammps.org/notebook):

- A Python package **`lammps-js`** (`python/lammps/__init__.py`) mirroring
  the official LAMMPS Python API (`lmp = await lammps()`, `command`,
  `get_thermo`, `extract_atom`, …), built as a wheel into the JupyterLite
  piplite index.
- Inside the pyodide worker it dynamically imports the lammps.js ES module
  from `{site}/lammps/client.js` — engine and kernel share one thread, no
  message passing. URL derivation from the kernel URL is verified to work
  under Atomify's `/atomify/jupyter/` base.
- A proxy Emscripten FS (`_MOUNT_DRIVEFS_JS`) mounts JupyterLite's DriveFS
  onto the engine's workdir, mapped to **the kernel's cwd** (re-evaluated
  per operation, so `os.chdir` moves it): files LAMMPS writes land next to
  the notebook.
- Cross-origin isolation on static hosting via a build-time service-worker
  patch (`examples/notebook/coi_patch.py`) — JupyterLite's own SW must
  keep owning its scope, so the generic `coi-serviceworker` shim cannot be
  used inside it.

Atomify pins the same JupyterLite versions (`jupyterlite-core==0.8.0`,
`jupyterlite-pyodide-kernel==0.8.1`), so the pieces port — but review
established the port is **not** turnkey; §3 states the real supply chain.

With ADR-001, projects and runs live *in* the JupyterLite contents store.
This ADR decides the notebook experience on top of that.

## Decision

### 1. The notebook operates on the project directory

The Notebook tab opens JupyterLite at the current project's notebook:
`lab/index.html?path=<dirName>/analysis.ipynb`. The kernel cwd is the
project directory; by ADR-001's layout the notebook sees the working tree
and `runs/`. **Cross-run analysis is a glob, not a feature**:

```python
import glob, json, lammps_logfile
for path in sorted(glob.glob("runs/*/log.lammps")):
    meta = json.load(open(path.rsplit("/", 1)[0] + "/.atomify/run.json"))
    log = lammps_logfile.File(path)   # plot D vs meta["vars"]["T"], etc.
```

The Notebook tab is available only for **library projects**. Quick runs
and embeds live on `MemoryProjectStorage` (ADR-001 §6), which JupyterLite
cannot see — the tab is hidden there and appears after "Save as project".
(A scoped in-memory contents drive is possible future work.)

### 2. A per-project `analysis.ipynb`, generated once

At project creation Atomify generates `<dirName>/analysis.ipynb` from a
template (evolving `src/utils/AnalyzeNotebook.ts`): a header, a
latest-run plot cell, the compare-runs glob cell above, and a commented
scripting cell (§4). Examples that ship a curated notebook copy that in
instead. The file is **owned by the user afterwards** — never overwritten
(preserving today's guarantee, `src/store/simulation.ts:443-447`). Because
runs are discovered by glob at execution time, the notebook needs no
regeneration when runs appear — that is what makes generate-once viable.

`lammps_logfile` moves from a source-directory copy at the contents root
(which becomes unimportable once the notebook cwd is `<dirName>/`) to the
**`lammps-logfile` wheel from PyPI in the piplite index**; the content-dir
copy is deleted. Templates start with
`%pip install lammps-logfile lammps-js`.

### 3. Bundle the `lammps-js` Python package — with an explicit supply chain

Goal: notebooks can run entire simulations in the kernel:

```python
%pip install lammps-js
from lammps import lammps
import os
for T in [1.0, 2.0, 3.0]:
    rundir = f"runs/run-T{T}"
    os.makedirs(rundir, exist_ok=True)        # mkdir BEFORE LAMMPS writes there
    lmp = await lammps()
    lmp.command(f"log {rundir}/log.lammps")
    lmp.command(f"variable T equal {T}")
    lmp.file("in.diffusion")                  # reads the project working tree
    lmp.close()
```

**Supply chain** (review blocker — the wheel exists nowhere consumable
today: PyPI 404s, and the npm tarball excludes `python/`):

- **Upstream first** (we control lammps.js): PR to publish the `lammps-js`
  wheel — either to PyPI in `release.yml`, or by adding `python/` to the
  npm `files` so consumers build it from `node_modules`. Same PR bumps
  `python/pyproject.toml` to track the npm version (already skewed:
  1.5.0 vs 1.5.1).
- **Interim**: vendor the prebuilt wheel in-repo at
  `pypi/lammps_js-<ver>-py3-none-any.whl`, pinned to the npm lammps.js
  version, with a comment pointing at the upstream issue.
- **Build mechanics** (verified specifics): Atomify's lite dir is the repo
  root, so wheels go in `<repo>/pypi/` for auto-indexing; the built
  lammps.js client is copied `node_modules/lammps.js/dist/` →
  `public/jupyter/lammps/` **after** `npm install` — `deploy.yaml`
  currently builds the Jupyter site before npm install, so the workflow
  steps are reordered. A `make jupyter` target gives the same build
  locally (none exists today; `public/jupyter` is CI-only).

**Capability boundary** (stated honestly): the kernel client loads only
the *serial* or *KOKKOS* wasm variants (MOLECULE package set + KOKKOS);
the app's engine is the full-package `lammps-atomify` build. Projects
using packages outside that set (ReaxFF, KSPACE/water, Vashishta/silica…)
run in the app but **error in the kernel** until an upstream
`variant: "atomify"` client/python option lands (small change — the wasm
already ships in the npm dist as `./wasm-atomify`; it also means the dist
copy ships all three variants, ~55 MB, not ~40). The template's scripting
cell names this limitation.

Notebook-created runs carry `"origin": "notebook"` when the script writes
`run.json`; the app lists any `runs/*` directory regardless, rendering
metadata-less ones as "external run" rows with mtime-derived timestamps
(ADR-001 §5). The app's Run button and sweeps (ADR-001 §7) are one
producer of runs; Python loops are another; both write the same layout.

### 4. App ⇄ notebook freshness — corrected semantics

One store (ADR-001 §3) means no sync protocol, only cache refresh. Review
verified `BrowserStorageDrive` holds **no in-memory cache** — but two
timing realities must be designed around, not wished away:

- **App → notebook**: app-side writes are visible to the kernel and file
  browser on their next operation (JupyterLab's browser auto-refreshes
  ~10 s while visible). The app copies run outputs into `runs/<id>/`
  during a run (ADR-001 §5 data path), so a notebook **can** analyze an
  app-driven run in flight.
- **Notebook → app**: the DriveFS proxy flushes on **file close**. LAMMPS
  holds `log.lammps` open for the whole run, so kernel-driven runs become
  visible **at completion**, not in flight. Consequently: the Runs tab
  discovers notebook runs on its normal refresh triggers after they
  finish; and a file held open by the kernel clobbers concurrent app-side
  edits at close (the per-file LWW window is the open duration —
  acceptable, documented).
- The app re-stats the working tree on `visibilitychange` and pane
  switches (ADR-001 §8) to pick up notebook-side edits.

No postMessage bridge in v1; a same-origin `BroadcastChannel` is the
upgrade path if push-refresh is ever wanted.

### 5. Cross-origin isolation strategy

KOKKOS in the kernel needs `crossOriginIsolated`. Inside the Jupyter
scope, JupyterLite's own service worker must stay in control (DriveFS's
contents API rides on it), so Atomify ports lammps.js's `coi_patch.py`:
patch the built `service-worker.js` to add COOP/COEP/CORP headers, with
the one-shot reload bootstrap injected into the app pages. Two nested
service workers then coexist: the parent app's `coi-serviceworker`
(scope `/atomify/`, COEP `credentialless`) and JupyterLite's patched SW
(scope `/atomify/jupyter/`, `require-corp`). This combination is legal
(same-origin child with its own COEP) but the first-load sequencing —
two independent SW installs, two reload bootstraps — gets an **explicit
manual test matrix** (cold load, hard refresh, SW update) on the deployed
site before release; per project memory, dev/preview cannot reproduce
GitHub Pages SW behavior. Serial fallback keeps notebooks functional if
isolation fails.

## Alternatives considered

- **Notebook as viewer only.** Rejected: scripted parameter sweeps are the
  core scientific workflow requested, and lammps.js already paid the cost.
- **postMessage/custom JupyterLite extension for sync.** Heavy,
  version-pinned, unnecessary with a shared store.
- **One engine (run app simulations in the kernel too).** Couples the 3D
  visualization pipeline (worker heap streaming, ASYNCIFY constraints) to
  notebook lifecycle for no user benefit.
- **Regenerating `analysis.ipynb` per run.** Clobbers user work; glob
  discovery makes it moot.
- **Bundling `lammps_logfile` as content.** That is the status quo; it
  breaks under project-scoped cwds. Wheel via piplite is strictly better.

## Consequences

- (+) "Always synced with the notebook" holds by construction, with the
  honest caveat that kernel-side writes surface at file close.
- (+) Scripted sweeps and app sweeps produce the same on-disk shape;
  analysis code never cares who ran the simulation.
- (−) Two upstream lammps.js PRs are on the critical path for the full
  vision (wheel publication; `variant: "atomify"`). Both are small and we
  control the repo; the vendored wheel and the stated capability boundary
  keep Atomify shippable meanwhile.
- (−) The Jupyter site grows by the lammps.js dist (all wasm variants,
  ~55 MB). Trim to serial+kokkos if size bites.
- (−) The SW patch pins jupyterlite-core 0.8.0 internals (tracked
  upstream, jupyterlite#1409); version bumps require re-validating the
  patch asserts.
- (−) JupyterLite directory listings deserialize the entire store —
  ADR-001's size caps are what keep the notebook file browser fast; this
  coupling is a standing constraint on how much run output we persist.

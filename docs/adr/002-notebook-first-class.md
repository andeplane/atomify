# ADR-002: The notebook as a first-class analysis and scripting surface

- **Status**: Proposed
- **Date**: 2026-07-11
- **Deciders**: Anders Hafreager, Claude
- **Depends on**: ADR-001 (projects, runs, single project filesystem)

## Context

Atomify embeds JupyterLite (pyodide kernel) in an iframe
(`src/containers/Notebook.tsx`) and today pushes run outputs into the
JupyterLite contents IndexedDB after each run (`syncFilesJupyterLite`).
The integration is shallow:

- One-way: notebook edits never reach the app; the generated
  `analyze.ipynb` is written once and never regenerated.
- Flat: a single global `analyze.ipynb` regardless of simulation; outputs
  of successive runs overwrite each other.
- Passive: the notebook can only *look at* results. It cannot run LAMMPS.

Meanwhile, the upstream **lammps.js** repo (which Atomify already depends
on for its WASM engine) ships a proven, deeper integration
(`lammps/lammps.js`, deployed at editor.lammps.org/notebook):

- A Python package **`lammps-js`** (source `python/lammps/__init__.py`)
  whose wheel is bundled into the JupyterLite build (`pypi/`), installable
  with `%pip install lammps-js`. It mirrors the official LAMMPS Python API
  (`lmp = await lammps()`, `command`, `get_thermo`, `extract_atom`, …).
- Inside the pyodide worker it dynamically imports the lammps.js ES module
  from `{site}/lammps/client.js` — the engine runs **in the same worker as
  the kernel**, no message passing.
- A proxy Emscripten filesystem (`_MOUNT_DRIVEFS_JS`) mounts JupyterLite's
  DriveFS onto the engine's `/work`, so every file LAMMPS writes lands
  **next to the notebook** in the contents store, instantly visible in the
  file browser.
- Cross-origin isolation on static hosting via a build-time service-worker
  patch (`examples/notebook/coi_patch.py`) — JupyterLite's own service
  worker must keep owning the scope (the DriveFS contents API rides on it),
  so the generic `coi-serviceworker` shim cannot be used inside the
  notebook's scope.

Atomify pins the **same** JupyterLite versions as lammps.js
(`jupyterlite-core==0.8.0`, `jupyterlite-pyodide-kernel==0.8.1` in
`jupyterlite/requirements.txt`), so these pieces port directly.

With ADR-001, projects and runs live *in* the JupyterLite contents store.
This ADR decides what the notebook experience is on top of that.

## Decision

### 1. The notebook operates on the project directory

The Notebook pane opens JupyterLite at the current project's notebook:
`lab/index.html?path=<dirName>/analysis.ipynb`. The kernel's working
directory is therefore the project directory, and by ADR-001's layout the
notebook sees:

```
in.diffusion          # the working tree
runs/0001-k3f9a2/log.lammps
runs/0002-8xc1p0/log.lammps
```

**Cross-run analysis is a glob, not a feature**:

```python
import glob, lammps_logfile
for path in sorted(glob.glob("runs/*/log.lammps")):
    log = lammps_logfile.File(path)
    ...
```

### 2. A per-project `analysis.ipynb`, generated once

At project creation, Atomify generates `<dirName>/analysis.ipynb` from a
template (evolving `src/utils/AnalyzeNotebook.ts`). The template contains:

1. A markdown header naming the project.
2. A "latest run" cell: loads `sorted(glob("runs/*/log.lammps"))[-1]` and
   plots thermo output with `lammps_logfile` + matplotlib.
3. A "compare runs" cell iterating all runs (as above).
4. A commented "drive LAMMPS from Python" cell demonstrating `lammps-js`
   (see §3).

The file is **owned by the user after creation** — Atomify never overwrites
an existing notebook (preserving the guarantee the current code already
makes at `src/store/simulation.ts:443-447`). Because runs are discovered by
glob at execution time, the notebook does not need regeneration when new
runs appear — this is what makes "generate once" viable.

### 3. Bundle the `lammps-js` Python package: script runs from Python

The Atomify JupyterLite build adopts the lammps.js recipe:

- Add the `lammps-js` wheel to the build (piplite index in `pypi/`), and
  copy the lammps.js `dist/` to `public/jupyter/lammps/` so the package's
  client-URL derivation (strip `lab/…` from the kernel URL, append
  `lammps/client.js`) resolves. Both steps go into the existing
  `jupyter lite build` step in `.github/workflows/deploy.yaml` and the
  local `Makefile` equivalent.
- Notebooks can then run *entire simulations in the kernel*:

```python
%pip install lammps-js
from lammps import lammps
lmp = await lammps()
for T in [1.0, 2.0, 3.0]:
    lmp.command(f"variable T equal {T}")
    lmp.file("in.diffusion")          # reads the project's working tree
```

- Thanks to the DriveFS mount, files the kernel-side engine writes land in
  the project directory. The template's scripting cell demonstrates the
  convention of writing into `runs/<name>/` so scripted sweeps appear in
  the app's run history. Run records created this way carry
  `"origin": "notebook"`; a `run.json` is optional for notebook runs — the
  app lists any `runs/*` directory, and fills in what metadata exists.

This is the "script and run multiple things" capability: the app's Run
button is one producer of runs; Python loops in the notebook are another.
Both write the same layout into the same store.

### 4. App ⇄ notebook freshness

Because there is one store (ADR-001 §3), there is no sync protocol — only
cache refresh:

- **App → notebook**: JupyterLite's file browser polls the contents store;
  newly written run outputs appear on its next refresh. During a run the
  app copies outputs from the WASM FS into `runs/<id>/` on a throttle
  (every ~3 s) and at completion, so a notebook can analyze a run in
  flight.
- **Notebook → app**: the app re-stats the working tree on
  `visibilitychange` and on pane switches (ADR-001 §5), picking up files
  created or edited from the notebook side. The runs list refreshes on the
  same triggers, discovering notebook-created runs.

No postMessage bridge is required for v1. If richer signaling is ever
needed (e.g. push-refresh of the runs list), a `BroadcastChannel` on the
same origin is the natural upgrade path; it is explicitly out of scope now.

### 5. Cross-origin isolation strategy

KOKKOS multithreading needs `crossOriginIsolated`, and the kernel-side
engine wants it too (`lammps-js` falls back to serial otherwise). The main
app uses the `coi-serviceworker` shim, but **inside the notebook's scope
JupyterLite's service worker must stay in control** (its contents API and
DriveFS depend on it). Therefore Atomify adopts lammps.js's approach: patch
the built JupyterLite `service-worker.js` to add
COOP/COEP/CORP headers to every response (port of
`examples/notebook/coi_patch.py`), applied as a post-build step. This also
resolves the known conflict noted in project memory (JupyterLite's SW
shadowing the coi shim). Serial fallback keeps notebooks functional if
isolation fails.

## Alternatives considered

- **Keep app-side runs as the only producer and treat the notebook as a
  viewer.** Rejected: parameter sweeps are the core scientific workflow the
  user asked for ("script and run multiple things"), and lammps.js already
  paid the engineering cost.
- **postMessage/custom JupyterLite extension for file sync.** Heavy,
  version-pinned against JupyterLite internals, and unnecessary once the
  store is shared (ADR-001).
- **Running app-triggered simulations inside the kernel too (one engine).**
  Tempting unification, but the app's live 3D visualization is wired to its
  own worker pipeline (`LammpsWorkerProxy`, per-timestep heap streaming,
  ASYNCIFY constraints per project memory). Moving it into the kernel
  would couple rendering to notebook lifecycle for no user benefit.
- **Regenerating `analysis.ipynb` after every run.** Rejected: clobbers
  user work or forks endless copies; glob-based discovery makes it moot.

## Consequences

- (+) "Always synced with the notebook" holds by construction; the demo
  story ("run, then analyze across runs in Python, then script a sweep
  from Python") requires no manual file plumbing.
- (+) Atomify inherits upstream lammps.js maintenance of the Python
  package instead of building its own.
- (−) The JupyterLite build grows by the lammps.js dist (~40 MB with the
  KOKKOS wasm). Acceptable for a static site; can be trimmed to the serial
  build if size becomes a problem.
- (−) The SW patch pins against jupyterlite-core 0.8.0 internals (same
  trade lammps.js accepted; tracked upstream at jupyterlite#1409).
- (−) Two engines (app worker + kernel) can write the same project
  concurrently. Run-directory naming (unique suffixes) makes collisions
  structurally unlikely; per-file LWW covers the rest (ADR-001 §5).

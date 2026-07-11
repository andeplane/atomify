# ADR-001: Projects, runs, and a single project filesystem

- **Status**: Proposed
- **Date**: 2026-07-11
- **Deciders**: Anders Hafreager, Claude

## Context

Today a "simulation" in Atomify is a single in-memory object
(`Simulation` in `src/store/simulation.ts`):

```ts
export interface Simulation {
  id: string;
  files: SimulationFile[];
  inputScript: string;
  analysisDescription?: string;
  analysisScript?: string;
  start: boolean;
  vars?: Record<string, number>;
  showSimulationBox?: boolean;
  showWalls?: boolean;
}
```

Its problems, in order of user pain:

1. **Nothing persists.** The New Simulation modal literally warns
   *"these files are not stored across Atomify sessions yet"*
   (`src/containers/NewSimulation.tsx`). Closing the tab loses all edits.
2. **There is no history.** Every run overwrites the outputs of the previous
   one in the WASM filesystem and in the notebook storage. Comparing "before"
   and "after" a parameter change — the single most common workflow in
   MD work — is impossible without manually copying files out.
3. **One simulation at a time, keyed by a collision-prone `id`.** The `id`
   doubles as the WASM FS directory and the JupyterLite folder name. Loading
   the "diffusion" example twice silently merges/overwrites state.
4. **Edits bypass the store.** The Monaco editor mutates `file.content` in
   place (`src/containers/Edit.tsx`), invisible to easy-peasy/immer, so there
   is no reliable "content changed" signal to hook persistence onto.
5. **The notebook is a one-way dump.** `syncFilesJupyterLite` copies run
   outputs into the JupyterLite contents IndexedDB after a run; nothing is
   ever read back, and generated notebooks are never updated once they exist.

The goal is a product-grade story: a **library of projects** that persists
across sessions, where each project accumulates **runs** with full
provenance, and where the Jupyter notebook operates on the *same files* the
app does (see ADR-002).

## Decision

### 1. Domain model: Project = working tree + runs

A **project** is a named directory containing the user's *source files*
(input scripts, data files, notebooks) — the working tree — plus a `runs/`
directory that accumulates immutable **run records**.

A **run** is created every time a simulation is executed. It contains a
snapshot of the source files as they were at launch time, all outputs the
run produced, and a metadata record. Runs are append-only history; the
working tree is the only thing the user edits.

### 2. Canonical filesystem layout

The layout is storage-agnostic — the same tree works in IndexedDB today and
on a server filesystem behind an API later:

```
diffusion/                        # project directory (dirName = identity)
  .atomify/
    project.json                  # project metadata (see below)
  in.diffusion                    # working tree: source files
  data.lammps
  analysis.ipynb                  # project notebook (see ADR-002)
  runs/
    0001-k3f9a2/                  # run directory: seq number + short id
      .atomify/
        run.json                  # run metadata (see below)
      in.diffusion                # snapshot of sources at launch
      log.lammps                  # outputs
      msd.dat
    0002-8xc1p0/
      ...
```

`project.json`:

```jsonc
{
  "schemaVersion": 1,
  "displayName": "Diffusion",          // free-form, renameable
  "description": "LJ binary diffusion",
  "createdAt": "2026-07-11T09:00:00Z",
  "inputScript": "in.diffusion",       // default script to run
  "source": { "type": "example", "exampleId": "diffusion/simple_diffusion" }
  // source.type: "blank" | "upload" | "example" | "shared"
}
```

`run.json`:

```jsonc
{
  "schemaVersion": 1,
  "id": "0002-8xc1p0",
  "inputScript": "in.diffusion",
  "vars": { "T": 3.0 },
  "status": "completed",               // running | completed | failed | canceled
  "startedAt": "2026-07-11T09:05:00Z",
  "finishedAt": "2026-07-11T09:06:31Z",
  "stats": { "timesteps": 5000, "numAtoms": 6750, "wallSeconds": 91.2 },
  "origin": "app"                      // app | notebook (ADR-002)
}
```

Key naming decisions:

- **`dirName` is the project identity.** It is a slug derived from the
  display name at creation time (`"Diffusion"` → `diffusion`), unique-ified
  with a numeric suffix on collision (`diffusion-2`). It is what the user
  sees in the Jupyter file browser, so it must be human-readable — a UUID
  here would wreck the notebook experience. Renaming a project changes only
  `displayName`; `dirName` is immutable after creation so that notebook
  cells referencing paths never break.
- **Run directories sort chronologically by name** (zero-padded sequence
  number) and carry a short random suffix so concurrent creators (app and
  notebook kernel) cannot collide.
- **Snapshot scope**: all working-tree files except notebooks (`*.ipynb`)
  are copied into the run directory at launch. Notebooks are analysis, not
  simulation input. Data files are included because they affect results;
  this trades some storage for complete provenance (see Consequences).

### 3. The project filesystem IS the JupyterLite contents store

There is **one** persistent filesystem, not two stores kept in sync.
Projects are stored in the IndexedDB database that JupyterLite's contents
manager already reads and writes (`"JupyterLite Storage"`, store `files` —
configured in `jupyter-lite.json` and already targeted by
`src/store/simulation.ts:25-30`). Records use JupyterLite's contents schema
(`{name, path, content, format, mimetype, type, last_modified, created, size,
writable}`), one record per file/directory, keyed by path.

Consequences of this choice do the heavy lifting for the whole feature:

- "Sync with the notebook" stops being a mechanism and becomes a
  **non-event**: the notebook file browser shows a project's directory
  because the project *is* that directory.
- Files created by the pyodide kernel (via its DriveFS mount, ADR-002) are
  project files with zero extra code in the app.
- The future API backend is a natural fit: the Jupyter contents schema is
  already a REST API shape (Jupyter Server's contents API), so the swap is
  an implementation change, not a redesign.

### 4. Swappable storage interface

All persistence goes through a `ProjectStorage` interface. Nothing in the
app touches localforage/IndexedDB directly.

```ts
// src/storage/types.ts
export interface FileStat {
  path: string;               // project-relative, e.g. "runs/0001-k3f9a2/log.lammps"
  type: "file" | "notebook" | "directory";
  lastModified: string;       // ISO 8601
  size: number;
}

export interface ProjectStorage {
  // Project level
  listProjects(): Promise<ProjectMeta[]>;          // reads .atomify/project.json of each top-level dir
  createProject(meta: NewProjectMeta): Promise<ProjectMeta>; // allocates dirName
  updateProjectMeta(dirName: string, patch: Partial<ProjectMeta>): Promise<ProjectMeta>;
  deleteProject(dirName: string): Promise<void>;   // recursive

  // File level (paths are project-relative)
  list(dirName: string, subdir?: string): Promise<FileStat[]>;
  read(dirName: string, path: string): Promise<string | Uint8Array>;
  write(dirName: string, path: string, content: string | Uint8Array): Promise<FileStat>;
  rename(dirName: string, from: string, to: string): Promise<void>;
  remove(dirName: string, path: string): Promise<void>;
  stat(dirName: string, path: string): Promise<FileStat | null>;
}
```

Implementations:

- **`JupyterContentsStorage`** (now): backed by a dedicated `localforage`
  instance on `"JupyterLite Storage"/files`. Maintains directory records and
  parent listings the way JupyterLite expects.
- **`MemoryProjectStorage`** (now): in-memory map, used in **embedded mode**
  (iframe embeds and share-link previews must not write into the visitor's
  library) and in unit tests.
- **`ApiProjectStorage`** (later): same interface over HTTP.

The active implementation is chosen once at startup (embedded mode check)
and injected into the easy-peasy store via `createStore`'s `injections`, so
thunks receive it as a dependency rather than importing a singleton.

Run management (snapshotting sources, allocating run dirs, writing
`run.json`) is a thin `runs.ts` module implemented **on top of**
`ProjectStorage` file operations — it is layout convention, not a storage
concern, so the swappable surface stays minimal.

### 5. Write-through editing, single source of truth

The store's in-memory project state and Monaco buffers become **caches** of
the project filesystem:

- Editor changes dispatch a real action (fixing the in-place mutation bug)
  and persist via a debounced (~500 ms) `storage.write`. The save state is
  surfaced in the UI ("Saved" indicator) — think product.
- When the app regains focus (`visibilitychange`) or the user switches into
  the Edit/Files view, the working tree is re-`stat`ed; files whose
  `lastModified` is newer than the cached copy (e.g. edited in the Jupyter
  editor) are reloaded. Conflict policy is **per-file last-writer-wins** —
  acceptable for a single-user, single-browser tool, and revisit-able when
  an API backend introduces multi-device access.
- Runs write outputs to the WASM FS during execution (unchanged — the hot
  path stays off IndexedDB), then outputs are copied to
  `runs/<runId>/` at completion, plus a throttled copy every few seconds
  during the run so notebooks can watch progress (ADR-002).

### 6. Product rules for project creation

Every way of loading files into Atomify lands in the same model:

| Entry point | Behavior |
| --- | --- |
| **New simulation** | Creates a project (blank template or uploaded files). |
| **Examples → open** | Instantiates a project from the example (name = example name, suffixed on repeat). Examples are templates; the gallery itself stays read-only. |
| **Share link / embed** | Embedded mode: `MemoryProjectStorage`, nothing persisted. Normal mode: offer "Save to your simulations" which materializes a project. |

There is no "unsaved scratch simulation" state — removing it is what makes
the persistence story simple and trustworthy.

### 7. Migration

No migration is needed: nothing today persists projects. Existing
`"JupyterLite Storage"` content from the old one-way sync (flat
`analyze.ipynb`, `<id>/` directories without `.atomify/project.json`) is
simply not listed as projects; users can delete it via the Jupyter file
browser. The legacy `syncFilesJupyterLite` thunk is removed.

## Alternatives considered

- **Separate Atomify IndexedDB + two-way sync with JupyterLite storage.**
  Rejected: perpetual sync code, conflict windows, duplicate storage of
  potentially large dump files, and a second source of truth to corrupt.
  Single-store was chosen precisely to delete this problem class.
- **OPFS (Origin Private File System).** Attractive perf, but JupyterLite's
  contents manager reads IndexedDB; using OPFS reintroduces the two-store
  sync problem.
- **File System Access API (real local folder).** Great for power users but
  permission UX is heavy, unsupported in Firefox/Safari for writable
  handles, and orthogonal — it can become another `ProjectStorage`
  implementation later.
- **UUID project identity + display-name mapping everywhere.** Rejected
  because the directory name is user-visible in Jupyter; readable paths in
  notebooks (`runs/0002-.../log.lammps` under `diffusion/`) beat opaque ones.
- **Storing runs as diffs/refs instead of full snapshots.** Premature;
  snapshot-copy is trivially correct and the files are small in the common
  case. Content-addressed dedup can be added inside the storage layer
  without changing the layout contract.

## Consequences

- (+) Projects survive sessions; runs are comparable, reproducible history.
- (+) Notebook integration is structural, not synchronized (ADR-002 builds
  directly on this).
- (+) Storage backend swap is one class, as requested.
- (−) IndexedDB quota is finite (Chrome ~60 % of free disk per origin, but
  Safari is stricter). Large dump files multiplied by run history will hit
  it eventually. Mitigations, in order: surface per-project storage size in
  the UI, "delete run" affordance, `navigator.storage.persist()`, and later
  a size-capped output policy. Quota errors must surface as a visible
  warning, not silent data loss.
- (−) Writing run outputs through the contents schema stores file bodies as
  JSON strings (text) — binary dump formats need base64 records, matching
  JupyterLite's own convention for binary files.
- (−) The app takes on responsibility for keeping directory records
  consistent with what JupyterLite expects; covered by unit tests against
  recorded JupyterLite fixtures.

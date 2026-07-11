# ADR-001: Projects, runs, and a single project filesystem

- **Status**: Proposed (rev 2 — after architecture + product review)
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
2. **There is no history.** Every run overwrites the previous one's outputs.
   Comparing runs — the single most common workflow in MD work — requires
   manually copying files out of the browser.
3. **One simulation at a time, keyed by a collision-prone `id`** that
   doubles as the WASM FS directory and the JupyterLite folder name.
4. **Edits bypass the store.** Monaco mutates `file.content` in place
   (`src/containers/Edit.tsx`), invisible to easy-peasy/immer — no reliable
   "content changed" signal exists to hook persistence onto.
5. **The notebook integration is one-way and stale.** `syncFilesJupyterLite`
   was written when the WASM FS lived on the main thread. Since the worker
   migration, the main thread's `getWasm().FS` is a **write-only bridge**
   (a JS `Map` mirroring only files the main thread itself wrote —
   `src/wasm/LammpsWorkerProxy.ts:300-362`), and the worker protocol has no
   file-read command (`src/wasm/workerMessages.ts`). So today's "sync" only
   round-trips input files; **run outputs never reach the notebook at all.**

The goal is a product-grade story: a **library of projects** that persists
across sessions, where each project accumulates **runs** with full
provenance, and where the Jupyter notebook operates on the *same files* the
app does (ADR-002). The user-facing noun is **project** (per the design,
ADR-003); "simulation" describes what a run executes.

## Decision

### 1. Domain model: Project = working tree + runs

A **project** is a named directory containing the user's *source files*
(input scripts, data files, notebooks) — the working tree — plus a `runs/`
directory that accumulates immutable **run records**.

A **run** is created every time a simulation is executed — from the app's
Run button, from a parameter sweep (§7), or from Python in the notebook
(ADR-002). It contains a snapshot of the source files as they were at
launch, all outputs the run produced, and a metadata record. Runs are
append-only history; the working tree is the only thing the user edits.

Each project has **at most one designated input script**
(`project.json.inputScript`). It is set automatically when unambiguous
(project created from an example; or exactly one `in.*`/`*.in` file in the
working tree) and is otherwise unset. **Run behavior when unset**: the Run
button prompts the user to choose from the project's candidate scripts and
persists the choice (ADR-003 §5). Any file can also be run directly
("Run this file") without changing the default.

### 2. Canonical filesystem layout

The layout is storage-agnostic — the same tree works in IndexedDB today and
on a server filesystem behind an API later:

```
diffusion/                        # project directory (dirName = identity)
  .atomify/
    project.json                  # project metadata
  in.diffusion                    # working tree: source files
  data.lammps
  analysis.ipynb                  # project notebook (ADR-002)
  runs/
    run-001/                      # run directory
      .atomify/
        run.json                  # run metadata
        frame.png                 # final viewport capture (ADR-003)
      in.diffusion                # snapshot of sources at launch
      log.lammps                  # outputs
      msd.dat
    run-002/
      ...
```

`project.json`:

```jsonc
{
  "schemaVersion": 1,
  "displayName": "Diffusion coefficients",   // free-form, renameable
  "description": "LJ binary diffusion",
  "createdAt": "2026-07-11T09:00:00Z",
  "inputScript": "in.diffusion",             // designated script; may be absent
  "color": "#3F6EFF",                        // library identity dot (ADR-003)
  "source": { "type": "example", "exampleId": "diffusion" }
  // source.type: "blank" | "upload" | "example" | "shared"
}
```

`run.json`:

```jsonc
{
  "schemaVersion": 1,
  "id": "run-002",
  "inputScript": "in.diffusion",
  "vars": { "T": 3.0 },                      // LAMMPS variables injected (§7)
  "sweepId": "sweep-yj2k",                   // present when part of a sweep (§7)
  "status": "completed",                     // running | completed | failed | canceled | interrupted
  "startedAt": "2026-07-11T09:05:00Z",
  "finishedAt": "2026-07-11T09:06:31Z",
  "stats": { "timesteps": 5000, "numAtoms": 6750, "wallSeconds": 91.2 },
  "error": null,                             // LAMMPS error message when failed
  "origin": "app"                            // app | sweep | notebook (ADR-002)
}
```

Naming rules:

- **`dirName` is the project identity.** Slug of the display name at
  creation (`"Diffusion coefficients"` → `diffusion-coefficients`),
  alphabet `[a-z0-9-]`, non-empty (fallback `project`), unique-ified with a
  numeric suffix. It is what the user sees in the Jupyter file browser, so
  it must be human-readable. Renaming a project changes only `displayName`;
  `dirName` is immutable so notebook paths never break. The rename dialog
  and the workspace header show the dirName (mono font) so the mapping is
  never a mystery. `%` and `/` are rejected in all file names (JupyterLite's
  drive `decodeURIComponent`s paths; `%` throws in its UI).
- **Run directories are `run-NNN`** (zero-padded sequence, per the design).
  Allocation takes the max existing number + 1; if the allocated directory
  already exists (concurrent creation from the notebook side), allocation
  retries with the next number. The app **claims the directory by writing
  its directory record before anything else**, and the notebook template
  recommends non-numeric run names (`run-T3.0`), so simultaneous
  allocation cannot silently merge two runs. Runs created by external
  tools with other names are still listed (§5).

**Snapshot contract** (explicit allow/deny — review finding): a run
snapshot copies the working tree **excluding** `runs/`, `.atomify/`, and
`*.ipynb`. Notebooks are analysis, not simulation input; `runs/` excluded
prevents recursive snapshot growth. When a file is byte-identical to the
same path in the previous run's snapshot, the copy skips re-reading and
re-encoding the working-tree body — but **the bytes are still duplicated
per run** (the contents schema stores full content per path-keyed record).
True dedup (content-addressed records behind the storage interface) is
future work; the size caps below are what actually bound quota today.
Files larger than a threshold (default 64 MB) are not snapshotted; the run
records their names + hashes in `run.json` so provenance gaps are explicit.

### 3. The project filesystem IS the JupyterLite contents store

There is **one** persistent filesystem, not two stores kept in sync.
Projects live in the IndexedDB database JupyterLite's contents manager
already uses (`"JupyterLite Storage"`, per `jupyter-lite.json`), in
JupyterLite's contents schema: one record per file/directory keyed by path,
value `{name, path, content, format, mimetype, type, last_modified,
created, size, writable}`.

This single decision does the heavy lifting: "sync with the notebook" stops
being a mechanism and becomes a non-event; files created by the pyodide
kernel are project files with zero extra code; and the future API backend
maps 1:1 onto Jupyter Server's contents REST API.

**Facts we design around** (verified against `@jupyterlite/contents`'
`BrowserStorageDrive`, jupyterlite-core 0.8):

- The DB has **three object stores**: `files`, `counters`, and
  `checkpoints`. JupyterLite saves up to 5 full checkpoint copies of files
  edited in its UI. Our `remove`/`rename`/`deleteProject` must clear
  matching `checkpoints` entries (mirroring JupyterLite's own
  `forgetPath`), or deleted projects leak quota and can be "restored" from
  the checkpoint UI.
- Listing a directory in JupyterLite **iterates every record in the store,
  materializing values**. Browsing cost therefore scales with total bytes
  stored, which is another reason the size caps in §2/§8 exist.
- `get()` on a path with no record **throws**; every ancestor directory
  needs an explicit directory record. `ProjectStorage.write()` auto-creates
  missing parent directory records.
- Notebooks are stored as **parsed JSON** (`format: "json"`), binary files
  as base64 strings, text as strings. The storage implementation owns the
  extension→`{type, format, mimetype}` table and it must match JupyterLite's
  file registry.
- Dot-directories (`.atomify/`) get records like any other path; JupyterLab's
  file browser hides dotfiles by default (`showHiddenFiles` off), which is
  exactly the behavior the layout wants.
- The kernel-side DriveFS proxy flushes writes on **file close** — a file
  LAMMPS holds open all run (e.g. `log.lammps`) reaches the store at
  completion, not incrementally (consequences in ADR-002 §4).

**App-side listing strategy** (avoids the O(store bytes) trap): the app
never bulk-reads file bodies to render lists. `listProjects()` scans
**keys only** (`localforage.keys()`), finds top-level dirs, and reads just
their `.atomify/project.json` records. The Runs tab likewise scans keys
under `<dirName>/runs/` and reads only `run.json` records lazily. `stat()`
of a working-tree file does read its record (localforage has no partial
reads), which is acceptable because working trees are small; the app never
`stat`s `runs/` contents wholesale.

### 4. Swappable storage interface

All persistence goes through a `ProjectStorage` interface; nothing else
touches localforage/IndexedDB.

```ts
// src/storage/types.ts
export type FileFormat = "text" | "json" | "base64";

export interface FileStat {
  path: string;              // project-relative
  type: "file" | "notebook" | "directory";
  format: FileFormat;
  mimetype: string;
  lastModified: string;      // ISO 8601
  size: number;
}

export interface ProjectStorage {
  // Projects
  listProjects(): Promise<ProjectMeta[]>;
  createProject(meta: NewProjectMeta): Promise<ProjectMeta>;   // allocates dirName
  updateProjectMeta(dirName: string, patch: Partial<ProjectMeta>): Promise<ProjectMeta>;
  deleteProject(dirName: string): Promise<void>;               // recursive, incl. checkpoints

  // Files (project-relative paths; parents auto-created on write)
  list(dirName: string, subdir?: string): Promise<FileStat[]>; // key-scan, no body reads
  read(dirName: string, path: string): Promise<string | Uint8Array>; // Uint8Array iff base64
  write(dirName: string, path: string, content: string | Uint8Array): Promise<FileStat>;
  rename(dirName: string, from: string, to: string): Promise<void>;  // incl. checkpoints
  remove(dirName: string, path: string): Promise<void>;              // incl. checkpoints
  stat(dirName: string, path: string): Promise<FileStat | null>;
}
```

`read` returns `Uint8Array` exactly when the stored format is `base64`;
notebooks come back as their JSON text. Binary uploads are supported by
reading `File.arrayBuffer()` (the current `originFile.text()` upload path
is replaced).

Implementations:

- **`JupyterContentsStorage`** (now): the IndexedDB implementation above.
- **`MemoryProjectStorage`** (now): in-memory map for **embedded mode**,
  **quick runs** (§6), and unit tests.
- **`ApiProjectStorage`** (later): same interface over HTTP.

The storage a given project uses is resolved by context (persistent library
vs. quick-run/embed scratch space) — not a single global chosen once. Both
implementations are injected into the easy-peasy store via `createStore`
`injections` so thunks receive them as dependencies.

Run management (snapshotting, run-dir allocation, `run.json`, sweeps) is a
`src/storage/runs.ts` module implemented **on top of** `ProjectStorage` —
layout convention, not a storage concern, so the swap surface stays minimal.

### 5. Run outputs data path (new worker protocol)

The runs mechanism requires reading files back out of the worker, which is
impossible today (Context #5). The worker protocol gains:

- `snapshotWorkdir` request → worker responds with `{path, bytes}[]` for
  files under the run's working directory, **collected inside the
  step-callback window** (the WASM module sits suspended in ASYNCIFY sleep
  between steps and must only be touched synchronously inside the step
  callback — established project constraint). Buffers are transferred, not
  copied.
- The collection is **size-aware**: per file, only files ≤ the copy
  threshold are included mid-run; everything (subject to §2 caps) is
  included in the final end-of-run snapshot. `log.lammps` and small series
  files stream live; a growing multi-hundred-MB dump does not stall the
  simulation loop.

Flow per run:

1. Flush pending editor debounce (§8), snapshot working tree →
   `runs/run-NNN/` (from the store's buffers, so what runs is what is
   recorded — no debounce race).
2. Write `run.json` (`status: "running"`), sync sources into the worker's
   WASM FS under `/<dirName>/runs/run-NNN/`, run there (cwd = run dir, so
   LAMMPS relative writes land in the run by construction).
3. Every ~3 s of wall clock, the step callback triggers `snapshotWorkdir`
   (thresholded) → `ProjectStorage.write` the changed outputs.
4. On finish: final snapshot (all sizes, subject to caps), update
   `run.json` (`completed`/`failed`/`canceled` + stats + error), capture
   `frame.png`.

**Reconciliation** (crash/zombie handling — review finding): on project
open and on library listing, a run with `status: "running"` that this
session does not own is rewritten to `"interrupted"` (partial outputs
kept, badge in UI) — with an **ownership/grace rule** so live notebook
runs are not killed: app/sweep-origin runs reconcile immediately (one app
session owns the engine), while `origin: "notebook"` runs reconcile only
when their `run.json` `last_modified` is older than a grace window
(10 min). Runs in `runs/*` without any `run.json` (external/scripted)
are listed as "external run" rows with mtime-derived timestamps, never
reconciled. A top-level directory without `.atomify/project.json`
is not listed; the library offers "recover as project" for such orphans.
If the project directory disappears mid-run (deleted from the Jupyter
side), the run is canceled and its output copies stop.

### 6. Product rules: where files come from

| Entry point | Behavior |
| --- | --- |
| **New project** | Modal: name + start blank / from example / drop files. Creates a persisted project. |
| **Example → "Use as project"** | Instantiates a project from the example's files. |
| **Example → "Quick run"** | Runs immediately in a **scratch project on `MemoryProjectStorage`** — nothing persisted, banner offers **"Save as project"**, which materializes the working tree *and completed runs* into the library. Closing the tab discards it. This keeps tire-kicking from littering the library (review finding) while "everything in the library persists" stays absolutely true. |
| **Share link** | Normal mode: opens as a quick run (same banner/save flow). Embedded mode: `MemoryProjectStorage`, no save affordance, Notebook hidden (ADR-002 §1). |

### 7. Parameter sweeps

A script that uses LAMMPS variables (`variable T equal 3.0` /
`${T}`-style references, already injectable via the existing
`prepareVarsScript` mechanism, `src/store/simulation.ts:37-59`) can be
**parameterized at run time**: the Run flow lets the user define values or
ranges for one or more variables (e.g. `T = 1.0, 1.5, … 3.0`), producing
the cartesian product as a **sweep** — one run per combination:

- Each combination becomes an ordinary run (`run-014`, `run-015`, …) with
  `vars` and a shared `sweepId` in `run.json`. There is no separate sweep
  entity in storage — a sweep is a label over runs, so cross-run analysis
  in the notebook (`glob("runs/*/log.lammps")` + reading `vars` from
  `run.json`) works identically for swept and manual runs.
- The app executes sweep runs **sequentially** (one WASM engine); the Runs
  tab shows queued entries (`status: "queued"` in memory only — never
  persisted, so no zombie queue states) with progress per run and
  cancel-remaining. Consequence of in-memory queuing: a page refresh
  mid-sweep drops the not-yet-started combinations; on reload the app
  shows "sweep interrupted — N runs not started" with a re-enqueue
  affordance (completed runs are untouched).
- Variable values are injected per run via the vars-wrapper mechanism, and
  recorded in `run.json.vars` — the Runs list surfaces them (ADR-003), which
  is what makes ten near-identical rows distinguishable.
- Sweeps from Python in the notebook remain a plain `for` loop (ADR-002);
  the app sweep is the no-code path over the same storage layout.

### 8. Write-through editing, single source of truth

Store state and Monaco buffers are **caches** of the project filesystem:

- Editor changes dispatch a store action (fixing the in-place mutation) and
  persist via debounced (~500 ms) `storage.write`. The editor shows
  three save states: *saving / saved / couldn't save (retry)* — a saved
  indicator that can silently lie is worse than none (review finding).
- Debounce is **flushed** on run start (§5), on `visibilitychange: hidden`,
  and on pane switches.
- On focus regain and pane switches, the working tree is re-`stat`ed;
  files newer in storage than the cache (edited in the Jupyter UI) reload —
  **unless the local buffer is dirty**, in which case the local buffer wins
  until saved (per-file last-writer-wins with a dirty-buffer carve-out).
- Editing is **no longer locked during runs** — runs execute from their
  snapshot, so the working tree is free (product win the old design left
  on the table; the current read-only editor lock is removed).

### 9. Migration

Nothing today persists projects, but the legacy one-way sync did write
`analyze.ipynb` and `<id>/…` entries that may hold real user analysis
work. Policy: leave legacy records untouched; they remain reachable from
the Jupyter file browser. The Notebook pane's flat-path logic
(`src/containers/Notebook.tsx`) and `syncFilesJupyterLite` are removed in
the **same change** that introduces project-scoped notebooks (they are
load-bearing for each other — review finding). Examples that ship a curated
`analysisScript` notebook copy it into the project working tree at
instantiation (taking precedence over the generated template, ADR-002 §2).

## Alternatives considered

- **Separate Atomify IndexedDB + two-way sync into JupyterLite storage.**
  Rejected: perpetual sync code, conflict windows, duplicated large files,
  a second source of truth to corrupt.
- **OPFS / File System Access API.** Not readable by JupyterLite's contents
  manager → reintroduces two-store sync. FSA additionally has heavy
  permission UX and no writable-handle support in Firefox/Safari. Either
  can become a `ProjectStorage` implementation later.
- **UUID project identity.** Rejected: the directory name is user-visible
  in Jupyter; readable notebook paths beat opaque ones.
- **A custom JupyterLite drive plugin** to avoid the contents-schema
  coupling. Deferred: version-pinned against JupyterLite internals and not
  needed while the schema-fidelity tests pass.
- **Run snapshots as diffs.** The skip-unchanged rule (§2) captures the
  dominant saving (large data files rarely change between runs) without a
  diff format.

## Consequences

- (+) Projects survive sessions; runs are comparable, reproducible history
  with explicit provenance (including what was *not* snapshotted).
- (+) Notebook integration is structural (ADR-002 builds on §3).
- (+) Storage backend swap is one class per backend, as requested.
- (−) IndexedDB quota is finite and JupyterLite browsing cost scales with
  stored bytes. Mitigations **in priority order**: (1) size caps on
  snapshot/copy with explicit gaps recorded (§2, §5); (2) skip-unchanged
  snapshot dedup (§2); (3) per-project size surfaced in the UI + delete-run
  affordance (ADR-003); (4) `navigator.storage.persist()` (prevents
  eviction; adds no quota). A quota error during output copy marks the run
  `failed` with reason `storage full` (partial outputs kept) and raises a
  visible warning naming the project — never silent loss.
- (−) Base64 inflates binary outputs by ~33 % and giant single-record
  strings are the known fragile spot in browsers; the size caps above are
  the guard. Blob-valued records are a possible future optimization if
  JupyterLite compatibility allows.
- (−) The app owns contents-schema fidelity (directory records, checkpoint
  cleanup, format table), verified by unit tests against fixtures recorded
  from a real JupyterLite session.
- (−) A new worker protocol (`snapshotWorkdir`) is required; its
  step-callback scheduling is constrained by ASYNCIFY re-entry rules and
  must be reviewed against them.

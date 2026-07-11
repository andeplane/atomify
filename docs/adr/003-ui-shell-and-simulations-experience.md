# ADR-003: UI shell redesign and the projects experience

- **Status**: Accepted (2026-07-11)
- **Date**: 2026-07-11
- **Deciders**: Anders Hafreager, Claude
- **Depends on**: ADR-001 (projects & runs), ADR-002 (notebook)
- **Design source**: claude.ai Design project `f50a64cb-1082-404c-b41f-728c9d24e37f`,
  file **`Atomify Projects.dc.html`** (supersedes `Atomify.dc.html`). The
  design is still being iterated; the latest version is re-fetched
  immediately before UI implementation. This ADR fixes structure and
  behavior; pixels follow the design file.

## Context

The current shell is an antd `Layout` whose `Sider` menu drives an
invisible antd `Tabs` (`src/App.tsx`, `src/containers/Main.tsx`,
`src/hooks/useMenuItems.tsx`). There is no library, no run history, no
file management, and the run-completion moment is a Console *modal*
popping over everything (`handleRunResult` → `setShowConsole(true)`).

The design establishes a different information architecture than the old
menu — and different from rev 1 of this ADR: there are no global
View/Console panes; those fold into a per-run **Run detail** screen.

## Decision

### 1. Vocabulary (glossary — binding for all UI copy)

| Term | Meaning | UI usage |
| --- | --- | --- |
| **Project** | Named directory: working tree + runs (ADR-001) | "Projects", "New project", breadcrumb `Projects /` |
| **Run** | One execution, immutable record | "Run #005", "Runs" tab |
| **Simulation** | What a run executes | verbs/marketing only: "Run simulation" button |
| **Quick run** | Ephemeral scratch project (ADR-001 §6) | banner: "This is a quick run — files are temporary" |

"Your simulations" from the original brief is realized as the **Projects**
library. The word "project" is the user-facing noun (per the design);
runs are numbered `#NNN`. The internal `dirName` appears as a mono-font
subtitle in the workspace header and rename dialog ("folder name stays
`diffusion`"), so the Jupyter file browser never shows a mystery name.

### 2. Information architecture (per `Atomify Projects.dc.html`)

```
Sidebar (global): Home · Example library · PROJECTS (list, + New project)
                  footer: theme toggle · Settings

Home:             greeting · "Continue where you left off" card (live run
                  status) · Create new project · Quick-run an example ·
                  Recent projects grid · "Start from an example" row

Example library:  card grid; per card: "Use as project" | "Quick run"

Project workspace:
  header:         breadcrumb · displayName · Running pill · Share · Run simulation
  tabs:           Files | Runs | Notebook
  Files:          table (name/size/modified/actions) · search · New file ·
                  Upload · drop-anywhere · runs/ folder row (tagged) ·
                  input-script chip on the designated script
  Editor:         sub-screen of Files (back button, filename, type chip,
                  save state, Save & run)
  Runs:           run rows: status icon, #NNN, when, script (mono), summary,
                  vars, live progress bar for running runs
  Run detail:     sub-screen of Runs: 3D viewport + following console strip +
                  right panel (status stats, speed slider, output files) ·
                  Stop (while running) · "Analyze in notebook"
  Notebook:       JupyterLite iframe at <dirName>/analysis.ipynb
                  (design shows a project-files rail; v1 relies on
                  JupyterLite's own file browser)
```

Sidebar projects show a **color identity dot** (from `project.json.color`,
assigned from the design palette at creation) and a pulsing dot when
running. **No thumbnails in v1** — the design uses color dots for cards;
the only image is the Home "continue" card, which uses the last run's
`frame.png` (captured from the WebGL canvas at run completion,
ADR-001 §5) when present, else a gradient.

### 3. Navigation state

No router (GitHub Pages subpath + embeds); the ad-hoc `selectedMenu`
string is replaced by typed state:

```ts
type Screen =
  | { name: "home" }
  | { name: "examples" }
  | { name: "project"; dirName: string; tab: "files" | "runs" | "notebook";
      filePath?: string;   // files tab: editor sub-screen
      runId?: string }     // runs tab: run-detail sub-screen
```

Deep links (`?project=diffusion&tab=runs&run=run-005`) map 1:1 so refresh
restores position. Legacy params (`script=`, embed codec URLs) resolve
into quick-run state. Embedded mode lands on the run detail of its
auto-started run and hides sidebar/library (as today) and the Notebook tab
(ADR-002 §1).

### 4. The run lifecycle (the core loop, specified end-to-end)

1. **Run simulation** (header) or **Save & run** (editor): flush editor
   saves, create the run (ADR-001 §5), navigate to **Run detail** of the
   new run — live viewport, following console, stats. The old
   console-completion modal is **removed**.
2. **While running**: sidebar project row and header show the running
   pulse; the Runs tab shows the live row with progress. Speed/UI sliders
   live in the run-detail right panel. Editing files stays enabled
   (runs execute from snapshots).
3. **Completion**: run-detail status pill flips (completed/failed —
   failed shows the LAMMPS error from `run.json.error` prominently);
   output files panel fills in; `frame.png` captured. If the user is
   elsewhere in the app, a toast: "Run #005 finished — View · Analyze in
   notebook". No modal.
4. **Run button with no input script** (user requirement): if
   `project.json.inputScript` is unset and more than one candidate
   exists, the Run button opens a "Choose input script" dialog listing
   the working tree's scripts; the choice persists to `project.json`.
   Exactly one candidate → auto-set silently. Zero candidates → dialog
   explains and offers New file/Upload. The Files tab shows an
   "input script" chip on the designated file, and each script row has
   "Set as input script" + one-off "Run this file" actions.
5. **Parameter sweep** (user requirement): a dropdown on the Run button —
   "Run simulation" / "Sweep variables…". The sweep dialog detects
   `variable X equal …` definitions in the input script, lets the user
   enter a list or range per variable (`1.0, 1.5 … 3.0`), previews the
   run count, and enqueues the cartesian product as sequential runs
   (ADR-001 §7). The Runs tab groups rows sharing a `sweepId` under a
   collapsible header with "cancel remaining"; each row shows its `vars`.
6. **Opening a previously-run project**: workspace opens on **Files**
   for never-run projects, **Runs** otherwise. Run detail of a finished
   run shows `frame.png` in the viewport area (with "Run again" overlay)
   plus the console (rendered from the run's persisted `log.lammps`) and
   outputs — never a silent black canvas (review blocker). Trajectories
   are not replayed in v1.
7. **Interrupted runs** (ADR-001 §5 reconciliation) render with a
   distinct badge and keep partial outputs.

### 5. Files, editing, deletion

- Files tab lists the working tree plus the `runs/` folder row (tagged
  "one directory per run", navigating to the Runs tab). `.atomify/` is
  hidden. Run outputs open **read-only** in Monaco with a "snapshot of
  run #NNN" banner; immutability of runs is a UI convention (the kernel
  is not blocked from writing there — documented, not enforced).
- Editor autosaves (debounced) with visible *saving / saved / couldn't
  save (retry)* states (ADR-001 §8); the design's Save button is the
  immediate-flush affordance. `Save & run` = flush + run.
- **Delete project**: confirm modal states run count and total size
  ("Deletes 14 runs, 320 MB — cannot be undone"); blocked while that
  project has a live run. **Delete run**: plain confirm with size. No
  undo/trash in v1 (decided, not deferred-by-silence).
- **Duplicate project**: copies working tree + notebook, **not** runs;
  fresh dirName. (Explicitly: the copied notebook's glob sees zero runs
  until the copy is run.)
- Rename edits `displayName` only (§1).
- **Storage pressure**: Settings shows a storage meter (via
  `navigator.storage.estimate()`) with per-project sizes; quota failures
  surface as a toast naming the project (ADR-001 consequences).

### 6. Visual implementation strategy

- **The shell is bespoke**: design tokens as CSS custom properties
  (`--bg/--surface/--text/--accent/…`) with `[data-theme]` dark/light
  variants; Manrope UI font, JetBrains Mono for code/paths. The antd
  `Menu`/`Tabs` shell is removed.
- **antd remains for commodity inner components** (Upload dragger,
  notifications/toasts, tooltips), bridged to the same tokens via
  `ConfigProvider`; Monaco, dygraphs, omovi untouched.
- **Theme** is a persisted setting (`data-theme` on root); the design's
  light palette becomes Atomify's first light mode. The JupyterLite
  iframe keeps its own theme setting in v1.
- The WASM-loading progress must not block Home/library browsing (today a
  modal blocks everything until the engine loads) — the engine is needed
  only to *run*, not to browse, edit, or read notebooks.

### 7. v1 vs deferred

| In v1 | Deferred |
| --- | --- |
| Home, library, create (blank/example/upload), open, rename, duplicate, delete | Project tags/search/sort beyond updated-at |
| Files CRUD + Monaco autosave + input-script selection | Working-tree subfolders UI, drag-reorder |
| Runs list + run detail + interrupted reconciliation + delete run | Run comparison/diff UI, run notes |
| Variable sweeps (list/range, sequential queue) | Parallel sweep execution, sweep charts |
| Quick run + Save as project; share links open as quick runs | Publishing a project as a shareable example |
| Design tokens, dark + light, storage meter | Accent color picker, thumbnails on cards |

## Alternatives considered

- **react-router**: small screen graph, trivial deep-link mapping; a
  router adds base-path friction on Pages for no structural gain.
- **Restyle antd in place**: the sidebar/cards/run-rows don't map onto
  antd idioms; owning ~600 lines of layout primitives is cheaper than
  fighting the library.
- **Global View/Console panes (rev 1 of this ADR)**: superseded by the
  design — run-scoped detail makes "which run am I looking at?"
  unaskable, and kills the completion-modal pattern naturally.
- **Thumbnails on all cards (rev 1)**: dropped in favor of the design's
  color-dot identity; `frame.png` capture is kept only where it earns
  its cost (continue card, run detail).

## Consequences

- (+) The core loop is fully specified: create → edit (autosave) → run
  (live detail) → analyze (notebook glob) → iterate (sweeps, history).
- (+) Typed navigation kills the `"file"+fileName` string-key hack;
  every screen is deep-linkable and testable.
- (−) `App.tsx`, `Main.tsx`, `useMenuItems.tsx` are substantially
  rewritten; embed + AutoStart flows need regression tests (they bypass
  Home and land on run detail).
- (−) Two styling systems coexist during transition (tokens + antd
  bridge), contained inside panes.
- (−) Run detail for historical runs is a still image + logs in v1;
  trajectory replay stays future work.

## Amendment (2026-07-11)

Embedded mode is gone: `embed=true` iframes, `AutoStartSimulation`, the
invisible-tabs `Main` shell, the Share modal and the URL-encoding codec
were all removed — the projects shell is the whole app. The §3 note about
legacy params resolving into quick-run state no longer applies (they are
ignored), and the workspace header has no Share button. URL-encoded
sharing died on GitHub Pages' ~2 KB URL limit; project zip export/import
(workspace ⋯ menu / New Project upload) is the sharing story, and the book
embedding use case will use a different mechanism. Sharing via a backend
is future work.

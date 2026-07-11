# ADR-003: UI shell redesign and the "Your simulations" experience

- **Status**: Proposed
- **Date**: 2026-07-11
- **Deciders**: Anders Hafreager, Claude
- **Depends on**: ADR-001 (projects & runs), ADR-002 (notebook)
- **Design source**: claude.ai Design project `f50a64cb-1082-404c-b41f-728c9d24e37f`
  (`Atomify.dc.html`). The design is being actively iterated by the user; the
  latest version is re-fetched immediately before UI implementation. This ADR
  fixes the *structure*; pixels follow the design file.

## Context

The current shell is an antd `Layout` with a `Sider` menu driving an
invisible antd `Tabs` (`src/App.tsx`, `src/containers/Main.tsx`,
`src/hooks/useMenuItems.tsx`). There is no notion of a simulation library:
the menu shows View / Console / Notebook / "Edit `<id>`" / New simulation /
Examples / Share / Run controls / Settings, all scoped to the single
in-memory simulation. Files of the loaded simulation appear only as
submenu entries; there is no add/rename/delete, no list of past work, and
no visual identity beyond stock antd dark theme.

The Claude Design draft establishes: a collapsible custom sidebar (brand,
grouped nav: *Workspace* [View / Console / Notebook / Edit], *Simulations*
[New simulation / Examples / Share], *Run* [Run-Stop primary button / Run
in cloud], footer with dark/light toggle + Settings), an Examples gallery
as a card grid with filter chips and search, a viewport HUD (Dynamics
panel: stats, speed sliders, modifier checkboxes, computes), custom-styled
modals, and a full design-token system (CSS variables, Manrope +
JetBrains Mono, light/dark themes, accent-configurable).

ADR-001/002 introduce concepts the current UI cannot express: a project
library, a working tree per project, and a run history.

## Decision

### 1. Information architecture

```
Home ("Your simulations")            ← default screen, replaces Examples as landing
 ├─ New simulation (modal)           ← creates project (blank / upload)
 ├─ Examples gallery                 ← templates; opening one instantiates a project
 └─ Project workspace (per project)
     ├─ View        (3D viewport + Dynamics HUD)
     ├─ Console     (LAMMPS log of current/last run)
     ├─ Notebook    (JupyterLite at <dirName>/analysis.ipynb)
     ├─ Files       (working tree: open-in-editor, add, upload, rename, delete)
     │   └─ Editor  (Monaco, per file, autosave with saved-state indicator)
     └─ Runs        (history list: status, started, duration, atoms/steps,
                     open outputs in Files/Notebook, delete run)
```

- **"Your simulations" is the landing screen** (except embedded mode, which
  keeps landing on View). It shows a card grid of projects — name,
  description, updated-at, run count, thumbnail — plus prominent "New
  simulation" and "Browse examples" entries and an empty state that points
  first-time users at Examples.
- **The sidebar becomes project-aware.** The *Workspace* group (View /
  Console / Notebook / Files / Runs) renders only when a project is open,
  under the project's name; a "Your simulations" item above it returns
  home. The *Run* group's primary button runs the open project's
  `inputScript`.
- **Thumbnails**: captured from the WebGL canvas at run completion
  (`canvas.toBlob` downscaled to ~320 px) and stored via `ProjectStorage`
  under `.atomify/thumbnail.png`, so library cards show real results.

### 2. Navigation state

The app keeps its no-router architecture (it must keep working under
`/atomify/` on GitHub Pages and in embeds), but the ad-hoc
`selectedMenu` string is replaced by a typed navigation state in the store:

```ts
type Screen =
  | { name: "home" }
  | { name: "examples" }
  | { name: "project"; dirName: string;
      pane: "view" | "console" | "notebook" | "files" | "runs";
      filePath?: string }   // files pane with a file open in Monaco
```

Deep links (`?project=diffusion&pane=view`) map 1:1 onto this state so a
browser refresh restores where you were. Legacy query params (`script=`,
embed codec URLs) keep working and resolve into the same state.

### 3. Visual implementation strategy

- **The shell (sidebar, screens, cards, modals, HUD) is bespoke**, built
  from the design file's token system: CSS custom properties
  (`--bg/--surface/--text/--accent/…`) defined once with `[data-theme]`
  dark/light variants, Manrope for UI, JetBrains Mono for code/paths.
  antd's `Menu`-driven shell and its invisible `Tabs` are removed.
- **antd stays for commodity inner components** (upload dragger, tooltips,
  notifications) restyled through its `ConfigProvider` token bridge to the
  same CSS variables, until replaced opportunistically. This avoids a
  big-bang rewrite of working panes (Monaco editor, dygraphs plots, omovi
  canvas are untouched).
- **Theme**: a `theme` field in the persisted settings model; `data-theme`
  attribute on the root; the design's light palette becomes the first
  supported light mode in Atomify. The JupyterLite iframe follows via its
  own theme setting (jupyterlab-night for dark) — acceptable to leave
  manual in v1.

### 4. What ships in v1 vs later

| In v1 | Deferred |
| --- | --- |
| Home grid, create/open/rename/duplicate/delete project | Project search/sort/tags |
| Files pane with full file CRUD + Monaco autosave | Drag-drop reorder, folders in working tree |
| Runs pane (list, open outputs, delete run) | Run diffing/comparison UI |
| Design tokens, dark + light themes, collapsible sidebar | Accent color picker |
| Examples gallery restyled per design | Example authoring from a project |

## Alternatives considered

- **Adopt a router (react-router).** The screen graph is small and the
  deep-link mapping is trivial; a router adds a dependency and base-path
  friction on GitHub Pages for no structural gain at this size.
- **Restyle antd in place instead of a bespoke shell.** The design's
  sidebar, cards, and HUD do not map onto antd `Menu`/`Tabs` idioms;
  fighting the component library costs more than owning ~600 lines of
  layout primitives.
- **Keep Examples as the landing page.** Rejected: the product story is
  "your work lives here"; examples are an on-ramp, reachable in one click
  and via the empty state.

## Consequences

- (+) The app reads as a product: work persists visibly, history is
  browsable, files are manageable, and the visual language is owned.
- (+) Typed navigation state kills the `"file"+fileName` string-key hack
  and makes project/pane deep-linking testable.
- (−) `useMenuItems.tsx`, `Main.tsx`, and `App.tsx` are substantially
  rewritten; embed mode and the AutoStart flow must be regression-tested
  (they bypass the home screen).
- (−) Two styling systems (tokens + antd bridge) coexist during the
  transition; contained by keeping antd usage inside panes.

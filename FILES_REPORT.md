# TypeScript Files Report

A per-file review of all 91 `.ts`/`.tsx` files in the repository (17,784 lines total).
Baseline before fixes: `tsc --noEmit` clean, 406/406 tests passing in 26 test files.

**Scoring**

- **Quality** (1–10): readability, structure, idiomatic React/TS, absence of smells.
- **Bugs**: concrete defects found (each has a *Problem* → *Solution*; "Fixed in this PR" marks what this PR changes).
- **Tests**: `yes` (dedicated test file), `partial` (covered indirectly or thin), `no`.
- **Patterns**: adherence to the codebase's own conventions (easy-peasy store, modifier pipeline, antd UI).

**Legend**: 🔴 fixed in this PR · 🟡 documented, intentionally not fixed (risk/scope) · ⚪ nit/no action

---

## Repository-wide patterns (cross-cutting)

1. 🔴 **Copy-paste triplication of modifier sync logic** — `synccomputesmodifier.ts`, `syncfixesmodifier.ts`, `syncvariablesmodifier.ts` are ~90 % identical (data1D syncing, label handling, WASM wrapper cleanup). *Solution: extract a shared `syncModifierData` helper; the three classes become thin wrappers. The 25-test `syncmodifiers.test.ts` suite guards the refactor.*
2. 🔴 **Near-duplicate 475-line components** — `SimulationSummaryContent.tsx` and `SimulationSummaryExpanded.tsx` differ only in wrapper class, a "show less" button and one settings row. *Solution: `SimulationSummaryExpanded` now renders shared `SimulationSummaryContent`.*
3. 🟡 **Direct mutation of store-held objects** — modifier instances (`colorModifier.computeName = …`, `modifier.active = …` in table `rowSelection`) and files (`file.content = …` in `Edit.tsx`) are mutated in place rather than through actions. It works because the objects are class instances/refs that immer does not freeze, and the modifier pipeline reads them imperatively each frame — but it bypasses the store contract. *Solution (not applied): route these through dedicated actions; requires a broader state-model redesign.*
4. 🟡 **Double persistence of settings** — `store/model.ts` wraps `settingsModel` in easy-peasy `persist()` *and* `store/settings.ts` manually loads/saves render settings to `localStorage`. Two sources of truth on rehydration. *Solution (not applied): pick one mechanism; needs a migration story for existing users' stored settings.*
5. 🟡 **Side effects inside actions** — `track()` calls in `render.ts` actions, `setSyncFrequency()` (WASM write) in `settings.setSimulation`, `localStorage` writes in `settings.setRender`. Reducers should be pure; easy-peasy thunks are the right home. *Not applied: behavior-preserving but touches many call sites.*
6. ⚪ **0–255 color convention inside `THREE.Color`** — `hexToRgb` returns 0–255 ints passed to `new THREE.Color(...)`, and `visualizer.setColor` consumes 0–255. Unusual (THREE expects 0–1) but applied consistently across `atomtypes.ts`, `colormodifier.ts` and omovi. Do **not** "fix" one site in isolation.

---

## src/store

### store/index.ts — Quality 9 · Bugs 0 · Tests no · Patterns ✓
16 lines. Store creation + Vite HMR hook. No issues.

### store/model.ts — Quality 8 · Bugs 0 · Tests no · Patterns ⚠
Clean composition. Carries cross-cutting issue #4 (`persist(settingsModel)` while settings.ts also persists manually).

### store/app.ts — Quality 8 · Bugs 1 · Tests yes · Patterns ✓
- 🔴 **Type mismatch**: `setSelectedFile` is declared `Action<AppModel, SimulationFile>` but the implementation accepts `selectedFile?: SimulationFile` (optional). Callers cannot legally clear the selected file even though the code supports it. *Solution: declare the payload as `SimulationFile | undefined` so type and implementation agree.*

### store/render.ts — Quality 6 · Bugs 1 · Tests yes · Patterns ⚠
- 🔴 **`addParticleStyle` turns the array into a plain object**: `const particleStyles = { ...state.particleStyles }` spreads `AtomType[]` into `{}`. After the first call, `state.particleStyles` (typed `AtomType[]`) is a plain object — `Array.isArray()` is false and `.length`/`.map`/iteration silently break. The existing test suite *documents* this bug instead of failing on it ("spreads AtomType[] into an object (type confusion)"). *Solution: copy with `[...state.particleStyles]` (sparse indices still work), update the two tests that asserted the broken behavior.*
- ⚪ `track()` side effects inside actions (cross-cutting #5).

### store/settings.ts — Quality 6 · Bugs 0 · Tests yes · Patterns ⚠
No functional bug on its own, but the double-persistence design (#4) and WASM side effect inside `setSimulation` (#5) live here. Load/save helpers are defensive and well tested.

### store/simulationstatus.ts — Quality 8 · Bugs 0 · Tests yes · Patterns ✓
19 boilerplate setters — verbose but correct; `reset()` covers every field (verified against the interface).

### store/simulation.ts — Quality 6 · Bugs 4 · Tests yes · Patterns ⚠
671 lines; the run/newSimulation thunks are the core of the app.
- 🔴 **Mis-indented block** (lines ~497–518 inside `run`): a 20-line block is dedented two levels, hiding the control flow. *Solution: reindent.*
- 🔴 **Crash if input script is missing**: `simulation.files.filter(f => f.fileName === simulation.inputScript)[0]` then `inputScriptFile.content` — a simulation whose `inputScript` doesn't match any file (bad share URL, bad examples.json) throws `TypeError: Cannot read properties of undefined` instead of surfacing an error. Same pattern in `newSimulation`. *Solution: guard, call `setLastError` and stop the run.*
- 🔴 **`fetch` without `response.ok` check** in `newSimulation`: a 404 makes the HTML error page become the LAMMPS input file, producing a baffling downstream parse error. *Solution: check `response.ok`, surface `setLastError` with status.*
- 🔴 **Un-awaited `localforage.setItem`** for `analyze.ipynb` in `syncFilesJupyterLite`, while every other setItem is awaited — the notebook write can race with JupyterLite opening the file. *Solution: `await` it.*
- 🟡 `newSimulation` mutates `file.content` on the payload object after it was stored via `setSimulation` (cross-cutting #3); works because the same object identity is re-set afterwards.
- ⚪ `await allActions.app.setStatus(...)` awaits a synchronous action (misleading but harmless). Debug `console.log`s in the error path are arguably useful; kept.

### store/processing.ts — Quality 7 · Bugs 2 · Tests yes · Patterns ✓
- 🔴 **Idle state reported as "Minimization"**: `whichFlag === 1 ? "Dynamics" : "Minimization"` — LAMMPS `whichflag` is 0 = idle, 1 = dynamics, 2 = minimization, so an idle simulation displays "Minimization" in the summary. *Solution: map 1→Dynamics, 2→Minimization, 0→"" .*
- 🔴 **Comment contradicts the code**: "We are not allowed to ask for these values unless whichFlag is 0" sits on `if (whichFlag !== 0)`. *Solution: correct the comment (values are only valid during an active run).*
- Good: `getSimulationBox/Origo` avoid re-allocating when unchanged; `getModifierContext` deduplicates the two thunks.

### Store test files
| File | Quality | Notes |
|---|---|---|
| store/app.test.ts | 6 | 🔴 The "embedded mode" test is tautological — it rebuilds `selectedMenu: isEmbeddedMode() ? "view" : "examples"` inline instead of exercising module code, so it can never fail. *Solution: re-import the module with `vi.resetModules()` so `getInitialSelectedMenu` actually runs against the mock.* Also imports `vi` after first use (hoisting saves it). |
| store/settings.test.ts | 8 | Solid load/save coverage incl. quota errors; store actions untested (minor gap). |
| store/render.test.ts | 8 | Thorough; two tests asserted the array→object bug as expected behavior — updated together with the fix. |
| store/processing.test.ts | 8 | Covers modifier orchestration paths. |
| store/simulation.test.ts | 8 | 22 tests over thunk logic. |
| store/simulation-run-helpers.test.ts | 8 | Good coverage of `prepareVarsScript`/`collectRunMetrics`/`handleRunResult`. |
| store/simulationstatus.test.ts | 8 | 19 tests, includes `reset` coverage. |

---

## src/modifiers

### modifier.ts — Quality 8 · Bugs 0 · Tests yes · Patterns ✓
Abstract-via-runtime-throw base class using an arrow property; fine for the pipeline's usage.

### types.ts — Quality 9 · Bugs 0 · Tests n/a · Patterns ✓

### syncparticlesmodifier.ts — Quality 7 · Bugs 1 · Tests yes · Patterns ✓
- 🔴 **Stray `return newParticles`** from a method typed `void` (base class contract) — dead value, confuses readers into thinking callers consume it. *Solution: drop the return; output flows through `output.particles`.*
- Capacity-doubling growth strategy is correct.

### syncbondsmodifier.ts — Quality 7 · Bugs 0 · Tests yes · Patterns ✓
- ⚪ No capacity doubling (unlike particles) — reallocates on every growth; acceptable given bond counts.
- ⚪ `radii` only filled at construction; `SyncBondsSettings` compensates when the user changes radius. Fragile coupling, works today.

### synccomputesmodifier.ts / syncfixesmodifier.ts / syncvariablesmodifier.ts — Quality 5 each · Bugs 0 · Tests yes · Patterns ✗
- 🔴 **~90 % copy-paste triplication** (cross-cutting #1). Any fix to the data1D logic (e.g. the WASM wrapper `delete()` calls added for leak prevention) must be re-applied three times and has already drifted (computes gate on `execute()`, variables re-read `hasScalarData`, fixes do neither). *Solution: shared `syncModifierData()` helper in `modifiers/syncData1D.ts`; each class keeps only its type-specific prologue.*

### colormodifier.ts — Quality 6 · Bugs 0 · Tests yes · Patterns ✓
- ⚪ `defaultAtomTypes`: 18 hand-written entries where 10–18 duplicate 1–9 exactly — could be generated, left as data.
- ⚪ `colormap()` recomputed on every `runByProperty` call (72 shades per frame while coloring by compute); cache would be a micro-optimization.
- ⚪ `everything` parameter unused in both run paths.

### ColorModifierSettings.tsx — Quality 4 · Bugs 1 · Tests no · Patterns ✗
- 🔴 **Rules-of-Hooks violation**: `if (!colorModifier) return null;` executes *before* three `useState` calls. If `colorModifier` ever becomes undefined between renders (modifier list replaced via `setPostTimestepModifiers`), React throws "Rendered fewer hooks than expected" and unmounts the tree. This is exactly the class of bug `eslint-plugin-react-hooks` exists to catch. *Solution: move the hooks above the early return.*
- 🟡 Mutates `colorModifier.customMinValue/…` directly (cross-cutting #3) — kept, this is how the whole pipeline consumes the modifier.

### SyncParticlesSettings.tsx / SyncBondsSettings.tsx — Quality 7 · Bugs 0 · Tests no · Patterns ⚠
- ⚪ Near-duplicates of each other (single-slider modal); tolerable at 70 lines each.
- ⚪ `SyncParticlesSettings` reuses the copy-pasted row key `"bondradius"` for the particle-radius row — harmless (single row) but sloppy.

### Modifier test files
| File | Quality | Notes |
|---|---|---|
| modifier.test.ts | 8 | Base-class contract covered. |
| colormodifier.test.ts | 8 | Min/max tracking, custom range, reset paths covered. |
| syncmodifiers.test.ts | 9 | 691 lines, 25 tests with a faithful WASM-heap fake — this is what makes the triplication refactor safe. |

---

## src/components

### App.tsx (src/) — Quality 8 · Bugs 0 · Tests partial · Patterns ✓
Clean composition after the hooks extraction. `onMenuSelect`'s `"file" + fileName` key protocol is stringly-typed but consistently applied (see useMenuItems/Main).

### AppModals.tsx — Quality 9 · Bugs 0 · Tests no · Patterns ✓

### AutoStartSimulation.tsx — Quality 6 · Bugs 1 · Tests no · Patterns ⚠
- 🔴 **Leaked polling loop**: `checkWasmAndStart` re-schedules itself with `setTimeout(…, 500)` and the effect never returns a cleanup, while its dependency array has 10 entries — every dep change spawns an *additional* self-perpetuating timer chain that keeps polling (and closes over stale state) until WASM loads. *Solution: track the timer id + a `cancelled` flag in the effect and clear on cleanup.*
- ⚪ `fetch(embeddedSimulationUrl!)` without `response.ok` check — the catch shows a notification, so failure is at least surfaced.

### ColorLegend.tsx — Quality 8 · Bugs 0 · Tests yes · Patterns ✓
Canvas gradient redrawn only when colormap changes; formatting helpers are tidy.

### Figure.tsx — Quality 7 · Bugs 1 · Tests yes · Patterns ✓
- 🔴 **Dygraph instance never destroyed**: the graph is created in an effect and kept in state, but no cleanup calls `graph.destroy()` — each opened figure leaks DOM nodes and listeners until page reload. *Solution: `useEffect` cleanup that destroys the graph on unmount.*
- ⚪ `plotConfig` useMemo lists granular deps instead of `[modifier, plotData]` — intentional (parent mutates objects in place), documented by the surrounding refs.

### LoadingSimulationScreen.tsx — Quality 9 · Bugs 0 · Tests no · Patterns ✓

### ResponsiveSimulationSummary.tsx — Quality 9 · Bugs 0 · Tests yes · Patterns ✓
Nice single-responsibility dispatch component with a clear decision table in comments.

### SelectedAtomsInfo.tsx — Quality 7 · Bugs 0 · Tests no · Patterns ✓
- 🟡 **Unbounded time-series growth**: distance/angle series append one point per timestep with array copies (`[...existing.data, …]`) — O(n²) total copying and unbounded memory over very long runs. Cleared on selection change and run start, so bounded in practice. *Solution if it bites: ring buffer / cap length.*
- Geometry math (angle clamp for acos) is correct.

### Simulation.tsx — Quality 6 · Bugs 1 · Tests no · Patterns ⚠
- 🔴 **`window.onkeydown = …` assignment**: clobbers any other keydown consumer (View.tsx uses `addEventListener` for Esc — that one survives, but nothing else that assigns `onkeydown` would), and is never removed on unmount. *Solution: `addEventListener`/`removeEventListener` with effect cleanup.*
- ⚪ Commented-out `// setWasm(Module)` line removed.
- ⚪ WASM module load is guarded by `getWasmOrNull()` but the guard is checked before an async gap — double-init possible under React StrictMode dev double-invoke; harmless (second module wins) and dev-only.

### SimulationSummary.tsx — Quality 8 · Bugs 0 · Tests no · Patterns ✓
- ⚪ Speed slider `min={1} step={2}` yields 1,3,…,199 — `max={200}` unreachable; matches the other sliders' intent poorly but harmless.

### SimulationSummaryContent.tsx — Quality 6 → 7 · Bugs 0 · Tests no · Patterns ✗→✓
- 🔴 Half of cross-cutting #2: compute/fix/variable table column definitions are triplicated within the file *and* duplicated wholesale in `SimulationSummaryExpanded`. *Solution: this file becomes the single source; gains `hideShowSimulationBox` prop for the expanded variant.*
- 🟡 `rowSelection.onChange` mutates `modifier.active` in place (cross-cutting #3).

### SimulationSummaryExpanded.tsx — Quality 3 → 8 · Bugs 1 · Tests no · Patterns ✗→✓
- 🔴 **476-line copy of SimulationSummaryContent** (cross-cutting #2), including a bonus redundancy: the same store slice selected twice (`modifiers` and `postTimestepModifiers`). Every fix to the summary tables had to be made twice; the two had already drifted (the expanded copy lost the "show simulation box" row). *Solution: reduced to a ~40-line wrapper around `SimulationSummaryContent`.*

### SimulationSummaryModal.tsx — Quality 9 · Bugs 0 · Tests no · Patterns ✓

### Component test files
| File | Quality | Notes |
|---|---|---|
| App.test.tsx | 5 | 🟡 Renders `<App/>` without `StoreProvider`; passes only because React 19 concurrent rendering surfaces the hook error asynchronously. A smoke test that can't fail is not a smoke test. Left as-is (fixing requires mocking WASM/visualizer stack — tracked here). |
| ColorLegend.test.tsx | 8 | 15 tests incl. canvas mock. |
| Figure.test.tsx | 8 | Covers modifier/plotData variants and sync toggling. |
| ResponsiveSimulationSummary.test.tsx | 8 | All four dispatch branches covered. |

---

## src/containers

### Console.tsx — Quality 8 · Bugs 0 · Tests no · Patterns ✓
Reveal-last-line effect is correct; mutable default for `height` is quirky but fine.

### Edit.tsx — Quality 7 · Bugs 0 · Tests no · Patterns ⚠
- 🟡 `onEditorChange` writes `file.content = newValue` directly into the store-held file object (cross-cutting #3). Deliberate (avoids re-render feedback loops with Monaco); the store never re-renders from it, and `syncFilesWasm` reads it later.
- ⚪ `loader.init()` at module import time — side-effectful import, acceptable for Monaco registration.

### Examples.tsx — Quality 7 · Bugs 0 · Tests no · Patterns ✓
- ⚪ `fetch` chain checks only `status !== 404` for the description; a 500 would put an error page in the markdown. Fallback-to-default logic on any failure is good.
- ⚪ Keyword filter is O(n·m) `forEach` with a flag — fine for dozens of examples.

### Main.tsx — Quality 7 · Bugs 2 · Tests no · Patterns ✓
- 🔴 **Redundant double dispatch**: `setPreferredView(undefined); setPreferredView("notebook");` — the first call is dead. *Solution: remove it.*
- 🔴 **Keyless fragment in `footer` array**: `footer={[<><Button key="analyze"…/></>]}` — the array element is the *fragment*, which has no key; React logs a key warning on every console modal open. *Solution: use a keyed fragment / plain array of keyed buttons.*

### NewSimulation.tsx — Quality 6 · Bugs 2 · Tests yes · Patterns ⚠
- 🔴 **Missing `key` on `<Option>`** in the input-script select (`files.map(file => <Option value=…>)`) — React key warning, and antd reconciliation churn on file list changes. *Solution: add `key={file.fileName}`.*
- 🔴 **Keyless fragment in `footer` array** (same as Main.tsx). *Solution: keyed elements.*
- 🟡 **`window.files` global as upload-state workaround** — the comment admits it: "these async functions can't seem to agree on the state". It works (single dialog at a time) and the 728-line test file pins the behavior; replacing it with a `useRef` accumulator is the clean fix but changes tested internals, deferred.

### Notebook.tsx — Quality 8 · Bugs 0 · Tests no · Patterns ✓
`isMounted` cleanup done properly.

### RunInCloud.tsx — Quality 4 · Bugs 2 · Tests no · Patterns ✗
- 🔴 **Five `Form.Item`s share `name="gpu"`** (gpu type, gpu count, budget, email, comments) — duplicate form field names mean antd Form state collides; the survey works only because values are read from parallel `useState`s, and `valuePropName="checked"` is wrong for Selects/Inputs. *Solution: unique names, drop bogus `valuePropName`.*
- 🔴 **Tracked defaults don't match the UI**: state initializes `numCpu="nocpu"`, `gpuType="nogpu"` while the Selects display "Does not matter" (`"n/a"`) — an untouched form submits values the UI never showed, corrupting the survey data this page exists to collect. *Solution: initialize state to `"n/a"`, gate the GPU-count section on a selection being made.*
- 🔴 Typo ×2: "appreaciate" → "appreciate".

### Settings.tsx — Quality 8 · Bugs 0 · Tests no · Patterns ✓
`handleSettingChange` generic helper is the nicest settings code in the repo. ⚪ Tab key typo `keybordshortcuts` (internal only).

### ShareSimulation.tsx — Quality 8 · Bugs 0 · Tests no · Patterns ✓
Correct loading/error/copy flows; URL-length warning is a thoughtful touch.

### View.tsx — Quality 7 · Bugs 1 · Tests yes · Patterns ✓
618 lines but well-sectioned into effects with clear comments.
- 🔴 **Keyless `<Button>` in Modal `footer` array** ("No simulation" modal). *Solution: add `key`.*
- ⚪ Progress `runTimesteps / (runTotalTimesteps + 1)` — the `+1` div-by-zero guard means the bar tops out at ~99 %; cosmetic.
- ⚪ Visualizer dispose effect depends on `[visualizer, …]` — cleanup ordering is correct because the dispose callbacks only change identity when `visualizer` does.
- Good: box/wall group disposal traverses geometry+material; Esc-to-clear uses `addEventListener` correctly.

### Container test files
| File | Quality | Notes |
|---|---|---|
| NewSimulation.test.tsx | 8 | 728 lines covering the upload race workaround, auto-select of `.in`, validation gating. |
| View.test.tsx | 8 | 17 tests with omovi/visualizer mocked; covers selection, box/wall groups, embed config. |

---

## src/hooks

### hooks/index.ts — Quality 9 · Bugs 0 · Tests n/a · Patterns ✓
### useEmbeddedMode.ts — Quality 8 · Bugs 0 · Tests yes · Patterns ✓
Defaults-applied config parsing with defensive try/catch. ⚪ `useMemo(…, [])` means URL params are read once per mount — fine for this app (full reload on URL change).
### useMenuItems.tsx — Quality 7 · Bugs 1 · Tests no · Patterns ✓
- 🔴 `simulation ? simulation?.id : ""` — redundant optional chain inside a truthy branch. *Solution: `simulation?.id ?? ""`.*
- ⚪ Three "This is another hack. Should really rethink menu system." comments — honest, and the report agrees; menu/preferredView interplay is the most convoluted state flow in the app.
### useSimulationNotifications.ts — Quality 8 · Bugs 0 · Tests no · Patterns ✓
### useEmbeddedMode.test.ts — Quality 8 · 18 tests over vars/config/index parsing.

---

## src/utils

### embeddedMode.ts — Quality 8 · Bugs 0 · Tests yes (17) · Patterns ✓
### metrics.ts — Quality 7 · Bugs 0 · Tests yes (11) · Patterns ✓
- ⚪ `embedMode` union `string | false` is awkward for consumers; ⚪ stale `//eslint-disable-line` comment on a blank branch.
### parsers.ts — Quality 8 · Bugs 0 · Tests yes (8, thorough tables) · Patterns ✓
- ⚪ `parseFloat` NaN not rejected for camera commands — a malformed `#/camera position a b c` yields a NaN vector; input is author-controlled script comments, low impact.
### AnalyzeNotebook.ts — Quality 8 · Bugs 0 · Tests yes (9) · Patterns ✓
### atomtypes.ts — Quality 6 · Bugs 1 · Tests yes (10) · Patterns ✓
- 🔴 `var result` in `hexToRgb` — only `var` in the codebase. *Solution: `const`.*
- ⚪ Neon's color `#3050F8` duplicates nitrogen's (Jmol neon is `#B3E3F5`) — data nit, left (rendering-visible change).
- Cross-cutting #6 applies (0–255 in THREE.Color is the app convention — do not normalize).
### boxGeometry.ts — Quality 9 · Bugs 0 · Tests yes (13) · Patterns ✓
Best-documented module in the repo.
### wallGeometry.ts — Quality 7 · Bugs 1 · Tests yes (4, thin) · Patterns ✓
- 🔴 `wallSide` computed at the top of `createWallMesh` and never used (recomputed later in the 3-D branch). *Solution: remove the dead first computation.*
- ⚪ The `dimension === 2` branch of `createWallMesh` is unreachable through `createWallGroup` (which returns an empty group for 2-D) — kept because the function is exported and directly tested.
### lammpsLanguage.ts — Quality 7 · Bugs 0 · Tests no · Patterns ✓
1,401 lines, ~99 % keyword data for Monaco Monarch tokenizer. Fine as generated-ish data.
### embed/codec.ts — Quality 8 · Bugs 0 · Tests yes (14, round-trip) · Patterns ✓
- ⚪ `ensureFileContent` fetch lacks `response.ok` check; failure surfaces via ShareSimulation's error alert.
- ⚪ `=` → `,` padding substitution is nonstandard base64url but symmetric and URL-safe.
### embed/proto.ts — Quality 7 · Bugs 0 · Tests partial (via codec) · Patterns ✓
Generated ts-proto style code (`/* eslint-disable */`); reviewed, not hand-edited.

### Util test files
metrics.test.ts (7), embeddedMode.test.ts (8), atomtypes.test.ts (8), parsers.test.ts (9), AnalyzeNotebook.test.ts (8), wallGeometry.test.ts (6 — only 4 tests for 191 lines; 2-D branch and orientation math untested), boxGeometry.test.ts (9), codec.test.ts (9).

---

## src/wasm & entry & config

| File | Quality | Bugs | Tests | Notes |
|---|---|---|---|---|
| wasm/wasmInstance.ts | 9 | 0 | yes (7) | Clean module-singleton replacing window globals; rationale documented. |
| wasm/types.ts | 9 | 0 | n/a | |
| wasm/lammps.mjs.d.ts | 9 | 0 | n/a | |
| types.ts (src/) | 8 | 0 | n/a | ⚪ `LammpsWeb.runFile` typed `() => void` but awaited in a try/catch that expects thrown numeric pointers — works (await of void), type undersells the async contract. ⚪ dead commented field in `LammpsOutput`. |
| global.d.ts | 8 | 0 | n/a | Window globals documented; `files` exists only for the NewSimulation workaround. |
| index.tsx | 8 | 0 | no | Mixpanel token hardcoded — normal for public web analytics. Root-element guard present. |
| theme.ts | 9 | 0 | n/a | |
| setupTests.ts | 9 | 0 | n/a | Sensible matchMedia + Monaco mocks. |
| vite.config.ts | 9 | 0 | n/a | |
| vitest.config.mts | 8 | 0 | n/a | ⚪ empty `resolve.alias` placeholder. |

---

## Score distribution

- 9: 15 files · 8: 34 files · 7: 20 files · 6: 12 files · 5: 4 files · 4: 4 files · 3: 2 files
- Weakest files (pre-fix): `SimulationSummaryExpanded.tsx` (3), `ColorModifierSettings.tsx` (4), `RunInCloud.tsx` (4), `App.test.tsx` (5), the three sync modifiers (5).

## Test-coverage gaps worth closing next

1. `ColorModifierSettings.tsx` — no test caught the hooks-order bug; a render test with `postTimestepModifiers = []` would have.
2. `Simulation.tsx` — keyboard shortcuts and postStepCallback wiring untested.
3. `useMenuItems.tsx` / `AutoStartSimulation.tsx` — no tests for the app's most stateful glue.
4. `App.test.tsx` — replace the can't-fail smoke test with a provider-wrapped render.
5. `wallGeometry.ts` — orientation quaternions untested.

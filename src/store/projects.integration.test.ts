/**
 * Integration tests for the projects store model (ADR-001/003).
 *
 * These tests build the REAL store (full model composition) on REAL
 * in-memory project storage. Only the engine boundary is faked: a
 * LammpsWeb whose runFile resolves immediately (or on demand) and a
 * minimal wasm module for the FS writes the simulation model performs.
 * Every scenario asserts against the actual storage contents — the
 * persisted project.json / run.json / snapshots — not just store state.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { createStore, type Store } from "easy-peasy";

// Mock metrics — the store models call track/time_event on most transitions;
// mocking keeps tests quiet and avoids mixpanel/localStorage side effects.
vi.mock(import("../utils/metrics"), () => ({
  track: vi.fn(),
  time_event: vi.fn(),
  getEmbeddingParams: vi.fn(() => ({
    embedMode: false as const,
    embedFullscreen: false,
    embedAutoStart: false,
  })),
}));

import { storeModel, type StoreModel } from "./model";
import type { RunRequest, StoreInjections } from "./projects";
import {
  createMemoryProjectStorage,
  PROJECT_META_PATH,
  readRunMeta,
  writeRunMeta,
  RUNS_DIR,
  RUN_META_PATH,
  type ProjectMeta,
  type ProjectStorage,
  type RunMeta,
} from "../storage";
import { getWasm, setWasm } from "../wasm/wasmInstance";
import type { AtomifyWasmModule } from "../wasm/types";
import type { LammpsWeb, LMPModifier, Wall } from "../types";

const SCRIPT = "units lj\nrun 100\n";
const FAKE_LOG = "fake LAMMPS log output";

afterEach(() => {
  vi.useRealTimers();
});

describe("projects store integration", () => {
  describe("createProject", () => {
    it("creates a blank project: project.json persisted, analysis notebook generated, listed in library", async () => {
      const { store, libraryStorage } =
        await createTestStore(createFakeEngine());

      const meta = await store
        .getActions()
        .projects.createProject({ displayName: "Blank", files: [] });

      // project.json exists in real storage with the created identity
      const persisted = await readJson<ProjectMeta>(
        libraryStorage,
        meta.dirName,
        PROJECT_META_PATH,
      );
      expect(persisted.dirName).toBe(meta.dirName);
      expect(persisted.displayName).toBe("Blank");
      expect(persisted.inputScript).toBeUndefined();

      // starter notebook generated (template mentions the project)
      const notebook = await libraryStorage.read(
        meta.dirName,
        "analysis.ipynb",
      );
      expect(typeof notebook).toBe("string");
      expect(notebook as string).toContain("Blank");

      // listed in the library (storage) and in store state
      const listed = await libraryStorage.listProjects();
      expect(listed.map((p) => p.dirName)).toContain(meta.dirName);
      expect(
        store.getState().projects.projects.map((p) => p.dirName),
      ).toContain(meta.dirName);
      expect(store.getState().projects.active?.meta.dirName).toBe(meta.dirName);
    });

    it("does not overwrite a curated notebook with the template", async () => {
      const { store, libraryStorage } =
        await createTestStore(createFakeEngine());
      const curated = JSON.stringify({
        cells: [],
        metadata: { curated: true },
        nbformat: 4,
        nbformat_minor: 5,
      });

      const meta = await store.getActions().projects.createProject({
        displayName: "Curated",
        files: [{ fileName: "analysis.ipynb", content: curated }],
      });

      const stored = await libraryStorage.read(meta.dirName, "analysis.ipynb");
      expect(JSON.parse(stored as string)).toEqual(JSON.parse(curated));
    });

    it("auto-sets inputScript when exactly one script file is provided", async () => {
      const { store, libraryStorage } =
        await createTestStore(createFakeEngine());

      const meta = await store.getActions().projects.createProject({
        displayName: "One Script",
        files: [
          { fileName: "in.lmp", content: SCRIPT },
          { fileName: "data.spce", content: "some data" },
        ],
      });

      expect(meta.inputScript).toBe("in.lmp");
      const persisted = await readJson<ProjectMeta>(
        libraryStorage,
        meta.dirName,
        PROJECT_META_PATH,
      );
      expect(persisted.inputScript).toBe("in.lmp");
    });

    it("leaves inputScript undefined when two script files are provided", async () => {
      const { store, libraryStorage } =
        await createTestStore(createFakeEngine());

      const meta = await store.getActions().projects.createProject({
        displayName: "Two Scripts",
        files: [
          { fileName: "in.melt", content: SCRIPT },
          { fileName: "equilibrate.in", content: SCRIPT },
        ],
      });

      expect(meta.inputScript).toBeUndefined();
      const persisted = await readJson<ProjectMeta>(
        libraryStorage,
        meta.dirName,
        PROJECT_META_PATH,
      );
      expect(persisted.inputScript).toBeUndefined();
    });
  });

  describe("full run loop", () => {
    it("records snapshot, run.json, outputs, and clears activeRun after a completed run", async () => {
      const engine = createFakeEngine();
      const { store, libraryStorage } = await createTestStore(engine);
      await store.getActions().projects.createProject({
        displayName: "Melt",
        files: [
          { fileName: "in.lmp", content: SCRIPT },
          { fileName: "data.spce", content: "some data" },
        ],
      });
      const dirName = activeDirName(store);

      await store
        .getActions()
        .projects.startRuns([runRequest({ vars: { T: 2 } })]);

      // Source snapshot: the script (and data file) yes, notebook and
      // project-level .atomify NO.
      expect(
        await libraryStorage.read(dirName, `${RUNS_DIR}/run-001/in.lmp`),
      ).toBe(SCRIPT);
      expect(
        await libraryStorage.read(dirName, `${RUNS_DIR}/run-001/data.spce`),
      ).toBe("some data");
      expect(
        await libraryStorage.stat(
          dirName,
          `${RUNS_DIR}/run-001/analysis.ipynb`,
        ),
      ).toBeNull();
      expect(
        await libraryStorage.stat(
          dirName,
          `${RUNS_DIR}/run-001/.atomify/project.json`,
        ),
      ).toBeNull();

      // run.json: completed with vars, stats, and both timestamps.
      const runMeta = await readRunMeta(libraryStorage, dirName, "run-001");
      expect(runMeta).not.toBeNull();
      expect(runMeta?.status).toBe("completed");
      expect(runMeta?.vars).toEqual({ T: 2 });
      expect(runMeta?.origin).toBe("app");
      expect(runMeta?.sweepId).toBeUndefined();
      expect(runMeta?.stats?.timesteps).toBe(500);
      expect(runMeta?.stats?.numAtoms).toBe(100);
      expect(typeof runMeta?.stats?.wallSeconds).toBe("number");
      expect(runMeta?.startedAt).toBeTruthy();
      expect(runMeta?.finishedAt).toBeTruthy();

      // Outputs copied from the fake engine's workdir snapshot.
      expect(
        await libraryStorage.read(dirName, `${RUNS_DIR}/run-001/log.lammps`),
      ).toBe(FAKE_LOG);

      // The materialized Simulation id is the run directory: the engine got
      // a script path inside <dirName>/runs/run-001.
      expect(engine.runFilePaths).toHaveLength(1);
      expect(
        engine.runFilePaths[0].startsWith(`/${dirName}/${RUNS_DIR}/run-001/`),
      ).toBe(true);

      // Store state settled: activeRun cleared, runs list refreshed.
      expect(store.getState().projects.activeRun).toBeUndefined();
      const runs = store.getState().projects.active?.runs ?? [];
      expect(runs.map((r) => r.runId)).toEqual(["run-001"]);
      expect(runs[0].meta?.status).toBe("completed");
    });

    it("useKokkos injects the suffix kk opt-in into the materialized script only", async () => {
      const engine = createFakeEngine();
      const { store, libraryStorage } = await createTestStore(engine);
      await store.getActions().projects.createProject({
        displayName: "Kokkos Toggle",
        files: [{ fileName: "in.lmp", content: SCRIPT }],
      });
      const dirName = activeDirName(store);

      await store
        .getActions()
        .projects.startRuns([runRequest({ useKokkos: true, threads: 4 })]);

      // The script the engine ran carries the injected opt-in marker…
      const ranScript = getWasm().FS.readFile(
        `/${dirName}/${RUNS_DIR}/run-001/in.lmp`,
        { encoding: "utf8" },
      );
      expect(ranScript.startsWith("suffix kk")).toBe(true);
      expect(ranScript).toContain(SCRIPT);
      // …while the working tree and the run snapshot keep the original text.
      expect(await libraryStorage.read(dirName, "in.lmp")).toBe(SCRIPT);
      expect(
        await libraryStorage.read(dirName, `${RUNS_DIR}/run-001/in.lmp`),
      ).toBe(SCRIPT);
    });

    it("useKokkos: false leaves the script untouched (serial preprocessing applies)", async () => {
      const engine = createFakeEngine();
      const { store } = await createTestStore(engine);
      await store.getActions().projects.createProject({
        displayName: "Serial Run",
        files: [{ fileName: "in.lmp", content: SCRIPT }],
      });
      const dirName = activeDirName(store);

      await store.getActions().projects.startRuns([runRequest()]);

      // No opt-in marker injected; syncFilesWasm applied the serial-styles
      // preprocessing (suffix off) for the always-on `-sf kk` module.
      const ranScript = getWasm().FS.readFile(
        `/${dirName}/${RUNS_DIR}/run-001/in.lmp`,
        { encoding: "utf8" },
      );
      expect(ranScript.startsWith("suffix off")).toBe(true);
      expect(ranScript).not.toContain("suffix kk");
    });

    it("records a failed run with the engine's error message", async () => {
      const engine = createFakeEngine();
      const { store, libraryStorage } = await createTestStore(engine);
      await store.getActions().projects.createProject({
        displayName: "Broken",
        files: [{ fileName: "in.lmp", content: SCRIPT }],
      });
      const dirName = activeDirName(store);
      engine.setErrorMessage("ERROR: Unknown command: frobnicate");

      await store.getActions().projects.startRuns([runRequest()]);

      const runMeta = await readRunMeta(libraryStorage, dirName, "run-001");
      expect(runMeta?.status).toBe("failed");
      expect(runMeta?.error).toBe("ERROR: Unknown command: frobnicate");
      expect(runMeta?.finishedAt).toBeTruthy();
      expect(store.getState().projects.activeRun).toBeUndefined();
    });
  });

  describe("sweeps", () => {
    it("executes a 3-run sweep sequentially with shared sweepId and per-run vars", async () => {
      const engine = createFakeEngine();
      const { store, libraryStorage } = await createTestStore(engine);
      await store.getActions().projects.createProject({
        displayName: "Sweep",
        files: [{ fileName: "in.lmp", content: SCRIPT }],
      });
      const dirName = activeDirName(store);

      await store
        .getActions()
        .projects.startRuns([
          runRequest({ vars: { T: 1 } }),
          runRequest({ vars: { T: 2 } }),
          runRequest({ vars: { T: 3 } }),
        ]);

      // Sequential execution: the engine saw run-001, run-002, run-003 in order.
      expect(engine.runFilePaths).toHaveLength(3);
      expect(engine.runFilePaths[0]).toContain(`/${RUNS_DIR}/run-001/`);
      expect(engine.runFilePaths[1]).toContain(`/${RUNS_DIR}/run-002/`);
      expect(engine.runFilePaths[2]).toContain(`/${RUNS_DIR}/run-003/`);

      const metas: RunMeta[] = [];
      for (const runId of ["run-001", "run-002", "run-003"]) {
        const meta = await readRunMeta(libraryStorage, dirName, runId);
        expect(meta).not.toBeNull();
        metas.push(meta as RunMeta);
      }
      expect(metas.map((m) => m.status)).toEqual([
        "completed",
        "completed",
        "completed",
      ]);
      expect(metas.map((m) => m.vars)).toEqual([{ T: 1 }, { T: 2 }, { T: 3 }]);
      expect(metas.map((m) => m.origin)).toEqual(["sweep", "sweep", "sweep"]);
      expect(metas[0].sweepId).toMatch(/^sweep-/);
      expect(new Set(metas.map((m) => m.sweepId)).size).toBe(1);
      expect(store.getState().projects.runQueue).toEqual([]);
    });

    it("cancelQueuedRuns mid-sweep: queued runs are never created", async () => {
      const engine = createFakeEngine({ manual: true });
      const { store, libraryStorage } = await createTestStore(engine);
      await store.getActions().projects.createProject({
        displayName: "Canceled Sweep",
        files: [{ fileName: "in.lmp", content: SCRIPT }],
      });
      const dirName = activeDirName(store);

      const sweepPromise = store
        .getActions()
        .projects.startRuns([
          runRequest({ vars: { T: 1 } }),
          runRequest({ vars: { T: 2 } }),
          runRequest({ vars: { T: 3 } }),
        ]);
      // First run is now in flight (engine holds it); cancel the queue
      // before it resolves, then let the first run finish.
      await waitForCondition(
        () => engine.runFilePaths.length === 1,
        "first runFile call",
      );
      store.getActions().projects.cancelQueuedRuns();
      engine.resolveRun();
      await sweepPromise;

      // Only run-001 exists — run-002/003 were never allocated.
      const runDirs = await libraryStorage.list(dirName, RUNS_DIR);
      expect(runDirs.map((e) => e.path)).toEqual([`${RUNS_DIR}/run-001`]);
      expect(engine.runFilePaths).toHaveLength(1);
      const meta = await readRunMeta(libraryStorage, dirName, "run-001");
      expect(meta?.status).toBe("completed");
      expect(store.getState().projects.activeRun).toBeUndefined();
      expect(store.getState().projects.runQueue).toEqual([]);
    });
  });

  describe("debounced saves", () => {
    it("saveFileDebounced does not persist immediately; flushPendingSaves persists", async () => {
      const { store, libraryStorage } =
        await createTestStore(createFakeEngine());
      await store.getActions().projects.createProject({
        displayName: "Editing",
        files: [{ fileName: "in.lmp", content: SCRIPT }],
      });
      const dirName = activeDirName(store);
      const edited = "units metal\nrun 42\n";

      store
        .getActions()
        .projects.saveFileDebounced({ path: "in.lmp", content: edited });

      // Debounce pending: storage still holds the original content.
      expect(await libraryStorage.read(dirName, "in.lmp")).toBe(SCRIPT);
      expect(store.getState().projects.saveStates["in.lmp"]).toBe("saving");

      await store.getActions().projects.flushPendingSaves();

      expect(await libraryStorage.read(dirName, "in.lmp")).toBe(edited);
      expect(store.getState().projects.saveStates["in.lmp"]).toBe("saved");
    });

    it("the debounced save lands on its own after 500ms", async () => {
      const { store, libraryStorage } =
        await createTestStore(createFakeEngine());
      await store.getActions().projects.createProject({
        displayName: "Debounce Timer",
        files: [{ fileName: "in.lmp", content: SCRIPT }],
      });
      const dirName = activeDirName(store);
      const edited = "# edited via timer\n";

      vi.useFakeTimers();
      store
        .getActions()
        .projects.saveFileDebounced({ path: "in.lmp", content: edited });
      expect(await libraryStorage.read(dirName, "in.lmp")).toBe(SCRIPT);

      await vi.advanceTimersByTimeAsync(500);
      vi.useRealTimers();

      expect(await libraryStorage.read(dirName, "in.lmp")).toBe(edited);
      expect(store.getState().projects.saveStates["in.lmp"]).toBe("saved");
    });

    it("startRuns flushes pending saves so the snapshot has the edited content", async () => {
      const engine = createFakeEngine();
      const { store, libraryStorage } = await createTestStore(engine);
      await store.getActions().projects.createProject({
        displayName: "Edit Then Run",
        files: [{ fileName: "in.lmp", content: SCRIPT }],
      });
      const dirName = activeDirName(store);
      const edited = "units real\nrun 7\n";

      store
        .getActions()
        .projects.saveFileDebounced({ path: "in.lmp", content: edited });
      await store.getActions().projects.startRuns([runRequest()]);

      expect(
        await libraryStorage.read(dirName, `${RUNS_DIR}/run-001/in.lmp`),
      ).toBe(edited);
      expect(await libraryStorage.read(dirName, "in.lmp")).toBe(edited);
    });
  });

  describe("quick runs", () => {
    it("quick projects live on scratch storage; saveQuickAsProject copies tree and runs into the library with a fresh identity", async () => {
      const engine = createFakeEngine();
      const { store, libraryStorage, scratchStorage } =
        await createTestStore(engine);

      const quickMeta = await store.getActions().projects.createProject({
        displayName: "Quick run — Melt",
        files: [{ fileName: "in.lmp", content: SCRIPT }],
        quick: true,
      });

      // Invisible to the library while quick.
      expect(await libraryStorage.listProjects()).toEqual([]);
      expect(
        (await scratchStorage.listProjects()).map((p) => p.dirName),
      ).toEqual([quickMeta.dirName]);

      await store.getActions().projects.startRuns([runRequest()]);
      expect(store.getState().projects.activeRun).toBeUndefined();
      // The run landed on scratch storage, not the library.
      expect(
        await scratchStorage.read(
          quickMeta.dirName,
          `${RUNS_DIR}/run-001/log.lammps`,
        ),
      ).toBe(FAKE_LOG);
      expect(await libraryStorage.listProjects()).toEqual([]);

      await store.getActions().projects.saveQuickAsProject();

      const libraryProjects = await libraryStorage.listProjects();
      expect(libraryProjects).toHaveLength(1);
      const saved = libraryProjects[0];
      expect(saved.displayName).toBe("Melt");
      expect(saved.dirName).not.toBe(quickMeta.dirName);
      expect(saved.inputScript).toBe("in.lmp");

      // Working tree AND completed runs materialized.
      expect(await libraryStorage.read(saved.dirName, "in.lmp")).toBe(SCRIPT);
      expect(
        await libraryStorage.stat(saved.dirName, "analysis.ipynb"),
      ).not.toBeNull();
      expect(
        await libraryStorage.read(
          saved.dirName,
          `${RUNS_DIR}/run-001/log.lammps`,
        ),
      ).toBe(FAKE_LOG);
      const runMeta = await readRunMeta(
        libraryStorage,
        saved.dirName,
        "run-001",
      );
      expect(runMeta?.status).toBe("completed");

      // Fresh identity: the library project.json carries the new dirName,
      // not a copy of the scratch project's.
      const persisted = await readJson<ProjectMeta>(
        libraryStorage,
        saved.dirName,
        PROJECT_META_PATH,
      );
      expect(persisted.dirName).toBe(saved.dirName);
      expect(persisted.displayName).toBe("Melt");
      expect(store.getState().projects.active?.quick).toBe(false);
      expect(store.getState().projects.active?.meta.dirName).toBe(
        saved.dirName,
      );
    });
  });

  describe("project zip export/import", () => {
    /** Recursive file listing (paths only), sorted, for tree comparison. */
    async function treeOf(
      storage: ProjectStorage,
      dirName: string,
      subdir?: string,
    ): Promise<string[]> {
      const paths: string[] = [];
      for (const entry of await storage.list(dirName, subdir)) {
        if (entry.type === "directory") {
          paths.push(...(await treeOf(storage, dirName, entry.path)));
        } else {
          paths.push(entry.path);
        }
      }
      return paths.sort();
    }

    it("round-trips a project (incl. a binary file and run history)", async () => {
      const engine = createFakeEngine();
      const { store, libraryStorage } = await createTestStore(engine);
      await store.getActions().projects.createProject({
        displayName: "Zip Trip",
        files: [{ fileName: "in.lmp", content: SCRIPT }],
      });
      const dirName = activeDirName(store);
      const binary = new Uint8Array([0, 1, 2, 128, 254, 255]);
      await store
        .getActions()
        .projects.writeFile({ path: "weights.npy", content: binary });
      await store.getActions().projects.startRuns([runRequest()]);

      const exported = await store
        .getActions()
        .projects.exportProject({ includeRuns: true });
      expect(exported).not.toBeNull();
      expect(exported!.fileName).toBe(`${dirName}.zip`);

      const imported = await store.getActions().projects.importProject({
        zip: exported!.bytes,
        displayName: "Zip Trip Copy", // the modal's name field wins
      });
      expect(imported.dirName).not.toBe(dirName);
      expect(imported.displayName).toBe("Zip Trip Copy");
      expect(imported.inputScript).toBe("in.lmp");

      // Identical trees (both have a regenerated .atomify/project.json).
      expect(await treeOf(libraryStorage, imported.dirName)).toEqual(
        await treeOf(libraryStorage, dirName),
      );
      expect(await libraryStorage.read(imported.dirName, "in.lmp")).toBe(
        SCRIPT,
      );
      // Binary file survives byte-exact.
      const importedBinary = await libraryStorage.read(
        imported.dirName,
        "weights.npy",
      );
      expect(importedBinary).toBeInstanceOf(Uint8Array);
      expect([...(importedBinary as Uint8Array)]).toEqual([...binary]);
      // Run history came along, metadata intact.
      const runMeta = await readRunMeta(
        libraryStorage,
        imported.dirName,
        "run-001",
      );
      expect(runMeta?.status).toBe("completed");
    });

    it("export without runs; import falls back to the zip's project.json name", async () => {
      const engine = createFakeEngine();
      const { store, libraryStorage } = await createTestStore(engine);
      await store.getActions().projects.createProject({
        displayName: "No Runs Export",
        files: [{ fileName: "in.lmp", content: SCRIPT }],
      });
      await store.getActions().projects.startRuns([runRequest()]);

      const exported = await store
        .getActions()
        .projects.exportProject({ includeRuns: false });
      const imported = await store
        .getActions()
        .projects.importProject({ zip: exported!.bytes });

      expect(imported.displayName).toBe("No Runs Export");
      expect(imported.inputScript).toBe("in.lmp");
      const tree = await treeOf(libraryStorage, imported.dirName);
      expect(tree.some((path) => path.startsWith(`${RUNS_DIR}/`))).toBe(false);
      expect(tree).toContain("in.lmp");
      expect(tree).toContain("analysis.ipynb");
    });
  });

  describe("deleteProject", () => {
    it("is blocked while the project has an active run and allowed afterwards", async () => {
      const engine = createFakeEngine({ manual: true });
      const { store, libraryStorage } = await createTestStore(engine);
      await store.getActions().projects.createProject({
        displayName: "Busy",
        files: [{ fileName: "in.lmp", content: SCRIPT }],
      });
      const dirName = activeDirName(store);

      const runPromise = store.getActions().projects.startRuns([runRequest()]);
      // activeRun is claimed synchronously at queue pickup (re-entrancy
      // guard); the engine call happens later — wait for it before we plan
      // to resolve it, and assert the delete block while it is in flight.
      await waitForCondition(
        () => engine.runFilePaths.length > 0,
        "the engine runFile call",
      );

      await store.getActions().projects.deleteProject(dirName);

      // Blocked: still in storage, notice explains why.
      expect(
        (await libraryStorage.listProjects()).map((p) => p.dirName),
      ).toContain(dirName);
      expect(store.getState().projects.notice).toContain("run in progress");

      engine.resolveRun();
      await runPromise;

      await store.getActions().projects.deleteProject(dirName);

      expect(await libraryStorage.listProjects()).toEqual([]);
      expect(await libraryStorage.stat(dirName, PROJECT_META_PATH)).toBeNull();
      expect(store.getState().projects.active).toBeUndefined();
      expect(store.getState().projects.screen).toEqual({ name: "home" });
    });
  });

  describe("run reconciliation on openProject", () => {
    it("marks unowned app-origin running runs interrupted; fresh notebook runs survive", async () => {
      const { store, libraryStorage } =
        await createTestStore(createFakeEngine());
      await store.getActions().projects.createProject({
        displayName: "Zombies",
        files: [{ fileName: "in.lmp", content: SCRIPT }],
      });
      const dirName = activeDirName(store);

      // A zombie from a previous app session…
      await writeRunMeta(libraryStorage, dirName, {
        schemaVersion: 1,
        id: "run-001",
        inputScript: "in.lmp",
        status: "running",
        startedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        origin: "app",
      });
      // …and a notebook-origin run whose run.json was just written (fresh
      // mtime — the kernel may genuinely still be executing it).
      await writeRunMeta(libraryStorage, dirName, {
        schemaVersion: 1,
        id: "run-002",
        inputScript: "in.lmp",
        status: "running",
        startedAt: new Date().toISOString(),
        origin: "notebook",
      });

      await store.getActions().projects.openProject({ dirName });

      const appRun = await readRunMeta(libraryStorage, dirName, "run-001");
      expect(appRun?.status).toBe("interrupted");
      expect(appRun?.finishedAt).toBeTruthy();

      const notebookRun = await readRunMeta(libraryStorage, dirName, "run-002");
      expect(notebookRun?.status).toBe("running");
      expect(store.getState().projects.notice).toContain("interrupted");
    });
  });

  describe("duplicateProject", () => {
    it("copies the working tree and notebook, keeps inputScript, and starts with zero runs", async () => {
      const engine = createFakeEngine();
      const { store, libraryStorage } = await createTestStore(engine);
      await store.getActions().projects.createProject({
        displayName: "Original",
        files: [
          { fileName: "in.lmp", content: SCRIPT },
          { fileName: "data.spce", content: "some data" },
        ],
      });
      const originalDirName = activeDirName(store);
      // Give the original a run so "zero runs in the copy" is meaningful.
      await store.getActions().projects.startRuns([runRequest()]);

      await store.getActions().projects.duplicateProject();

      const copyDirName = activeDirName(store);
      expect(copyDirName).not.toBe(originalDirName);
      const copyMeta = await readJson<ProjectMeta>(
        libraryStorage,
        copyDirName,
        PROJECT_META_PATH,
      );
      expect(copyMeta.displayName).toBe("Original (copy)");
      expect(copyMeta.inputScript).toBe("in.lmp");

      // Working tree + notebook copied (the original's notebook, not a
      // regenerated template for the copy's name).
      expect(await libraryStorage.read(copyDirName, "in.lmp")).toBe(SCRIPT);
      expect(await libraryStorage.read(copyDirName, "data.spce")).toBe(
        "some data",
      );
      const notebook = (await libraryStorage.read(
        copyDirName,
        "analysis.ipynb",
      )) as string;
      expect(notebook).toContain("Original");
      expect(notebook).not.toContain("Original (copy)");

      // Zero runs in the copy; the original keeps its run.
      expect(await libraryStorage.list(copyDirName, RUNS_DIR)).toEqual([]);
      expect(store.getState().projects.active?.runs).toEqual([]);
      expect(
        await libraryStorage.stat(
          originalDirName,
          `${RUNS_DIR}/run-001/${RUN_META_PATH}`,
        ),
      ).not.toBeNull();
    });
  });

  describe("removeFile", () => {
    it("clears meta.inputScript when the designated input script is removed", async () => {
      const { store, libraryStorage } =
        await createTestStore(createFakeEngine());
      const meta = await store.getActions().projects.createProject({
        displayName: "Remove Input",
        files: [{ fileName: "in.lmp", content: SCRIPT }],
      });
      expect(meta.inputScript).toBe("in.lmp");

      await store.getActions().projects.removeFile("in.lmp");

      expect(await libraryStorage.stat(meta.dirName, "in.lmp")).toBeNull();
      const persisted = await readJson<ProjectMeta>(
        libraryStorage,
        meta.dirName,
        PROJECT_META_PATH,
      );
      expect(persisted.inputScript).toBeUndefined();
      expect(
        store.getState().projects.active?.meta.inputScript,
      ).toBeUndefined();
    });
  });
});

// --- Helpers ---------------------------------------------------------------

interface FakeEngine {
  lammps: LammpsWeb;
  /** Every path passed to runFile, in call order. */
  runFilePaths: string[];
  /** Resolve the oldest pending manual runFile (manual mode only). */
  resolveRun: () => void;
  /** Value returned by getErrorMessage after runFile settles. */
  setErrorMessage: (message: string) => void;
}

interface FakeEngineOptions {
  /** When true, runFile returns a promise resolved via resolveRun(). */
  manual?: boolean;
  /** Files snapshotWorkdir reports (defaults to a log.lammps). */
  outputs?: { path: string; content: string }[];
}

function createFakeEngine(options: FakeEngineOptions = {}): FakeEngine {
  const outputs = options.outputs ?? [
    { path: "log.lammps", content: FAKE_LOG },
  ];
  const runFilePaths: string[] = [];
  const pendingRuns: (() => void)[] = [];
  let errorMessage = "";

  const emptyStringArray = () => ({
    get: () => "",
    size: () => 0,
    delete: () => {},
  });
  const noModifier = (): LMPModifier => {
    throw new Error("LMP modifiers are not exercised by these tests");
  };
  const emptyWalls = () => ({
    get: (): Wall => ({ which: 0, style: 0, position: 0, cutoff: 0 }),
    size: () => 0,
    delete: () => {},
  });

  const lammps: LammpsWeb = {
    getNumAtoms: () => 100,
    setSyncFrequency: () => {},
    setBuildNeighborlist: () => {},
    setBondDistance: () => {},
    clearBondDistances: () => {},
    getIsRunning: () => false,
    getErrorMessage: () => errorMessage,
    getLastCommand: () => "",
    getTimesteps: () => 500,
    getRunTimesteps: () => 0,
    getRunTotalTimesteps: () => 0,
    getTimestepsPerSecond: () => 0,
    getCPURemain: () => 0,
    getWhichFlag: () => 0,
    getCompute: noModifier,
    getComputeNames: emptyStringArray,
    getFix: noModifier,
    getFixNames: emptyStringArray,
    getVariable: noModifier,
    getVariableNames: emptyStringArray,
    syncComputes: () => {},
    syncFixes: () => {},
    syncVariables: () => {},
    snapshotWorkdir: async () => ({
      files: outputs.map((file) => ({
        path: file.path,
        bytes: new TextEncoder().encode(file.content),
      })),
      skipped: [],
    }),
    getMemoryUsage: () => 0,
    getPositionsPointer: () => 0,
    getIdPointer: () => 0,
    getTypePointer: () => 0,
    getCellMatrixPointer: () => 0,
    getOrigoPointer: () => 0,
    getBondsPosition1Pointer: () => 0,
    getBondsPosition2Pointer: () => 0,
    getExceptionMessage: (address: number) => `exception at ${address}`,
    step: () => {},
    stop: () => true,
    start: () => true,
    cancel: () => {},
    runCommand: () => {},
    runFile: (path: string) => {
      runFilePaths.push(path);
      if (!options.manual) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => pendingRuns.push(resolve));
    },
    computeBonds: () => 0,
    computeParticles: () => 0,
    getDimension: () => 3,
    getWalls: emptyWalls,
  };

  return {
    lammps,
    runFilePaths,
    resolveRun: () => {
      const resolve = pendingRuns.shift();
      if (!resolve) {
        throw new Error("No pending runFile to resolve");
      }
      resolve();
    },
    setErrorMessage: (message: string) => {
      errorMessage = message;
    },
  };
}

/** A minimal wasm module: only the FS + heaps the simulation model touches. */
function createFakeWasm(): AtomifyWasmModule {
  const files = new Map<string, string | Uint8Array>();
  const dirs = new Set<string>(["/"]);
  const fs: AtomifyWasmModule["FS"] = {
    mkdir: (path) => {
      dirs.add(path);
    },
    rmdir: (path) => {
      dirs.delete(path);
    },
    chdir: () => {},
    cwd: () => "/",
    writeFile: (path, data) => {
      files.set(path, data);
    },
    unlink: (path) => {
      files.delete(path);
    },
    readFile: (path) => {
      const data = files.get(path);
      if (data === undefined) {
        throw new Error(`No such fake file: ${path}`);
      }
      return typeof data === "string" ? data : new TextDecoder().decode(data);
    },
    readdir: () => [],
    analyzePath: (path) => ({
      exists: dirs.has(path) || files.has(path),
      isRoot: path === "/",
      path,
      name: path.slice(path.lastIndexOf("/") + 1),
      error: 0,
    }),
    stat: () => ({ size: 0, mode: 0, mtime: new Date() }),
    isDir: () => false,
    isFile: () => true,
  };
  // LAMMPSWeb/ScalarType (the embind class handles) are never touched by the
  // store models; Partial + cast per docs/testing_patterns.md §9.
  const wasm: Partial<AtomifyWasmModule> = {
    HEAPF32: new Float32Array(1024),
    HEAPF64: new Float64Array(64),
    HEAP32: new Int32Array(1024),
    HEAP64: new BigInt64Array(16),
    FS: fs,
  };
  return wasm as AtomifyWasmModule;
}

async function createTestStore(engine: FakeEngine): Promise<{
  store: Store<StoreModel>;
  libraryStorage: ProjectStorage;
  scratchStorage: ProjectStorage;
}> {
  const libraryStorage = createMemoryProjectStorage();
  const scratchStorage = createMemoryProjectStorage();
  const injections: StoreInjections = { libraryStorage, scratchStorage };
  const store = createStore(storeModel, { injections });
  // The settings branch is persist()-wrapped; rehydration is async and
  // REPLACES store state when it lands. Await it so it cannot clobber the
  // setup dispatches below (it does, once earlier tests have populated
  // sessionStorage).
  await store.persist.resolveRehydration();
  setWasm(createFakeWasm());
  // The omovi/three post-timestep render pipeline is not under test here;
  // clearing the modifiers (via the real action) keeps completed-run
  // processing to plain engine getters.
  store.getActions().processing.setPostTimestepModifiers([]);
  store.getActions().simulation.setLammps(engine.lammps);
  return { store, libraryStorage, scratchStorage };
}

function runRequest(
  overrides: Partial<Omit<RunRequest, "dirName" | "quick" | "sweepId">> = {},
): Omit<RunRequest, "dirName" | "quick" | "sweepId"> {
  return {
    inputScript: "in.lmp",
    vars: {},
    useKokkos: false,
    threads: 1,
    ...overrides,
  };
}

function activeDirName(store: Store<StoreModel>): string {
  const active = store.getState().projects.active;
  if (!active) {
    throw new Error("Expected an active project");
  }
  return active.meta.dirName;
}

async function readJson<T>(
  storage: ProjectStorage,
  dirName: string,
  path: string,
): Promise<T> {
  const raw = await storage.read(dirName, path);
  return JSON.parse(
    typeof raw === "string" ? raw : new TextDecoder().decode(raw),
  ) as T;
}

async function waitForCondition(
  condition: () => boolean,
  what: string,
): Promise<void> {
  const deadline = Date.now() + 5000;
  while (!condition()) {
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting for ${what}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

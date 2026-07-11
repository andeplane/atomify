import { describe, expect, it, beforeEach } from "vitest";
import { createMemoryProjectStorage } from "./contentsProjectStorage";
import {
  allocateRunDir,
  expandSweep,
  listRuns,
  NOTEBOOK_RUN_GRACE_MS,
  parseSweepValues,
  readRunMeta,
  reconcileRuns,
  snapshotWorkingTree,
  writeRunMeta,
} from "./runs";
import type { ProjectStorage, RunMeta } from "./types";

function runMeta(id: string, patch?: Partial<RunMeta>): RunMeta {
  return {
    schemaVersion: 1,
    id,
    inputScript: "in.diffusion",
    status: "completed",
    startedAt: "2026-07-11T09:00:00.000Z",
    finishedAt: "2026-07-11T09:05:00.000Z",
    origin: "app",
    ...patch,
  };
}

describe("runs", () => {
  let storage: ProjectStorage;
  let dirName: string;

  beforeEach(async () => {
    storage = createMemoryProjectStorage();
    const meta = await storage.createProject({ displayName: "Diffusion" });
    dirName = meta.dirName;
    await storage.write(dirName, "in.diffusion", "units lj\nrun 100");
  });

  describe("allocateRunDir", () => {
    it("allocates run-001 first and increments past existing runs", async () => {
      const first = await allocateRunDir(storage, dirName);
      expect(first).toBe("run-001");

      const second = await allocateRunDir(storage, dirName);
      expect(second).toBe("run-002");
    });

    it("skips past non-numeric external run directories", async () => {
      await storage.write(dirName, "runs/run-T3.5/log.lammps", "external");
      const allocated = await allocateRunDir(storage, dirName);
      expect(allocated).toBe("run-001");
    });

    it("claims the directory immediately (run.json placeholder exists)", async () => {
      const runId = await allocateRunDir(storage, dirName);
      const meta = await readRunMeta(storage, dirName, runId);
      expect(meta?.status).toBe("running");
    });
  });

  describe("snapshotWorkingTree", () => {
    it("copies sources but excludes runs/, .atomify/ and notebooks", async () => {
      await storage.write(dirName, "data.lammps", "1 atoms");
      await storage.write(dirName, "analysis.ipynb", '{"cells":[]}');
      await storage.write(dirName, "runs/run-000/old.log", "old");
      const runId = await allocateRunDir(storage, dirName);

      const { copied } = await snapshotWorkingTree(storage, dirName, runId);

      expect(copied.sort()).toEqual(["data.lammps", "in.diffusion"]);
      expect(
        await storage.read(dirName, `runs/${runId}/in.diffusion`),
      ).toContain("units lj");
      expect(
        await storage.stat(dirName, `runs/${runId}/analysis.ipynb`),
      ).toBeNull();
      expect(
        await storage.stat(dirName, `runs/${runId}/runs/run-000/old.log`),
      ).toBeNull();
    });

    it("records oversized files as provenance gaps instead of copying", async () => {
      await storage.write(dirName, "data.big", "x".repeat(100));
      const runId = await allocateRunDir(storage, dirName);

      const { copied, gaps } = await snapshotWorkingTree(
        storage,
        dirName,
        runId,
        { sizeCap: 50 },
      );

      expect(copied).toEqual(["in.diffusion"]);
      expect(gaps).toHaveLength(1);
      expect(gaps![0].path).toBe("data.big");
      expect(gaps![0].size).toBe(100);
      expect(gaps![0].sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(await storage.stat(dirName, `runs/${runId}/data.big`)).toBeNull();
    });
  });

  describe("listRuns", () => {
    it("lists runs newest-first and includes metadata-less external runs", async () => {
      await writeRunMeta(storage, dirName, runMeta("run-001"));
      await writeRunMeta(
        storage,
        dirName,
        runMeta("run-002", { finishedAt: "2026-07-11T10:00:00.000Z" }),
      );
      // External run: directory with outputs but no run.json.
      await storage.write(dirName, "runs/run-T3.5/log.lammps", "external");

      const runs = await listRuns(storage, dirName);

      expect(runs.map((run) => run.runId)).toContain("run-T3.5");
      const external = runs.find((run) => run.runId === "run-T3.5");
      expect(external?.meta).toBeNull();
      const ordered = runs.filter((run) => run.meta);
      expect(ordered[0].runId).toBe("run-002");
    });
  });

  describe("reconcileRuns", () => {
    it("interrupts unowned app runs but leaves owned ones", async () => {
      await writeRunMeta(
        storage,
        dirName,
        runMeta("run-001", { status: "running", finishedAt: undefined }),
      );
      await writeRunMeta(
        storage,
        dirName,
        runMeta("run-002", { status: "running", finishedAt: undefined }),
      );

      const interrupted = await reconcileRuns(
        storage,
        dirName,
        new Set(["run-002"]),
      );

      expect(interrupted).toEqual(["run-001"]);
      expect((await readRunMeta(storage, dirName, "run-001"))?.status).toBe(
        "interrupted",
      );
      expect((await readRunMeta(storage, dirName, "run-002"))?.status).toBe(
        "running",
      );
    });

    it("gives live notebook runs a grace window", async () => {
      await writeRunMeta(
        storage,
        dirName,
        runMeta("run-001", {
          status: "running",
          finishedAt: undefined,
          origin: "notebook",
        }),
      );

      // Fresh run.json (just written): inside the grace window.
      const early = await reconcileRuns(storage, dirName, new Set());
      expect(early).toEqual([]);

      // Well past the grace window.
      const later = new Date(Date.now() + NOTEBOOK_RUN_GRACE_MS + 60_000);
      const interrupted = await reconcileRuns(
        storage,
        dirName,
        new Set(),
        later,
      );
      expect(interrupted).toEqual(["run-001"]);
    });
  });

  describe("sweeps", () => {
    it("expands the cartesian product in stable order", () => {
      const combos = expandSweep({ T: [1, 2], rho: [0.5, 0.8] });
      expect(combos).toEqual([
        { T: 1, rho: 0.5 },
        { T: 1, rho: 0.8 },
        { T: 2, rho: 0.5 },
        { T: 2, rho: 0.8 },
      ]);
    });

    it("returns empty for empty input or an empty value list", () => {
      expect(expandSweep({})).toEqual([]);
      expect(expandSweep({ T: [] })).toEqual([]);
    });

    it("parses comma lists and start:end:step ranges", () => {
      expect(parseSweepValues("1, 1.5, 2")).toEqual([1, 1.5, 2]);
      expect(parseSweepValues("1:3:0.5")).toEqual([1, 1.5, 2, 2.5, 3]);
      expect(parseSweepValues("3:1:-1")).toEqual([3, 2, 1]);
      expect(() => parseSweepValues("1:3:0")).toThrow(/never reaches/);
      expect(() => parseSweepValues("1, banana")).toThrow(/Invalid number/);
    });
  });
});

import { describe, expect, it, beforeEach } from "vitest";
import { ContentsProjectStorage } from "./contentsProjectStorage";
import type { ContentsRecord } from "./contentsSchema";
import { MemoryStore } from "./kv";
import type { ProjectMeta, ProjectStorage } from "./types";

describe("ContentsProjectStorage", () => {
  let files: MemoryStore;
  let checkpoints: MemoryStore;
  let storage: ProjectStorage;

  beforeEach(() => {
    files = new MemoryStore();
    checkpoints = new MemoryStore();
    storage = new ContentsProjectStorage(files, checkpoints);
  });

  describe("projects", () => {
    it("creates a project with a slugged dirName and skeleton records", async () => {
      const meta = await storage.createProject({
        displayName: "Diffusion coefficients",
      });

      expect(meta.dirName).toBe("diffusion-coefficients");
      expect(meta.displayName).toBe("Diffusion coefficients");
      expect(meta.color).toBeDefined();

      // Skeleton: project dir, .atomify dir, runs dir, project.json.
      const dir = await files.getItem<ContentsRecord>("diffusion-coefficients");
      expect(dir?.type).toBe("directory");
      const runs = await files.getItem<ContentsRecord>(
        "diffusion-coefficients/runs",
      );
      expect(runs?.type).toBe("directory");
      const metaRecord = await files.getItem<ContentsRecord>(
        "diffusion-coefficients/.atomify/project.json",
      );
      expect(metaRecord?.format).toBe("json");
    });

    it("unique-ifies colliding dirNames", async () => {
      const first = await storage.createProject({ displayName: "Diffusion" });
      const second = await storage.createProject({ displayName: "Diffusion" });
      expect(first.dirName).toBe("diffusion");
      expect(second.dirName).toBe("diffusion-2");
    });

    it("lists only directories holding a project.json", async () => {
      await storage.createProject({ displayName: "Real project" });
      // Legacy junk from the pre-projects one-way sync.
      await files.setItem("analyze.ipynb", {
        name: "analyze.ipynb",
        path: "analyze.ipynb",
        type: "notebook",
      } as ContentsRecord);
      await files.setItem("legacy-sim/log.lammps", {
        name: "log.lammps",
        path: "legacy-sim/log.lammps",
        type: "file",
      } as ContentsRecord);

      const projects = await storage.listProjects();
      expect(projects.map((p) => p.dirName)).toEqual(["real-project"]);
    });

    it("updates meta but refuses dirName changes", async () => {
      const created = await storage.createProject({ displayName: "Original" });
      const updated = await storage.updateProjectMeta(created.dirName, {
        displayName: "Renamed study",
      });
      expect(updated.displayName).toBe("Renamed study");
      expect(updated.dirName).toBe("original");

      await expect(
        storage.updateProjectMeta(created.dirName, {
          dirName: "hijack",
        } as Partial<ProjectMeta>),
      ).rejects.toThrow(/immutable/);
    });

    it("deletes recursively including checkpoints", async () => {
      const { dirName } = await storage.createProject({ displayName: "Doomed" });
      await storage.write(dirName, "in.script", "run 100");
      await checkpoints.setItem(`${dirName}/in.script`, [{ id: "0" }]);

      await storage.deleteProject(dirName);

      expect(await files.keys()).toEqual([]);
      expect(await checkpoints.keys()).toEqual([]);
    });
  });

  describe("files", () => {
    let dirName: string;

    beforeEach(async () => {
      const meta = await storage.createProject({ displayName: "Proj" });
      dirName = meta.dirName;
    });

    it("round-trips text files and preserves created on rewrite", async () => {
      const first = await storage.write(dirName, "in.diffusion", "units lj");
      const record1 = await files.getItem<ContentsRecord>(
        `${dirName}/in.diffusion`,
      );
      await storage.write(dirName, "in.diffusion", "units metal");
      const record2 = await files.getItem<ContentsRecord>(
        `${dirName}/in.diffusion`,
      );

      expect(await storage.read(dirName, "in.diffusion")).toBe("units metal");
      expect(first.format).toBe("text");
      expect(record2?.created).toBe(record1?.created);
    });

    it("stores notebooks as parsed JSON and reads them back as JSON text", async () => {
      const notebook = JSON.stringify({ cells: [], nbformat: 4 });
      await storage.write(dirName, "analysis.ipynb", notebook);

      const record = await files.getItem<ContentsRecord>(
        `${dirName}/analysis.ipynb`,
      );
      expect(record?.type).toBe("notebook");
      expect(record?.format).toBe("json");
      expect(typeof record?.content).toBe("object");

      const read = await storage.read(dirName, "analysis.ipynb");
      expect(JSON.parse(read as string)).toEqual({ cells: [], nbformat: 4 });
    });

    it("round-trips binary files as base64", async () => {
      const bytes = new Uint8Array([137, 80, 78, 71, 0, 255]);
      await storage.write(dirName, ".atomify/frame.png", bytes);

      const record = await files.getItem<ContentsRecord>(
        `${dirName}/.atomify/frame.png`,
      );
      expect(record?.format).toBe("base64");

      const read = await storage.read(dirName, ".atomify/frame.png");
      expect(read).toBeInstanceOf(Uint8Array);
      expect([...(read as Uint8Array)]).toEqual([137, 80, 78, 71, 0, 255]);
    });

    it("auto-creates parent directory records on deep writes", async () => {
      await storage.write(dirName, "runs/run-001/log.lammps", "LAMMPS log");
      const runDir = await files.getItem<ContentsRecord>(
        `${dirName}/runs/run-001`,
      );
      expect(runDir?.type).toBe("directory");
    });

    it("lists direct children only, synthesizing implied directories", async () => {
      await storage.write(dirName, "in.diffusion", "units lj");
      await storage.write(dirName, "runs/run-001/log.lammps", "log");
      // Simulate an externally-written deep key with no parent record.
      await files.removeItem(`${dirName}/runs/run-001`);

      const root = await storage.list(dirName);
      const names = root.map((stat) => stat.path);
      expect(names).toContain("in.diffusion");
      expect(names).toContain("runs");
      expect(names).toContain(".atomify");
      expect(names).not.toContain("runs/run-001/log.lammps");

      const runs = await storage.list(dirName, "runs");
      expect(runs).toHaveLength(1);
      expect(runs[0].path).toBe("runs/run-001");
      expect(runs[0].type).toBe("directory");
    });

    it("renames files, carrying checkpoints along", async () => {
      await storage.write(dirName, "in.old", "run 1");
      await checkpoints.setItem(`${dirName}/in.old`, [{ id: "0" }]);

      await storage.rename(dirName, "in.old", "in.new");

      expect(await storage.stat(dirName, "in.old")).toBeNull();
      expect(await storage.read(dirName, "in.new")).toBe("run 1");
      expect(await checkpoints.getItem(`${dirName}/in.old`)).toBeNull();
      expect(await checkpoints.getItem(`${dirName}/in.new`)).not.toBeNull();
    });

    it("renames directories recursively", async () => {
      await storage.write(dirName, "data/one.txt", "1");
      await storage.write(dirName, "data/deep/two.txt", "2");

      await storage.rename(dirName, "data", "inputs");

      expect(await storage.read(dirName, "inputs/one.txt")).toBe("1");
      expect(await storage.read(dirName, "inputs/deep/two.txt")).toBe("2");
      expect(await storage.stat(dirName, "data")).toBeNull();
    });

    it("removes directories recursively including checkpoints", async () => {
      await storage.write(dirName, "runs/run-001/log.lammps", "log");
      await checkpoints.setItem(`${dirName}/runs/run-001/log.lammps`, [
        { id: "0" },
      ]);

      await storage.remove(dirName, "runs/run-001");

      expect(await storage.stat(dirName, "runs/run-001")).toBeNull();
      expect(await storage.stat(dirName, "runs/run-001/log.lammps")).toBeNull();
      expect(
        await checkpoints.getItem(`${dirName}/runs/run-001/log.lammps`),
      ).toBeNull();
    });

    it("rejects paths JupyterLite cannot handle", async () => {
      await expect(storage.write(dirName, "bad%name", "x")).rejects.toThrow(
        /%/,
      );
      await expect(storage.write(dirName, "../escape", "x")).rejects.toThrow(
        /segment/,
      );
      await expect(storage.write(dirName, "/absolute", "x")).rejects.toThrow(
        /slash/,
      );
    });
  });
});

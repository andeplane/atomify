import { describe, it, expect } from "vitest";
import { isScriptFile, isStaleExampleCopy } from "./helpers";
import type { ProjectMeta } from "../../storage";

describe("isStaleExampleCopy", () => {
  it.each([
    ["display name ends in (copy)", "Water vapor (copy)", "water-vapor-copy"],
    ["dirName ends in -copy", "My water run", "water-vapor-copy"],
    ["dirName ends in -copy-N", "My water run", "water-vapor-copy-3"],
    ["display name only", "Water vapor (copy)", "renamed-dir"],
  ])("detects an example-sourced copy: %s", (_, displayName, dirName) => {
    expect(isStaleExampleCopy(projectMeta({ displayName, dirName }))).toBe(
      true,
    );
  });

  it.each([
    ["a genuine example", "Water vapor", "water-vapor"],
    ["a second instance of an example", "Water vapor", "water-vapor-2"],
    ["a renamed example", "My water run", "water-vapor"],
    ["copy only mid-name", "Copy of water", "copy-of-water"],
  ])("leaves %s alone", (_, displayName, dirName) => {
    expect(isStaleExampleCopy(projectMeta({ displayName, dirName }))).toBe(
      false,
    );
  });

  it("ignores copies that are not example-sourced", () => {
    const names = { displayName: "Mine (copy)", dirName: "mine-copy" };
    expect(
      isStaleExampleCopy(projectMeta({ ...names, source: undefined })),
    ).toBe(false);
    expect(
      isStaleExampleCopy(projectMeta({ ...names, source: { type: "blank" } })),
    ).toBe(false);
    expect(
      isStaleExampleCopy(
        projectMeta({ ...names, source: { type: "duplicate" } }),
      ),
    ).toBe(false);
  });
});

function projectMeta(
  overrides: Partial<ProjectMeta> & { displayName: string; dirName: string },
): ProjectMeta {
  return {
    schemaVersion: 1,
    createdAt: "2026-07-01T00:00:00.000Z",
    source: { type: "example", exampleId: "watervapor" },
    ...overrides,
  };
}

describe("isScriptFile", () => {
  it.each([
    "in.lj",
    "in.pour.2d.molecule",
    "crack.in",
    "run.in.npt",
    "run_short_sim.in.nvt",
    "system.in.settings",
    "subdir/in.melt",
    "subdir/run.in.nvt",
    "runs/run-1/water.in",
  ])("recognizes %s", (path) => {
    expect(isScriptFile(path)).toBe(true);
  });

  it.each([
    "data.lammps",
    "system.data",
    "log.lammps",
    "notebook.ipynb",
    "input.txt",
    "main.inc",
    "in/data.txt",
    "bin.lj",
  ])("rejects %s", (path) => {
    expect(isScriptFile(path)).toBe(false);
  });

  it("always accepts the designated input script", () => {
    expect(isScriptFile("simulation.lmp", "simulation.lmp")).toBe(true);
    expect(isScriptFile("other.lmp", "simulation.lmp")).toBe(false);
  });
});

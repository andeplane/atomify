import { describe, it, expect } from "vitest";
import { isStaleExampleCopy } from "./projects";
import type { ProjectMeta } from "../storage";

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

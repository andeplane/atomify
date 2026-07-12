import { describe, it, expect } from "vitest";
import { parseDeepLink, screenToSearch } from "./deepLink";
import type { Screen } from "../store/projects";

describe("parseDeepLink", () => {
  it("returns null with no managed params", () => {
    expect(parseDeepLink("")).toBeNull();
    expect(parseDeepLink("?examplesUrl=https://example.com/x.json")).toBeNull();
  });

  it("parses a project with its tab", () => {
    expect(parseDeepLink("?project=diffusion&tab=runs")).toEqual({
      name: "project",
      dirName: "diffusion",
      tab: "runs",
      runId: undefined,
      filePath: undefined,
    });
  });

  it("defaults to the files tab for unknown tab values", () => {
    expect(parseDeepLink("?project=diffusion&tab=nope")).toMatchObject({
      tab: "files",
    });
  });

  it("pins the tab to runs when a run is given", () => {
    expect(parseDeepLink("?project=diffusion&tab=files&run=run-005")).toEqual({
      name: "project",
      dirName: "diffusion",
      tab: "runs",
      runId: "run-005",
      filePath: undefined,
    });
  });

  it("pins the tab to files when a file is given", () => {
    expect(
      parseDeepLink("?project=diffusion&tab=notebook&file=in.melt"),
    ).toEqual({
      name: "project",
      dirName: "diffusion",
      tab: "files",
      runId: undefined,
      filePath: "in.melt",
    });
  });

  it("parses the examples screen", () => {
    expect(parseDeepLink("?screen=examples")).toEqual({ name: "examples" });
  });

  it("legacy embed params are not deep links", () => {
    expect(parseDeepLink("?data=abc123&autostart=true")).toBeNull();
  });
});

describe("screenToSearch", () => {
  it("clears managed params for home", () => {
    expect(screenToSearch({ name: "home" }, "?project=x&tab=runs")).toBe("");
  });

  it("preserves unmanaged params", () => {
    expect(
      screenToSearch({ name: "home" }, "?project=x&examplesUrl=custom.json"),
    ).toBe("?examplesUrl=custom.json");
  });

  it("serializes project screens with sub-screens", () => {
    const screen: Screen = {
      name: "project",
      dirName: "diffusion",
      tab: "runs",
      runId: "run-005",
    };
    expect(screenToSearch(screen, "")).toBe(
      "?project=diffusion&tab=runs&run=run-005",
    );
  });

  it("round-trips through parseDeepLink", () => {
    const screen: Screen = {
      name: "project",
      dirName: "silica",
      tab: "files",
      filePath: "in.silica",
    };
    expect(parseDeepLink(screenToSearch(screen, ""))).toEqual({
      ...screen,
      runId: undefined,
    });
  });
});

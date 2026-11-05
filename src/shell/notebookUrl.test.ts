import { describe, it, expect } from "vitest";
import {
  findProjectNotebook,
  jupyterLabUrl,
  notebookUrlFor,
} from "./notebookUrl";
import type { FileStat } from "../storage/types";

describe("jupyterLabUrl", () => {
  it("follows the Vite base path", () => {
    expect(jupyterLabUrl("/atomify/")).toBe("/atomify/jupyter/lab/index.html");
  });

  it("tolerates a base without a trailing slash", () => {
    expect(jupyterLabUrl("/atomify")).toBe("/atomify/jupyter/lab/index.html");
  });

  it("defaults to import.meta.env.BASE_URL", () => {
    expect(jupyterLabUrl()).toBe(jupyterLabUrl(import.meta.env.BASE_URL));
  });
});

describe("notebookUrlFor", () => {
  it("opens the project notebook with an encoded path", () => {
    expect(notebookUrlFor("diffusion", "analysis.ipynb", "/atomify/")).toBe(
      "/atomify/jupyter/lab/index.html?path=diffusion%2Fanalysis.ipynb",
    );
  });

  it("defaults to analysis.ipynb", () => {
    expect(notebookUrlFor("my-project", undefined, "/atomify/")).toBe(
      "/atomify/jupyter/lab/index.html?path=my-project%2Fanalysis.ipynb",
    );
  });

  it("falls back to the JupyterLite root without a project", () => {
    expect(notebookUrlFor(undefined, undefined, "/atomify/")).toBe(
      "/atomify/jupyter/lab/index.html",
    );
  });
});

describe("findProjectNotebook", () => {
  const stat = (path: string, type: FileStat["type"]): FileStat =>
    ({ path, type }) as FileStat;

  it("picks the first .ipynb file, ignoring directories", () => {
    const files = [
      stat("in.lammps", "file"),
      stat("old.ipynb", "directory"),
      stat("analysis.ipynb", "notebook"),
    ];
    expect(findProjectNotebook(files)?.path).toBe("analysis.ipynb");
  });

  it("returns undefined without a notebook", () => {
    expect(findProjectNotebook([stat("in.lammps", "file")])).toBeUndefined();
  });
});

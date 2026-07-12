import { describe, expect, it } from "vitest";
import { projectAnalysisNotebook } from "./AnalyzeNotebook";

const cellSource = (source: string | string[]): string =>
  Array.isArray(source) ? source.join("") : source;

describe("projectAnalysisNotebook", () => {
  const meta = { displayName: "Diffusion coefficients", dirName: "diffusion" };

  it("produces a valid pyodide notebook", () => {
    const notebook = projectAnalysisNotebook(meta);
    expect(notebook.nbformat).toBe(4);
    expect(notebook.metadata.kernelspec).toMatchObject({ name: "python" });
    expect(notebook.cells.length).toBeGreaterThan(3);
  });

  it("titles the notebook after the project", () => {
    const notebook = projectAnalysisNotebook(meta);
    const header = notebook.cells[0];
    expect(header.cell_type).toBe("markdown");
    expect(cellSource(header.source)).toContain("Diffusion coefficients");
  });

  it("includes the project description when present", () => {
    const notebook = projectAnalysisNotebook({
      ...meta,
      description: "LJ binary diffusion",
    });
    expect(cellSource(notebook.cells[0].source)).toContain(
      "LJ binary diffusion",
    );
  });

  it("discovers runs by glob rather than hardcoding paths", () => {
    const notebook = projectAnalysisNotebook(meta);
    const allCode = notebook.cells
      .filter((cell) => cell.cell_type === "code")
      .map((cell) => cellSource(cell.source))
      .join("\n");
    expect(allCode).toContain('glob.glob("runs/*');
    // The notebook cwd is the project dir; no dirName-prefixed paths.
    expect(allCode).not.toContain("diffusion/");
  });

  it("installs analysis deps via piplite wheels", () => {
    const notebook = projectAnalysisNotebook(meta);
    const pipCell = notebook.cells.find((cell) =>
      cellSource(cell.source).includes("%pip install"),
    );
    expect(pipCell).toBeDefined();
    expect(cellSource(pipCell!.source)).toContain("lammps-logfile");
  });

  it("reads sweep variables from run metadata", () => {
    const notebook = projectAnalysisNotebook(meta);
    const allCode = notebook.cells
      .map((cell) => cellSource(cell.source))
      .join("\n");
    expect(allCode).toContain(".atomify");
    expect(allCode).toContain("run.json");
    expect(allCode).toContain('"vars"');
  });
});

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

  describe("generated from the .ipynb template", () => {
    // Round-trip through JSON exactly as createProject writes the file.
    const generate = (description?: string) =>
      JSON.parse(
        JSON.stringify(projectAnalysisNotebook({ ...meta, description })),
      );

    it("emits the starter cells in order with string sources", () => {
      const notebook = generate();
      expect(notebook.nbformat).toBe(4);
      expect(notebook.nbformat_minor).toBe(4);
      expect(notebook.metadata.kernelspec).toEqual({
        name: "python",
        display_name: "Python (Pyodide)",
        language: "python",
      });
      expect(
        notebook.cells.map((cell: { cell_type: string }) => cell.cell_type),
      ).toEqual(["markdown", "code", "code", "code", "code", "code", "code"]);
      for (const cell of notebook.cells) {
        expect(typeof cell.source).toBe("string");
        if (cell.cell_type === "code") {
          expect(cell).toEqual({
            cell_type: "code",
            source: cell.source,
            metadata: { trusted: true },
            execution_count: null,
            outputs: [],
          });
        } else {
          expect(cell.metadata).toEqual({});
        }
      }
      expect(notebook.cells[1].source).toBe(
        "%pip install -q lammps-logfile pandas",
      );
      // Trailing empty cell for the user to start typing in.
      expect(notebook.cells[6].source).toBe("");
      expect(JSON.stringify(notebook)).not.toContain("{{");
    });

    it("substitutes the display name and omits a missing description", () => {
      expect(generate().cells[0].source).toBe(
        "# Diffusion coefficients — analysis\n\n" +
          "This notebook shares the project's files: every run of " +
          "*Diffusion coefficients* appears under `runs/` with its input " +
          "snapshot, `log.lammps`, and outputs. Re-run the cells below after " +
          "new runs — they discover runs by glob.",
      );
    });

    it("inserts the description as its own paragraph", () => {
      expect(generate("LJ binary diffusion").cells[0].source).toMatch(
        /^# Diffusion coefficients — analysis\n\nLJ binary diffusion\n\nThis notebook/,
      );
    });

    it("keeps user text literal (no $-patterns or nested placeholders)", () => {
      const notebook = projectAnalysisNotebook({
        displayName: "A $& {{description}}",
        dirName: "a",
        description: "costs $1 {{displayName}}",
      });
      expect(cellSource(notebook.cells[0].source)).toMatch(
        /^# A \$& \{\{description\}\} — analysis\n\ncosts \$1 \{\{displayName\}\}\n\n/,
      );
    });
  });
});

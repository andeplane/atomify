import { describe, it, expect } from "vitest";
import AnalyzeNotebook from "./AnalyzeNotebook";
import { Simulation } from "../store/simulation";

// Helper function to create mock simulation with defaults
const createMockSimulation = (overrides: Partial<Simulation> = {}): Simulation => ({
  id: "test-sim",
  inputScript: "",
  files: [],
  start: false,
  ...overrides,
});

describe("AnalyzeNotebook", () => {
  it("should generate notebook with simulation ID replaced", () => {
    // Arrange
    const simulation = createMockSimulation({
      id: "test-simulation-123",
      inputScript: "run 1000",
    });

    // Act
    const notebook = AnalyzeNotebook(simulation);

    // Assert
    expect(notebook.cells[1].source).toContain("test-simulation-123");
    expect(notebook.cells[1].source).not.toContain("###SIMULATIONID###");
  });

  it("should have correct notebook structure", () => {
    // Arrange
    const simulation = createMockSimulation({ id: "sim-001" });

    // Act
    const notebook = AnalyzeNotebook(simulation);

    // Assert
    expect(notebook.nbformat).toBe(4);
    expect(notebook.nbformat_minor).toBe(4);
    expect(notebook.metadata).toBeDefined();
    expect(notebook.metadata.language_info.name).toBe("python");
  });

  it("should have three cells by default (pip install, plot code, empty)", () => {
    // Arrange
    const simulation = createMockSimulation({ id: "sim-002" });

    // Act
    const notebook = AnalyzeNotebook(simulation);

    // Assert
    expect(notebook.cells).toHaveLength(3);
    expect(notebook.cells[0].cell_type).toBe("code");
    expect(notebook.cells[0].source).toContain("%pip install pandas");
    expect(notebook.cells[1].cell_type).toBe("code");
    expect(notebook.cells[1].source).toContain("lammps_logfile");
    expect(notebook.cells[2].cell_type).toBe("code");
    expect(notebook.cells[2].source).toBe("");
  });

  it("should add markdown cell when analysisDescription is provided", () => {
    // Arrange
    const simulation = createMockSimulation({
      id: "sim-003",
      analysisDescription: "# Analysis\nThis is a test analysis description",
    });

    // Act
    const notebook = AnalyzeNotebook(simulation);

    // Assert
    expect(notebook.cells).toHaveLength(4); // markdown + 3 default cells
    expect(notebook.cells[0].cell_type).toBe("markdown");
    expect(notebook.cells[0].source).toBe(
      "# Analysis\nThis is a test analysis description"
    );
  });

  it("should place markdown cell before pip install cell", () => {
    // Arrange
    const simulation = createMockSimulation({
      id: "sim-004",
      analysisDescription: "Test description",
    });

    // Act
    const notebook = AnalyzeNotebook(simulation);

    // Assert
    expect(notebook.cells[0].cell_type).toBe("markdown");
    expect(notebook.cells[1].source).toContain("%pip install");
  });

  it("should contain lammps_logfile import and plotting code", () => {
    // Arrange
    const simulation = createMockSimulation({ id: "sim-005" });

    // Act
    const notebook = AnalyzeNotebook(simulation);

    // Assert
    const plotCell = notebook.cells[1].source;
    expect(plotCell).toContain("import lammps_logfile");
    expect(plotCell).toContain("import matplotlib.pyplot as plt");
    expect(plotCell).toContain("log.lammps");
    expect(plotCell).toContain("plt.plot");
  });

  it("should have correct metadata for Python kernel", () => {
    // Arrange
    const simulation = createMockSimulation({ id: "sim-006" });

    // Act
    const notebook = AnalyzeNotebook(simulation);

    // Assert
    expect(notebook.metadata.kernelspec.name).toBe("python");
    expect(notebook.metadata.kernelspec.display_name).toBe("Python (Pyodide)");
    expect(notebook.metadata.kernelspec.language).toBe("python");
    expect(notebook.metadata.language_info.name).toBe("python");
    expect(notebook.metadata.language_info.version).toBe("3.12");
  });

  it("should handle special characters in simulation ID", () => {
    // Arrange
    const simulation = createMockSimulation({
      id: "sim-with-special-chars_123",
    });

    // Act
    const notebook = AnalyzeNotebook(simulation);

    // Assert
    expect(notebook.cells[1].source).toContain("sim-with-special-chars_123");
  });

  it("should not modify other cells when adding markdown", () => {
    // Arrange
    const simulation = createMockSimulation({
      id: "sim-007",
      analysisDescription: "Description",
    });

    // Act
    const notebook = AnalyzeNotebook(simulation);

    // Assert
    // The pip install cell should be at index 1 (after markdown)
    expect(notebook.cells[1].source).toContain("%pip install pandas");
    // The plot cell should be at index 2
    expect(notebook.cells[2].source).toContain("lammps_logfile");
    // Empty cell should be at index 3
    expect(notebook.cells[3].source).toBe("");
  });
});


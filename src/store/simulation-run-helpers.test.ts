import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  prepareVarsScript,
  collectRunMetrics,
  handleRunResult,
  type Simulation,
  type RunResultContext,
} from "./simulation";

// Mock localforage — the module-level config call in simulation.ts fails in jsdom
vi.mock("localforage", () => ({
  default: {
    config: vi.fn(),
    INDEXEDDB: "asyncStorage",
    setItem: vi.fn(),
    getItem: vi.fn(),
  },
}));

// Mock metrics — handleRunResult calls track()
vi.mock("../utils/metrics", () => ({
  track: vi.fn(),
  time_event: vi.fn(),
  getEmbeddingParams: vi.fn(() => ({})),
}));

import { track } from "../utils/metrics";

describe("prepareVarsScript", () => {
  let mockWriteFile: ReturnType<typeof vi.fn<(path: string, data: string) => void>>;
  let mockWasm: { FS: { writeFile: (path: string, data: string) => void } };

  beforeEach(() => {
    mockWriteFile = vi.fn<(path: string, data: string) => void>();
    mockWasm = { FS: { writeFile: mockWriteFile } };
  });

  it("returns the original inputScript when vars is undefined", () => {
    const sim: Pick<Simulation, "id" | "inputScript" | "vars"> = {
      id: "sim-1",
      inputScript: "in.lmp",
      vars: undefined,
    };

    const result = prepareVarsScript(sim, "some content", mockWasm);

    expect(result).toBe("in.lmp");
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("returns the original inputScript when vars is empty", () => {
    const sim: Pick<Simulation, "id" | "inputScript" | "vars"> = {
      id: "sim-1",
      inputScript: "in.lmp",
      vars: {},
    };

    const result = prepareVarsScript(sim, "some content", mockWasm);

    expect(result).toBe("in.lmp");
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("writes vars and wrapper files and returns wrapper filename", () => {
    const sim: Pick<Simulation, "id" | "inputScript" | "vars"> = {
      id: "sim-1",
      inputScript: "in.lmp",
      vars: { temp: 300, pressure: 1 },
    };
    const inputContent = "run 1000\n";

    const result = prepareVarsScript(sim, inputContent, mockWasm);

    expect(result).toBe("_wrapper_in.lmp");
    expect(mockWriteFile).toHaveBeenCalledTimes(2);

    // First call: vars file
    const [varsPath, varsContent] = mockWriteFile.mock.calls[0] as [string, string];
    expect(varsPath).toBe("/sim-1/_vars_in.lmp");
    expect(varsContent).toContain("variable temp equal 300");
    expect(varsContent).toContain("variable pressure equal 1");

    // Second call: wrapper file (vars + original content)
    const [wrapperPath, wrapperContent] = mockWriteFile.mock.calls[1] as [string, string];
    expect(wrapperPath).toBe("/sim-1/_wrapper_in.lmp");
    expect(wrapperContent).toContain("variable temp equal 300");
    expect(wrapperContent).toContain("run 1000\n");
  });

  it("generates correct LAMMPS variable syntax", () => {
    const sim: Pick<Simulation, "id" | "inputScript" | "vars"> = {
      id: "s1",
      inputScript: "in.lmp",
      vars: { x: 42 },
    };

    prepareVarsScript(sim, "", mockWasm);

    const varsContent = mockWriteFile.mock.calls[0][1] as string;
    expect(varsContent).toBe("variable x equal 42\n\n");
  });
});

describe("collectRunMetrics", () => {
  it("computes metrics from lammps state", () => {
    const mockLammps = {
      getTimesteps: vi.fn(() => 1000),
      getNumAtoms: vi.fn(() => 500),
    };

    const result = collectRunMetrics(mockLammps, 2.0, ["pe", "ke"]);

    expect(result).toEqual({
      timesteps: 1000,
      timestepsPerSecond: "500.000",
      numAtoms: 500,
      computes: ["pe", "ke"],
    });
  });

  it("handles zero duration gracefully", () => {
    const mockLammps = {
      getTimesteps: vi.fn(() => 100),
      getNumAtoms: vi.fn(() => 10),
    };

    const result = collectRunMetrics(mockLammps, 0, []);

    expect(result.timesteps).toBe(100);
    expect(result.timestepsPerSecond).toBe("0.000");
    expect(result.computes).toEqual([]);
  });
});

describe("handleRunResult", () => {
  let mockActions: RunResultContext["actions"];
  let mockAllActions: RunResultContext["allActions"];
  const metricsData = {
    timesteps: 100,
    timestepsPerSecond: "50.000",
    numAtoms: 10,
    computes: [] as string[],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockActions = {
      setRunning: vi.fn(),
      setShowConsole: vi.fn(),
      setLastError: vi.fn(),
    };
    mockAllActions = {
      processing: { runPostTimestep: vi.fn() },
    };
  });

  it('returns "completed" and calls runPostTimestep when no error', () => {
    const result = handleRunResult({
      errorMessage: undefined,
      simulationId: "sim-1",
      metricsData,
      actions: mockActions,
      allActions: mockAllActions,
    });

    expect(result).toBe("completed");
    expect(mockAllActions.processing.runPostTimestep).toHaveBeenCalledWith(true);
    expect(mockActions.setRunning).toHaveBeenCalledWith(false);
    expect(mockActions.setShowConsole).toHaveBeenCalledWith(true);
    expect(track).toHaveBeenCalledWith(
      "Simulation.Stop",
      expect.objectContaining({ stopReason: "completed" }),
    );
  });

  it('returns "canceled" when error includes Atomify::canceled', () => {
    const result = handleRunResult({
      errorMessage: "ERROR: Atomify::canceled by user",
      simulationId: "sim-1",
      metricsData,
      actions: mockActions,
      allActions: mockAllActions,
    });

    expect(result).toBe("canceled");
    expect(mockAllActions.processing.runPostTimestep).toHaveBeenCalledWith(true);
    expect(mockActions.setRunning).toHaveBeenCalledWith(false);
    expect(track).toHaveBeenCalledWith(
      "Simulation.Stop",
      expect.objectContaining({ stopReason: "canceled" }),
    );
  });

  it('returns "failed" and sets lastError for other errors', () => {
    const result = handleRunResult({
      errorMessage: "LAMMPS syntax error",
      simulationId: "sim-1",
      metricsData,
      actions: mockActions,
      allActions: mockAllActions,
    });

    expect(result).toBe("failed");
    expect(mockActions.setLastError).toHaveBeenCalledWith("LAMMPS syntax error");
    expect(mockAllActions.processing.runPostTimestep).not.toHaveBeenCalled();
    expect(mockActions.setRunning).toHaveBeenCalledWith(false);
    expect(track).toHaveBeenCalledWith(
      "Simulation.Stop",
      expect.objectContaining({
        stopReason: "failed",
        errorMessage: "LAMMPS syntax error",
      }),
    );
  });

  it('returns "completed" when errorMessage is empty string', () => {
    const result = handleRunResult({
      errorMessage: "",
      simulationId: "sim-1",
      metricsData,
      actions: mockActions,
      allActions: mockAllActions,
    });

    // Empty string is falsy, so this path goes to "completed"
    expect(result).toBe("completed");
    expect(mockAllActions.processing.runPostTimestep).toHaveBeenCalledWith(true);
  });
});

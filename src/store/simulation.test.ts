import { describe, it, expect, vi, beforeEach } from "vitest";
import { createStore, type Store } from "easy-peasy";

// Mock localforage — the module-level config call in simulation.ts fails in jsdom
vi.mock("localforage", () => ({
  default: {
    config: vi.fn(),
    INDEXEDDB: "asyncStorage",
    setItem: vi.fn(),
    getItem: vi.fn(),
  },
}));

// Mock metrics — simulation.ts imports track/time_event at module level
vi.mock("../utils/metrics", () => ({
  track: vi.fn(),
  time_event: vi.fn(),
  getEmbeddingParams: vi.fn(() => ({})),
}));

import {
  simulationModel,
  type SimulationModel,
  type Simulation,
} from "./simulation";

describe("simulation store — pure actions", () => {
  let store: Store<SimulationModel>;

  beforeEach(() => {
    store = createStore(simulationModel);
  });

  describe("addLammpsOutput", () => {
    it("appends output to lammpsOutput array", () => {
      store.getActions().addLammpsOutput("line 1");
      store.getActions().addLammpsOutput("line 2");

      expect(store.getState().lammpsOutput).toEqual(["line 1", "line 2"]);
    });

    it("caps the array at 2000 entries", () => {
      const actions = store.getActions();
      for (let i = 0; i < 2005; i++) {
        actions.addLammpsOutput(`line ${i}`);
      }

      const output = store.getState().lammpsOutput;
      expect(output).toHaveLength(2000);
      expect(output[0]).toBe("line 5");
      expect(output[1999]).toBe("line 2004");
    });

    it("keeps exactly 2000 when adding one beyond the cap", () => {
      // Pre-fill with 2000 entries
      const actions = store.getActions();
      for (let i = 0; i < 2000; i++) {
        actions.addLammpsOutput(`line ${i}`);
      }
      expect(store.getState().lammpsOutput).toHaveLength(2000);

      // Add one more — oldest should be dropped
      actions.addLammpsOutput("overflow");

      const output = store.getState().lammpsOutput;
      expect(output).toHaveLength(2000);
      expect(output[0]).toBe("line 1");
      expect(output[1999]).toBe("overflow");
    });
  });

  describe("resetLammpsOutput", () => {
    it("clears the lammpsOutput array", () => {
      store.getActions().addLammpsOutput("something");
      expect(store.getState().lammpsOutput).toHaveLength(1);

      store.getActions().resetLammpsOutput();

      expect(store.getState().lammpsOutput).toEqual([]);
    });

    it("is a no-op on an already empty array", () => {
      store.getActions().resetLammpsOutput();

      expect(store.getState().lammpsOutput).toEqual([]);
    });
  });

  describe("setRunning", () => {
    it("sets running to true", () => {
      store.getActions().setRunning(true);

      expect(store.getState().running).toBe(true);
    });

    it("sets running to false", () => {
      store.getActions().setRunning(true);
      store.getActions().setRunning(false);

      expect(store.getState().running).toBe(false);
    });
  });

  describe("setPaused", () => {
    it("sets paused to true", () => {
      store.getActions().setPaused(true);

      expect(store.getState().paused).toBe(true);
    });

    it("sets paused to false", () => {
      store.getActions().setPaused(true);
      store.getActions().setPaused(false);

      expect(store.getState().paused).toBe(false);
    });
  });

  describe("setShowConsole", () => {
    it("sets showConsole to true", () => {
      store.getActions().setShowConsole(true);

      expect(store.getState().showConsole).toBe(true);
    });

    it("sets showConsole to false", () => {
      store.getActions().setShowConsole(true);
      store.getActions().setShowConsole(false);

      expect(store.getState().showConsole).toBe(false);
    });
  });

  describe("setSimulation", () => {
    it("sets the simulation object", () => {
      const simulation = createMockSimulation();

      store.getActions().setSimulation(simulation);

      expect(store.getState().simulation).toEqual(simulation);
    });

    it("replaces a previously set simulation", () => {
      store.getActions().setSimulation(createMockSimulation({ id: "first" }));
      const second = createMockSimulation({ id: "second" });

      store.getActions().setSimulation(second);

      expect(store.getState().simulation?.id).toBe("second");
    });
  });

  describe("setFiles", () => {
    it("sets the files array", () => {
      store.getActions().setFiles(["file1.lmp", "file2.lmp"]);

      expect(store.getState().files).toEqual(["file1.lmp", "file2.lmp"]);
    });

    it("replaces previously set files", () => {
      store.getActions().setFiles(["old.lmp"]);
      store.getActions().setFiles(["new.lmp"]);

      expect(store.getState().files).toEqual(["new.lmp"]);
    });

    it("can set an empty array", () => {
      store.getActions().setFiles(["something"]);
      store.getActions().setFiles([]);

      expect(store.getState().files).toEqual([]);
    });
  });

  describe("reset", () => {
    it("clears files and lammps", () => {
      store.getActions().setFiles(["a.lmp", "b.lmp"]);

      store.getActions().reset(undefined);

      expect(store.getState().files).toEqual([]);
      expect(store.getState().lammps).toBeUndefined();
    });
  });

  describe("setLastError", () => {
    it("sets lastError", () => {
      store.getActions().setLastError("something broke");

      expect(store.getState().lastError).toBe("something broke");
    });

    it("clears lastError when set to undefined", () => {
      store.getActions().setLastError("err");
      store.getActions().setLastError(undefined);

      expect(store.getState().lastError).toBeUndefined();
    });
  });

  describe("setLastWarning", () => {
    it("sets lastWarning", () => {
      store.getActions().setLastWarning("heads up");

      expect(store.getState().lastWarning).toBe("heads up");
    });

    it("clears lastWarning when set to undefined", () => {
      store.getActions().setLastWarning("warn");
      store.getActions().setLastWarning(undefined);

      expect(store.getState().lastWarning).toBeUndefined();
    });
  });

  describe("initial state", () => {
    it("starts with correct defaults", () => {
      const state = store.getState();

      expect(state.running).toBe(false);
      expect(state.paused).toBe(false);
      expect(state.showConsole).toBe(false);
      expect(state.files).toEqual([]);
      expect(state.lammpsOutput).toEqual([]);
      expect(state.simulation).toBeUndefined();
      expect(state.lammps).toBeUndefined();
      expect(state.lastError).toBeUndefined();
      expect(state.lastWarning).toBeUndefined();
    });
  });
});

// Helper functions

function createMockSimulation(
  overrides?: Partial<Simulation>,
): Simulation {
  return {
    id: "test-sim",
    files: [{ fileName: "in.lmp", content: "run 100" }],
    inputScript: "in.lmp",
    start: true,
    ...overrides,
  };
}

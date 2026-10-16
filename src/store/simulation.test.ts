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
}));

import { simulationModel, type SimulationModel } from "./simulation";
import type { LammpsWeb } from "../types";

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
    it("forwards to the engine proxy, which owns run control", () => {
      const setPaused = vi.fn();
      store.getActions().setLammps({ setPaused } as unknown as LammpsWeb);

      store.getActions().setPaused(true);
      store.getActions().setPaused(false);

      expect(setPaused.mock.calls).toEqual([[true], [false]]);
    });

    it("is a no-op before the engine has loaded", () => {
      expect(() => store.getActions().setPaused(true)).not.toThrow();
    });
  });

  describe("setLoadedWorkdir", () => {
    it("records the engine workdir of the loaded run", () => {
      store.getActions().setLoadedWorkdir("proj/runs/run-001");

      expect(store.getState().loadedWorkdir).toBe("proj/runs/run-001");
    });

    it("replaces a previously loaded run", () => {
      store.getActions().setLoadedWorkdir("proj/runs/run-001");
      store.getActions().setLoadedWorkdir("proj/runs/run-002");

      expect(store.getState().loadedWorkdir).toBe("proj/runs/run-002");
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
      expect(state.lammpsOutput).toEqual([]);
      expect(state.loadedWorkdir).toBeUndefined();
      expect(state.lammps).toBeUndefined();
      expect(state.lastError).toBeUndefined();
      expect(state.lastWarning).toBeUndefined();
    });
  });
});

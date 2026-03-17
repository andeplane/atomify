import { describe, it, expect, beforeEach, vi } from "vitest";
import { createStore, type Store } from "easy-peasy";
import {
  simulationStatusModel,
  type SimulationStatusModel,
} from "./simulationstatus";
import * as THREE from "three";
import type { Compute, Fix, Variable, Wall } from "../types";
import { ModifierType } from "../types";

describe("simulationStatus store", () => {
  let store: Store<SimulationStatusModel>;

  beforeEach(() => {
    store = createStore(simulationStatusModel);
  });

  describe("initial state", () => {
    it("should have correct defaults", () => {
      const state = store.getState();
      expect(state.timesteps).toBe(0);
      expect(state.memoryUsage).toBe(0);
      expect(state.runTimesteps).toBe(0);
      expect(state.runTotalTimesteps).toBe(0);
      expect(state.remainingTime).toBe(0);
      expect(state.timestepsPerSecond).toBe(0);
      expect(state.hasSynchronized).toBe(false);
      expect(state.runType).toBe("");
      expect(state.numAtoms).toBe(0);
      expect(state.numBonds).toBe(0);
      expect(state.computes).toEqual({});
      expect(state.fixes).toEqual({});
      expect(state.variables).toEqual({});
      expect(state.dimension).toBe(3);
      expect(state.walls).toEqual([]);
    });
  });

  describe.each([
    ["setTimesteps", "timesteps", 42] as const,
    ["setMemoryUsage", "memoryUsage", 1024] as const,
    ["setRunTimesteps", "runTimesteps", 500] as const,
    ["setRunTotalTimesteps", "runTotalTimesteps", 1000] as const,
    ["setRemainingTime", "remainingTime", 3.14] as const,
    ["setTimestepsPerSecond", "timestepsPerSecond", 99.9] as const,
    ["setNumAtoms", "numAtoms", 256] as const,
    ["setNumBonds", "numBonds", 128] as const,
    ["setDimension", "dimension", 2] as const,
  ])("%s", (actionName, stateKey, value) => {
    it(`should set ${stateKey} to ${value}`, () => {
      store.getActions()[actionName](value);

      expect(store.getState()[stateKey]).toBe(value);
    });
  });

  describe("setHasSynchronized", () => {
    it("should set hasSynchronized to true", () => {
      store.getActions().setHasSynchronized(true);

      expect(store.getState().hasSynchronized).toBe(true);
    });
  });

  describe("setRunType", () => {
    it("should set runType", () => {
      store.getActions().setRunType("Dynamics");

      expect(store.getState().runType).toBe("Dynamics");
    });
  });

  describe("setLastCommand", () => {
    it("should set lastCommand", () => {
      store.getActions().setLastCommand("run 1000");

      expect(store.getState().lastCommand).toBe("run 1000");
    });

    it("should allow clearing with undefined", () => {
      store.getActions().setLastCommand("run 1000");
      store.getActions().setLastCommand(undefined);

      expect(store.getState().lastCommand).toBeUndefined();
    });
  });

  describe("setBox", () => {
    it("should set box to a Matrix3", () => {
      const box = new THREE.Matrix3().set(1, 0, 0, 0, 1, 0, 0, 0, 1);

      store.getActions().setBox(box);

      expect(store.getState().box).toBe(box);
    });
  });

  describe("setOrigo", () => {
    it("should set origo to a Vector3", () => {
      const origo = new THREE.Vector3(1, 2, 3);

      store.getActions().setOrigo(origo);

      expect(store.getState().origo).toBe(origo);
    });
  });

  describe("setWalls", () => {
    it("should set walls array", () => {
      const walls: Wall[] = [
        { which: 0, style: 1, position: 0.5, cutoff: 1.0 },
        { which: 1, style: 2, position: 1.0, cutoff: 0.5 },
      ];

      store.getActions().setWalls(walls);

      expect(store.getState().walls).toEqual(walls);
    });
  });

  describe("setComputes / setFixes / setVariables", () => {
    it("should set computes map", () => {
      const computes = { temp: createMockCompute("temp") };

      store.getActions().setComputes(computes);

      expect(store.getState().computes).toEqual(computes);
    });

    it("should set fixes map", () => {
      const fixes = { nve: createMockFix("nve") };

      store.getActions().setFixes(fixes);

      expect(store.getState().fixes).toEqual(fixes);
    });

    it("should set variables map", () => {
      const variables = { myVar: createMockVariable("myVar") };

      store.getActions().setVariables(variables);

      expect(store.getState().variables).toEqual(variables);
    });
  });

  describe("setModifierSyncDataPoints", () => {
    it("should update syncDataPoints on an existing compute", () => {
      const computes = { temp: createMockCompute("temp") };
      store.getActions().setComputes(computes);

      store
        .getActions()
        .setModifierSyncDataPoints({ name: "temp", type: "compute", value: true });

      expect(store.getState().computes["temp"].syncDataPoints).toBe(true);
    });

    it("should update syncDataPoints on an existing fix", () => {
      const fixes = { nve: createMockFix("nve") };
      store.getActions().setFixes(fixes);

      store
        .getActions()
        .setModifierSyncDataPoints({ name: "nve", type: "fix", value: true });

      expect(store.getState().fixes["nve"].syncDataPoints).toBe(true);
    });

    it("should update syncDataPoints on an existing variable", () => {
      const variables = { myVar: createMockVariable("myVar") };
      store.getActions().setVariables(variables);

      store
        .getActions()
        .setModifierSyncDataPoints({ name: "myVar", type: "variable", value: true });

      expect(store.getState().variables["myVar"].syncDataPoints).toBe(true);
    });

    it("should be a no-op when the named compute does not exist", () => {
      store
        .getActions()
        .setModifierSyncDataPoints({ name: "missing", type: "compute", value: true });

      expect(store.getState().computes).toEqual({});
    });

    it("should be a no-op when the named fix does not exist", () => {
      store
        .getActions()
        .setModifierSyncDataPoints({ name: "missing", type: "fix", value: true });

      expect(store.getState().fixes).toEqual({});
    });

    it("should be a no-op when the named variable does not exist", () => {
      store
        .getActions()
        .setModifierSyncDataPoints({ name: "missing", type: "variable", value: true });

      expect(store.getState().variables).toEqual({});
    });
  });

  describe("reset", () => {
    it("should revert all fields to defaults", () => {
      // Arrange — mutate every field
      const actions = store.getActions();
      actions.setTimesteps(100);
      actions.setMemoryUsage(2048);
      actions.setRunTimesteps(50);
      actions.setRunTotalTimesteps(200);
      actions.setRemainingTime(10);
      actions.setTimestepsPerSecond(500);
      actions.setHasSynchronized(true);
      actions.setRunType("Dynamics");
      actions.setNumAtoms(1000);
      actions.setNumBonds(500);
      actions.setComputes({ c: createMockCompute("c") });
      actions.setFixes({ f: createMockFix("f") });
      actions.setVariables({ v: createMockVariable("v") });
      actions.setBox(new THREE.Matrix3());
      actions.setOrigo(new THREE.Vector3(1, 2, 3));
      actions.setDimension(2);
      actions.setWalls([{ which: 0, style: 1, position: 0, cutoff: 1 }]);
      actions.setLastCommand("run 100");

      // Act
      actions.reset();

      // Assert
      const state = store.getState();
      expect(state.hasSynchronized).toBe(false);
      expect(state.lastCommand).toBeUndefined();
      expect(state.timesteps).toBe(0);
      expect(state.memoryUsage).toBe(0);
      expect(state.runTimesteps).toBe(0);
      expect(state.runTotalTimesteps).toBe(0);
      expect(state.remainingTime).toBe(0);
      expect(state.timestepsPerSecond).toBe(0);
      expect(state.runType).toBe("");
      expect(state.numAtoms).toBe(0);
      expect(state.numBonds).toBe(0);
      expect(state.computes).toEqual({});
      expect(state.fixes).toEqual({});
      expect(state.variables).toEqual({});
      expect(state.box).toBeUndefined();
      expect(state.origo).toBeUndefined();
      expect(state.dimension).toBe(3);
      expect(state.walls).toEqual([]);
    });
  });
});

// Helper functions

function createMockLMPModifier(): Partial<import("../types").LMPModifier> {
  return {
    getName: vi.fn(() => "mock"),
    getType: vi.fn(() => ModifierType.ComputeOther),
    getPerAtomData: vi.fn(() => 0),
    getIsPerAtom: vi.fn(() => false),
    hasScalarData: vi.fn(() => false),
    getClearPerSync: vi.fn(() => false),
    getScalarValue: vi.fn(() => 0),
    sync: vi.fn(),
    getXLabel: vi.fn(() => ""),
    getYLabel: vi.fn(() => ""),
    delete: vi.fn(),
  };
}

function createMockCompute(name: string): Compute {
  return {
    name,
    type: ModifierType.ComputeOther,
    isPerAtom: false,
    hasScalarData: false,
    scalarValue: 0,
    xLabel: "",
    yLabel: "",
    clearPerSync: false,
    syncDataPoints: false,
    hasData1D: false,
    lmpCompute: createMockLMPModifier() as import("../types").LMPModifier,
  };
}

function createMockFix(name: string): Fix {
  return {
    name,
    type: ModifierType.FixOther,
    isPerAtom: false,
    hasScalarData: false,
    scalarValue: 0,
    xLabel: "",
    yLabel: "",
    clearPerSync: false,
    syncDataPoints: false,
    hasData1D: false,
    lmpFix: createMockLMPModifier() as import("../types").LMPModifier,
  };
}

function createMockVariable(name: string): Variable {
  return {
    name,
    type: ModifierType.VariableOther,
    isPerAtom: false,
    hasScalarData: false,
    scalarValue: 0,
    xLabel: "",
    yLabel: "",
    clearPerSync: false,
    syncDataPoints: false,
    hasData1D: false,
    lmpVariable: createMockLMPModifier() as import("../types").LMPModifier,
  };
}

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createStore, type Store } from "easy-peasy";

// Mock metrics — render.ts imports track at module level
vi.mock("../utils/metrics", () => ({
  track: vi.fn(),
  time_event: vi.fn(),
}));

import { renderModel, type RenderModel } from "./render";
import { track } from "../utils/metrics";
import type { AtomType } from "../utils/atomtypes";

describe("render store", () => {
  let store: Store<RenderModel>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createStore(renderModel);
  });

  describe("initial state", () => {
    it("has correct defaults", () => {
      const state = store.getState();
      expect(state.particleStyles).toEqual([]);
      expect(state.particleStylesUpdated).toBe(true);
      expect(state.bondRadius).toBe(1);
      expect(state.particleRadius).toBe(1);
      expect(state.panMode).toBe(false);
    });
  });

  describe("setPanMode", () => {
    it("switches left-drag between rotate and pan", () => {
      store.getActions().setPanMode(true);
      expect(store.getState().panMode).toBe(true);
      store.getActions().setPanMode(false);
      expect(store.getState().panMode).toBe(false);
    });
  });

  describe("addParticleStyle", () => {
    it("inserts an AtomType at the specified index", () => {
      const atomType = createMockAtomType({ shortname: "He" });

      store.getActions().addParticleStyle({ index: 0, atomType });

      const styles = store.getState().particleStyles;
      expect(styles[0]).toEqual(atomType);
    });

    it("sets particleStylesUpdated to true", () => {
      // Arrange: clear the flag first
      store.getActions().setParticleStylesUpdated(false);
      expect(store.getState().particleStylesUpdated).toBe(false);

      // Act
      const atomType = createMockAtomType();
      store.getActions().addParticleStyle({ index: 0, atomType });

      // Assert
      expect(store.getState().particleStylesUpdated).toBe(true);
    });

    it("inserts at non-contiguous indices", () => {
      const atomA = createMockAtomType({ shortname: "H" });
      const atomB = createMockAtomType({ shortname: "O" });

      store.getActions().addParticleStyle({ index: 0, atomType: atomA });
      store.getActions().addParticleStyle({ index: 5, atomType: atomB });

      const styles = store.getState().particleStyles;
      expect(styles[0]).toEqual(atomA);
      expect(styles[5]).toEqual(atomB);
    });

    it("overwrites an existing index", () => {
      const atomA = createMockAtomType({ shortname: "H" });
      const atomB = createMockAtomType({ shortname: "O" });

      store.getActions().addParticleStyle({ index: 0, atomType: atomA });
      store.getActions().addParticleStyle({ index: 0, atomType: atomB });

      expect(store.getState().particleStyles[0]).toEqual(atomB);
    });

    it("keeps particleStyles a true array", () => {
      const atomType = createMockAtomType();
      store.getActions().addParticleStyle({ index: 0, atomType });

      const styles = store.getState().particleStyles;
      expect(Array.isArray(styles)).toBe(true);
    });
  });

  describe("resetParticleStyles", () => {
    it("clears particleStyles to an empty array", () => {
      // Arrange: add a style
      store.getActions().addParticleStyle({
        index: 0,
        atomType: createMockAtomType(),
      });

      // Act
      store.getActions().resetParticleStyles();

      // Assert
      const styles = store.getState().particleStyles;
      expect(Array.isArray(styles)).toBe(true);
      expect(styles).toEqual([]);
    });

    it("sets particleStylesUpdated to true", () => {
      store.getActions().setParticleStylesUpdated(false);

      store.getActions().resetParticleStyles();

      expect(store.getState().particleStylesUpdated).toBe(true);
    });
  });

  describe.each([
    {
      actionName: "setBondRadius" as const,
      stateKey: "bondRadius" as const,
      trackEvent: "Settings.Render.BondRadius",
      value: 2.5,
    },
    {
      actionName: "setParticleRadius" as const,
      stateKey: "particleRadius" as const,
      trackEvent: "Settings.Render.ParticleRadius",
      value: 3.0,
    },
  ])("$actionName", ({ actionName, stateKey, trackEvent, value }) => {
    it("stores the value", () => {
      store.getActions()[actionName](value);
      expect(store.getState()[stateKey]).toBe(value);
    });

    it("calls track() with correct event", () => {
      store.getActions()[actionName](value);
      expect(track).toHaveBeenCalledWith(trackEvent, { value });
    });
  });

  describe("setParticleStylesUpdated", () => {
    it.each([true, false])("sets particleStylesUpdated to %s", (value) => {
      store.getActions().setParticleStylesUpdated(value);
      expect(store.getState().particleStylesUpdated).toBe(value);
    });
  });
});

// Helper functions
function createMockAtomType(overrides?: Partial<AtomType>): AtomType {
  return {
    shortname: "H",
    fullname: "hydrogen",
    radius: 1.2,
    color: { r: 204, g: 204, b: 204 },
    ...overrides,
  } as AtomType;
}

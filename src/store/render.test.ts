import { describe, it, expect, vi, beforeEach } from "vitest";
import { createStore, type Store } from "easy-peasy";

// Mock metrics — render.ts imports track at module level
vi.mock("../utils/metrics", () => ({
  track: vi.fn(),
  time_event: vi.fn(),
  getEmbeddingParams: vi.fn(() => ({})),
}));

import { renderModel, type RenderModel } from "./render";
import { track } from "../utils/metrics";
import type { AtomType } from "../utils/atomtypes";
import type { Visualizer, Particles, Bonds } from "omovi";

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
      expect(state.visualizer).toBeUndefined();
      expect(state.particles).toBeUndefined();
      expect(state.bonds).toBeUndefined();
    });
  });

  describe("addParticleStyle", () => {
    it("inserts an AtomType at the specified index", () => {
      const atomType = createMockAtomType({ shortname: "He" });

      store.getActions().addParticleStyle({ index: 0, atomType });

      // NOTE: addParticleStyle spreads the array into an object via { ...state.particleStyles },
      // so the result is an object with numeric keys, not a true array.
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

    it("spreads AtomType[] into an object (type confusion)", () => {
      // This documents the existing bug: { ...array } produces an object, not an array.
      const atomType = createMockAtomType();
      store.getActions().addParticleStyle({ index: 0, atomType });

      const styles = store.getState().particleStyles;
      // After the spread, Array.isArray returns false because it's now a plain object
      expect(Array.isArray(styles)).toBe(false);
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

    it("zeroes particle count and marks needs update when particles exist", () => {
      const mockParticles: Partial<Particles> = {
        count: 100,
        markNeedsUpdate: vi.fn(),
      };
      store.getActions().setParticles(mockParticles as Particles);

      store.getActions().resetParticleStyles();

      const particles = store.getState().particles;
      expect(particles!.count).toBe(0);
      expect(mockParticles.markNeedsUpdate).toHaveBeenCalled();
    });

    it("zeroes bond count and marks needs update when bonds exist", () => {
      const mockBonds: Partial<Bonds> = {
        count: 50,
        markNeedsUpdate: vi.fn(),
      };
      store.getActions().setBonds(mockBonds as Bonds);

      store.getActions().resetParticleStyles();

      const bonds = store.getState().bonds;
      expect(bonds!.count).toBe(0);
      expect(mockBonds.markNeedsUpdate).toHaveBeenCalled();
    });

    it("handles missing particles and bonds gracefully", () => {
      // No particles or bonds set — should not throw
      expect(() => store.getActions().resetParticleStyles()).not.toThrow();
    });
  });

  describe("setVisualizer", () => {
    it("stores the visualizer", () => {
      const mockVisualizer: Partial<Visualizer> = { dispose: vi.fn() };

      store.getActions().setVisualizer(mockVisualizer as Visualizer);

      expect(store.getState().visualizer).toBe(mockVisualizer);
    });

    it("sets particleStylesUpdated to true", () => {
      store.getActions().setParticleStylesUpdated(false);
      const mockVisualizer: Partial<Visualizer> = { dispose: vi.fn() };

      store.getActions().setVisualizer(mockVisualizer as Visualizer);

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

  describe("setParticles", () => {
    it("stores the particles reference", () => {
      const mockParticles: Partial<Particles> = { count: 42 };
      store.getActions().setParticles(mockParticles as Particles);
      expect(store.getState().particles).toBe(mockParticles);
    });
  });

  describe("setBonds", () => {
    it("stores the bonds reference", () => {
      const mockBonds: Partial<Bonds> = { count: 10 };
      store.getActions().setBonds(mockBonds as Bonds);
      expect(store.getState().bonds).toBe(mockBonds);
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

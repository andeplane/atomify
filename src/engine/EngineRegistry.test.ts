import { describe, it, expect, vi } from "vitest";
import type { Bonds, Particles, Visualizer } from "omovi";
import { EngineRegistry, createDefaultModifiers } from "./EngineRegistry";
import ColorModifier from "../modifiers/colormodifier";
import type { LammpsWeb } from "../types";

describe("EngineRegistry", () => {
  it("starts empty with the default modifier pipeline", () => {
    const engine = new EngineRegistry();

    expect(engine.getSnapshot()).toEqual({});
    expect(engine.modifiers.map((modifier) => modifier.name)).toEqual([
      "Particles",
      "Bonds",
      "Colors",
      "Computes",
      "Fixes",
      "Variables",
    ]);
    expect(engine.colorModifier).toBe(engine.modifiers[2]);
    expect(engine.colorModifier).toBeInstanceOf(ColorModifier);
  });

  it("gives every registry its own modifier instances", () => {
    expect(new EngineRegistry().modifiers[0]).not.toBe(
      new EngineRegistry().modifiers[0],
    );
    expect(createDefaultModifiers()[2]).not.toBe(createDefaultModifiers()[2]);
  });

  it("has no color modifier when built without one", () => {
    expect(new EngineRegistry([]).colorModifier).toBeUndefined();
  });

  it("stores each object by reference", () => {
    const engine = new EngineRegistry([]);
    const lammps = {} as LammpsWeb;
    const visualizer = {} as Visualizer;
    const particles = { count: 42 } as Particles;
    const bonds = { count: 10 } as Bonds;

    engine.setLammps(lammps);
    engine.setVisualizer(visualizer);
    engine.setParticles(particles);
    engine.setBonds(bonds);

    expect(engine.lammps).toBe(lammps);
    expect(engine.visualizer).toBe(visualizer);
    expect(engine.particles).toBe(particles);
    expect(engine.bonds).toBe(bonds);
    expect(engine.getSnapshot()).toEqual({
      lammps,
      visualizer,
      particles,
      bonds,
    });
  });

  it("replaces the snapshot and notifies on a change, and only then", () => {
    const engine = new EngineRegistry([]);
    const listener = vi.fn();
    engine.subscribe(listener);
    const before = engine.getSnapshot();
    const visualizer = {} as Visualizer;

    engine.setVisualizer(visualizer);
    const after = engine.getSnapshot();
    expect(after).not.toBe(before);
    expect(before).toEqual({});
    expect(listener).toHaveBeenCalledTimes(1);

    // Setting the same object again is not a change.
    engine.setVisualizer(visualizer);
    expect(engine.getSnapshot()).toBe(after);
    expect(listener).toHaveBeenCalledTimes(1);

    // Releasing it is.
    engine.setVisualizer(undefined);
    expect(engine.visualizer).toBeUndefined();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("stops notifying an unsubscribed listener", () => {
    const engine = new EngineRegistry([]);
    const listener = vi.fn();
    const unsubscribe = engine.subscribe(listener);

    unsubscribe();
    engine.setLammps({} as LammpsWeb);

    expect(listener).not.toHaveBeenCalled();
  });

  describe("clearGeometry", () => {
    it("zeroes the particle and bond counts and marks both for update", () => {
      const engine = new EngineRegistry([]);
      const particles = { count: 100, markNeedsUpdate: vi.fn() };
      const bonds = { count: 50, markNeedsUpdate: vi.fn() };
      engine.setParticles(particles as unknown as Particles);
      engine.setBonds(bonds as unknown as Bonds);
      const listener = vi.fn();
      engine.subscribe(listener);

      engine.clearGeometry();

      expect(particles.count).toBe(0);
      expect(particles.markNeedsUpdate).toHaveBeenCalled();
      expect(bonds.count).toBe(0);
      expect(bonds.markNeedsUpdate).toHaveBeenCalled();
      // Same objects, refilled by the next frames: not a replacement.
      expect(engine.particles).toBe(particles);
      expect(listener).not.toHaveBeenCalled();
    });

    it("handles missing particles and bonds", () => {
      expect(() => new EngineRegistry([]).clearGeometry()).not.toThrow();
    });
  });
});

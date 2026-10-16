import { describe, expect, it, vi } from "vitest";
import SyncParticlesModifier from "./syncparticlesmodifier";
import type { ModifierInput, ModifierOutput } from "./types";
import { emptyEngineFrame } from "../wasm/engineFrame";

vi.mock("omovi", () => ({
  Particles: class {
    capacity: number;
    count = 0;
    positions: Float32Array;
    types: Float32Array;
    indices: Float32Array;
    constructor(count: number) {
      this.capacity = count;
      this.positions = new Float32Array(3 * count);
      this.types = new Float32Array(count);
      this.indices = new Float32Array(count);
    }
    dispose() {}
    markNeedsUpdate() {}
  },
}));

describe("persistent LAMMPS atom tags", () => {
  it("keeps sparse tags paired with positions and types after engine reordering", () => {
    const input = { lammps: {} } as unknown as ModifierInput;
    const output = {} as ModifierOutput;
    const modifier = new SyncParticlesModifier({
      name: "Particles",
      active: true,
    });
    const sync = (atoms: { id: number; type: number; x: number }[]) => {
      // Each streamed step is a fresh frame, like the worker sends.
      input.frame = {
        ...emptyEngineFrame(),
        count: atoms.length,
        positions: new Float32Array(atoms.flatMap((a) => [a.x, 0, 0])),
        types: new Int32Array(atoms.map((a) => a.type)),
        ids: new Int32Array(atoms.map((a) => a.id)),
      };
      modifier.run(input, output);
      return Array.from(output.particles!.indices).map((id, index) => ({
        id,
        type: output.particles!.types[index],
        x: output.particles!.positions[3 * index],
      }));
    };
    const initial = [
      { id: 42, type: 2, x: 1 },
      { id: 7, type: 1, x: 3 },
      { id: 99, type: 3, x: 2 },
    ];
    expect(sync(initial)).toEqual(initial);
    const reordered = [
      { ...initial[2], x: 2.5 },
      { ...initial[0], x: 1.5 },
      { ...initial[1], x: 3.5 },
    ];
    expect(sync(reordered)).toEqual(reordered);
    expect(Array.from(output.particles!.indices)).not.toEqual([0, 1, 2]);
  });
});

describe("periodic images", () => {
  it("appends shifted copies that keep each atom's tag and type", () => {
    // Arrange: two atoms in a triclinic cell (rows a, b, c).
    const input = {
      lammps: {},
      frame: {
        ...emptyEngineFrame(),
        count: 2,
        positions: new Float32Array([1, 2, 3, 4, 5, 6]),
        types: new Int32Array([1, 2]),
        ids: new Int32Array([42, 7]),
        boxMatrix: new Float32Array([10, 0, 0, 2, 20, 0, 3, 4, 30]),
      },
    } as unknown as ModifierInput;
    const output = {} as ModifierOutput;
    const modifier = new SyncParticlesModifier({
      name: "Particles",
      active: true,
    });
    modifier.periodicImages = [1, 2, 1];

    // Act
    modifier.run(input, output);

    // Assert
    const particles = output.particles!;
    expect(particles.count).toBe(4);
    expect(Array.from(particles.indices.subarray(0, 4))).toEqual([
      42, 7, 42, 7,
    ]);
    expect(Array.from(particles.types.subarray(0, 4))).toEqual([1, 2, 1, 2]);
    expect(Array.from(particles.positions.subarray(6, 12))).toEqual([
      3, 22, 3, 6, 25, 6,
    ]);
    expect(output.imageShifts).toEqual([0, 0, 0, 2, 20, 0]);

    // Back to 1×1×1 renders only the real atoms again.
    modifier.periodicImages = [1, 1, 1];
    modifier.run(input, output);
    expect(output.particles!.count).toBe(2);
    expect(output.imageShifts).toEqual([0, 0, 0]);
  });
});

import { describe, expect, it, vi } from "vitest";
import SyncParticlesModifier from "./syncparticlesmodifier";
import type { ModifierInput, ModifierOutput } from "./types";

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
    const heap = new ArrayBuffer(256);
    const floats = new Float32Array(heap);
    const ints = new Int32Array(heap);
    const input = {
      wasm: { HEAPF32: floats, HEAP32: ints },
      lammps: {
        computeParticles: () => 3,
        getPositionsPointer: () => 0,
        getTypePointer: () => 64,
        getIdPointer: () => 96,
      },
    } as unknown as ModifierInput;
    const output = {} as ModifierOutput;
    const modifier = new SyncParticlesModifier({
      name: "Particles",
      active: true,
    });
    const sync = (atoms: { id: number; type: number; x: number }[]) => {
      floats.set(atoms.flatMap((a) => [a.x, 0, 0]));
      ints.set(
        atoms.map((a) => a.type),
        64 / 4,
      );
      ints.set(
        atoms.map((a) => a.id),
        96 / 4,
      );
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

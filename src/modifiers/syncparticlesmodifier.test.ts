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

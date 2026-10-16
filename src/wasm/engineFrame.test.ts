import { describe, expect, it } from "vitest";
import {
  emptyEngineFrame,
  frameTransferables,
  perAtomValues,
  type EngineFrame,
} from "./engineFrame";
import { ModifierType } from "../types";

const frameWith = (overrides: Partial<EngineFrame>): EngineFrame => ({
  ...emptyEngineFrame(),
  ...overrides,
});

describe("frameTransferables", () => {
  it("lists every array buffer of the frame exactly once", () => {
    const x = new Float32Array([1, 2]);
    const frame = frameWith({
      count: 1,
      positions: new Float32Array(3),
      types: new Int32Array(1),
      ids: new Int32Array(1),
      radii: new Float32Array(1),
      perAtom: { category: "compute", name: "ke", values: new Float64Array(1) },
      modifiers: [
        {
          name: "msd",
          category: "compute",
          type: ModifierType.ComputeMSD,
          style: "msd",
          isPerAtom: false,
          hasScalar: true,
          clearPerSync: false,
          xLabel: "Time",
          yLabel: "MSD",
          scalar: 0,
          // Two series sharing one x buffer must not list it twice.
          series: [
            { name: "a", label: "a", x, y: new Float32Array(2) },
            { name: "b", label: "b", x, y: new Float32Array(2) },
          ],
        },
      ],
    });

    const buffers = frameTransferables(frame);

    // positions, types, ids, bondFirst, bondSecond, boxMatrix, origin,
    // group masks, radii, per-atom values, shared x, two y's.
    expect(buffers).toHaveLength(13);
    expect(new Set(buffers).size).toBe(buffers.length);
    expect(buffers).toContain(frame.positions.buffer);
    expect(buffers).toContain(frame.perAtom!.values.buffer);
    expect(buffers).toContain(x.buffer);
  });
});

describe("perAtomValues", () => {
  it("derives 0/1 group membership from the frame's bitsets", () => {
    const frame = frameWith({
      count: 3,
      groups: {
        names: ["Group: all", "Group: wall"],
        masks: new Uint32Array([0b01, 0b11, 0b01]),
      },
    });
    expect(Array.from(perAtomValues(frame, "Group: all"))).toEqual([1, 1, 1]);
    expect(Array.from(perAtomValues(frame, "Group: wall"))).toEqual([0, 1, 0]);
  });

  it("returns the streamed values only for the compute they belong to", () => {
    const values = new Float64Array([0.1, 0.2]);
    const frame = frameWith({
      count: 2,
      perAtom: { category: "compute", name: "ke", values },
    });
    expect(perAtomValues(frame, "ke")).toBe(values);
    expect(perAtomValues(frame, "pe")).toHaveLength(0);
    expect(perAtomValues(emptyEngineFrame(), "ke")).toHaveLength(0);
  });
});

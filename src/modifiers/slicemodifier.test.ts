import { describe, expect, it, vi } from "vitest";
import type { Bonds, Particles } from "omovi";
import SliceModifier, {
  computeSlabMask,
  isInSlab,
  sliceNormal,
  type Slab,
} from "./slicemodifier";
import type { ModifierInput, ModifierOutput } from "./types";

// The modifier hands its mask to the instance-style adapter, which needs a
// real omovi visualizer; record the calls instead.
vi.mock(import("../rendering/particleAttributes"), () => ({
  setHiddenParticles: vi.fn(),
}));
import { setHiddenParticles } from "../rendering/particleAttributes";

describe("sliceNormal", () => {
  it("returns unit axes and normalizes custom vectors", () => {
    expect(sliceNormal("y", [5, 5, 5])).toEqual([0, 1, 0]);
    const [x, y, z] = sliceNormal("custom", [3, 0, 4])!;
    expect([x, y, z]).toEqual([0.6, 0, 0.8]);
  });

  it("rejects a zero custom vector", () => {
    expect(sliceNormal("custom", [0, 0, 0])).toBeUndefined();
  });
});

describe("isInSlab", () => {
  const slab: Slab = {
    normal: [0, 0, 1],
    position: 10,
    width: 4,
    invert: false,
  };

  it("keeps points within half the width of the slab center", () => {
    expect(isInSlab(100, -3, 10, slab)).toBe(true);
    expect(isInSlab(0, 0, 8, slab)).toBe(true);
    expect(isInSlab(0, 0, 12, slab)).toBe(true);
    expect(isInSlab(0, 0, 12.01, slab)).toBe(false);
    expect(isInSlab(0, 0, 7.99, slab)).toBe(false);
  });

  it("swaps inside and outside when inverted", () => {
    const inverted = { ...slab, invert: true };
    expect(isInSlab(0, 0, 10, inverted)).toBe(false);
    expect(isInSlab(0, 0, 20, inverted)).toBe(true);
  });

  it("measures along a tilted normal", () => {
    const diagonal: Slab = {
      normal: sliceNormal("custom", [1, 1, 0])!,
      position: Math.SQRT2,
      width: 0.1,
      invert: false,
    };
    expect(isInSlab(1, 1, 50, diagonal)).toBe(true);
    expect(isInSlab(2, 0, 0, diagonal)).toBe(true);
    expect(isInSlab(1, 0, 0, diagonal)).toBe(false);
  });
});

describe("computeSlabMask", () => {
  it("flags the points outside the slab and counts them", () => {
    // Arrange
    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 2, 0, 0, 3, 0, 0]);
    const hidden = new Uint8Array(5).fill(7);
    const slab: Slab = {
      normal: [1, 0, 0],
      position: 1.5,
      width: 1,
      invert: false,
    };

    // Act
    const numHidden = computeSlabMask(positions, 4, slab, hidden);

    // Assert
    expect(numHidden).toBe(2);
    expect(Array.from(hidden)).toEqual([1, 0, 0, 1, 7]);
  });
});

describe("SliceModifier", () => {
  it("hides atoms outside the slab and bonds with a hidden end", () => {
    // Arrange
    const { modifier, input, output } = setup();
    Object.assign(modifier, { active: true, axis: "x", position: 1, width: 1 });

    // Act
    modifier.run(input, output);

    // Assert
    const mask = vi.mocked(setHiddenParticles).mock.calls.at(-1)![2]!;
    expect(Array.from(mask.subarray(0, 3))).toEqual([1, 0, 1]);
    expect(Array.from(output.bonds!.radii)).toEqual([0, 0.5, 0]);
  });

  it("does nothing while off, and restores everything once when switched off", () => {
    // Arrange
    const { modifier, input, output } = setup();
    modifier.run(input, output);
    expect(setHiddenParticles).not.toHaveBeenCalled();
    Object.assign(modifier, { active: true, axis: "x", position: 1, width: 1 });
    modifier.run(input, output);
    vi.mocked(setHiddenParticles).mockClear();

    // Act
    modifier.active = false;
    modifier.run(input, output);
    modifier.run(input, output);

    // Assert
    expect(setHiddenParticles).toHaveBeenCalledTimes(1);
    expect(setHiddenParticles).toHaveBeenCalledWith(
      undefined,
      output.particles,
      undefined,
    );
    expect(Array.from(output.bonds!.radii)).toEqual([0.5, 0.5, 0.5]);
  });

  it("shows everything for a zero custom normal", () => {
    const { modifier, input, output } = setup();
    Object.assign(modifier, {
      active: true,
      axis: "custom",
      customNormal: [0, 0, 0],
    });
    modifier.run(input, output);
    expect(setHiddenParticles).not.toHaveBeenCalled();
  });
});

function setup() {
  vi.mocked(setHiddenParticles).mockClear();
  const modifier = new SliceModifier({ name: "Slice", active: false });
  // Three atoms along x at 0, 1, 2.
  const particles: Partial<Particles> = {
    capacity: 4,
    count: 3,
    positions: new Float32Array([0, 0, 0, 1, 0, 0, 2, 0, 0, 9, 9, 9]),
    indices: new Float32Array([10, 11, 12, 0]),
  };
  // Bonds 0-1, 1-1 (degenerate, inside), 1-2.
  const bonds: Partial<Bonds> = {
    count: 3,
    positions1: new Float32Array([0, 0, 0, 1, 0, 0, 1, 0, 0]),
    positions2: new Float32Array([1, 0, 0, 1, 0, 0, 2, 0, 0]),
    radii: new Float32Array([0.5, 0.5, 0.5]),
    markNeedsUpdate: vi.fn(),
  };
  const input = {
    renderState: { bondRadius: 2, visualizer: undefined },
  } as unknown as ModifierInput;
  const output = {
    particles: particles as Particles,
    bonds: bonds as Bonds,
    colorsDirty: false,
    computes: {},
    fixes: {},
    variables: {},
  } as ModifierOutput;
  return { modifier, input, output };
}

import { describe, expect, it } from "vitest";
import {
  clampImageCounts,
  imageShifts,
  realParticleCount,
  replicatePositions,
  replicateValues,
} from "./periodicImages";

// Row-major cell matrices: rows are the box vectors a, b, c.
const orthogonal = [10, 0, 0, 0, 20, 0, 0, 0, 30];
// LAMMPS triclinic: a = (lx,0,0), b = (xy,ly,0), c = (xz,yz,lz).
const triclinic = [10, 0, 0, 2, 20, 0, 3, 4, 30];

const triples = (values: ArrayLike<number>) =>
  Array.from({ length: values.length / 3 }, (_, i) =>
    Array.from(values).slice(3 * i, 3 * i + 3),
  );

describe("imageShifts", () => {
  it("is a single zero shift for 1×1×1", () => {
    expect(imageShifts(orthogonal, [1, 1, 1])).toEqual([0, 0, 0]);
  });

  it("places 2×2×1 images at the orthogonal box corners, original first", () => {
    expect(triples(imageShifts(orthogonal, [2, 2, 1]))).toEqual([
      [0, 0, 0],
      [10, 0, 0],
      [0, 20, 0],
      [10, 20, 0],
    ]);
  });

  it("follows the tilted box vectors of a triclinic cell", () => {
    expect(triples(imageShifts(triclinic, [2, 2, 2]))).toEqual([
      [0, 0, 0],
      [10, 0, 0],
      [2, 20, 0],
      [12, 20, 0],
      [3, 4, 30],
      [13, 4, 30],
      [5, 24, 30],
      [15, 24, 30],
    ]);
  });
});

describe("replication", () => {
  it("copies positions into image blocks shifted by each translation", () => {
    // Arrange: two atoms, room for a 2×1×1 triclinic replication along b.
    const positions = new Float32Array(12);
    positions.set([1, 2, 3, 4, 5, 6]);

    // Act
    replicatePositions(positions, 2, imageShifts(triclinic, [1, 2, 1]));

    // Assert
    expect(triples(positions)).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [3, 22, 3],
      [6, 25, 6],
    ]);
  });

  it("repeats per-particle values (types, IDs) in every image block", () => {
    const ids = new Float32Array([42, 7, 0, 0, 0, 0]);
    replicateValues(ids, 2, 3);
    expect(Array.from(ids)).toEqual([42, 7, 42, 7, 42, 7]);
  });

  it("recovers the real particle count from the rendered count", () => {
    expect(realParticleCount(12, imageShifts(orthogonal, [2, 2, 1]))).toBe(3);
    expect(realParticleCount(5, undefined)).toBe(5);
  });
});

describe("clampImageCounts", () => {
  it("keeps requests under the cap unchanged", () => {
    expect(clampImageCounts([2, 2, 1], 1000, 4000)).toEqual([2, 2, 1]);
  });

  it("shrinks the largest axis until the total fits", () => {
    expect(clampImageCounts([4, 2, 1], 1000, 4000)).toEqual([2, 2, 1]);
  });

  it("always keeps the original box", () => {
    expect(clampImageCounts([3, 3, 3], 10_000, 4000)).toEqual([1, 1, 1]);
  });

  it("sanitizes invalid and oversized counts", () => {
    expect(clampImageCounts([0, Number.NaN, 2.7], 1)).toEqual([1, 1, 2]);
    expect(clampImageCounts([1000, 1, 1], 1)[0]).toBe(10);
  });
});

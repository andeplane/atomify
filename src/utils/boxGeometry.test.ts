import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { createBoxGeometry, calculateBoxRadius } from "./boxGeometry";

describe("createBoxGeometry", () => {
  it("should create 12 cylinder edges for a box", () => {
    const matrix = new THREE.Matrix3().set(1, 0, 0, 0, 1, 0, 0, 0, 1);
    const origin = new THREE.Vector3(0, 0, 0);

    const group = createBoxGeometry(matrix, origin);

    expect(group.children).toHaveLength(12);
  });
});

describe("calculateBoxRadius", () => {
  it("should use row vectors (transpose matrix) for triclinic boxes", () => {
    // Triclinic matrix: rows != columns
    // Rows: a=(100,0,0), b=(100,50,0), c=(0,0,50)
    // Cols: (100,100,0), (0,50,0), (0,0,50)
    const matrix = new THREE.Matrix3().set(100, 0, 0, 100, 50, 0, 0, 0, 50);

    // Row avg: (100 + sqrt(12500) + 50) / 3 ≈ 87.27 -> radius ≈ 0.131
    const rowAvg = (100 + Math.sqrt(12500) + 50) / 3;
    const expectedRadius = rowAvg * 0.0015;

    const radius = calculateBoxRadius(matrix);

    expect(radius).toBeCloseTo(expectedRadius, 3);
  });
});

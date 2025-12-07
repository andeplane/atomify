import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  calculateBoxRadius,
  createBoxGeometry,
  extractBasisVectors,
  getSimulationBoxBounds,
} from "./boxGeometry";

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

describe("extractBasisVectors", () => {
  it("should extract basis vectors from orthogonal box", () => {
    // Orthogonal box: identity-like matrix
    const matrix = new THREE.Matrix3().set(10, 0, 0, 0, 20, 0, 0, 0, 30);

    const { a, b, c } = extractBasisVectors(matrix);

    expect(a.x).toBeCloseTo(10, 5);
    expect(a.y).toBeCloseTo(0, 5);
    expect(a.z).toBeCloseTo(0, 5);
    expect(b.x).toBeCloseTo(0, 5);
    expect(b.y).toBeCloseTo(20, 5);
    expect(b.z).toBeCloseTo(0, 5);
    expect(c.x).toBeCloseTo(0, 5);
    expect(c.y).toBeCloseTo(0, 5);
    expect(c.z).toBeCloseTo(30, 5);
  });

  it("should extract basis vectors from triclinic box", () => {
    // Triclinic box: non-orthogonal
    // Rows: a=(100,0,0), b=(100,50,0), c=(0,0,50)
    const matrix = new THREE.Matrix3().set(100, 0, 0, 100, 50, 0, 0, 0, 50);

    const { a, b, c } = extractBasisVectors(matrix);

    // Should extract row vectors (after transpose)
    expect(a.x).toBeCloseTo(100, 5);
    expect(a.y).toBeCloseTo(0, 5);
    expect(a.z).toBeCloseTo(0, 5);
    expect(b.x).toBeCloseTo(100, 5);
    expect(b.y).toBeCloseTo(50, 5);
    expect(b.z).toBeCloseTo(0, 5);
    expect(c.x).toBeCloseTo(0, 5);
    expect(c.y).toBeCloseTo(0, 5);
    expect(c.z).toBeCloseTo(50, 5);
  });

  it("should return vectors with correct lengths", () => {
    const matrix = new THREE.Matrix3().set(10, 0, 0, 0, 20, 0, 0, 0, 30);

    const { a, b, c } = extractBasisVectors(matrix);

    expect(a.length()).toBeCloseTo(10, 5);
    expect(b.length()).toBeCloseTo(20, 5);
    expect(c.length()).toBeCloseTo(30, 5);
  });
});

describe("getSimulationBoxBounds", () => {
  it("should calculate bounding box for orthogonal box at origin", () => {
    const matrix = new THREE.Matrix3().set(10, 0, 0, 0, 20, 0, 0, 0, 30);
    const origin = new THREE.Vector3(0, 0, 0);

    const box = getSimulationBoxBounds(matrix, origin);

    expect(box.min.x).toBeCloseTo(0, 5);
    expect(box.min.y).toBeCloseTo(0, 5);
    expect(box.min.z).toBeCloseTo(0, 5);
    expect(box.max.x).toBeCloseTo(10, 5);
    expect(box.max.y).toBeCloseTo(20, 5);
    expect(box.max.z).toBeCloseTo(30, 5);
  });

  it("should calculate bounding box for orthogonal box with offset origin", () => {
    const matrix = new THREE.Matrix3().set(10, 0, 0, 0, 20, 0, 0, 0, 30);
    const origin = new THREE.Vector3(-5, -10, -15);

    const box = getSimulationBoxBounds(matrix, origin);

    expect(box.min.x).toBeCloseTo(-5, 5);
    expect(box.min.y).toBeCloseTo(-10, 5);
    expect(box.min.z).toBeCloseTo(-15, 5);
    expect(box.max.x).toBeCloseTo(5, 5);
    expect(box.max.y).toBeCloseTo(10, 5);
    expect(box.max.z).toBeCloseTo(15, 5);
  });

  it("should calculate bounding box for triclinic box", () => {
    // Triclinic box: a=(100,0,0), b=(100,50,0), c=(0,0,50)
    const matrix = new THREE.Matrix3().set(100, 0, 0, 100, 50, 0, 0, 0, 50);
    const origin = new THREE.Vector3(0, 0, 0);

    const box = getSimulationBoxBounds(matrix, origin);

    // Bounding box should contain all 8 vertices
    // Vertices: (0,0,0), (100,0,0), (100,50,0), (0,0,50), (200,50,0), (100,0,50), (100,50,50), (200,50,50)
    expect(box.min.x).toBeCloseTo(0, 5);
    expect(box.min.y).toBeCloseTo(0, 5);
    expect(box.min.z).toBeCloseTo(0, 5);
    expect(box.max.x).toBeCloseTo(200, 5); // max x from vertices
    expect(box.max.y).toBeCloseTo(50, 5);
    expect(box.max.z).toBeCloseTo(50, 5);
  });

  it("should contain all vertices of the parallelepiped", () => {
    const matrix = new THREE.Matrix3().set(10, 0, 0, 0, 20, 0, 0, 0, 30);
    const origin = new THREE.Vector3(0, 0, 0);
    const { a, b, c } = extractBasisVectors(matrix);

    const box = getSimulationBoxBounds(matrix, origin);

    // Check all 8 vertices are contained
    const vertices = [
      origin.clone(),
      origin.clone().add(a),
      origin.clone().add(b),
      origin.clone().add(c),
      origin.clone().add(a).add(b),
      origin.clone().add(a).add(c),
      origin.clone().add(b).add(c),
      origin.clone().add(a).add(b).add(c),
    ];

    for (const vertex of vertices) {
      expect(box.containsPoint(vertex)).toBe(true);
    }
  });
});

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { boxRangeAlong } from "./SliceControls";

describe("boxRangeAlong", () => {
  it("projects the box corners onto the normal", () => {
    // Rows are the a, b, c box vectors (LAMMPS convention).
    const box = new THREE.Matrix3().set(10, 0, 0, 0, 20, 0, 0, 0, 30);
    const origo = new THREE.Vector3(-5, 0, 1);
    expect(boxRangeAlong([1, 0, 0], box, origo)).toEqual([-5, 5]);
    expect(boxRangeAlong([0, 0, 1], box, origo)).toEqual([1, 31]);
  });

  it("covers the tilted corners of a triclinic box", () => {
    const box = new THREE.Matrix3().set(10, 0, 0, 4, 10, 0, 0, 0, 10);
    expect(boxRangeAlong([1, 0, 0], box, new THREE.Vector3())).toEqual([0, 14]);
  });

  it("falls back to a fixed range before the box is known", () => {
    expect(boxRangeAlong([1, 0, 0], undefined, undefined)).toEqual([-50, 50]);
  });
});

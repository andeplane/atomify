import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { boxRangeAlong, choosePopoverAlign } from "./SliceControls";

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

describe("choosePopoverAlign", () => {
  const bounds = { left: 250, right: 980 };

  it("extends right from the left edge when it fits", () => {
    expect(choosePopoverAlign({ left: 300, right: 360 }, bounds, 278)).toBe(
      "left",
    );
  });

  it("extends left from the right edge near the container's end", () => {
    expect(choosePopoverAlign({ left: 811, right: 871 }, bounds, 278)).toBe(
      "right",
    );
  });

  it("picks the roomier side when neither fits", () => {
    const narrow = { left: 0, right: 300 };
    expect(choosePopoverAlign({ left: 40, right: 100 }, narrow, 278)).toBe(
      "left",
    );
    expect(choosePopoverAlign({ left: 220, right: 280 }, narrow, 278)).toBe(
      "right",
    );
  });
});

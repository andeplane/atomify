import { describe, it, expect } from "vitest";
import * as THREE from "three";
import {
  parseCameraPosition,
  parseCameraTarget,
  parseAtomType,
  parseBond,
  parseAtomSizeAndColor,
} from "./parsers";

describe("parseCameraPosition", () => {
  it.each([
    {
      case: "positive integers",
      input: "camera position 10 20 30",
      expected: new THREE.Vector3(10, 20, 30),
    },
    {
      case: "negative coordinates",
      input: "camera position -5 -10 -15",
      expected: new THREE.Vector3(-5, -10, -15),
    },
    {
      case: "floating point values",
      input: "camera position 1.5 2.7 3.9",
      expected: new THREE.Vector3(1.5, 2.7, 3.9),
    },
    {
      case: "mixed positive and negative floats",
      input: "camera position -1.5 2.7 -3.9",
      expected: new THREE.Vector3(-1.5, 2.7, -3.9),
    },
    {
      case: "zero values",
      input: "camera position 0 0 0",
      expected: new THREE.Vector3(0, 0, 0),
    },
  ])("should parse $case", ({ input, expected }) => {
    // Act
    const result = parseCameraPosition(input);

    // Assert
    expect(result).toEqual(expected);
  });

  it.each([
    { case: "wrong prefix", input: "cam position 1 2 3" },
    { case: "wrong command", input: "camera target 1 2 3" },
    { case: "too few parts", input: "camera position 1 2" },
    { case: "too many parts", input: "camera position 1 2 3 4" },
    { case: "missing coordinates", input: "camera position" },
    { case: "empty string", input: "" },
    { case: "invalid format", input: "random text" },
  ])("should return undefined for $case", ({ input }) => {
    // Act
    const result = parseCameraPosition(input);

    // Assert
    expect(result).toBeUndefined();
  });

  // Tests for whitespace handling
  it.each([
    {
      case: "double spaces",
      input: "camera  position  1  2  3",
      expected: new THREE.Vector3(1, 2, 3),
    },
    {
      case: "triple spaces",
      input: "camera   position   5   10   15",
      expected: new THREE.Vector3(5, 10, 15),
    },
    {
      case: "mixed spaces and tabs",
      input: "camera\tposition\t1\t2\t3",
      expected: new THREE.Vector3(1, 2, 3),
    },
  ])("should handle $case whitespace", ({ input, expected }) => {
    // Act
    const result = parseCameraPosition(input);

    // Assert
    expect(result).toEqual(expected);
  });
});

describe("parseCameraTarget", () => {
  it.each([
    {
      case: "positive integers",
      input: "camera target 10 20 30",
      expected: new THREE.Vector3(10, 20, 30),
    },
    {
      case: "negative coordinates",
      input: "camera target -5 -10 -15",
      expected: new THREE.Vector3(-5, -10, -15),
    },
    {
      case: "floating point values",
      input: "camera target 1.5 2.7 3.9",
      expected: new THREE.Vector3(1.5, 2.7, 3.9),
    },
    {
      case: "mixed positive and negative floats",
      input: "camera target -1.5 2.7 -3.9",
      expected: new THREE.Vector3(-1.5, 2.7, -3.9),
    },
    {
      case: "zero values",
      input: "camera target 0 0 0",
      expected: new THREE.Vector3(0, 0, 0),
    },
  ])("should parse $case", ({ input, expected }) => {
    // Act
    const result = parseCameraTarget(input);

    // Assert
    expect(result).toEqual(expected);
  });

  it.each([
    { case: "wrong prefix", input: "cam target 1 2 3" },
    { case: "wrong command", input: "camera position 1 2 3" },
    { case: "too few parts", input: "camera target 1 2" },
    { case: "too many parts", input: "camera target 1 2 3 4" },
    { case: "missing coordinates", input: "camera target" },
    { case: "empty string", input: "" },
    { case: "invalid format", input: "random text" },
  ])("should return undefined for $case", ({ input }) => {
    // Act
    const result = parseCameraTarget(input);

    // Assert
    expect(result).toBeUndefined();
  });

  // Tests for whitespace handling
  it.each([
    {
      case: "double spaces",
      input: "camera  target  1  2  3",
      expected: new THREE.Vector3(1, 2, 3),
    },
    {
      case: "triple spaces",
      input: "camera   target   5   10   15",
      expected: new THREE.Vector3(5, 10, 15),
    },
    {
      case: "mixed spaces and tabs",
      input: "camera\ttarget\t-1\t-2\t-3",
      expected: new THREE.Vector3(-1, -2, -3),
    },
  ])("should handle $case whitespace", ({ input, expected }) => {
    // Act
    const result = parseCameraTarget(input);

    // Assert
    expect(result).toEqual(expected);
  });
});

describe("parseAtomType", () => {
  it.each([
    {
      case: "simple atom type",
      input: "atom 1 Carbon",
      expected: { atomType: 1, atomName: "Carbon" },
    },
    {
      case: "two digit atom type",
      input: "atom 12 Oxygen",
      expected: { atomType: 12, atomName: "Oxygen" },
    },
    {
      case: "single space separator",
      input: "atom 5 Hydrogen",
      expected: { atomType: 5, atomName: "Hydrogen" },
    },
    {
      case: "multiple spaces",
      input: "atom   3   Nitrogen",
      expected: { atomType: 3, atomName: "Nitrogen" },
    },
    {
      case: "tab separator",
      input: "atom\t2\tHelium",
      expected: { atomType: 2, atomName: "Helium" },
    },
    {
      case: "mixed whitespace",
      input: "atom \t 7  \t Lithium",
      expected: { atomType: 7, atomName: "Lithium" },
    },
  ])("should parse $case", ({ input, expected }) => {
    // Act
    const result = parseAtomType(input);

    // Assert
    expect(result).toEqual(expected);
  });

  it.each([
    { case: "wrong prefix", input: "atm 1 Carbon" },
    { case: "extra parts", input: "atom 1 Carbon extra" },
    { case: "special characters in name", input: "atom 1 Car-bon" },
    { case: "empty string", input: "" },
  ])("should return undefined for $case", ({ input }) => {
    // Act
    const result = parseAtomType(input);

    // Assert
    expect(result).toBeUndefined();
  });

  // Edge cases that the regex still matches (empty name is allowed by \w*)
  it("should parse 'atom 1' with empty name", () => {
    const result = parseAtomType("atom 1");
    expect(result).toEqual({ atomType: 1, atomName: "" });
  });

  // With stricter regex (\d+ instead of \d*), these now properly return undefined
  it("should return undefined for 'atom Carbon' (missing type number)", () => {
    const result = parseAtomType("atom Carbon");
    expect(result).toBeUndefined();
  });

  it("should return undefined for 'atom' (missing both)", () => {
    const result = parseAtomType("atom");
    expect(result).toBeUndefined();
  });
});

describe("parseBond", () => {
  it.each([
    {
      case: "simple bond",
      input: "bond 1 2 1.5",
      expected: { atomType1: 1, atomType2: 2, distance: 1.5 },
    },
    {
      case: "two digit atom types",
      input: "bond 12 15 2.5",
      expected: { atomType1: 12, atomType2: 15, distance: 2.5 },
    },
    {
      case: "large distance",
      input: "bond 1 3 10.75",
      expected: { atomType1: 1, atomType2: 3, distance: 10.75 },
    },
    {
      case: "small distance",
      input: "bond 2 4 0.1",
      expected: { atomType1: 2, atomType2: 4, distance: 0.1 },
    },
    {
      case: "multiple spaces",
      input: "bond   5   6   3.5",
      expected: { atomType1: 5, atomType2: 6, distance: 3.5 },
    },
    {
      case: "tab separator",
      input: "bond\t7\t8\t1.25",
      expected: { atomType1: 7, atomType2: 8, distance: 1.25 },
    },
  ])("should parse $case", ({ input, expected }) => {
    // Act
    const result = parseBond(input);

    // Assert
    expect(result).toEqual(expected);
  });

  it.each([
    { case: "wrong prefix", input: "bnd 1 2 1.5" },
    { case: "extra parts", input: "bond 1 2 1.5 extra" },
    { case: "negative distance", input: "bond 1 2 -1.5" },
    { case: "empty string", input: "" },
    { case: "only bond keyword", input: "bond" },
  ])("should return undefined for $case", ({ input }) => {
    // Act
    const result = parseBond(input);

    // Assert
    expect(result).toBeUndefined();
  });

  // Integer distance is valid
  it("should parse integer distance", () => {
    const result = parseBond("bond 1 2 5");
    expect(result).toEqual({ atomType1: 1, atomType2: 2, distance: 5 });
  });

  // With stricter regex (\d+ instead of \d*), these now properly return undefined
  it("should return undefined for 'bond 1 2' (missing distance)", () => {
    const result = parseBond("bond 1 2");
    expect(result).toBeUndefined();
  });

  it("should return undefined for 'bond 1.5' (missing second type)", () => {
    const result = parseBond("bond 1.5");
    expect(result).toBeUndefined();
  });
});

describe("parseAtomSizeAndColor", () => {
  it.each([
    {
      case: "lowercase hex",
      input: "atom 1 1.5 #ff0000",
      expected: { atomTypeIndex: 1, radius: 1.5, color: "#ff0000" },
    },
    {
      case: "uppercase hex",
      input: "atom 2 2.0 #00FF00",
      expected: { atomTypeIndex: 2, radius: 2.0, color: "#00FF00" },
    },
    {
      case: "mixed case hex",
      input: "atom 3 0.5 #AaBbCc",
      expected: { atomTypeIndex: 3, radius: 0.5, color: "#AaBbCc" },
    },
    {
      case: "large radius",
      input: "atom 5 10.5 #123456",
      expected: { atomTypeIndex: 5, radius: 10.5, color: "#123456" },
    },
    {
      case: "small radius",
      input: "atom 7 0.1 #FEDCBA",
      expected: { atomTypeIndex: 7, radius: 0.1, color: "#FEDCBA" },
    },
    {
      case: "two digit atom type",
      input: "atom 12 3.5 #FFFFFF",
      expected: { atomTypeIndex: 12, radius: 3.5, color: "#FFFFFF" },
    },
    {
      case: "black color",
      input: "atom 1 1.0 #000000",
      expected: { atomTypeIndex: 1, radius: 1.0, color: "#000000" },
    },
    {
      case: "white color",
      input: "atom 2 2.5 #FFFFFF",
      expected: { atomTypeIndex: 2, radius: 2.5, color: "#FFFFFF" },
    },
    {
      case: "tab separator",
      input: "atom\t4\t1.8\t#ABCDEF",
      expected: { atomTypeIndex: 4, radius: 1.8, color: "#ABCDEF" },
    },
  ])("should parse $case", ({ input, expected }) => {
    // Act
    const result = parseAtomSizeAndColor(input);

    // Assert
    expect(result).toEqual(expected);
  });

  it.each([
    { case: "wrong prefix", input: "atm 1 1.5 #FF0000" },
    { case: "missing color", input: "atom 1 1.5" },
    { case: "short hex (3 chars)", input: "atom 1 1.5 #F00" },
    { case: "long hex (8 chars)", input: "atom 1 1.5 #FF0000FF" },
    { case: "invalid hex characters", input: "atom 1 1.5 #GGGGGG" },
    { case: "missing hash", input: "atom 1 1.5 FF0000" },
    { case: "extra parts", input: "atom 1 1.5 #FF0000 extra" },
    { case: "empty string", input: "" },
    { case: "only atom keyword", input: "atom" },
  ])("should return undefined for $case", ({ input }) => {
    // Act
    const result = parseAtomSizeAndColor(input);

    // Assert
    expect(result).toBeUndefined();
  });

  // Edge cases that the regex actually matches
  // Integer radius is valid
  it("should parse integer radius", () => {
    const result = parseAtomSizeAndColor("atom 1 5 #FF0000");
    expect(result).toEqual({ atomTypeIndex: 1, radius: 5, color: "#FF0000" });
  });

  // With stricter regex (\d+ instead of \d*), this now properly returns undefined
  it("should return undefined for 'atom 1 #FF0000' (missing radius)", () => {
    const result = parseAtomSizeAndColor("atom 1 #FF0000");
    expect(result).toBeUndefined();
  });
});

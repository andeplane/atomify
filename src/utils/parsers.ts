import * as THREE from "three";

/**
 * Parses camera position from Atomify command format: "camera position x y z"
 * @param line The command line to parse
 * @returns THREE.Vector3 with the position, or undefined if parsing fails
 */
export const parseCameraPosition = (line: string) => {
  const splitted = line.split(/\s+/);
  if (
    splitted[0] === "camera" &&
    splitted[1] === "position" &&
    splitted.length === 5
  ) {
    const x = parseFloat(splitted[2]);
    const y = parseFloat(splitted[3]);
    const z = parseFloat(splitted[4]);
    return new THREE.Vector3(x, y, z);
  }
};

/**
 * Parses camera target from Atomify command format: "camera target x y z"
 * @param line The command line to parse
 * @returns THREE.Vector3 with the target, or undefined if parsing fails
 */
export const parseCameraTarget = (line: string) => {
  const splitted = line.split(/\s+/);
  if (
    splitted[0] === "camera" &&
    splitted[1] === "target" &&
    splitted.length === 5
  ) {
    const x = parseFloat(splitted[2]);
    const y = parseFloat(splitted[3]);
    const z = parseFloat(splitted[4]);
    return new THREE.Vector3(x, y, z);
  }
};

/**
 * Parses atom type from Atomify command format: "atom <number> <name>"
 * @param line The command line to parse
 * @returns Object with atomType and atomName, or undefined if parsing fails
 */
export const parseAtomType = (line: string) => {
  const regex = /^atom\s+(\d+)\s*(\w*)$/;
  const matches = line.match(regex);
  if (matches) {
    return {
      atomType: parseInt(matches[1]),
      atomName: matches[2],
    };
  }
};

/**
 * Parses bond from Atomify command format: "bond <type1> <type2> <distance>"
 * @param line The command line to parse
 * @returns Object with atomType1, atomType2, and distance, or undefined if parsing fails
 */
export const parseBond = (line: string) => {
  const regex = /^bond\s+(\d+)\s+(\d+)\s+(\d+\.?\d*)$/;
  const matches = line.match(regex);
  if (matches) {
    return {
      atomType1: parseInt(matches[1]),
      atomType2: parseInt(matches[2]),
      distance: parseFloat(matches[3]),
    };
  }
};

/**
 * Parses atom size and color from Atomify command format: "atom <number> <radius> #RRGGBB"
 * @param line The command line to parse
 * @returns Object with atomTypeIndex, radius, and color, or undefined if parsing fails
 */
export const parseAtomSizeAndColor = (line: string) => {
  const regex = /^atom\s+(\d+)\s+(\d+\.?\d*)\s+(#[0-9a-fA-F]{6})$/;
  const matches = line.match(regex);
  if (matches) {
    return {
      atomTypeIndex: parseInt(matches[1]),
      radius: parseFloat(matches[2]),
      color: matches[3],
    };
  }
};

/**
 * Gets the distance unit symbol for a given LAMMPS unit style
 * @param unitStyle The LAMMPS unit style (e.g., "real", "metal", "lj", "si", etc.)
 * @returns The distance unit symbol string
 */
export const getDistanceUnitSymbol = (unitStyle: string | undefined): string => {
  if (!unitStyle) {
    return "Å"; // Default to Angstroms if unit style is not found
  }
  
  const style = unitStyle.toLowerCase();
  switch (style) {
    case "lj":
      return "σ";
    case "real":
    case "metal":
      return "Å";
    case "si":
      return "m";
    case "cgs":
      return "cm";
    case "electron":
      return "a₀";
    case "micro":
      return "μm";
    case "nano":
      return "nm";
    default:
      return "Å"; // Default to Angstroms for unknown unit styles
  }
};


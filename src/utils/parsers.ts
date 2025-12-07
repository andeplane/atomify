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

export type ColorSource = "compute" | "fix" | "variable" | "type";

export interface ColorCommand {
  source: ColorSource;
  name?: string; // undefined when source is "type"
}

/**
 * Parses color command from Atomify command format: "color compute|fix|variable|type <name>"
 * @param line The command line to parse
 * @returns ColorCommand object or undefined if parsing fails
 */
export const parseColor = (line: string): ColorCommand | undefined => {
  const splitted = line.split(/\s+/);
  if (splitted[0] !== "color") {
    return undefined;
  }

  const source = splitted[1] as ColorSource;
  if (!["compute", "fix", "variable", "type"].includes(source)) {
    return undefined;
  }

  if (source === "type") {
    return { source: "type" };
  }

  // For compute/fix/variable, we need a name
  if (splitted.length < 3) {
    return undefined;
  }

  return {
    source,
    name: splitted[2],
  };
};

/**
 * Parses colormap command from Atomify command format: "colormap <name>"
 * @param line The command line to parse
 * @returns Colormap name or undefined if parsing fails
 */
export const parseColormap = (line: string): string | undefined => {
  const splitted = line.split(/\s+/);
  if (splitted[0] === "colormap" && splitted.length === 2) {
    return splitted[1];
  }
  return undefined;
};

export interface ColormapRangeCommand {
  auto: boolean;
  min?: number;
  max?: number;
}

/**
 * Parses colormaprange command from Atomify command format: 
 * "colormaprange <min> <max>" or "colormaprange auto"
 * @param line The command line to parse
 * @returns ColormapRangeCommand object or undefined if parsing fails
 */
export const parseColormapRange = (line: string): ColormapRangeCommand | undefined => {
  const splitted = line.split(/\s+/);
  if (splitted[0] !== "colormaprange") {
    return undefined;
  }

  if (splitted[1] === "auto") {
    return { auto: true };
  }

  if (splitted.length === 3) {
    const min = parseFloat(splitted[1]);
    const max = parseFloat(splitted[2]);
    if (!isNaN(min) && !isNaN(max)) {
      return { auto: false, min, max };
    }
  }

  return undefined;
};

export interface AtomRadiusCommand {
  atomTypeIndex: number;
  radius: number;
}

/**
 * Parses atom radius command from Atomify command format: "atom <type> radius <value>"
 * @param line The command line to parse
 * @returns AtomRadiusCommand object or undefined if parsing fails
 */
export const parseAtomRadius = (line: string): AtomRadiusCommand | undefined => {
  const regex = /^atom\s+(\d+)\s+radius\s+(\d+\.?\d*)$/;
  const matches = line.match(regex);
  if (matches) {
    return {
      atomTypeIndex: parseInt(matches[1]),
      radius: parseFloat(matches[2]),
    };
  }
  return undefined;
};

export interface AtomColorCommand {
  atomTypeIndex: number;
  color: string;
}

/**
 * Parses atom color command from Atomify command format: "atom <type> color #RRGGBB"
 * @param line The command line to parse
 * @returns AtomColorCommand object or undefined if parsing fails
 */
export const parseAtomColor = (line: string): AtomColorCommand | undefined => {
  const regex = /^atom\s+(\d+)\s+color\s+(#[0-9a-fA-F]{6})$/;
  const matches = line.match(regex);
  if (matches) {
    return {
      atomTypeIndex: parseInt(matches[1]),
      color: matches[2],
    };
  }
  return undefined;
};

// Group command types
export type GroupColorType = 
  | { type: "solid"; color: string }
  | { type: "compute"; name: string }
  | { type: "fix"; name: string }
  | { type: "variable"; name: string };

export interface GroupCommand {
  groupName: string;
  property: "color" | "radius";
  value: GroupColorType | number; // GroupColorType for color, number for radius
}

/**
 * Parses group commands from Atomify command format:
 * - "group <name> color #RRGGBB" - solid color
 * - "group <name> color compute <name>" - per-atom compute
 * - "group <name> color fix <name>" - per-atom fix
 * - "group <name> color variable <name>" - per-atom variable
 * - "group <name> radius <value>" - radius
 * @param line The command line to parse
 * @returns GroupCommand object or undefined if parsing fails
 */
export const parseGroup = (line: string): GroupCommand | undefined => {
  const splitted = line.split(/\s+/);
  if (splitted[0] !== "group" || splitted.length < 4) {
    return undefined;
  }

  const groupName = splitted[1];
  const property = splitted[2];

  if (property === "radius") {
    const radius = parseFloat(splitted[3]);
    if (!isNaN(radius)) {
      return {
        groupName,
        property: "radius",
        value: radius,
      };
    }
    return undefined;
  }

  if (property === "color") {
    // Check for solid color: "group <name> color #RRGGBB"
    const colorRegex = /^#[0-9a-fA-F]{6}$/;
    if (colorRegex.test(splitted[3])) {
      return {
        groupName,
        property: "color",
        value: { type: "solid", color: splitted[3] },
      };
    }

    // Check for per-atom sources: "group <name> color compute|fix|variable <name>"
    const source = splitted[3] as "compute" | "fix" | "variable";
    if (["compute", "fix", "variable"].includes(source) && splitted.length >= 5) {
      return {
        groupName,
        property: "color",
        value: { type: source, name: splitted[4] },
      };
    }
  }

  return undefined;
};


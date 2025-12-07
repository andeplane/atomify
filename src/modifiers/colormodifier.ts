import Modifier from "./modifier";
import { ModifierInput, ModifierOutput } from "./types";
import colormap from "colormap";
import { AtomType, hexToRgb } from "../utils/atomtypes";
import { ColorSource, GroupColorType } from "../utils/parsers";
import * as THREE from "three";

// Group style configuration
export interface GroupStyle {
  groupName: string;
  groupBit?: number; // Cached group bitmask from LAMMPS
  color?: GroupColorType;
  radius?: number;
}

const defaultAtomTypes: AtomType[] = [
  {
    shortname: "1",
    fullname: "1",
    radius: 1.2,
    color: new THREE.Color(255, 102, 102),
  },
  {
    shortname: "2",
    fullname: "2",
    radius: 1.2,
    color: new THREE.Color(102, 102, 255),
  },
  {
    shortname: "3",
    fullname: "3",
    radius: 1.2,
    color: new THREE.Color(255, 255, 0),
  },
  {
    shortname: "4",
    fullname: "4",
    radius: 1.2,
    color: new THREE.Color(255, 102, 255),
  },
  {
    shortname: "5",
    fullname: "5",
    radius: 1.2,
    color: new THREE.Color(102, 255, 51),
  },
  {
    shortname: "6",
    fullname: "6",
    radius: 1.2,
    color: new THREE.Color(204, 255, 179),
  },
  {
    shortname: "7",
    fullname: "7",
    radius: 1.2,
    color: new THREE.Color(179, 0, 255),
  },
  {
    shortname: "8",
    fullname: "8",
    radius: 1.2,
    color: new THREE.Color(51, 255, 255),
  },
  {
    shortname: "9",
    fullname: "9",
    radius: 1.2,
    color: new THREE.Color(247, 247, 247),
  },
  {
    shortname: "10",
    fullname: "10",
    radius: 1.2,
    color: new THREE.Color(255, 102, 102),
  },
  {
    shortname: "11",
    fullname: "11",
    radius: 1.2,
    color: new THREE.Color(102, 102, 255),
  },
  {
    shortname: "12",
    fullname: "12",
    radius: 1.2,
    color: new THREE.Color(255, 255, 0),
  },
  {
    shortname: "13",
    fullname: "13",
    radius: 1.2,
    color: new THREE.Color(255, 102, 255),
  },
  {
    shortname: "14",
    fullname: "14",
    radius: 1.2,
    color: new THREE.Color(102, 255, 51),
  },
  {
    shortname: "15",
    fullname: "15",
    radius: 1.2,
    color: new THREE.Color(204, 255, 179),
  },
  {
    shortname: "16",
    fullname: "16",
    radius: 1.2,
    color: new THREE.Color(179, 0, 255),
  },
  {
    shortname: "17",
    fullname: "17",
    radius: 1.2,
    color: new THREE.Color(51, 255, 255),
  },
  {
    shortname: "18",
    fullname: "18",
    radius: 1.2,
    color: new THREE.Color(247, 247, 247),
  },
];

interface ColorModifierProps {
  name: string;
  active: boolean;
}

class ColorModifier extends Modifier {
  // Color source configuration
  public colorSource: ColorSource = "type";
  public colorSourceName?: string; // Name of the compute/fix/variable
  
  // Legacy property - kept for backward compatibility with UI
  public get computeName(): string | undefined {
    return this.colorSource === "compute" ? this.colorSourceName : undefined;
  }
  public set computeName(value: string | undefined) {
    if (value) {
      this.colorSource = "compute";
      this.colorSourceName = value;
    } else {
      this.colorSource = "type";
      this.colorSourceName = undefined;
    }
  }
  
  private previousColoringMethod?: string;
  
  // Min/max tracking over time
  public globalMinValue: number = Infinity;
  public globalMaxValue: number = -Infinity;
  
  // Custom min/max values (if set, override computed values)
  public customMinValue?: number;
  public customMaxValue?: number;
  
  // Flag to reset global min/max
  public resetMinMax: boolean = false;

  // Colormap selection
  public colormap: string = "jet";

  // Group styles - keyed by group name
  public groupStyles: Map<string, GroupStyle> = new Map();

  constructor({ name, active }: ColorModifierProps) {
    super({ name, active });
    this.colorSource = "type";
    this.colorSourceName = undefined;
  }
  
  // Set color source from parsed command
  public setColorSource(source: ColorSource, name?: string): void {
    this.colorSource = source;
    this.colorSourceName = name;
    // Reset min/max when changing source
    this.resetGlobalMinMax();
  }

  // Set group style
  public setGroupStyle(groupName: string, style: Partial<GroupStyle>): void {
    const existing = this.groupStyles.get(groupName) || { groupName };
    this.groupStyles.set(groupName, { ...existing, ...style });
  }

  // Clear all group styles
  public clearGroupStyles(): void {
    this.groupStyles.clear();
  }
  
  // Get the effective min/max values (custom or global)
  public getEffectiveMinValue(): number {
    return this.customMinValue !== undefined ? this.customMinValue : this.globalMinValue;
  }
  
  public getEffectiveMaxValue(): number {
    return this.customMaxValue !== undefined ? this.customMaxValue : this.globalMaxValue;
  }
  
  // Reset global min/max values
  public resetGlobalMinMax(): void {
    this.globalMinValue = Infinity;
    this.globalMaxValue = -Infinity;
    this.resetMinMax = false;
  }

  // Get per-atom data from the appropriate source (compute, fix, or variable)
  private getPerAtomData = (input: ModifierInput, particleCount: number): Float64Array | undefined => {
    const sourceName = this.colorSourceName;
    if (!sourceName) {
      return undefined;
    }
    return this.getPerAtomDataBySource(input, this.colorSource, sourceName, particleCount);
  };

  // Get per-atom data from a specific source type and name
  private getPerAtomDataBySource = (
    input: ModifierInput, 
    sourceType: "compute" | "fix" | "variable" | "type", 
    sourceName: string, 
    particleCount: number
  ): Float64Array | undefined => {
    if (sourceType === "compute") {
      const compute = input.computes[sourceName];
      if (!compute || !compute.isPerAtom) {
        return undefined;
      }
      const didCompute = compute.lmpCompute.execute();
      if (!didCompute) {
        return undefined;
      }
      compute.lmpCompute.sync();
      const perAtomDataPtr = compute.lmpCompute.getPerAtomData() / 8;
      return input.wasm.HEAPF64.subarray(
        perAtomDataPtr,
        perAtomDataPtr + particleCount,
      ) as Float64Array;
    } else if (sourceType === "fix") {
      const fix = input.fixes[sourceName];
      if (!fix || !fix.isPerAtom) {
        return undefined;
      }
      fix.lmpFix.sync();
      const perAtomDataPtr = fix.lmpFix.getPerAtomData() / 8;
      return input.wasm.HEAPF64.subarray(
        perAtomDataPtr,
        perAtomDataPtr + particleCount,
      ) as Float64Array;
    } else if (sourceType === "variable") {
      const variable = input.variables[sourceName];
      if (!variable || !variable.isPerAtom) {
        return undefined;
      }
      variable.lmpVariable.sync();
      const perAtomDataPtr = variable.lmpVariable.getPerAtomData() / 8;
      return input.wasm.HEAPF64.subarray(
        perAtomDataPtr,
        perAtomDataPtr + particleCount,
      ) as Float64Array;
    }

    return undefined;
  };

  runByProperty = (input: ModifierInput, output: ModifierOutput) => {
    if (!input.renderState.visualizer) {
      return;
    }
    if (!output.particles) {
      return;
    }
    const particles = output.particles;
    const visualizer = input.renderState.visualizer;

    const colors = colormap({
      colormap: this.colormap,
      nshades: 72,
      format: "float",
      alpha: 1,
    });

    const perAtomArray = this.getPerAtomData(input, particles.count);
    if (!perAtomArray) {
      return;
    }
    
    // Reset global min/max if requested
    if (this.resetMinMax) {
      this.resetGlobalMinMax();
    }
    
    // Calculate min/max for current timestep
    let currentMinValue = Infinity;
    let currentMaxValue = -Infinity;
    for (let i = 0; i < perAtomArray.length; i++) {
      const value = perAtomArray[i];
      currentMinValue = Math.min(currentMinValue, value);
      currentMaxValue = Math.max(currentMaxValue, value);
    }
    
    // Update global min/max values
    this.globalMinValue = Math.min(this.globalMinValue, currentMinValue);
    this.globalMaxValue = Math.max(this.globalMaxValue, currentMaxValue);
    
    // Use effective min/max for coloring
    const effectiveMinValue = this.getEffectiveMinValue();
    const effectiveMaxValue = this.getEffectiveMaxValue();
    
    // Avoid division by zero
    const range = effectiveMaxValue - effectiveMinValue;
    const validRange = range > 0 ? range : 1;
    
    perAtomArray.forEach((value, index) => {
      const realIndex = particles.indices[index];
      
      // Clamp value to effective range
      const clampedValue = Math.max(effectiveMinValue, Math.min(effectiveMaxValue, value));
      
      const colorIndex = Math.floor(
        ((clampedValue - effectiveMinValue) / validRange) * (colors.length - 1),
      );

      const color = colors[colorIndex];
      visualizer.setColor(realIndex, {
        r: 255 * color[0],
        g: 255 * color[1],
        b: 255 * color[2],
      });
    });
    this.previousColoringMethod = "property";
    return;
  };

  runByType = (
    input: ModifierInput,
    output: ModifierOutput,
    everything: boolean = false,
  ) => {
    if (
      (this.previousColoringMethod === "type" && !output.colorsDirty) ||
      !input.renderState.visualizer
    ) {
      return;
    }
    if (!output.particles) {
      return;
    }
    const particles = output.particles;
    const particleStyles = input.renderState.particleStyles;
    const visualizer = input.renderState.visualizer;

    for (let i = 0; i < particles.count; i++) {
      const realIndex = particles.indices[i];
      const type = particles.types[i];
      let atomType = particleStyles[type];
      if (!atomType) {
        atomType = defaultAtomTypes[type % defaultAtomTypes.length];
      }
      const radius = 0.33 * input.renderState.particleRadius * atomType.radius;
      visualizer.setRadius(realIndex, radius);
      visualizer.setColor(realIndex, {
        r: atomType.color.r,
        g: atomType.color.g,
        b: atomType.color.b,
      });
    }

    this.previousColoringMethod = "type";
  };

  // Apply group-specific styles after base coloring
  private applyGroupStyles = (input: ModifierInput, output: ModifierOutput) => {
    if (this.groupStyles.size === 0) {
      return;
    }
    if (!input.renderState.visualizer || !output.particles) {
      return;
    }

    const particles = output.particles;
    const visualizer = input.renderState.visualizer;
    const lammps = input.lammps;

    // Get the group mask array from LAMMPS
    const groupMaskPtr = lammps.getGroupMaskPointer() / 4;
    if (groupMaskPtr === 0) {
      return;
    }
    const groupMaskArray = input.wasm.HEAP32.subarray(
      groupMaskPtr,
      groupMaskPtr + particles.count,
    ) as Int32Array;

    // Update group bits if needed
    for (const [groupName, style] of this.groupStyles) {
      if (style.groupBit === undefined) {
        style.groupBit = lammps.getGroupBit(groupName);
      }
    }

    // Prepare colormap for per-atom coloring
    const colors = colormap({
      colormap: this.colormap,
      nshades: 72,
      format: "float",
      alpha: 1,
    });

    // Apply each group style
    for (const [, style] of this.groupStyles) {
      if (style.groupBit === undefined || style.groupBit < 0) {
        continue;
      }

      // Get per-atom data if using a per-atom color source
      let perAtomArray: Float64Array | undefined;
      let effectiveMin = 0;
      let effectiveMax = 1;

      if (style.color && style.color.type !== "solid") {
        perAtomArray = this.getPerAtomDataBySource(
          input,
          style.color.type,
          style.color.name,
          particles.count,
        );

        if (perAtomArray) {
          // Calculate min/max for this data
          let min = Infinity;
          let max = -Infinity;
          for (let i = 0; i < perAtomArray.length; i++) {
            // Only consider atoms in this group
            if ((groupMaskArray[i] & style.groupBit) !== 0) {
              min = Math.min(min, perAtomArray[i]);
              max = Math.max(max, perAtomArray[i]);
            }
          }
          if (isFinite(min) && isFinite(max)) {
            effectiveMin = min;
            effectiveMax = max;
          }
        }
      }

      const range = effectiveMax - effectiveMin;
      const validRange = range > 0 ? range : 1;

      // Apply style to atoms in this group
      for (let i = 0; i < particles.count; i++) {
        const atomMask = groupMaskArray[i];
        if ((atomMask & style.groupBit) === 0) {
          continue; // Atom not in this group
        }

        const realIndex = particles.indices[i];

        // Apply radius if specified
        if (style.radius !== undefined) {
          visualizer.setRadius(realIndex, style.radius * input.renderState.particleRadius * 0.33);
        }

        // Apply color if specified
        if (style.color) {
          if (style.color.type === "solid") {
            const rgb = hexToRgb(style.color.color);
            visualizer.setColor(realIndex, {
              r: rgb[0],
              g: rgb[1],
              b: rgb[2],
            });
          } else if (perAtomArray) {
            // Per-atom coloring for this group
            const value = perAtomArray[i];
            const clampedValue = Math.max(effectiveMin, Math.min(effectiveMax, value));
            const colorIndex = Math.floor(
              ((clampedValue - effectiveMin) / validRange) * (colors.length - 1),
            );
            const color = colors[colorIndex];
            visualizer.setColor(realIndex, {
              r: 255 * color[0],
              g: 255 * color[1],
              b: 255 * color[2],
            });
          }
        }
      }
    }
  };

  run = (input: ModifierInput, output: ModifierOutput) => {
    // First apply base coloring
    if (this.colorSource !== "type" && this.colorSourceName) {
      this.runByProperty(input, output);
    } else {
      this.runByType(input, output);
    }

    // Then apply group-specific styles (overrides base coloring for those groups)
    this.applyGroupStyles(input, output);
  };
}

export default ColorModifier;

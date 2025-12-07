import colormap from "colormap";
import * as THREE from "three";
import type { AtomType } from "../utils/atomtypes";
import Modifier from "./modifier";
import type { ModifierInput, ModifierOutput } from "./types";

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
  public computeName?: string;
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

  constructor({ name, active }: ColorModifierProps) {
    super({ name, active });
    this.computeName = undefined;
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
    const computes = input.computes;
    const compute = this.computeName ? computes[this.computeName] : undefined;
    if (!compute || !compute.isPerAtom) {
      return;
    }

    const didCompute = compute.lmpCompute.execute();
    if (!didCompute) {
      return;
    }
    compute.lmpCompute.sync();
    const perAtomDataPtr = compute.lmpCompute.getPerAtomData() / 8;
    const perAtomArray = input.wasm.HEAPF64.subarray(
      perAtomDataPtr,
      perAtomDataPtr + particles.count
    ) as Float64Array;

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
        ((clampedValue - effectiveMinValue) / validRange) * (colors.length - 1)
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

  runByType = (input: ModifierInput, output: ModifierOutput, everything: boolean = false) => {
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

  run = (input: ModifierInput, output: ModifierOutput) => {
    if (this.computeName) {
      this.runByProperty(input, output);
    } else {
      this.runByType(input, output);
    }
  };
}

export default ColorModifier;

import { setHiddenParticles } from "../rendering/particleAttributes";
import Modifier, { ModifierProps } from "./modifier";
import { ModifierInput, ModifierOutput } from "./types";

export type SliceAxis = "x" | "y" | "z" | "custom";
export type Vector3Tuple = [number, number, number];

export type Slab = {
  /** Unit plane normal. */
  normal: Vector3Tuple;
  /** Slab center, as a distance along the normal from the origin. */
  position: number;
  width: number;
  /** Show atoms outside the slab instead of inside. */
  invert: boolean;
};

const AXIS_NORMALS: Record<Exclude<SliceAxis, "custom">, Vector3Tuple> = {
  x: [1, 0, 0],
  y: [0, 1, 0],
  z: [0, 0, 1],
};

/** Unit normal for an axis, or undefined for a zero custom vector. */
export function sliceNormal(
  axis: SliceAxis,
  custom: Vector3Tuple,
): Vector3Tuple | undefined {
  if (axis !== "custom") return AXIS_NORMALS[axis];
  const length = Math.hypot(custom[0], custom[1], custom[2]);
  if (!(length > 0) || !Number.isFinite(length)) return undefined;
  return [custom[0] / length, custom[1] / length, custom[2] / length];
}

export function isInSlab(x: number, y: number, z: number, slab: Slab) {
  const [nx, ny, nz] = slab.normal;
  const inside =
    Math.abs(x * nx + y * ny + z * nz - slab.position) <= 0.5 * slab.width;
  return inside !== slab.invert;
}

/**
 * Flag every point outside the slab: `hidden[i] = 1` for point i of the
 * packed xyz `positions`. Returns how many points are hidden.
 */
export function computeSlabMask(
  positions: Float32Array,
  count: number,
  slab: Slab,
  hidden: Uint8Array,
): number {
  let numHidden = 0;
  for (let i = 0; i < count; i++) {
    const hide = isInSlab(
      positions[3 * i],
      positions[3 * i + 1],
      positions[3 * i + 2],
      slab,
    )
      ? 0
      : 1;
    hidden[i] = hide;
    numHidden += hide;
  }
  return numHidden;
}

/**
 * Shows only the atoms inside a slab, to see into bulk systems. Visual only:
 * hidden atoms are drawn with zero radius (so they can't be picked either),
 * and bonds with a hidden end get zero radius too. Atom count, IDs and
 * per-atom data stay untouched. Must run after the Particles, Bonds and
 * Colors modifiers, which reset styles and bond data every frame.
 */
class SliceModifier extends Modifier {
  public axis: SliceAxis = "z";
  public customNormal: Vector3Tuple = [1, 1, 1];
  public position = 0;
  public width = 0;
  public invert = false;

  private hidden = new Uint8Array(0);
  private particlesHidden = false;
  private bondsHidden = false;

  constructor({ name, active }: ModifierProps) {
    super({ name, active });
  }

  getSlab = (): Slab | undefined => {
    const normal = sliceNormal(this.axis, this.customNormal);
    if (!normal) return undefined;
    return {
      normal,
      position: this.position,
      width: this.width,
      invert: this.invert,
    };
  };

  run = (input: ModifierInput, output: ModifierOutput) => {
    const visualizer = input.renderState.visualizer;
    const defaultBondRadius = 0.25 * input.renderState.bondRadius;
    const slab = this.active ? this.getSlab() : undefined;
    if (!slab) {
      // Restore once after the slice is switched off, then do nothing.
      if (this.particlesHidden && output.particles) {
        setHiddenParticles(visualizer, output.particles, undefined);
      }
      if (this.bondsHidden && output.bonds) {
        output.bonds.radii.fill(defaultBondRadius);
        output.bonds.markNeedsUpdate();
      }
      this.particlesHidden = false;
      this.bondsHidden = false;
      return;
    }

    const particles = output.particles;
    if (particles) {
      if (this.hidden.length < particles.capacity) {
        this.hidden = new Uint8Array(particles.capacity);
      }
      computeSlabMask(particles.positions, particles.count, slab, this.hidden);
      setHiddenParticles(visualizer, particles, this.hidden);
      this.particlesHidden = true;
    }

    const bonds = output.bonds;
    if (bonds && bonds.count > 0) {
      const { positions1: p1, positions2: p2 } = bonds;
      for (let i = 0; i < bonds.count; i++) {
        const visible =
          isInSlab(p1[3 * i], p1[3 * i + 1], p1[3 * i + 2], slab) &&
          isInSlab(p2[3 * i], p2[3 * i + 1], p2[3 * i + 2], slab);
        bonds.radii[i] = visible ? defaultBondRadius : 0;
      }
      bonds.markNeedsUpdate();
      this.bondsHidden = true;
    }
  };
}

export default SliceModifier;

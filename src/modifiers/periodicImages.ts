/**
 * Periodic images (OVITO's "Replicate"): draw extra copies of the system
 * shifted by the box vectors. Visual only; the simulation is untouched.
 *
 * Rendered arrays are laid out as consecutive image blocks of the real
 * particles, the original (zero shift) block first, so index i < count is
 * always a real particle and every image keeps its atom's ID.
 */

export type ImageCounts = [number, number, number];

/** Total rendered particles (originals plus images) we allow. */
export const MAX_RENDERED_PARTICLES = 500_000;
/** Largest image count accepted per axis. */
export const MAX_IMAGES_PER_AXIS = 10;

const sanitize = (n: number) =>
  Math.min(MAX_IMAGES_PER_AXIS, Math.max(1, Math.floor(n) || 1));

/**
 * Clamp requested image counts so that numParticles * nx * ny * nz stays
 * within maxParticles, shrinking the largest axis first. The original box
 * is always kept, even when it alone exceeds the cap.
 */
export function clampImageCounts(
  counts: ImageCounts,
  numParticles: number,
  maxParticles: number = MAX_RENDERED_PARTICLES,
): ImageCounts {
  const clamped = counts.map(sanitize) as ImageCounts;
  while (
    numParticles * clamped[0] * clamped[1] * clamped[2] > maxParticles &&
    Math.max(...clamped) > 1
  ) {
    clamped[clamped.indexOf(Math.max(...clamped))]--;
  }
  return clamped;
}

/**
 * Translation of every image as flat xyz triples: i*a + j*b + k*c for
 * i < nx, j < ny, k < nz, starting with the zero shift. `cell` is the LAMMPS
 * cell matrix in row-major order, its rows being the box vectors a, b, c,
 * so triclinic tilts are carried along.
 */
export function imageShifts(
  cell: ArrayLike<number>,
  counts: ImageCounts,
): number[] {
  const [nx, ny, nz] = counts;
  const shifts: number[] = [];
  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        for (let d = 0; d < 3; d++) {
          shifts.push(i * cell[d] + j * cell[3 + d] + k * cell[6 + d]);
        }
      }
    }
  }
  return shifts;
}

/** Fill image blocks 1.. of an xyz array from the first `count` entries. */
export function replicatePositions(
  positions: Float32Array,
  count: number,
  shifts: ArrayLike<number>,
): void {
  const numImages = shifts.length / 3;
  for (let image = 1; image < numImages; image++) {
    const offset = 3 * image * count;
    const sx = shifts[3 * image];
    const sy = shifts[3 * image + 1];
    const sz = shifts[3 * image + 2];
    for (let i = 0; i < 3 * count; i += 3) {
      positions[offset + i] = positions[i] + sx;
      positions[offset + i + 1] = positions[i + 1] + sy;
      positions[offset + i + 2] = positions[i + 2] + sz;
    }
  }
}

/** Copy the first `count` per-particle values into image blocks 1.. */
export function replicateValues(
  values: Float32Array | Int32Array,
  count: number,
  numImages: number,
): void {
  for (let image = 1; image < numImages; image++) {
    values.copyWithin(image * count, 0, count);
  }
}

/** Number of real (non-image) particles in a rendered particle count. */
export function realParticleCount(
  renderedCount: number,
  shifts: ArrayLike<number> | undefined,
): number {
  const numImages = shifts ? shifts.length / 3 : 1;
  return numImages > 1 ? renderedCount / numImages : renderedCount;
}

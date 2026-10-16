import { syncParticleAttributes } from "../rendering/particleAttributes";
import Modifier, { ModifierProps } from "./modifier";
import { ModifierInput, ModifierOutput } from "./types";
import { Particles } from "omovi";
import {
  clampImageCounts,
  ImageCounts,
  imageShifts,
  replicatePositions,
  replicateValues,
} from "./periodicImages";

class SyncParticlesModifier extends Modifier {
  /** Periodic images per axis (visual only); 1×1×1 draws the box once. */
  public periodicImages: ImageCounts = [1, 1, 1];

  constructor({ name, active }: ModifierProps) {
    super({ name, active });
  }

  run = (
    input: ModifierInput,
    output: ModifierOutput,
    everything: boolean = false,
  ) => {
    if (!this.active) {
      if (output.particles) {
        output.particles.count = 0;
        if (output.particles.mesh) {
          output.particles.mesh.count = 0;
        }
      }
      return;
    }

    const numParticles = input.lammps.computeParticles();
    const shifts = this.currentImageShifts(input, numParticles);
    output.imageShifts = shifts;
    const numImages = shifts.length / 3;
    const numRendered = numParticles * numImages;
    let newParticles = output.particles;
    if (!newParticles || newParticles.capacity < numRendered) {
      let newCapacity = numRendered;
      if (newParticles) {
        newCapacity = Math.max(numRendered, 2 * newParticles.capacity);
        newParticles.dispose();
      }

      newParticles = new Particles(newCapacity);
      output.particles = newParticles;
      output.colorsDirty = true;
    } else {
      if (numRendered !== newParticles.count) {
        // Need to update colors and radius
        output.colorsDirty = true;
      }
    }

    const positionsPtr = input.lammps.getPositionsPointer() / 4;
    const typePtr = input.lammps.getTypePointer() / 4;
    const idPtr = input.lammps.getIdPointer() / 4;
    const positionsSubarray = input.wasm.HEAPF32.subarray(
      positionsPtr,
      positionsPtr + 3 * numParticles,
    ) as Float32Array;
    const typeSubarray = input.wasm.HEAP32.subarray(
      typePtr,
      typePtr + numParticles,
    ) as Int32Array;
    const idSubarray = input.wasm.HEAP32.subarray(
      idPtr,
      idPtr + numParticles,
    ) as Int32Array;

    newParticles.positions.set(positionsSubarray);
    newParticles.types.set(typeSubarray);
    newParticles.indices.set(idSubarray);
    if (numImages > 1) {
      // Images share their atom's ID, so styles set per ID apply to all.
      replicatePositions(newParticles.positions, numParticles, shifts);
      replicateValues(newParticles.types, numParticles, numImages);
      replicateValues(newParticles.indices, numParticles, numImages);
    }
    if (newParticles.count !== numRendered) {
      output.colorsDirty = true;
    }
    newParticles.count = numRendered;

    if (newParticles.mesh) {
      newParticles.mesh.count = numRendered;
    }

    syncParticleAttributes(input.renderState?.visualizer, newParticles);
    // Only positions and IDs stream every frame. Style attributes mark
    // themselves dirty when styles or the ID-to-instance mapping change.
    const geometry = newParticles.geometry;
    if (geometry) {
      geometry.getAttribute("particlePosition").needsUpdate = true;
      geometry.getAttribute("particleIndex").needsUpdate = true;
    }
    const radii = input.lammps.getParticleRadii?.();
    if (radii && input.renderState.visualizer) {
      for (let i = 0; i < numParticles; i++) {
        input.renderState.visualizer.setRadius(
          idSubarray[i],
          radii[i] * input.renderState.particleRadius,
        );
      }
    }
  };

  private currentImageShifts = (input: ModifierInput, numParticles: number) => {
    const counts = clampImageCounts(this.periodicImages, numParticles);
    if (counts[0] * counts[1] * counts[2] === 1) {
      return [0, 0, 0];
    }
    // Row-major float32 cell matrix whose rows are the box vectors a, b, c.
    const cellPtr = input.lammps.getCellMatrixPointer() / 4;
    const cell = input.wasm.HEAPF32.subarray(cellPtr, cellPtr + 9);
    return imageShifts(cell, counts);
  };
}

export default SyncParticlesModifier;

import { syncParticleAttributes } from "../rendering/particleAttributes";
import Modifier, { ModifierProps } from "./modifier";
import { ModifierInput, ModifierOutput } from "./types";
import { Particles } from "omovi";
import type { EngineFrame } from "../wasm/engineFrame";
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
    _everything: boolean = false,
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

    const frame = input.frame;
    const numParticles = frame.count;
    const shifts = this.currentImageShifts(frame, numParticles);
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

    // ids are persistent LAMMPS atom tags, paired index-by-index with
    // positions/types (the engine may reorder atoms between steps).
    const ids = frame.ids.subarray(0, numParticles);
    newParticles.positions.set(frame.positions.subarray(0, 3 * numParticles));
    newParticles.types.set(frame.types.subarray(0, numParticles));
    newParticles.indices.set(ids);
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
    const radii = frame.radii;
    if (radii && input.renderState.visualizer) {
      for (let i = 0; i < numParticles; i++) {
        input.renderState.visualizer.setRadius(
          ids[i],
          radii[i] * input.renderState.particleRadius,
        );
      }
    }
  };

  private currentImageShifts = (frame: EngineFrame, numParticles: number) => {
    const counts = clampImageCounts(this.periodicImages, numParticles);
    if (counts[0] * counts[1] * counts[2] === 1) {
      return [0, 0, 0];
    }
    // The frame's row-major cell matrix, whose rows are the box vectors a, b, c.
    return imageShifts(frame.boxMatrix, counts);
  };
}

export default SyncParticlesModifier;

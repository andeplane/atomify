import { syncParticleAttributes } from "../rendering/particleAttributes";
import Modifier, { ModifierProps } from "./modifier";
import { ModifierInput, ModifierOutput } from "./types";
import { Particles } from "omovi";

class SyncParticlesModifier extends Modifier {
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
    let newParticles = output.particles;
    if (!newParticles || newParticles.capacity < numParticles) {
      let newCapacity = numParticles;
      if (newParticles) {
        newCapacity = Math.max(numParticles, 2 * newParticles.capacity);
        newParticles.dispose();
      }

      newParticles = new Particles(newCapacity);
      output.particles = newParticles;
      output.colorsDirty = true;
    } else {
      if (numParticles !== newParticles.count) {
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
    if (newParticles.count !== numParticles) {
      output.colorsDirty = true;
    }
    newParticles.count = numParticles;

    if (newParticles.mesh) {
      newParticles.mesh.count = numParticles;
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
}

export default SyncParticlesModifier;

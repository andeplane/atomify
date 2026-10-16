import Modifier, { ModifierProps } from "./modifier";
import { ModifierInput, ModifierOutput } from "./types";
import { Bonds } from "omovi";
import { replicatePositions } from "./periodicImages";

class SyncBondsModifier extends Modifier {
  constructor({ name, active }: ModifierProps) {
    super({ name, active });
  }

  run = (input: ModifierInput, output: ModifierOutput) => {
    if (!this.active) {
      if (output.bonds) {
        output.bonds.count = 0;
        if (output.bonds.mesh) {
          output.bonds.mesh.count = 0;
        }
      }
      return;
    }

    const frame = input.frame;
    const numBonds = frame.bondCount;
    const shifts = output.imageShifts ?? [0, 0, 0];
    const numImages = shifts.length / 3;
    const numRendered = numBonds * numImages;
    const bondRadius = input.renderState.bondRadius;
    let newBonds = output.bonds;
    if (!newBonds || newBonds.capacity < numRendered) {
      const newCapacity = numRendered;
      if (newBonds) {
        newBonds.dispose();
      }

      newBonds = new Bonds(newCapacity);
      newBonds.indices.set(Array.from(Array(newCapacity).keys()));
      newBonds.radii.fill(bondRadius * 0.25);
      output.bonds = newBonds;
    }

    if (numBonds === 0) {
      newBonds.count = 0;
      if (newBonds.mesh) {
        newBonds.mesh.count = numBonds;
      }
      return newBonds;
    }

    newBonds.positions1.set(frame.bondFirst.subarray(0, 3 * numBonds));
    newBonds.positions2.set(frame.bondSecond.subarray(0, 3 * numBonds));
    // Shift both ends by the same image translation as the particles.
    replicatePositions(newBonds.positions1, numBonds, shifts);
    replicatePositions(newBonds.positions2, numBonds, shifts);

    newBonds.count = numRendered;
    if (newBonds.mesh) {
      newBonds.mesh.count = numRendered;
    }
    newBonds.markNeedsUpdate();
  };
}

export default SyncBondsModifier;

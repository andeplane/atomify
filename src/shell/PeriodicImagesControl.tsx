/**
 * Periodic images control for the run viewport: per-axis copy counts for
 * SyncParticlesModifier.periodicImages. Visual only.
 */

import { useState } from "react";
import { useEngine, useStoreActions, useStoreState } from "../hooks";
import SyncParticlesModifier from "../modifiers/syncparticlesmodifier";
import {
  clampImageCounts,
  ImageCounts,
  MAX_IMAGES_PER_AXIS,
  MAX_RENDERED_PARTICLES,
} from "../modifiers/periodicImages";
import { GhostButton, Popover, SectionLabel } from "./ui";

const AXES = ["x", "y", "z"] as const;

const PeriodicImagesControl = ({ live }: { live: boolean }) => {
  const modifier = useEngine().modifiers.find(
    (m): m is SyncParticlesModifier => m instanceof SyncParticlesModifier,
  );
  const numAtoms = useStoreState((state) => state.simulationStatus.numAtoms);
  const refreshRendering = useStoreActions(
    (actions) => actions.processing.runPostTimestepRendering,
  );
  const runPostTimestep = useStoreActions(
    (actions) => actions.processing.runPostTimestep,
  );
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<ImageCounts>(
    () => modifier?.periodicImages ?? [1, 1, 1],
  );
  if (!modifier) return null;

  const setAxis = (axis: number, value: number) => {
    const next = [...counts] as ImageCounts;
    next[axis] = Math.min(
      MAX_IMAGES_PER_AXIS,
      Math.max(1, Math.floor(value) || 1),
    );
    setCounts(next);
    modifier.periodicImages = next;
    // A live run pushes particles to the view; a finished one needs the full
    // pass so the (possibly reallocated) particles reach the render store.
    const refresh = live ? refreshRendering() : runPostTimestep(true);
    void Promise.resolve(refresh).catch((error) =>
      console.error("Periodic images refresh failed:", error),
    );
  };

  const effective = clampImageCounts(counts, numAtoms);
  const capped = effective.some((n, axis) => n !== counts[axis]);

  return (
    <div style={{ position: "relative" }}>
      <GhostButton
        data-testid="periodic-images"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
      >
        Images {counts.join("×")}
      </GhostButton>
      <Popover
        open={open}
        onClose={() => setOpen(false)}
        minWidth={236}
        testId="periodic-images-menu"
      >
        <div style={{ padding: 8, display: "grid", gap: 10 }}>
          <SectionLabel>Periodic images</SectionLabel>
          <div style={{ display: "flex", gap: 8 }}>
            {AXES.map((label, axis) => (
              <label
                key={label}
                style={{
                  display: "grid",
                  gap: 4,
                  fontSize: 12,
                  color: "var(--text-2)",
                }}
              >
                {label}
                <input
                  className="shell-input"
                  aria-label={`Images along ${label}`}
                  type="number"
                  min={1}
                  max={MAX_IMAGES_PER_AXIS}
                  step={1}
                  value={counts[axis]}
                  onChange={(e) => setAxis(axis, Number(e.target.value))}
                  style={{ width: 64, padding: "8px 10px" }}
                />
              </label>
            ))}
          </div>
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>
            {capped
              ? `Showing ${effective.join("×")}: at most ${MAX_RENDERED_PARTICLES.toLocaleString()} atoms are drawn.`
              : "Copies shifted by the box vectors. Display only."}
          </span>
        </div>
      </Popover>
    </div>
  );
};

export default PeriodicImagesControl;

/**
 * Compact slice control for the run viewport: a "Slice" button whose popover
 * edits the SliceModifier (normal, slab position and width, invert).
 */

import { useCallback, useState } from "react";
import type * as THREE from "three";
import { useStoreActions, useStoreState } from "../hooks";
import SliceModifier, {
  sliceNormal,
  type SliceAxis,
  type Vector3Tuple,
} from "../modifiers/slicemodifier";
import { extractBasisVectors } from "../utils/boxGeometry";
import { GhostButton, MONO, Popover, ToggleSwitch } from "./ui";

const AXES: SliceAxis[] = ["x", "y", "z", "custom"];

/** Extent of the simulation box projected onto a unit normal. */
export function boxRangeAlong(
  normal: Vector3Tuple,
  box: THREE.Matrix3 | undefined,
  origo: THREE.Vector3 | undefined,
): [number, number] {
  if (!box || !origo) return [-50, 50];
  const { a, b, c } = extractBasisVectors(box);
  let min = Infinity;
  let max = -Infinity;
  for (let corner = 0; corner < 8; corner++) {
    const p = origo.clone();
    if (corner & 1) p.add(a);
    if (corner & 2) p.add(b);
    if (corner & 4) p.add(c);
    const d = p.x * normal[0] + p.y * normal[1] + p.z * normal[2];
    min = Math.min(min, d);
    max = Math.max(max, d);
  }
  return max > min ? [min, max] : [min - 1, max + 1];
}

const rowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  fontSize: 12.5,
  color: "var(--text-2)",
} as const;

const SliceControls = () => {
  const [open, setOpen] = useState(false);
  // Stable, so the popover's outside-click listener isn't re-armed on every
  // render while the run streams updates.
  const close = useCallback(() => setOpen(false), []);
  const sliceModifier = useStoreState((state) =>
    state.processing.postTimestepModifiers.find(
      (modifier): modifier is SliceModifier =>
        modifier instanceof SliceModifier,
    ),
  );
  const box = useStoreState((state) => state.simulationStatus.box);
  const origo = useStoreState((state) => state.simulationStatus.origo);
  const refreshRendering = useStoreActions(
    (actions) => actions.processing.runPostTimestepRendering,
  );
  // The modifier is a plain mutable object; bump to re-render after edits.
  const [, setVersion] = useState(0);

  if (!sliceModifier) return null;
  const slice = sliceModifier;
  const normal = sliceNormal(slice.axis, slice.customNormal);
  const [min, max] = boxRangeAlong(normal ?? [0, 0, 1], box, origo);
  const extent = max - min;
  const step = extent / 500;

  const update = (patch: Partial<SliceModifier>) => {
    Object.assign(slice, patch);
    setVersion((version) => version + 1);
    void refreshRendering();
  };
  // Center a slab of a fifth of the box along the (new) normal.
  const recentered = (axis: SliceAxis, custom: Vector3Tuple) => {
    const [lo, hi] = boxRangeAlong(
      sliceNormal(axis, custom) ?? [0, 0, 1],
      box,
      origo,
    );
    return { position: (lo + hi) / 2, width: (hi - lo) / 5 };
  };
  const toggle = () => {
    const outside =
      slice.width <= 0 ||
      slice.position + slice.width / 2 < min ||
      slice.position - slice.width / 2 > max;
    update({
      active: !slice.active,
      ...(!slice.active && outside
        ? recentered(slice.axis, slice.customNormal)
        : {}),
    });
  };
  const setCustomComponent = (index: number, value: number) => {
    const customNormal = [...slice.customNormal] as Vector3Tuple;
    customNormal[index] = Number.isFinite(value) ? value : 0;
    update({ customNormal, ...recentered("custom", customNormal) });
  };

  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <GhostButton
        data-testid="slice-atoms"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        style={
          slice.active
            ? { border: "1px solid var(--accent)", color: "var(--accent)" }
            : undefined
        }
      >
        Slice{slice.active ? " on" : ""}
      </GhostButton>
      <Popover
        open={open}
        onClose={close}
        minWidth={264}
        align="left"
        testId="slice-popover"
      >
        <div
          style={{
            padding: "8px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={rowStyle}>
            <span style={{ fontWeight: 700, color: "var(--text)" }}>
              Show only a slab
            </span>
            <ToggleSwitch
              on={slice.active}
              onToggle={toggle}
              data-testid="slice-toggle"
              aria-label="Slice"
            />
          </div>
          <div style={rowStyle}>
            <span>Normal</span>
            <div style={{ display: "flex", gap: 4 }}>
              {AXES.map((axis) => (
                <button
                  key={axis}
                  data-testid={`slice-axis-${axis}`}
                  aria-pressed={slice.axis === axis}
                  onClick={() =>
                    update({
                      axis,
                      ...recentered(axis, slice.customNormal),
                    })
                  }
                  style={{
                    padding: "3px 8px",
                    borderRadius: 7,
                    border: "1px solid var(--border-strong)",
                    background:
                      slice.axis === axis ? "var(--accent)" : "transparent",
                    color: slice.axis === axis ? "#fff" : "var(--text-2)",
                    fontFamily: axis === "custom" ? "inherit" : MONO,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {axis}
                </button>
              ))}
            </div>
          </div>
          {slice.axis === "custom" && (
            <div style={{ display: "flex", gap: 6 }}>
              {slice.customNormal.map((value, index) => (
                <input
                  key={index}
                  type="number"
                  step={0.1}
                  aria-label={`Normal ${"xyz"[index]}`}
                  value={value}
                  onChange={(event) =>
                    setCustomComponent(index, Number(event.target.value))
                  }
                  style={{ width: "100%", minWidth: 0, fontFamily: MONO }}
                />
              ))}
            </div>
          )}
          {[
            {
              key: "position" as const,
              label: "Position",
              lo: min,
              hi: max,
            },
            { key: "width" as const, label: "Width", lo: 0, hi: extent },
          ].map(({ key, label, lo, hi }) => (
            <div key={key}>
              <div style={{ ...rowStyle, marginBottom: 7 }}>
                <span>{label}</span>
                <span
                  style={{
                    color: "var(--text)",
                    fontWeight: 600,
                    fontFamily: MONO,
                  }}
                >
                  {slice[key].toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                data-testid={`slice-${key}`}
                aria-label={label}
                min={lo}
                max={hi}
                step={step}
                value={Math.min(hi, Math.max(lo, slice[key]))}
                disabled={!normal}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  update(
                    key === "position" ? { position: value } : { width: value },
                  );
                }}
                style={{ width: "100%" }}
              />
            </div>
          ))}
          <div style={rowStyle}>
            <span>Invert (hide the slab)</span>
            <ToggleSwitch
              on={slice.invert}
              onToggle={() => update({ invert: !slice.invert })}
              data-testid="slice-invert"
              aria-label="Invert slice"
            />
          </div>
        </div>
      </Popover>
    </span>
  );
};

export default SliceControls;

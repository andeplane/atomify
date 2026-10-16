/**
 * Compact slice control for the run viewport: a "Slice" button whose popover
 * edits the SliceModifier (normal, slab position and width, invert).
 */

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type * as THREE from "three";
import { useEngine } from "../engine/EngineContext";
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

type Span = { left: number; right: number };

/**
 * Which anchor edge a popover of `width` should line up with so it stays
 * inside `bounds`: left (extends right) when it fits, else right (extends
 * left), else whichever side has more room.
 */
export function choosePopoverAlign(
  anchor: Span,
  bounds: Span,
  width: number,
): "left" | "right" {
  if (anchor.left + width <= bounds.right) return "left";
  if (anchor.right - width >= bounds.left) return "right";
  return bounds.right - anchor.left >= anchor.right - bounds.left
    ? "left"
    : "right";
}

/** Horizontal extent of the nearest ancestor that clips overflow. */
function clipBounds(element: HTMLElement): Span {
  const viewport = { left: 0, right: document.documentElement.clientWidth };
  for (let el = element.parentElement; el; el = el.parentElement) {
    if (getComputedStyle(el).overflowX !== "visible") {
      const rect = el.getBoundingClientRect();
      return {
        left: Math.max(rect.left, viewport.left),
        right: Math.min(rect.right, viewport.right),
      };
    }
  }
  return viewport;
}

/**
 * One custom-normal component. Keeps the typed text as a draft so clearing
 * the field or typing "-" mid-edit doesn't snap it to 0; only a finite
 * number is committed, and on blur an unfinished draft reverts.
 */
export const NormalInput = ({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
}) => {
  const [draft, setDraft] = useState(String(value));
  const [shown, setShown] = useState(value);
  if (shown !== value) {
    setShown(value);
    setDraft(String(value));
  }
  const parse = (text: string) => {
    const next = text.trim() === "" ? NaN : Number(text);
    return Number.isFinite(next) ? next : undefined;
  };

  return (
    <input
      type="number"
      step={0.1}
      aria-label={`Normal ${label}`}
      value={draft}
      onChange={(event) => {
        setDraft(event.target.value);
        const next = parse(event.target.value);
        if (next !== undefined && next !== value) onCommit(next);
      }}
      onBlur={() => {
        if (parse(draft) === undefined) setDraft(String(value));
      }}
      style={{ width: "100%", minWidth: 0, fontFamily: MONO }}
    />
  );
};

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
  const sliceModifier = useEngine().modifiers.find(
    (modifier): modifier is SliceModifier => modifier instanceof SliceModifier,
  );
  const sliceActive = sliceModifier?.active;
  // Line the popover up with whichever button edge keeps it inside the
  // clipping column: the button can sit at the right end of the header or,
  // when the header wraps, at the left edge. Measured before paint on open
  // and on toggling, since the "Slice on" label can re-wrap the header.
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const [align, setAlign] = useState<"left" | "right">("left");
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const popover = anchor?.querySelector<HTMLElement>(
      '[data-testid="slice-popover"]',
    );
    if (!open || !anchor || !popover) return;
    setAlign(
      choosePopoverAlign(
        anchor.getBoundingClientRect(),
        clipBounds(anchor),
        popover.offsetWidth,
      ),
    );
  }, [open, sliceActive]);
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
    customNormal[index] = value;
    update({ customNormal, ...recentered("custom", customNormal) });
  };

  return (
    <span
      ref={anchorRef}
      style={{ position: "relative", display: "inline-flex" }}
    >
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
        align={align}
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
                <NormalInput
                  key={index}
                  label={"xyz"[index]}
                  value={value}
                  onCommit={(next) => setCustomComponent(index, next)}
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

import { useEffect, useState, type CSSProperties } from "react";
import { scaleBarSize } from "../utils/scaleBar";

interface ScaleBarProps {
  /**
   * World length per CSS pixel, or undefined when no scale applies. Polled
   * every animation frame so the bar follows zoom, resize and camera changes.
   */
  getUnitsPerPixel: () => number | undefined;
  /** Length unit of the simulation; the label omits it when unknown. */
  unit?: string;
}

// The 3D viewport stays dark in both themes, so the bar uses the media tokens
// (src/shell/tokens.ts) like the other controls floating on it.
const containerStyle: CSSProperties = {
  position: "absolute",
  bottom: 20,
  right: 20,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  padding: "8px 12px",
  background: "var(--media-control-bg)",
  backdropFilter: "blur(8px)",
  border: "1px solid var(--media-control-border)",
  borderRadius: "var(--radius)",
  color: "var(--media-text)",
  fontSize: 13,
  fontVariantNumeric: "tabular-nums",
  pointerEvents: "none",
  zIndex: 1000,
};

const ScaleBar = ({ getUnitsPerPixel, unit }: ScaleBarProps) => {
  const [unitsPerPixel, setUnitsPerPixel] = useState(getUnitsPerPixel);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      // Unchanged values bail out of the re-render.
      setUnitsPerPixel(getUnitsPerPixel());
      frame = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(frame);
  }, [getUnitsPerPixel]);

  if (unitsPerPixel === undefined) {
    return null;
  }

  const { length, widthPx } = scaleBarSize(unitsPerPixel);
  return (
    <div data-testid="scale-bar" style={containerStyle}>
      <div>{unit ? `${length} ${unit}` : length}</div>
      <div
        data-testid="scale-bar-line"
        style={{
          width: widthPx,
          height: 6,
          border: "2px solid var(--media-text)",
          borderTop: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
};

export default ScaleBar;

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

// Light on dark in both themes: the 3D viewport background is always dark.
const containerStyle: CSSProperties = {
  position: "absolute",
  bottom: 20,
  right: 20,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  padding: "8px 12px",
  background: "rgba(42, 41, 47, 0.6)",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: 10,
  color: "#fff",
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
          border: "2px solid #fff",
          borderTop: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
};

export default ScaleBar;

import { SettingOutlined } from "@ant-design/icons";
import colormap from "colormap";
import { useEffect, useRef } from "react";

interface ColorLegendProps {
  computeName: string;
  minValue: number;
  maxValue: number;
  type?: "compute" | "fix" | "variable";
  colormap?: string;
  onSettingsClick?: () => void;
}

const ColorLegend = ({
  computeName,
  minValue,
  maxValue,
  type,
  colormap: colormapName = "jet",
  onSettingsClick,
}: ColorLegendProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size (higher resolution for better quality)
    canvas.width = 300;
    canvas.height = 30;

    const colors = colormap({
      colormap: colormapName,
      nshades: 72,
      format: "float",
      alpha: 1,
    });

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);

    colors.forEach((color, index) => {
      const position = index / (colors.length - 1);
      const r = Math.floor(color[0] * 255);
      const g = Math.floor(color[1] * 255);
      const b = Math.floor(color[2] * 255);
      gradient.addColorStop(position, `rgb(${r}, ${g}, ${b})`);
    });

    // Draw gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [colormapName]);

  const formatValue = (value: number): string => {
    if (!Number.isFinite(value)) {
      return "N/A";
    }
    // Format to 3 significant figures
    if (Math.abs(value) < 0.01 || Math.abs(value) > 1000) {
      return value.toExponential(2);
    }
    return value.toPrecision(3);
  };

  const formatTitle = (): string => {
    if (type) {
      const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
      return `${computeName} (${capitalizedType})`;
    }
    return computeName;
  };

  return (
    <div className="color-legend">
      {onSettingsClick && (
        <div style={{ position: "absolute", top: "8px", right: "8px", zIndex: 1 }}>
          <SettingOutlined
            onClick={onSettingsClick}
            className="color-legend-settings-icon"
            style={{
              color: "#fff",
              fontSize: "16px",
              cursor: "pointer",
            }}
          />
        </div>
      )}
      <div style={{ fontWeight: "bold", marginBottom: "8px", fontSize: "13px" }}>
        {formatTitle()}
      </div>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "20px",
          borderRadius: "4px",
          marginBottom: "8px",
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
        <span style={{ opacity: 0.8 }}>Min:</span>
        <span style={{ fontWeight: "bold" }}>{formatValue(minValue)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
        <span style={{ opacity: 0.8 }}>Max:</span>
        <span style={{ fontWeight: "bold" }}>{formatValue(maxValue)}</span>
      </div>
    </div>
  );
};

export default ColorLegend;

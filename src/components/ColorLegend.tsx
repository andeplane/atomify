import { useEffect, useRef } from "react";
import styled from "styled-components";
import colormap from "colormap";

const LegendContainer = styled.div`
  position: fixed;
  bottom: 80px;
  left: 20px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  padding: 12px 16px;
  color: white;
  font-family: monospace;
  font-size: 12px;
  z-index: 1000;
  min-width: 180px;
`;

const LegendTitle = styled.div`
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 13px;
`;

const GradientCanvas = styled.canvas`
  width: 100%;
  height: 20px;
  border-radius: 4px;
  margin-bottom: 8px;
`;

const ValueRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
`;

const ValueLabel = styled.span`
  opacity: 0.8;
`;

const ValueText = styled.span`
  font-weight: bold;
`;

interface ColorLegendProps {
  computeName: string;
  minValue: number;
  maxValue: number;
}

const ColorLegend = ({ computeName, minValue, maxValue }: ColorLegendProps) => {
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
      colormap: "jet",
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
  }, []);

  const formatValue = (value: number): string => {
    // Format to 3 significant figures
    if (Math.abs(value) < 0.01 || Math.abs(value) > 1000) {
      return value.toExponential(2);
    }
    return value.toPrecision(3);
  };

  return (
    <LegendContainer>
      <LegendTitle>{computeName}</LegendTitle>
      <GradientCanvas ref={canvasRef} />
      <ValueRow>
        <ValueLabel>Min:</ValueLabel>
        <ValueText>{formatValue(minValue)}</ValueText>
      </ValueRow>
      <ValueRow>
        <ValueLabel>Max:</ValueLabel>
        <ValueText>{formatValue(maxValue)}</ValueText>
      </ValueRow>
    </LegendContainer>
  );
};

export default ColorLegend;

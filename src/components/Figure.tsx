import { Modal, Empty } from "antd";
import { Compute, Fix, Variable, PlotData } from "../types";
import { useEffect, useState, useId, useMemo, useRef } from "react";
import { useStoreState } from "../hooks";
import Dygraph from "dygraphs";

type FigureProps = {
  onClose: () => void;
  onToggleSyncDataPoints?: (
    name: string,
    type: "compute" | "fix" | "variable",
    value: boolean,
  ) => void;
} & (
  | {
      modifier: Fix | Compute | Variable;
      modifierType: "compute" | "fix" | "variable";
      plotData?: never;
    }
  | {
      modifier?: never;
      modifierType?: never;
      plotData: PlotData;
    }
);

const Figure = ({
  modifier,
  modifierType,
  plotData,
  onClose,
  onToggleSyncDataPoints,
}: FigureProps) => {
  const [graph, setGraph] = useState<Dygraph>();
  const timesteps = useStoreState((state) => state.simulationStatus.timesteps);
  const graphId = useId();
  const width =
    window.innerWidth < 1000
      ? window.innerWidth * 0.8
      : window.innerWidth * 0.6;
  const height = (width * 3) / 4;

  // Extract plot configuration from either modifier or plotData
  const plotConfig = useMemo(() => {
    const source = modifier || plotData;
    // The `FigureProps` type guarantees that `source` will always be defined.
    return {
      data1D: source.data1D,
      xLabel: source.xLabel,
      yLabel: source.yLabel,
      name: source.name,
    };
  }, [
    modifier?.name,
    modifier?.xLabel,
    modifier?.yLabel,
    modifier?.data1D,
    plotData?.name,
    plotData?.xLabel,
    plotData?.yLabel,
    plotData?.data1D,
  ]);

  // Only set syncDataPoints when a modifier is provided
  // Use ref to track previous modifier name to detect actual changes
  const prevModifierNameRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (modifier && modifierType && onToggleSyncDataPoints) {
      const modifierName = modifier.name;
      const prevModifierName = prevModifierNameRef.current;

      // Only update if modifier name actually changed (not just object reference)
      if (prevModifierName !== modifierName) {
        // Cleanup previous modifier if name changed
        if (prevModifierName !== undefined) {
          onToggleSyncDataPoints(prevModifierName, modifierType, false);
        }

        // Set up new modifier
        onToggleSyncDataPoints(modifierName, modifierType, true);
        prevModifierNameRef.current = modifierName;
      }

      return () => {
        // Cleanup on unmount
        if (prevModifierNameRef.current !== undefined) {
          onToggleSyncDataPoints(
            prevModifierNameRef.current,
            modifierType,
            false,
          );
          prevModifierNameRef.current = undefined;
        }
      };
    } else {
      // Reset ref when modifier is removed
      prevModifierNameRef.current = undefined;
    }
  }, [modifier, modifierType, onToggleSyncDataPoints]);

  useEffect(() => {
    if (plotConfig?.data1D && !graph) {
      const g = new Dygraph(graphId, plotConfig.data1D.data, {
        labels: plotConfig.data1D.labels,
        xlabel: plotConfig.xLabel,
        ylabel: plotConfig.yLabel,
        title: plotConfig.name,
        width: width - 50, // Extra 50 is padding for the figure
        height,
        legend: "always",
        // Dark theme styling
        colors: [
          "#40a9ff",
          "#52c41a",
          "#f5222d",
          "#fa8c16",
          "#13c2c2",
          "#eb2f96",
          "#722ed1",
        ],
        legendFormatter: function (data) {
          if (data.x == null) {
            return "";
          }
          let html = '<div class="dygraph-custom-legend">';
          data.series.forEach(function (series) {
            if (!series.isVisible) return;
            const color = series.color;
            html +=
              '<span class="dygraph-legend-dot" style="color: ' +
              color +
              ';">● </span>';
            html += series.labelHTML + ": " + series.yHTML + "<br/>";
          });
          html += "</div>";
          return html;
        },
      });
      setGraph(g);
    }
  }, [plotConfig, graph, height, width, graphId]);

  useEffect(() => {
    if (graph && plotConfig?.data1D) {
      graph.updateOptions({ file: plotConfig.data1D.data });
    }
  }, [graph, plotConfig, timesteps]);

  return (
    <Modal open width={width} footer={null} onCancel={onClose}>
      <div id={graphId} />
      {!graph && <Empty />}
    </Modal>
  );
};
export default Figure;

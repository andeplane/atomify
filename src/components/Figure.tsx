import { Modal, Empty, Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { Compute, Fix, Variable, PlotData } from "../types";
import {
  useEffect,
  useState,
  useId,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useStoreState } from "../hooks";
import Dygraph from "dygraphs";
import { exportPlotDataToCsv } from "../utils/exportCsv";

/** Legacy default figure size: most of the window, 4:3. */
export function defaultFigureWidth(): number {
  return window.innerWidth < 1000
    ? window.innerWidth * 0.8
    : window.innerWidth * 0.6;
}

type FigureSourceProps =
  | {
      modifier: Fix | Compute | Variable;
      modifierType: "compute" | "fix" | "variable";
      plotData?: never;
    }
  | {
      modifier?: never;
      modifierType?: never;
      plotData: PlotData;
    };

export type FigureGraphProps = {
  onToggleSyncDataPoints?: (
    name: string,
    type: "compute" | "fix" | "variable",
    value: boolean,
  ) => void;
  width?: number;
  height?: number;
  /** Rendered while there is no data to plot yet. */
  placeholder?: ReactNode;
} & FigureSourceProps;

/**
 * The live dygraphs plot itself (no modal chrome): builds the graph from a
 * compute/fix/variable (or raw PlotData), turns per-timestep data-point
 * syncing on for the modifier while mounted, and refreshes the plot on every
 * synced timestep. Wrapped by the legacy antd Figure below and by the shell's
 * run-detail analysis modal (src/shell/RunAnalysis.tsx).
 */
export const FigureGraph = ({
  modifier,
  modifierType,
  plotData,
  onToggleSyncDataPoints,
  width,
  height,
  placeholder,
}: FigureGraphProps) => {
  const [graph, setGraph] = useState<Dygraph>();
  const timesteps = useStoreState((state) => state.simulationStatus.timesteps);
  const graphId = useId();
  const graphWidth = width ?? defaultFigureWidth();
  const graphHeight = height ?? (graphWidth * 3) / 4;

  // Extract plot configuration from either modifier or plotData
  const plotConfig = useMemo(() => {
    const source = modifier || plotData;
    // The `FigureGraphProps` type guarantees that `source` will always be defined.
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
    // Keyed on the modifier NAME, not the object: store updates (immer)
    // recreate the entry object every toggle/sync, and re-running the
    // cleanup/setup cycle on identity changes would flip syncDataPoints
    // off/on forever. The body only acts on name changes anyway.
  }, [modifier?.name, modifierType, onToggleSyncDataPoints]);

  useEffect(() => {
    if (plotConfig?.data1D && !graph) {
      const g = new Dygraph(graphId, plotConfig.data1D.data, {
        labels: plotConfig.data1D.labels,
        xlabel: plotConfig.xLabel,
        ylabel: plotConfig.yLabel,
        title: plotConfig.name,
        width: graphWidth - 50, // Extra 50 is padding for the figure
        height: graphHeight,
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
  }, [plotConfig, graph, graphHeight, graphWidth, graphId]);

  useEffect(() => {
    if (!graph) {
      return;
    }
    return () => {
      graph.destroy();
    };
  }, [graph]);

  useEffect(() => {
    if (graph && plotConfig?.data1D) {
      graph.updateOptions({ file: plotConfig.data1D.data });
    }
  }, [graph, plotConfig, timesteps]);

  return (
    <>
      <div id={graphId} />
      {!graph && placeholder}
    </>
  );
};

/** Sanitize a plot name into a safe CSV filename. */
export function figureCsvFilename(name: string): string {
  return `${name.replace(/[\s/\\?%*:"|<>]/g, "-")}.csv`;
}

type FigureProps = {
  onClose: () => void;
  onToggleSyncDataPoints?: (
    name: string,
    type: "compute" | "fix" | "variable",
    value: boolean,
  ) => void;
} & FigureSourceProps;

const Figure = ({
  modifier,
  modifierType,
  plotData,
  onClose,
  onToggleSyncDataPoints,
}: FigureProps) => {
  // Subscribe to synced timesteps so the Export CSV button appears as soon
  // as the (in-place mutated) modifier grows its data1D series.
  useStoreState((state) => state.simulationStatus.timesteps);
  const width = defaultFigureWidth();
  const source = modifier || plotData;

  const handleExportCsv = () => {
    if (source.data1D) {
      exportPlotDataToCsv(source.data1D, figureCsvFilename(source.name));
    }
  };

  return (
    <Modal open width={width} footer={null} onCancel={onClose}>
      {source.data1D && (
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExportCsv}
          style={{ marginBottom: 16 }}
        >
          Export CSV
        </Button>
      )}
      {modifier ? (
        <FigureGraph
          modifier={modifier}
          modifierType={modifierType}
          onToggleSyncDataPoints={onToggleSyncDataPoints}
          placeholder={<Empty />}
        />
      ) : (
        <FigureGraph plotData={plotData} placeholder={<Empty />} />
      )}
    </Modal>
  );
};
export default Figure;

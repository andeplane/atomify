import { Modal, Empty } from "antd";
import { Compute, Fix, Variable, PlotData } from "../types";
import { useEffect, useState, useId, useMemo } from "react";
import { useStoreState } from "../hooks";
import Dygraph from "dygraphs";

type FigureProps = {
  onClose: () => void;
} & (
  | {
      modifier: Fix | Compute | Variable;
      plotData?: never;
    }
  | {
      modifier?: never;
      plotData: PlotData;
    }
);

const Figure = ({ modifier, plotData, onClose }: FigureProps) => {
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
    if (modifier) {
      return {
        data1D: modifier.data1D,
        xLabel: modifier.xLabel,
        yLabel: modifier.yLabel,
        name: modifier.name,
      };
    } else if (plotData) {
      return {
        data1D: plotData.data1D,
        xLabel: plotData.xLabel,
        yLabel: plotData.yLabel,
        name: plotData.name,
      };
    }
    return null;
  }, [modifier, plotData]);

  // Only set syncDataPoints when a modifier is provided
  useEffect(() => {
    if (modifier) {
      modifier.syncDataPoints = true;
      return () => {
        modifier.syncDataPoints = false;
      };
    }
  }, [modifier]);

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
        colors: ['#40a9ff', '#52c41a', '#f5222d', '#fa8c16', '#13c2c2', '#eb2f96', '#722ed1'],
        legendFormatter: function(data) {
          if (data.x == null) {
            return '';
          }
          let html = '<div class="dygraph-custom-legend">';
          data.series.forEach(function(series) {
            if (!series.isVisible) return;
            const color = series.color;
            html += '<span class="dygraph-legend-dot" style="color: ' + color + ';">● </span>';
            html += series.labelHTML + ': ' + series.yHTML + '<br/>';
          });
          html += '</div>';
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

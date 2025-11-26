import { Modal, Empty } from "antd";
import { Compute, Fix, Variable } from "../types";
import { useEffect, useState } from "react";
import { useStoreState } from "../hooks";
import Dygraph from "dygraphs";

interface FigureProps {
  modifier: Fix | Compute | Variable;
  onClose: () => void;
}
const Figure = ({ modifier, onClose }: FigureProps) => {
  const [graph, setGraph] = useState<Dygraph>();
  const timesteps = useStoreState((state) => state.simulationStatus.timesteps);
  const width =
    window.innerWidth < 1000
      ? window.innerWidth * 0.8
      : window.innerWidth * 0.6;
  const height = (width * 3) / 4;

  useEffect(() => {
    modifier.syncDataPoints = true;
    return () => {
      modifier.syncDataPoints = false;
    };
  }, [modifier]);

  useEffect(() => {
    if (modifier.data1D && !graph) {
      const g = new Dygraph("graph", modifier.data1D.data, {
        labels: modifier.data1D.labels,
        xlabel: modifier.xLabel,
        ylabel: modifier.yLabel,
        title: modifier.name,
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
  }, [modifier, graph, height, width]);

  useEffect(() => {
    if (graph && modifier.data1D) {
      graph.updateOptions({ file: modifier.data1D.data });
    }
  }, [graph, modifier, timesteps]);

  return (
    <Modal open width={width} footer={null} onCancel={onClose}>
      <div id="graph" />
      {!graph && <Empty />}
    </Modal>
  );
};
export default Figure;

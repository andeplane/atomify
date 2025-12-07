import { useStoreState, useStoreActions } from "../hooks";
import { Slider, Button } from "antd";
import { MinusOutlined, ExpandOutlined } from "@ant-design/icons";
import { track } from "../utils/metrics";

interface SimulationSummaryProps {
  onShowMore?: () => void;
  isCollapsed?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
}

const SimulationSummary = ({ 
  onShowMore, 
  isCollapsed = false, 
  onExpand,
  onCollapse
}: SimulationSummaryProps) => {
  const simulationSettings = useStoreState(
    (state) => state.settings.simulation,
  );
  const setSimulationSettings = useStoreActions(
    (actions) => actions.settings.setSimulation,
  );
  const simulation = useStoreState((state) => state.simulation.simulation);
  const runType = useStoreState((state) => state.simulationStatus.runType);
  const numAtoms = useStoreState((state) => state.simulationStatus.numAtoms);
  const numBonds = useStoreState((state) => state.simulationStatus.numBonds);
  const timesteps = useStoreState((state) => state.simulationStatus.timesteps);
  const remainingTime = useStoreState(
    (state) => state.simulationStatus.remainingTime,
  );
  const timestepsPerSecond = useStoreState(
    (state) => state.simulationStatus.timestepsPerSecond,
  );

  const setSyncFrequency = (value: number | null) => {
    if (value && value > 0) {
      track("SimulationSpeed.Change", { speed: value });
      setSimulationSettings({ ...simulationSettings, speed: value });
    }
  };

  const handleShowMore = () => {
    if (onShowMore) {
      track("SimulationSummary.ShowMore");
      onShowMore();
    }
  };

  const handleExpand = () => {
    if (onExpand) {
      track("SimulationSummary.Expand");
      onExpand();
    }
  };

  const handleCollapse = () => {
    if (onCollapse) {
      track("SimulationSummary.Collapse");
      onCollapse();
    }
  };

  if (isCollapsed) {
    return (
      <div className="simulationsummary simulationsummary-collapsed">
        {/* No buttons when collapsed - just clickable text */}
        <button type="button" onClick={handleExpand}>
          <div>
            Show simulation summary
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="simulationsummary">
      {simulation && (
        <>
          <div className="simulation-summary-minimize-button" style={{ display: 'flex', gap: '4px' }}>
            {onCollapse && (
              <Button
                type="text"
                icon={<MinusOutlined />}
                onClick={handleCollapse}
                style={{ color: '#fff', padding: 0 }}
                title="Collapse"
              />
            )}
            {onShowMore && (
              <Button
                type="text"
                icon={<ExpandOutlined />}
                onClick={handleShowMore}
                style={{ color: '#fff', padding: 0 }}
                title="Expand"
              />
            )}
          </div>
          <div>
            Type: {runType}
            <br />
            Timesteps: {Math.ceil(timesteps)}
            <br />
            Number of atoms: {Math.ceil(numAtoms)}
            <br />
            Number of bonds: {Math.ceil(numBonds)}
            <br />
            Remaining time: {Math.ceil(remainingTime)} s<br />
            Timesteps per second: {Math.ceil(timestepsPerSecond)} <br />
            Simulation speed:{" "}
            <Slider
              min={1}
              step={2}
              max={200}
              defaultValue={simulationSettings.speed}
              onChange={(value) => setSyncFrequency(value)}
            />
          </div>
        </>
      )}
    </div>
  );
};
export default SimulationSummary;

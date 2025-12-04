import { useStoreState, useStoreActions } from "../hooks";
import { Slider, Button } from "antd";
import { MinusOutlined } from "@ant-design/icons";
import { track } from "../utils/metrics";

interface SimulationSummaryOverlayProps {
  onShowMore?: () => void;
  isCollapsed?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
}

const SimulationSummaryOverlay = ({ 
  onShowMore, 
  isCollapsed = false, 
  onExpand,
  onCollapse
}: SimulationSummaryOverlayProps) => {
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
      <button type="button" className="simulationsummary simulationsummary-collapsed" onClick={handleExpand}>
        <div>
          Show simulation summary
        </div>
      </button>
    );
  }

  return (
    <div className="simulationsummary">
      {simulation && (
        <>
          {onCollapse && (
            <div className="simulation-summary-minimize-button">
              <Button
                type="text"
                icon={<MinusOutlined />}
                onClick={handleCollapse}
                style={{ color: '#fff', padding: 0 }}
              />
            </div>
          )}
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
            {onShowMore && (
              <div className="show-more-container">
                <Button
                  type="link"
                  onClick={handleShowMore}
                  className="show-more-button"
                >
                  Show more →
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
export default SimulationSummaryOverlay;

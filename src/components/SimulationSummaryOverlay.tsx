import { useStoreState, useStoreActions } from "../hooks";
import { Slider, Button } from "antd";
import { track } from "../utils/metrics";

interface SimulationSummaryOverlayProps {
  onShowMore: () => void;
}

const SimulationSummaryOverlay = ({ onShowMore }: SimulationSummaryOverlayProps) => {
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
    track("SimulationSummary.ShowMore");
    onShowMore();
  };

  return (
    <div className="simulationsummary">
      {simulation && (
        <>
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
            <div className="show-more-container">
              <Button
                type="link"
                onClick={handleShowMore}
                className="show-more-button"
              >
                Show more →
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default SimulationSummaryOverlay;

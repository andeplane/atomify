import React from "react";
import NewSimulation from "../containers/NewSimulation";
import ShareSimulation from "../containers/ShareSimulation";
import Settings from "../containers/Settings";
import type { Simulation } from "../store/simulation";

interface AppModalsProps {
  showNewSimulation: boolean;
  showShareSimulation: boolean;
  showSettings: boolean;
  simulation: Simulation | undefined;
  onCloseNewSimulation: () => void;
  onCloseShareSimulation: () => void;
  onCloseSettings: () => void;
}

const AppModals: React.FC<AppModalsProps> = ({
  showNewSimulation,
  showShareSimulation,
  showSettings,
  simulation,
  onCloseNewSimulation,
  onCloseShareSimulation,
  onCloseSettings,
}) => {
  return (
    <>
      {showNewSimulation && (
        <NewSimulation onClose={onCloseNewSimulation} />
      )}
      {showShareSimulation && simulation && (
        <ShareSimulation
          visible={showShareSimulation}
          onClose={onCloseShareSimulation}
          simulation={simulation}
        />
      )}
      {showSettings && (
        <Settings open={showSettings} onClose={onCloseSettings} />
      )}
    </>
  );
};

export default AppModals;

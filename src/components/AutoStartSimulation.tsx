import { useEffect, useRef } from "react";
import { useStoreActions, useStoreState } from "../hooks";
import { Simulation } from "../store/simulation";
import { notification } from "antd";

declare global {
  interface Window {
    wasm: any; // Replace 'any' with the actual type if known
  }
}

interface Example {
  id: string;
  title: string;
  description: string;
  analysisDescription?: string;
  analysisScript?: string;
  imageUrl: string;
  inputScript: string;
  keywords?: string[];
  files: {
    fileName: string;
    url: string;
  }[];
}

interface ExamplesData {
  baseUrl: string;
  title: string;
  descriptionFile: string;
  examples: Example[];
}

const AutoStartSimulation = () => {
  const hasInitiatedStart = useRef(false);
  const setNewSimulation = useStoreActions(
    (actions) => actions.simulation.newSimulation
  );
  const setPreferredView = useStoreActions(
    (actions) => actions.app.setPreferredView
  );
  const running = useStoreState((state) => state.simulation.running);
  const simulation = useStoreState((state) => state.simulation.simulation);
  
  useEffect(() => {
    const fetchAndStartSimulation = async () => {
      const urlSearchParams = new URLSearchParams(window.location.search);
      const embeddedSimulationUrl = urlSearchParams.get('embeddedSimulationUrl');
      const simulationIndex = parseInt(urlSearchParams.get('simulationIndex') || '0', 10);

      if (!embeddedSimulationUrl || !simulationIndex) {
        return;
      }
      
      try {
        const response = await fetch(embeddedSimulationUrl);
        const data: ExamplesData = await response.json();
        
        // If we have a valid simulation index, start that simulation
        if (simulationIndex >= 0 && simulationIndex < data.examples.length) {
          const selectedExample = data.examples[simulationIndex];
          
          // Update all URLs with baseUrl
          selectedExample.imageUrl = `${data.baseUrl}/${selectedExample.imageUrl}`;
          if (selectedExample.analysisScript) {
            selectedExample.analysisScript = `${data.baseUrl}/${selectedExample.analysisScript}`;
          }
          selectedExample.files.forEach((file) => {
            file.url = `${data.baseUrl}/${file.url}`;
          });

          const newSimulation: Simulation = {
            id: selectedExample.id,
            inputScript: selectedExample.inputScript,
            files: selectedExample.files,
            analysisDescription: selectedExample.analysisDescription,
            analysisScript: selectedExample.analysisScript,
            start: true
          };

          if (simulation?.id !== newSimulation.id) {
            hasInitiatedStart.current = true;
            setNewSimulation(newSimulation);
            setPreferredView("view");
          }
        }
      } catch (error: any) { // Explicitly type 'error' as 'any'
        console.error("Error fetching examples data:", error);
        notification.error({
          message: "Error loading simulation",
          description: `Could not load the simulation data from the provided URL. Details: ${error.message || error}`, // Include error message
        });
      }
      }
    };
const checkWasmAndStart = () => {
  if (!window.wasm) {
    const timeoutId = setTimeout(checkWasmAndStart, 500);
    return () => clearTimeout(timeoutId);
  }

  if (!hasInitiatedStart.current && !running) {
    fetchAndStartSimulation();
  }
};
    };

    checkWasmAndStart();
  }, [running, simulation?.id, setNewSimulation, setPreferredView]);

  return null; // This component doesn't render anything
};

export default AutoStartSimulation;

import { useEffect, useRef } from "react";
import { useStoreActions, useStoreState } from "../hooks";
import { useEmbeddedMode } from "../hooks/useEmbeddedMode";
import { Simulation } from "../store/simulation";
import { notification } from "antd";
import React from "react";
import { decodeSimulation } from "../utils/embed/codec";

declare global {
  interface Window {
    wasm: any;
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

const AutoStartSimulation: React.FC = () => {
  const hasInitiatedStart = useRef(false);
  const setNewSimulation = useStoreActions(
    (actions) => actions.simulation.newSimulation
  );
  const setPreferredView = useStoreActions(
    (actions) => actions.app.setPreferredView
  );
  const running = useStoreState((state) => state.simulation.running);
  const simulation = useStoreState((state) => state.simulation.simulation);
  const { embeddedSimulationUrl, simulationIndex, embeddedData, autoStart, isEmbeddedMode, vars } = useEmbeddedMode();
  
  useEffect(() => {
    const fetchAndStartSimulation = async () => {
      try {
        // Handle embedded data first (works in both full editor and embedded modes)
        if (embeddedData) {
          const decodedSimulation = decodeSimulation(embeddedData, autoStart);
          decodedSimulation.vars = vars; // Add URL vars
          
          if (simulation?.id !== decodedSimulation.id) {
            hasInitiatedStart.current = true;
            setNewSimulation(decodedSimulation);
            
            // Set view based on autoStart
            if (autoStart) {
              setPreferredView("view"); // Visualizer showing atoms
            } else {
              setPreferredView("file" + decodedSimulation.inputScript); // Editor with script
            }
          }
          return;
        }
        
        // Handle URL-based embedding (only in embedded mode)
        if (!isEmbeddedMode) {
          return;
        }
        
        const response = await fetch(embeddedSimulationUrl!);
        const data: ExamplesData = await response.json();
        
        if (simulationIndex >= 0 && simulationIndex < data.examples.length) {
          const selectedExample = data.examples[simulationIndex];
          
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
            start: true,
            vars: vars // Add URL vars
          };

          if (simulation?.id !== newSimulation.id) {
            hasInitiatedStart.current = true;
            setNewSimulation(newSimulation);
            setPreferredView("view");
          }
        }
      } catch (error) {
        console.error("Error fetching examples data:", error);
        notification.error({
          message: "Error loading simulation",
          description: `Could not load the simulation data from the provided URL. Details: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    };

    const checkWasmAndStart = () => {
      if (!window.wasm) {
        setTimeout(checkWasmAndStart, 500);
        return;
      }

      if (!hasInitiatedStart.current && !running) {
        fetchAndStartSimulation();
      }
    };

    checkWasmAndStart();
  }, [simulation?.id, running, setNewSimulation, setPreferredView, embeddedSimulationUrl, embeddedData, autoStart, isEmbeddedMode, simulationIndex, vars]);

  return null;
};

export default AutoStartSimulation;

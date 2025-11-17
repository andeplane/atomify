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
  const { embeddedSimulationUrl, simulationIndex, embeddedData, isEmbeddedMode } = useEmbeddedMode();
  
  useEffect(() => {
    const fetchAndStartSimulation = async () => {
      if (!isEmbeddedMode) {
        return;
      }
      
      try {
        // Handle embedded data first (data in URL)
        if (embeddedData) {
          const decodedSimulation = decodeSimulation(embeddedData);
          
          if (simulation?.id !== decodedSimulation.id) {
            hasInitiatedStart.current = true;
            setNewSimulation(decodedSimulation);
            setPreferredView("view");
          }
          return;
        }
        
        // Fall back to URL-based embedding
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
            start: true
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
  }, [simulation?.id, running, setNewSimulation, setPreferredView, embeddedSimulationUrl, embeddedData, isEmbeddedMode, simulationIndex]);

  return null;
};

export default AutoStartSimulation;

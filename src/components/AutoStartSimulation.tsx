import { useEffect, useRef } from "react";
import { useStoreActions, useStoreState } from "../hooks";
import { useEmbeddedMode } from "../hooks/useEmbeddedMode";
import { Simulation } from "../store/simulation";
import { notification } from "antd";
import React from "react";
import { 
  decodeSimulationData, 
  convertEmbeddableToAtomifySimulation 
} from "../utils/embedding";

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
  const { embeddedSimulationUrl, embeddedSimulationData, simulationIndex, isEmbeddedMode } = useEmbeddedMode();
  
  // Helper function to decode base64url to base64
  const b64urlToB64 = (hashSafe: string): string => {
    return hashSafe.replace(/-/g, '+').replace(/_/g, '/').replace(/,/g, '=');
  };
  
  useEffect(() => {
    const fetchAndStartSimulation = async () => {
      if (!isEmbeddedMode) {
        return;
      }
      
      try {
        // Handle base64-encoded simulation data
        if (embeddedSimulationData) {
          let simulationWithContents: ReturnType<typeof convertEmbeddableToAtomifySimulation>;
          
          try {
            // Try protobuf decoding first
            const decodedData = decodeSimulationData(embeddedSimulationData);
            simulationWithContents = convertEmbeddableToAtomifySimulation(decodedData);
          } catch (protobufError) {
            console.log('Protobuf decoding failed, trying JSON fallback:', protobufError);
            
            // Fallback to simple JSON decoding for testing
            try {
              const base64 = b64urlToB64(embeddedSimulationData);
              const jsonString = window.atob(base64);
              const jsonData = JSON.parse(jsonString);
              
              // Convert from simple JSON format to atomify format
              const fileContents: { [key: string]: string } = {};
              const files = Object.entries(jsonData.files || {}).map(([fileName, file]: [string, any]) => {
                if (file.content?.$case === 'text') {
                  fileContents[fileName] = file.content.text;
                }
                return {
                  fileName,
                  url: ''
                };
              });
              
              simulationWithContents = {
                id: jsonData.id || 'test',
                title: jsonData.title || 'Test Simulation',
                description: jsonData.description || 'Test simulation',
                analysisDescription: jsonData.analysisDescription,
                analysisScript: jsonData.analysisScript,
                inputScript: jsonData.inputScript,
                keywords: jsonData.keywords || [],
                files,
                fileContents
              };
            } catch (jsonError) {
              throw new Error(`Failed to decode simulation data: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
            }
          }
          
          // Convert to the format expected by the store
          const files = simulationWithContents.files.map(file => ({
            fileName: file.fileName,
            content: simulationWithContents.fileContents[file.fileName] || '',
            url: '' // Not needed since we have content
          }));

          const newSimulation: Simulation = {
            id: simulationWithContents.id,
            inputScript: simulationWithContents.inputScript,
            files: files,
            analysisDescription: simulationWithContents.analysisDescription,
            analysisScript: simulationWithContents.analysisScript,
            start: true
          };

          if (simulation?.id !== newSimulation.id) {
            hasInitiatedStart.current = true;
            setNewSimulation(newSimulation);
            setPreferredView("view");
          }
          return;
        }
        
        // Handle URL-based simulation data (existing functionality)
        if (embeddedSimulationUrl) {
          const response = await fetch(embeddedSimulationUrl);
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
        }
      } catch (error) {
        console.error("Error loading simulation data:", error);
        notification.error({
          message: "Error loading simulation",
          description: `Could not load the simulation data. Details: ${error instanceof Error ? error.message : String(error)}`,
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
  }, [simulation?.id, running, setNewSimulation, setPreferredView, embeddedSimulationUrl, embeddedSimulationData, isEmbeddedMode, simulationIndex]);

  return null;
};

export default AutoStartSimulation;

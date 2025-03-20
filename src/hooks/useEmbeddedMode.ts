export interface EmbeddedModeResult {
  embeddedSimulationUrl: string | null;
  simulationIndex: number;
  isEmbeddedMode: boolean;
}

export function useEmbeddedMode(): EmbeddedModeResult {
  const urlSearchParams = new URLSearchParams(window.location.search);
  const embeddedSimulationUrl = urlSearchParams.get('embeddedSimulationUrl');
  const simulationIndex = parseInt(urlSearchParams.get('simulationIndex') || '0', 10);
  const isEmbeddedMode = Boolean(embeddedSimulationUrl && simulationIndex);

  return {
    embeddedSimulationUrl,
    simulationIndex,
    isEmbeddedMode,
  };
} 
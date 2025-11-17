export interface EmbeddedModeResult {
  embeddedSimulationUrl: string | null;
  simulationIndex: number;
  embeddedData: string | null;
  autoStart: boolean;
  isEmbeddedMode: boolean;
}

export function useEmbeddedMode(): EmbeddedModeResult {
  const urlSearchParams = new URLSearchParams(window.location.search);
  const embeddedSimulationUrl = urlSearchParams.get('embeddedSimulationUrl');
  const simulationIndex = parseInt(urlSearchParams.get('simulationIndex') || '0', 10);
  const embeddedData = urlSearchParams.get('data');
  const embedParam = urlSearchParams.get('embed');
  const autoStartParam = urlSearchParams.get('autostart');
  const autoStart = autoStartParam === 'true';
  
  // isEmbeddedMode is true when:
  // 1. Using embeddedSimulationUrl method, OR
  // 2. Using data parameter WITH explicit embed=true
  const isEmbeddedMode = Boolean(
    (embeddedSimulationUrl && simulationIndex >= 0) || 
    (embeddedData && embedParam === 'true')
  );

  return {
    embeddedSimulationUrl,
    simulationIndex,
    embeddedData,
    autoStart,
    isEmbeddedMode,
  };
} 
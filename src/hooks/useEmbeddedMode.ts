export interface EmbeddedModeResult {
  embeddedSimulationUrl: string | null;
  simulationIndex: number;
  embeddedData: string | null;
  autoStart: boolean;
  isEmbeddedMode: boolean;
  vars: Record<string, number>;
}

/**
 * Parse variables from URL parameter
 * Format: "temp:2.5,mass:1.0"
 * Returns: { temp: 2.5, mass: 1.0 }
 */
function parseVars(varsString: string | null): Record<string, number> {
  if (!varsString) return {};
  
  const vars: Record<string, number> = {};
  varsString.split(',').forEach(varDef => {
    const parts = varDef.trim().split(':');
    if (parts.length >= 2) {
      const name = parts[0];
      const value = parseFloat(parts[1]);
      if (!isNaN(value)) {
        vars[name] = value;
      }
    }
  });
  return vars;
}

export function useEmbeddedMode(): EmbeddedModeResult {
  const urlSearchParams = new URLSearchParams(window.location.search);
  const embeddedSimulationUrl = urlSearchParams.get('embeddedSimulationUrl');
  const simulationIndex = parseInt(urlSearchParams.get('simulationIndex') || '0', 10);
  const embeddedData = urlSearchParams.get('data');
  const embedParam = urlSearchParams.get('embed');
  const autoStartParam = urlSearchParams.get('autostart');
  const autoStart = autoStartParam === 'true';
  const vars = parseVars(urlSearchParams.get('vars'));
  
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
    vars,
  };
} 
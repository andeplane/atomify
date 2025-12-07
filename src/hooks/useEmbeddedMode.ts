import type { EmbedConfig } from "../types";
import { isEmbeddedMode } from "../utils/embeddedMode";

export interface EmbeddedModeResult {
  embeddedSimulationUrl: string | null;
  simulationIndex: number;
  embeddedData: string | null;
  autoStart: boolean;
  isEmbeddedMode: boolean;
  vars: Record<string, number>;
  embedConfig: EmbedConfig;
}

/**
 * Parse variables from URL parameter
 * Format: "temp:2.5,mass:1.0"
 * Returns: { temp: 2.5, mass: 1.0 }
 */
function parseVars(varsString: string | null): Record<string, number> {
  if (!varsString) return {};

  const vars: Record<string, number> = {};
  varsString.split(",").forEach((varDef) => {
    const parts = varDef.trim().split(":");
    if (parts.length >= 2) {
      const name = parts[0];
      const value = parseFloat(parts[1]);
      if (!Number.isNaN(value)) {
        vars[name] = value;
      }
    }
  });
  return vars;
}

/**
 * Default embed configuration values
 */
const DEFAULT_EMBED_CONFIG: EmbedConfig = {
  showSimulationSummary: true,
  showSimulationBox: true,
  enableCameraControls: true,
  enableParticlePicking: true,
};

/**
 * Parse embed configuration from base64-encoded JSON URL parameter
 * Returns: EmbedConfig with defaults applied
 */
function parseEmbedConfig(configString: string | null): EmbedConfig {
  if (!configString) {
    return DEFAULT_EMBED_CONFIG;
  }

  try {
    const decoded = atob(configString);
    const parsed = JSON.parse(decoded) as Partial<EmbedConfig>;

    // Apply defaults for any missing properties
    return {
      showSimulationSummary:
        parsed.showSimulationSummary ?? DEFAULT_EMBED_CONFIG.showSimulationSummary,
      showSimulationBox: parsed.showSimulationBox ?? DEFAULT_EMBED_CONFIG.showSimulationBox,
      enableCameraControls:
        parsed.enableCameraControls ?? DEFAULT_EMBED_CONFIG.enableCameraControls,
      enableParticlePicking:
        parsed.enableParticlePicking ?? DEFAULT_EMBED_CONFIG.enableParticlePicking,
    };
  } catch (error) {
    console.warn("Failed to parse embed config:", error);
    // Return defaults on parse error
    return DEFAULT_EMBED_CONFIG;
  }
}

export function useEmbeddedMode(): EmbeddedModeResult {
  const urlSearchParams = new URLSearchParams(window.location.search);
  const embeddedSimulationUrl = urlSearchParams.get("embeddedSimulationUrl");
  const simulationIndex = parseInt(urlSearchParams.get("simulationIndex") || "0", 10);
  const embeddedData = urlSearchParams.get("data");
  const autoStartParam = urlSearchParams.get("autostart");
  const autoStart = autoStartParam === "true";
  const vars = parseVars(urlSearchParams.get("vars"));
  const embedConfig = parseEmbedConfig(urlSearchParams.get("config"));

  // Use shared utility function to determine embedded mode
  const embeddedMode = isEmbeddedMode(urlSearchParams);

  return {
    embeddedSimulationUrl,
    simulationIndex,
    embeddedData,
    autoStart,
    isEmbeddedMode: embeddedMode,
    vars,
    embedConfig,
  };
}

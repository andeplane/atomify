/**
 * Check if the application is running in embedded mode based on URL parameters.
 *
 * Embedded mode is true when:
 * 1. Using embeddedSimulationUrl method (with valid simulationIndex >= 0), OR
 * 2. Using data parameter WITH explicit embed=true
 *
 * @param urlSearchParams - URLSearchParams object (defaults to window.location.search)
 * @returns true if in embedded mode, false otherwise
 */
export function isEmbeddedMode(urlSearchParams?: URLSearchParams): boolean {
  // Handle server-side rendering or missing window
  if (typeof window === "undefined") {
    return false;
  }

  const params = urlSearchParams || new URLSearchParams(window.location.search);
  const embeddedSimulationUrl = params.get("embeddedSimulationUrl");
  const simulationIndex = parseInt(params.get("simulationIndex") || "0", 10);
  const embeddedData = params.get("data");
  const embedParam = params.get("embed");

  return Boolean(
    (embeddedSimulationUrl && simulationIndex >= 0) ||
      (embeddedData && embedParam === "true"),
  );
}

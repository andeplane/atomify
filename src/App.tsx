/**
 * App entry split (ADR-003): embedded mode keeps the entire legacy shell
 * (AutoStartSimulation, invisible-tabs Main, console modal); everything
 * else gets the new projects shell.
 *
 * Shared-simulation links (?data=… / ?script=…) are decoded by the legacy
 * AutoStartSimulation pipeline, so they route to the legacy shell even
 * without embed=true — otherwise every previously shared URL would land on
 * an empty Home screen. Importing shares as quick-run projects (ADR-001 §6)
 * is the planned follow-up.
 */

import React from "react";
import EmbeddedApp from "./EmbeddedApp";
import Shell from "./shell/Shell";
import { isEmbeddedMode } from "./utils/embeddedMode";

export function isLegacyShareLink(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  return params.has("data") || params.has("script");
}

const App: React.FC = () => {
  return isEmbeddedMode() || isLegacyShareLink() ? <EmbeddedApp /> : <Shell />;
};

export default App;

/**
 * App entry split (ADR-003): embedded mode keeps the entire legacy shell
 * (AutoStartSimulation, invisible-tabs Main, console modal); everything
 * else gets the new projects shell.
 */

import React from "react";
import EmbeddedApp from "./EmbeddedApp";
import Shell from "./shell/Shell";
import { isEmbeddedMode } from "./utils/embeddedMode";

const App: React.FC = () => {
  return isEmbeddedMode() ? <EmbeddedApp /> : <Shell />;
};

export default App;

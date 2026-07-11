/**
 * App entry split (ADR-003): embedded mode (embed=true iframes) keeps the
 * entire legacy shell (AutoStartSimulation, invisible-tabs Main, console
 * modal); everything else gets the new projects shell.
 *
 * Legacy non-embed share links (?data=… / ?script=… without embed=true) are
 * no longer supported: the Share modal only produces embed links now, and
 * old plain share URLs land on the projects Home screen.
 */

import React from "react";
import EmbeddedApp from "./EmbeddedApp";
import Shell from "./shell/Shell";
import { isEmbeddedMode } from "./utils/embeddedMode";

const App: React.FC = () => {
  return isEmbeddedMode() ? <EmbeddedApp /> : <Shell />;
};

export default App;

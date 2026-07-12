/**
 * App entry (ADR-003): the projects shell is the whole app. The legacy
 * embedded mode (embed=true iframes, AutoStartSimulation, URL-encoded
 * ?data=/?script= share links) was removed 2026-07-11 — project zip
 * export/import is the sharing story until a backend exists.
 */

import React from "react";
import Shell from "./shell/Shell";

const App: React.FC = () => {
  return <Shell />;
};

export default App;

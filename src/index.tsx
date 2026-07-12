import "./index.css";
import "dygraphs/dist/dygraph.css";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { StoreProvider } from "easy-peasy";
import store from "./store";
import mixpanel from "mixpanel-browser";
import { track } from "./utils/metrics";

// index.html's ?sw-reset escape hatch is unregistering the service workers
// and reloads without the flag when done; don't boot the app (and kick off
// wasm downloads) in the meantime.
const swResetting = new URLSearchParams(window.location.search).has("sw-reset");

if (!swResetting) {
  mixpanel.init("b5022dd7fe5b3cd0396d84284ae647e6", { debug: false });

  track("Page.Load", {});

  const container = document.getElementById("root");
  if (!container) {
    throw new Error(
      "Failed to find the root element. Please ensure an element with id 'root' exists in your index.html.",
    );
  }

  const root = createRoot(container);
  // Wait for the persisted settings slice to rehydrate before mounting:
  // easy-peasy replays persisted state asynchronously, silently reverting any
  // dispatch made before it settles (e.g. setLammps from the engine bootstrap).
  const mount = () =>
    root.render(
      <StoreProvider store={store}>
        <App />
      </StoreProvider>,
    );
  void store.persist.resolveRehydration().then(mount, (error) => {
    // Corrupt persisted settings must degrade to defaults, never a blank page.
    console.error("Settings rehydration failed; using defaults:", error);
    mount();
  });
}

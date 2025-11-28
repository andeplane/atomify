import "./index.css";
import "dygraphs/dist/dygraph.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { StoreProvider } from "easy-peasy";
import store from "./store";
import mixpanel from "mixpanel-browser";
import { track, getEmbeddingParams } from "./utils/metrics";

mixpanel.init("b5022dd7fe5b3cd0396d84284ae647e6", { debug: false });

track("Page.Load", getEmbeddingParams());

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <StoreProvider store={store}>
    <App />
  </StoreProvider>
);

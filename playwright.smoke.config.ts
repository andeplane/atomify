/**
 * CI smoke subset of the e2e suite (.github/workflows/e2e.yaml), run
 * against the production build. Build first: `make jupyter` (the notebook
 * test skips itself without the JupyterLite site), then `npm run build`.
 *
 * Same settings as playwright.config.ts, but only tests tagged `@smoke`,
 * served by `vite preview` (which sets the same COOP/COEP headers as the
 * dev server, see vite.config.ts) on its own port so it never collides with
 * a dev server left running for the full suite.
 *
 * Only specs that drive the app through the UI can be tagged: the specs
 * that `import("/atomify/src/store/index.ts")` reach into the dev server's
 * unbundled modules, which a production build does not serve.
 */

import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

const PORT = 5201;

export default defineConfig({
  ...base,
  grep: /@smoke/,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : [["list"]],
  use: { ...base.use, baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/atomify/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

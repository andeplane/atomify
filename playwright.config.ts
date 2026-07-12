/**
 * Playwright e2e suite for the Atomify shell (ADR-003).
 *
 * The app is heavy: every page load fetches the ~43 MB LAMMPS wasm module
 * and compiles it (15–60 s headless), and each test drives a real engine,
 * real IndexedDB and real Monaco. Hence: one worker (one wasm engine at a
 * time keeps runs deterministic), generous timeouts, and a single chromium
 * project. Vite dev serves the COOP/COEP headers the pthreads build needs.
 *
 * Every test gets a fresh browser context (Playwright default), which is
 * what isolates IndexedDB between tests. Where persistence-across-reload is
 * the point, tests deliberately reuse the same context via page.reload().
 */

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  // Budget for engine load (~120 s worst case) + the run itself.
  timeout: 420_000,
  expect: { timeout: 15_000 },
  retries: 1,
  workers: 1,
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5199",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx vite --port 5199 --strictPort",
    url: "http://localhost:5199/atomify/",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

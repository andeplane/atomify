/**
 * Captures the screenshots used by the Help site (help/public/screenshots).
 *
 *   CHROMIUM_PATH=/path/to/chromium \
 *     npx playwright test -c help/scripts/playwright.config.ts
 *
 * Drives the real app (vite dev server, real LAMMPS engine, real Monaco) in
 * headless Chromium, like the e2e suite. One long serial spec; it takes a
 * while because it runs real simulations. Not part of CI: re-run it after
 * UI changes and commit the updated screenshots.
 */

import { defineConfig, devices } from "@playwright/test";

const PORT = 5198;

export default defineConfig({
  testDir: ".",
  testMatch: "screenshots.spec.ts",
  timeout: 3_600_000,
  expect: { timeout: 30_000 },
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    actionTimeout: 60_000,
    ...devices["Desktop Chrome"],
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
    // Dev mode serves the cross-origin isolation headers itself.
    serviceWorkers: "block",
    permissions: ["clipboard-read", "clipboard-write"],
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || undefined,
      args: ["--enable-unsafe-swiftshader"],
    },
  },
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    cwd: "../..",
    url: `http://localhost:${PORT}/atomify/`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

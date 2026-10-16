import { defineConfig, devices } from "@playwright/test";

// Build first: npm run build. No server isolation headers: exercise the
// same service-worker bootstrap used on GitHub Pages, including first visits.
export default defineConfig({
  testDir: "e2e",
  testMatch: "engine-isolation.spec.ts",
  timeout: 240_000,
  expect: { timeout: 15_000 },
  workers: 1,
  use: { baseURL: "http://localhost:5200", trace: "retain-on-failure" },
  projects: [
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "node e2e/static-server.mjs",
    url: "http://localhost:5200/atomify/",
    reuseExistingServer: false,
  },
});

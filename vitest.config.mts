import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    // A few tests do heavy synchronous work (e.g. thousands of store
    // dispatches) that can exceed the 5s default under parallel-fork
    // contention on a loaded/2-core CI runner — surfacing as flaky timeouts
    // even though they pass in isolation. Real failures are assertion errors,
    // which are immediate; give slow-under-load tests comfortable headroom.
    testTimeout: 20000,
    // Stale git worktrees under .claude/ carry their own src/ + node_modules;
    // without this exclude their tests (and broken deps) pollute every run.
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.claude/**",
      // Playwright specs (run via `npm run e2e`), not vitest tests.
      "e2e/**",
    ],
    environmentOptions: {
      jsdom: {
        resources: "usable",
      },
    },
    pool: "forks",
  },
  resolve: {
    alias: {
      // Add any path aliases from tsconfig if needed
    },
  },
});



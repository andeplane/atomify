import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
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

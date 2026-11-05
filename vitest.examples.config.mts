import { defineConfig } from "vitest/config";

// Runs the example-library smoke test (src/examples.smoke.ts) against the real
// atomify wasm build. Separate from vitest.config.mts: it needs a plain node
// environment (pthreads via worker_threads), no wasm stub, and minutes of time.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/examples.smoke.ts"],
    pool: "forks",
    fileParallelism: false,
    testTimeout: 600_000,
    hookTimeout: 300_000,
  },
});

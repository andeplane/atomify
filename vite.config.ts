import { createRequire } from "node:module";
import { createReadStream, statSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

/**
 * Dev-only: serve the ~43 MB lammps-atomify.js emscripten module RAW.
 * The worker loads it via `?url` + fetch-as-blob (see lammps.worker.ts) —
 * it is never bundled — but Vite's dev transform would otherwise rewrite it
 * and append an inline sourcemap, inflating the download to ~460 MB (which
 * can crash the tab). This middleware runs before Vite's transform and
 * streams the file as-is. `?url`/`?import` requests (the tiny URL-shim
 * module) still go through Vite untouched.
 */
function serveLammpsModuleRaw(): Plugin {
  return {
    name: "serve-lammps-atomify-raw",
    apply: "serve",
    configureServer(server) {
      const require = createRequire(import.meta.url);
      // Resolve via the package's exports map (the raw dist path is not an
      // exported subpath).
      const filePath = require.resolve("lammps.js/wasm-atomify");
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";
        if (!url.includes("lammps-atomify.js") || url.includes("?")) {
          return next();
        }
        res.setHeader("Content-Type", "text/javascript");
        res.setHeader("Content-Length", statSync(filePath).size);
        createReadStream(filePath).pipe(res);
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    serveLammpsModuleRaw(),
    // Only enable HTTPS if HTTPS environment variable is set
    ...(process.env.HTTPS === "true" ? [basicSsl()] : []),
  ],
  base: "/atomify/",
  optimizeDeps: {
    // The lammps.js wasm module (~11 MB, embedded wasm) breaks esbuild
    // pre-bundling; serve it as-is instead.
    exclude: ["lammps.js"],
  },
  build: {
    outDir: "dist",
    // The atomify (KOKKOS/pthreads) emscripten module uses top-level await,
    // which the default build target rejects.
    target: "esnext",
  },
  // The KOKKOS build spawns its pthread workers via `new Worker(new URL(...))`;
  // emit workers as ES modules so Vite can bundle that pattern.
  worker: { format: "es" },
  server: {
    host: true, // Allow access from local network (0.0.0.0)
    port: 3000,
    // Cross-origin isolation, required for SharedArrayBuffer — the atomify
    // (KOKKOS/pthreads) wasm build needs it. COEP: credentialless keeps
    // cross-origin subresources (e.g. imported example files) working
    // without requiring CORP headers on them. On GitHub Pages, which can't
    // set response headers, the coi-serviceworker shim in index.html applies
    // the equivalent headers instead.
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
    proxy: {
      "/chapters": {
        target: "http://localhost:5350",
        changeOrigin: true,
      },
    },
  },
  // `npm run preview` serves the production build; isolate it too so the
  // built site can be tested locally (GitHub Pages relies on the
  // coi-serviceworker shim instead, since it can't set response headers).
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
  },
  // WASM files served from public/ folder, no special config needed
});

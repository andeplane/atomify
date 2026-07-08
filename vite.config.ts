import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
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

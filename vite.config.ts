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
  },
  server: {
    host: true, // Allow access from local network (0.0.0.0)
    port: 3000,
    proxy: {
      "/chapters": {
        target: "http://localhost:5350",
        changeOrigin: true,
      },
    },
  },
  // WASM files served from public/ folder, no special config needed
});

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/atomify/",
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

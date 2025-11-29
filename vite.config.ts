import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/atomify/',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
    proxy: {
      '/chapters': {
        target: 'http://localhost:5350',
        changeOrigin: true
      }
    }
  },
  define: {
    // Fix for libraries expecting CommonJS 'module' in browser
    'typeof module': JSON.stringify('undefined'),
  },
  // WASM files served from public/ folder, no special config needed
});


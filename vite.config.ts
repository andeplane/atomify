import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/wasm/lammps.wasm',
          dest: '.'
        },
        {
          src: 'src/wasm/lammps.mjs',
          dest: '.'
        }
      ]
    })
  ],
  server: {
    proxy: {
      '/chapters': {
        target: 'http://localhost:5350',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    exclude: ['lammps.wasm', 'lammps.mjs']
  }
});


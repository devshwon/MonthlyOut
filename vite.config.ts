import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

import aitDevtools from "@apps-in-toss/devtools/unplugin";

export default defineConfig({
  base: './',
  plugins: [aitDevtools.vite(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 5173,
  },
});

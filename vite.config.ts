import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import pkg from './package.json';

import aitDevtools from "@apps-in-toss/devtools/unplugin";

export default defineConfig({
  base: './',
  // 설정 화면에 보여줄 앱 버전. package.json을 그대로 따라간다.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
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

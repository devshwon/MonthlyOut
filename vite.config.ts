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
    // 소스맵을 번들에 넣지 않는다. 켜두면 .ait의 4분의 3이 소스맵이 되고(5.7MB 중 4.3MB)
    // 앱 소스가 그대로 나간다. 실기기 스택이 필요하면 잠깐 'hidden'으로 만들어
    // 로컬에 두고 보되, webBundleDir에는 올리지 않는다.
    sourcemap: false,
  },
  server: {
    port: 5173,
  },
});

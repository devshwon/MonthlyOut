import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import path from 'path';
import pkg from './package.json';

import aitDevtools from "@apps-in-toss/devtools/unplugin";

// 광고 진단 로그에 심는 빌드 식별자. 버전만으로는 "어느 빌드에서 난 문제인가"를 못
// 가른다 — 이 앱은 1.0.0으로만 찍혀서 고친 빌드가 나갔는지 확인할 길이 없었다.
// 커밋 없이 빌드하면 `-dirty`가 붙는다. (ads-log KI-03 · KI-04)
const appBuild = (() => {
  try {
    const sha = execSync('git rev-parse --short HEAD').toString().trim();
    const dirty = execSync('git status --porcelain -uno').toString().trim() === '' ? '' : '-dirty';
    return `${pkg.version}+${sha}${dirty}`;
  } catch {
    return pkg.version;
  }
})();

export default defineConfig({
  base: './',
  // 설정 화면에 보여줄 앱 버전. package.json을 그대로 따라간다.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_BUILD__: JSON.stringify(appBuild),
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

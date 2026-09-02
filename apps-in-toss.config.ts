// Apps in Toss 배포 설정 (SDK 3.x).
// 2.x의 granite.config.ts를 대체한다 — `ait build`는 더 이상 웹을 빌드하지 않고,
// 여기 `webBundleDir`에 이미 만들어져 있는 산출물을 <appName>.ait로 패키징만 한다.
// 그래서 package.json의 build는 반드시 `vite build && ait build` 순서여야 한다.
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // TODO: 앱인토스 콘솔에 생성한 앱 이름으로 변경하세요.
  // 콘솔의 앱 이름과 완전히 동일해야 하고, 배포 스킴/CORS 도메인의 기준이 됩니다.
  appName: 'sample-miniapp',

  // 3.x부터 brand는 primaryColor만 받습니다. displayName·icon은 콘솔에서 관리해요.
  brand: {
    primaryColor: '#3182F6',
  },

  // vite build의 산출물 디렉토리 (vite.config.ts의 build.outDir와 반드시 일치).
  webBundleDir: 'dist',

  // 사용하는 네이티브 권한만 선언합니다. 예: [{ name: 'geolocation', access: 'access' }]
  permissions: [],

  // 2.x의 webViewProps에서 이름이 바뀌었고, type 속성은 사라졌습니다.
  webView: {},
});

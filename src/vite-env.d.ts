/// <reference types="vite/client" />

/** vite.config.ts의 define으로 주입되는 앱 버전 */
declare const __APP_VERSION__: string;
/** 진단 로그용 `버전+커밋` (vite.config.ts). 화면에는 __APP_VERSION__을 쓴다. */
declare const __APP_BUILD__: string;

# CLAUDE.md — toss-base

Apps in Toss WebView 미니앱을 빠르게 만드는 **재사용 베이스**입니다.
기획안을 받으면 **기획 → 화면 → 구현 → 검증 → 배포까지 한 흐름으로** 완성합니다.

---

## 시작하는 법

1. 이 저장소의 헌장은 `prompts/00-charter.md`다. 항상 따른다.
2. 새 앱을 만들 때는 사용자가 **기획안/아이디어**를 주거나 `prompts/01-app-console-input-template.md`를 채운다.
3. 사용자가 "이 기획대로 만들어줘"라고 하면 charter의 Step A~E(기획 요약 → 화면/흐름 → 구현 → 검증 → 보고)를 **멈추지 말고 끝까지** 진행한다.
4. 앱 정체성부터 바꾼다: `apps-in-toss.config.ts`(appName·brand.primaryColor), `index.html` title, `package.json` name. 상단 앱 이름 표시줄 켜기/끄기 요청이 있으면 아래 "상단 네비게이션 바" 섹션대로 `navigationBar`를 설정한다.

---

## 상단 네비게이션 바(앱 이름 표시줄) 켜기/끄기

토스가 미니앱 위에 씌우는 상단 바(뒤로가기 · 앱 아이콘+이름 · 홈 · 더보기)는 `apps-in-toss.config.ts`의 **`navigationBar`** 로 제어한다. `defineConfig`에 바로 넣으면 된다. **초기 설정만 지원**(런타임 변경 API 없음, 액세서리 버튼만 런타임 추가 가능). 키를 아예 안 넣으면 기본값(타이틀 표시)으로 뜬다.

- 사용자가 앱 생성/수정 시 **"상단 꺼줘 / 앱 이름 표시줄 없애줘"** → `withTitle: false`. 바를 더 비우려면 버튼도 함께 끈다.
- **"상단 켜줘"** → `navigationBar` 키를 지우거나 `withTitle: true`(기본 동작).

```ts
// apps-in-toss.config.ts > defineConfig({ ... })
navigationBar: {
  withTitle: false,            // ★ 앱 아이콘+이름(=앱 이름 표시줄) 숨김
  withBackButton: false,       // 뒤로가기 버튼 (backEvent로 직접 관리하면 off 궁합 좋음)
  withHomeButton: false,       // 홈 버튼
  transparentBackground: true, // 배경 투명 → 콘텐츠가 바 아래까지 확장(풀스크린 느낌)
  theme: 'light',              // 'light' | 'dark' — 버튼·텍스트 색
  // initialAccessoryButton: { id, title, icon } — 더보기 버튼 왼쪽 커스텀 아이콘 1개
},
```

⚠️ **바 전체를 완전히 없애는 옵션은 없다.** 모두 off + `transparentBackground: true`로 최소화해도 더보기·닫기 버튼은 남는다. 근거: 개발자센터 [내비게이션 바](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/NavigationBar.html) · [공통 설정](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/Config.html) 문서, 타입은 3.x 기준 `node_modules/@apps-in-toss/web-framework/dist/config.d.ts`의 `AppsInTossConfig.navigationBar`(2.x의 `@apps-in-toss/plugins`는 더 이상 설치되지 않는다).

---

## 작업 방식 — 끝까지 자율적으로 (가장 중요)

> 이 베이스의 charter/packet 문서는 "30~60분 패킷", "한 번에 큰 변경 금지"라고 적혀 있다.
> 그건 **사고·계획의 단위**일 뿐, **작업을 잘게 끊어 매번 사용자 확인을 받으라는 뜻이 아니다.**
> Claude Code에서는 아래 원칙이 우선한다.

- **한 덩어리를 끝까지 완결한다.** "홈 화면 + 추천 로직 + 배포"처럼 의미 있는 단위를 계획→구현→검증→(필요시)배포까지 한 흐름으로. 중간에 "여기까지 했는데 계속할까요?"로 멈추지 않는다.
- **사소한 결정은 합리적 기본값으로 진행한다.** 정말 사용자만 답할 수 있는 갈림길(되돌리기 어렵거나 취향이 갈리는 선택)만 묻는다. 물을 때도 2~3개 가정을 제시하고 기본값을 골라 진행한다.
- **항상 검증하고 끝낸다.** `npx tsc --noEmit` → `npx biome check --write src` → `npm run build`. 테스트가 있으면 `npx vitest run`.
- **확인할 만한 큰 변경을 마치면 `npm run release`로 배포**하고 deploymentId를 보고한다. 오타·미세 수정은 배포 스킵.
- 보고는 "결론 → 무엇을 바꿨나 → 검증/배포 결과 → 남은 것" 순서로 짧게.

---

## 기술 스택

- **플랫폼**: Apps in Toss WebView (비게임)
- **앱**: React 18 + TypeScript, react-router-dom
- **빌드**: Vite가 웹을 빌드하고, `ait build`는 그 산출물을 `<appName>.ait`로 패키징만 한다 — `npm run build` = `vite build && ait build`. **순서를 바꾸거나 `ait build`만 돌리면 실패한다.** `vite.config.ts`의 `build.outDir`와 `apps-in-toss.config.ts`의 `webBundleDir`는 **반드시 일치**(둘 다 `dist`).
- **UI**: TDS(`@toss/tds-mobile`) **필수**. 입력·버튼·모달 등은 TDS 우선, 불가피할 때만 커스텀.
- **SDK**: `@apps-in-toss/web-framework` 3.1.1 (위치·결제·광고·이벤트 등은 여기서 import). TDS는 `@toss/tds-mobile`·`@toss/tds-mobile-ait` 2.5.1. 브라우저 개발용 `@apps-in-toss/devtools` 3.1.1(devDependency).
- **설정 파일**: `apps-in-toss.config.ts` (2.x의 `granite.config.ts`를 대체).

---

## 토스 문서·검증 도구 (설치된 플러그인)

apps-in-toss-skills 마켓플레이스 플러그인이 설치돼 있다.

- **`/docs-search`** — Apps-in-Toss 개발자센터 · TDS Web · TDS RN 문서를 검색/조회한다(`ax` CLI 기반). `.mcp.json`의 `apps-in-toss` MCP로도 연결된다.
  - SDK·정책·배포·검수가 걸리는 작업은 **구현 전에 이걸로 근거를 확인**한다(문서 우선 원칙).
- **`/project-validator`** — `apps-in-toss.config.ts`·`package.json`·구조·TDS 의존성을 규약과 대조 검증한다.
- ⚠️ 플러그인이 이 머신에 **설치돼 있지 않으면** `ax`가 없어 `/docs-search`·MCP가 뜨지 않는다. 그때는 아래 `.d.ts` 직접 읽기로 대체한다.
- ⚠️ **`node_modules`는 Grep으로 안 잡힌다**(ripgrep이 무시). SDK의 정확한 export가 필요하면 `/docs-search`로 문서를 보거나, 해당 패키지의 `.d.ts`를 **Read로 직접** 연다.
  - 3.x부터 SDK 타입은 한 파일에 모여 있다: `node_modules/@apps-in-toss/web-framework/dist/index.d.ts` (config는 `dist/config.d.ts`). 2.x의 `@apps-in-toss/web-bridge`는 **더 이상 설치되지 않는다** — 옛 경로를 참조하지 말 것.
  - CLI 사용법은 `npx ait --help` / `npx ait <cmd> --help`(`AIT_LANG=ko`로 한국어).

---

## 디자인 (Toss Look)

- `desigin/toss-look.md` + `src/design/tokens.ts`를 따른다. 간격·모서리는 **토큰만**(임의 px 금지), 타이포는 TDS Typography(t2~t7).
- 섹션은 "제목 → 내용 → 액션", 화면당 주요 CTA 1개.
- **디자인은 눈으로 검증한다.** 큰 UI 작업은 다음 루프로:
  1. `design-preview/index.html`에 Pretendard 기반 HTML 목업을 그린다(여러 시안을 나란히 둬도 좋다).
  2. 미리보기를 띄워(`.claude/launch.json`의 `design` 서버) 스크린샷으로 확인하고 다듬는다.
  3. 확정안을 `src`에 **토큰 기반**으로 옮긴다.
  - 실제 TDS/SDK 화면은 토스 앱 WebView에서만 정확히 보이므로, 레이아웃·색·위계는 목업으로 먼저 잡는다.

---

## 브라우저에서 디버깅 (웹 미리보기)

토스 앱 없이 **브라우저에서 실제 앱을 띄워** 크롬 개발자도구로 디버깅한다.

- 실행: `npm run dev` → `http://localhost:5173`. 실기기에서 LAN으로 붙어볼 땐 `npm run dev:web`(5179, `--host`) 또는 `.claude/launch.json`의 `vite-dev` 서버.
- 원리: `vite.config.ts`의 `@apps-in-toss/devtools` 플러그인(`aitDevtools.vite()`)이 개발 빌드에서 `@apps-in-toss/web-framework`를 **공식 mock SDK로 alias**하고 devtools 패널을 진입점에 주입한다. **프로덕션 빌드에서는 자동으로 비활성**(`NODE_ENV=production`)이라 산출물에 안 들어간다.
  - 3.x부터 **자체 스텁(`src/dev-stubs/`)은 없앴다.** 새 SDK API를 써도 별도 스텁을 만들 필요 없이 공식 mock이 받아준다.
- **AIT DevTools 패널**: 우하단 파란 `AIT` 버튼. 플랫폼(iOS/Android)·앱 버전·환경·SafeAreaInsets·권한 상태·네트워크·IAP/광고 결과·기기 프레임(뷰포트 프리셋)·SDK 호출 로그를 실시간으로 바꿔가며 테스트한다. 옵션은 `aitDevtools.vite({ initialState, mock, panel })`로 `vite.config.ts`에서 선언한다.
- **화면 디버그 창**(우리 것, 앱 흐름 전용): 우하단 🐞 버튼(`src/components/FlowDebugPanel.tsx`). 어디서든 `pushFlowDebugEvent('이름', '데이터')`(`src/utils/flowDebug.ts`)로 남기면 실시간으로 쌓인다. 샘플 App은 라우팅·뒤로가기를 기록한다.
- 기본은 개발/미리보기에서만 켜진다. **실기기에서 켜려면** localStorage `tossbase_debug` = `'1'`(끄려면 `'0'`).
- 디자인 시안용 정적 목업 서버는 별도다(`design` 서버, `design-preview/`).

## 배포

- `npm run release` = `vite build` + `ait build` + `ait deploy`. **`package.json`의 `__PUT_YOUR_CONSOLE_API_KEY__`를 콘솔에서 발급한 API 키로 교체**해야 동작한다.
  - 3.x는 `npx ait token add`로 `~/.ait/credentials`에 프로필을 저장한 뒤 `ait deploy --profile <이름>`을 쓰는 방식도 지원한다(API 키를 package.json에 안 박아도 됨 — 이쪽을 권장).
  - 아티팩트는 프로젝트 루트에 `<appName>.ait`로 떨어지고 `ait deploy`가 그걸 올린다(`.gitignore`에 `*.ait` 포함).
- 배포 후 `deploymentId`와 `intoss-private://...` 스킴을 보고한다.
- 광고·위치 등 SDK 기능은 **토스 앱 안에서만** 동작한다 — 브라우저 미리보기/샌드박스에서 안 보이는 건 정상이다.

---

## 함정 · 노하우

- **포인트 지급 / 하단 여백 / 하단 배너 구현 전 → `docs/` 먼저 읽기.** 매번 재발하는 버그를 막으려고 실제 앱을 분석해 정리해뒀다: 포인트 지급은 [`docs/point-granting.md`](docs/point-granting.md)(서버 검증형 vs 클라 직접형, `grantPromotionReward` 에러코드·멱등성), iOS/Android 하단 여백은 [`docs/ios-android-bottom-spacing.md`](docs/ios-android-bottom-spacing.md), 하단 영역(배너·네비·safe-area)은 [`docs/bottom-banner-placement.md`](docs/bottom-banner-placement.md)(App 최상위 1회 마운트 — thump 패턴, 렌더 후 minHeight 접기, `env()` 금지 → SDK `SafeAreaInsets`).
- **SDK 3.x 출시하면 2.x로 롤백 불가.** 3.x 번들을 한 번 출시하면 그 앱은 2.x로 되돌릴 수 없다 — 콘솔 QR로 실기기 테스트를 충분히 하고 출시한다.
- **3.x는 CORS Origin이 바뀐다.** 자체 API를 쓴다면 서버 허용 목록에 아래를 등록해야 요청이 안 막힌다(`<appName>`은 콘솔 앱 이름).
  - `https://<appName>.web.tossmini.com` — 실제 서비스 환경
  - `https://<appName>.private-web.tossmini.com` — 콘솔 QR 테스트 환경
- **node_modules grep 안 됨** → `.d.ts`를 Read로 직접 확인(3.x는 `@apps-in-toss/web-framework/dist/index.d.ts` 하나).
- **`import.meta.env`** → `src/vite-env.d.ts`에 `/// <reference types="vite/client" />`가 있어야 타입이 잡힌다. dev/prod 분기에 `import.meta.env.DEV` 사용.
- **biome**: 탭 들여쓰기 + 더블쿼트. `biome check .`는 범위가 너무 넓어 무관한 파일까지 포맷하니 **`biome check --write src`**로 스코프한다.
- **광고 배너**: `TossAds.attachBanner(adGroupId, element, { theme, tone, variant })` → `{ destroy() }`. 컨테이너 `width:100%`, 고정형 `height:96px`. 개발은 테스트 ID(`ait-ad-test-banner-id`), 배포는 실 ID로 분기. 토스 앱 5.241.0+에서만 노출(`isSupported()` 가드).
- **국내 API + CORS**: 토스 기기에서 `localhost`/`http`는 막힌다(mixed content). 외부 HTTPS 도메인에 nginx 프록시를 두고, 업스트림이 `Access-Control-Allow-Origin`을 이미 주면 `proxy_hide_header`로 중복 ACAO를 제거한 뒤 다시 추가한다.
- **뒤로가기**: `graniteEvent.addEventListener("backEvent", ...)`로 직접 스택을 관리(브라우저 히스토리 의존 X). 최초 화면에서 뒤로가기 = `closeView()`.
- **출시 전 검수**: `prompts/99-last-checklist.md` 기준(비게임 내비바, 뒤로가기 중복 금지, 라이트 모드, 광고 사전 로딩, 권한 사전 동의 등).

---

## 저장소 구조

```
prompts/        워크플로우: 00-charter(헌장) · 01-콘솔입력 · 10-packet · 90-review · 95-릴리즈노트 · 99-검수체크리스트
desigin/        toss-look.md (디자인 규칙)
design-preview/ 디자인 시각 검증용 HTML 목업 (preview로 확인)
src/
  pages/        화면 (Home, Settings, Feature, NotFound …)
  design/       tokens.ts (간격·모서리·색)
  services/     로직·저장소·API
  components/    공용 컴포넌트 (ErrorBoundary 등)
apps-in-toss.config.ts  앱 이름·브랜드·webBundleDir·권한 (SDK 3.x)
vite.config.ts  웹 빌드 + @apps-in-toss/devtools 플러그인 (개발용 mock/패널)
.mcp.json       apps-in-toss MCP(ax)
.claude/        settings(권한) · launch(미리보기 서버)
```

## 참고

- 헌장: `prompts/00-charter.md`
- 디자인 규칙: `desigin/toss-look.md` · 토큰: `src/design/tokens.ts`
- 출시 검수: `prompts/99-last-checklist.md`

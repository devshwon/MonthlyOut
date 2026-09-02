# CLAUDE.md — 매달얼마 (MonthlyOut)

**매달 자동으로 나가는 돈이 총 얼마인지 한눈에 보여주는** Apps in Toss 미니앱.
부제: "구독·할부·보험·대출 한번에 정리".

- 기획서: [`docs/매달얼마_기획서.md`](docs/매달얼마_기획서.md) — **화면·정책·문구를 바꾸기 전에 여기부터 읽는다.**
- 콘솔 앱 이름 = `apps-in-toss.config.ts`의 `appName` = `monthlyout`.

---

## 도메인 규칙 (이걸 어기면 앱의 존재 이유가 사라진다)

기획서 4장에서 나온 규칙이고, `src/services/charges.ts`에 코드로 박혀 있다.

1. **현금 기준만 쓴다.** 50만원 12개월 할부는 "산 시점에 50만원"이 아니라 **"매달 41,666원"**이다.
   `FixedCharge.amount`에는 **월 납입액만** 넣는다. 구매 총액을 총액 계산에 더하면 이중과금이다.
   총액·잔여 회차는 **참고 정보로만** 보여준다(폼의 "총 X원 · N회차로 나눠서 빠져요").
2. **항목 층과 출금 층은 다르다.** 사용자가 등록하는 건 항목(넷플릭스 17,000)이고,
   사고가 나는 건 출금(25일 신한카드 337,000)이다. 출금 층 계산은 `withdrawalGroups()`가 담당한다.
3. **끝나는 날이 있는 항목을 구분한다.** `term`이 있으면 유기한(할부·대출), 없으면 무기한(구독·보험).
   "N개월 뒤 X원이 풀립니다"(`nextRelease()`)는 이 앱이 다른 앱과 다른 지점이라 지우지 않는다.
4. **입력 횟수를 최소화한다.** 한 번 등록하면 12개월 유효해야 한다.
   매달 손대야 하는 기능(변동지출 기록·일일 입력)을 넣는 순간 사용자는 이탈한다.
   필수 입력은 **이름과 금액뿐**이고, 나머지는 기본값으로 넘어갈 수 있어야 한다.
5. **하지 않는 것**: 보험/카드 추천·상담, 변동지출 가계부, 계좌 자동 연동, 자산·투자 관리.
   기능 제안을 받으면 먼저 기획서 2장 "하지 않는 것"과 충돌하는지 본다.

---

## 코드 지도

| 무엇 | 어디 |
|---|---|
| 도메인 타입 | `src/types/index.ts` — `FixedCharge` · `ChargeTerm` · `PaymentMethod` · `WithdrawalGroup` |
| 계산(순수 함수) | `src/services/charges.ts` — 회차/활성 판정, `activeCharges` · `monthlyTotal` · `nextRelease` · `withdrawalGroups` · `cardFixedTotal`, 표시 포맷 |
| 저장소 | `src/services/chargeStore.ts` — localStorage(`monthlyout.charges.v1`) + 모듈 스토어. 변경은 `addCharge`/`updateCharge`/`removeCharge`/`clearCharges`로만 |
| 화면 구독 | `src/hooks/useCharges.ts` — `useSyncExternalStore`. 화면에서 localStorage를 직접 읽지 말 것 |
| 홈 | `src/pages/Home.tsx` — 총액 → 금액 내림차순 리스트 → 해제 예정 |
| 등록/수정 | `src/pages/ChargeForm.tsx` — `/charge/new`, `/charge/:id` 공용 |
| 설정 | `src/pages/Settings.tsx` — 현황 · 전체 삭제 |
| 리스트 행 | `src/components/ChargeRow.tsx` |
| 라우팅·뒤로가기 | `src/App.tsx` — `backEvent`로 직접 스택 관리, 최초 화면에서 `closeView()` |

라우트: `/` · `/charge/new` · `/charge/:id` · `/settings`.

## 지금 상태 / 다음

**구현됨(기획서 6장 MVP)**: 항목 CRUD, 월 총액 + 정렬 리스트, 결제수단(카드/통장) 구분, 로컬 저장.

**2차 후보** — 재료는 이미 `charges.ts`에 있다:
- 출금 달력 → `withdrawalGroups()`
- 카드값 역산 → `cardFixedTotal()`. 화면에 **"카드값 중 최소 X원은 확정"**이라는 한계를 반드시 명시한다
- 결제일 알림, 종료 예정 알림, 클라우드 동기화

기획서 6장의 기준: **첫 버전을 본인이 두 달 연속 쓰는지 확인하기 전에는 기능을 늘리지 않는다.**

---

## 작업 방식 — 끝까지 자율적으로 (가장 중요)

> `prompts/`의 charter/packet 문서는 "30~60분 패킷", "한 번에 큰 변경 금지"라고 적혀 있다.
> 그건 **사고·계획의 단위**일 뿐, **작업을 잘게 끊어 매번 사용자 확인을 받으라는 뜻이 아니다.**

- **한 덩어리를 끝까지 완결한다.** "출금 달력 + 라우팅 + 검증"처럼 의미 있는 단위를 계획→구현→검증→(필요시)배포까지 한 흐름으로. 중간에 "여기까지 했는데 계속할까요?"로 멈추지 않는다.
- **사소한 결정은 합리적 기본값으로 진행한다.** 정말 사용자만 답할 수 있는 갈림길(되돌리기 어렵거나 취향이 갈리는 선택)만 묻는다.
- **항상 검증하고 끝낸다.** `npx tsc --noEmit` → `npx biome check --write src` → `npm run build`. 테스트가 있으면 `npx vitest run`.
- **UI를 바꿨으면 브라우저로 눈으로 확인한다**(아래 "브라우저에서 디버깅").
- **확인할 만한 큰 변경을 마치면 `npm run release`로 배포**하고 deploymentId를 보고한다. 오타·미세 수정은 배포 스킵.
- 보고는 "결론 → 무엇을 바꿨나 → 검증/배포 결과 → 남은 것" 순서로 짧게.

---

## 기술 스택

- **플랫폼**: Apps in Toss WebView (비게임)
- **앱**: React 18 + TypeScript, react-router-dom(HashRouter)
- **빌드**: Vite가 웹을 빌드하고, `ait build`는 그 산출물을 `monthlyout.ait`로 패키징만 한다 — `npm run build` = `vite build && ait build`. **순서를 바꾸거나 `ait build`만 돌리면 실패한다.** `vite.config.ts`의 `build.outDir`와 `apps-in-toss.config.ts`의 `webBundleDir`는 **반드시 일치**(둘 다 `dist`).
- **UI**: TDS(`@toss/tds-mobile`) **필수**. 입력·버튼·모달 등은 TDS 우선(`TextField` · `Chip`/`ChipItem` · `Switch` · `Button` · `Paragraph`), 불가피할 때만 커스텀.
- **저장**: 서버 없음. localStorage만 쓴다(기획서 7장 — 데이터가 항목 리스트 하나라 서버가 필요 없다).
- **SDK**: `@apps-in-toss/web-framework` 3.1.1 (위치·결제·광고·이벤트 등은 여기서 import). TDS는 `@toss/tds-mobile`·`@toss/tds-mobile-ait` 2.5.1. 브라우저 개발용 `@apps-in-toss/devtools` 3.1.1(devDependency).
- **설정 파일**: `apps-in-toss.config.ts` (2.x의 `granite.config.ts`를 대체).

### 아직 쓰지 않는 코드

수익 모델 없이 출시하는 게 기획(8장)이라 광고·포인트는 화면에 붙어 있지 않다.
다만 베이스에서 온 구현체는 남겨뒀다 — 나중에 붙일 때 `docs/`와 함께 본다.
`src/components/BannerAd.tsx` · `src/hooks/useFullScreenAd.ts` · `src/services/{fullScreenAd,promotion,localGrantLedger}.ts` · `src/constants/{ads,promotion}.ts`.

---

## 상단 네비게이션 바(앱 이름 표시줄) 켜기/끄기

토스가 미니앱 위에 씌우는 상단 바(뒤로가기 · 앱 아이콘+이름 · 홈 · 더보기)는 `apps-in-toss.config.ts`의 **`navigationBar`** 로 제어한다. `defineConfig`에 바로 넣으면 된다. **초기 설정만 지원**(런타임 변경 API 없음, 액세서리 버튼만 런타임 추가 가능). 키를 아예 안 넣으면 기본값(타이틀 표시)으로 뜬다 — 지금이 그 상태다.

- **"상단 꺼줘 / 앱 이름 표시줄 없애줘"** → `withTitle: false`. 바를 더 비우려면 버튼도 함께 끈다.
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

⚠️ **바 전체를 완전히 없애는 옵션은 없다.** 모두 off + `transparentBackground: true`로 최소화해도 더보기·닫기 버튼은 남는다. 근거: 개발자센터 [내비게이션 바](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/NavigationBar.html) · [공통 설정](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/Config.html) 문서, 타입은 3.x 기준 `node_modules/@apps-in-toss/web-framework/dist/config.d.ts`의 `AppsInTossConfig.navigationBar`.

---

## 토스 문서·검증 도구 (설치된 플러그인)

apps-in-toss-skills 마켓플레이스 플러그인이 설치돼 있다.

- **`/docs-search`** — Apps-in-Toss 개발자센터 · TDS Web · TDS RN 문서를 검색/조회한다(`ax` CLI 기반). `.mcp.json`의 `apps-in-toss` MCP로도 연결된다.
  - SDK·정책·배포·검수가 걸리는 작업은 **구현 전에 이걸로 근거를 확인**한다(문서 우선 원칙).
- **`/project-validator`** — `apps-in-toss.config.ts`·`package.json`·구조·TDS 의존성을 규약과 대조 검증한다.
- ⚠️ 플러그인이 이 머신에 **설치돼 있지 않으면** `ax`가 없어 `/docs-search`·MCP가 뜨지 않는다. 그때는 아래 `.d.ts` 직접 읽기로 대체한다.
- ⚠️ **`node_modules`는 Grep으로 안 잡힌다**(ripgrep이 무시). 정확한 export가 필요하면 `.d.ts`를 **Read로 직접** 연다.
  - SDK: `node_modules/@apps-in-toss/web-framework/dist/index.d.ts` (config는 `dist/config.d.ts`).
  - TDS: `node_modules/@toss/tds-mobile/dist/esm/index.d.ts` — 컴포넌트 목록은 `grep -oE "^export declare (const|function) [A-Za-z0-9_]+"`로 뽑고, props는 `XxxProps` 정의를 읽는다.
  - CLI 사용법은 `npx ait --help` / `npx ait <cmd> --help`(`AIT_LANG=ko`로 한국어).

---

## 디자인 (Toss Look)

- `desigin/toss-look.md` + `src/design/tokens.ts`를 따른다. 간격·모서리·**색은 토큰만**(임의 px·hex 금지), 타이포는 TDS Typography(t2~t7).
- 색은 `tokens.ts`의 `colors`를 쓴다(`background`/`surface`/`border`/`textPrimary`/`textSecondary`/`textTertiary`/`primary`/`positive`/`danger`). 새 hex를 화면 파일에 직접 적지 않는다.
- 섹션은 "제목 → 내용 → 액션", 화면당 주요 CTA 1개.
- 이 앱의 시각적 중심은 **총액 숫자**다. 홈에서 총액보다 시선을 끄는 요소를 추가하지 않는다.
- **디자인은 눈으로 검증한다.** 큰 UI 작업은: `design-preview/index.html`에 Pretendard 기반 목업 → 미리보기(`.claude/launch.json`의 `design` 서버)로 확인 → 확정안을 `src`에 토큰 기반으로 옮긴다.

---

## 브라우저에서 디버깅 (웹 미리보기)

토스 앱 없이 **브라우저에서 실제 앱을 띄워** 크롬 개발자도구로 디버깅한다.

- 실행: `npm run dev` → `http://localhost:5173`. 실기기에서 LAN으로 붙어볼 땐 `npm run dev:web`(5179, `--host`) 또는 `.claude/launch.json`의 `vite-dev` 서버.
- 원리: `vite.config.ts`의 `@apps-in-toss/devtools` 플러그인(`aitDevtools.vite()`)이 개발 빌드에서 `@apps-in-toss/web-framework`를 **공식 mock SDK로 alias**하고 devtools 패널을 진입점에 주입한다. **프로덕션 빌드에서는 자동으로 비활성**이라 산출물에 안 들어간다.
- **AIT DevTools 패널**: 우하단 파란 `AIT` 버튼. 플랫폼(iOS/Android)·앱 버전·환경·SafeAreaInsets·권한·네트워크·기기 프레임·SDK 호출 로그를 실시간으로 바꿔가며 테스트한다.
- **화면 디버그 창**(앱 흐름 전용): 우하단 🐞 버튼(`src/components/FlowDebugPanel.tsx`). 어디서든 `pushFlowDebugEvent('이름', '데이터')`(`src/utils/flowDebug.ts`)로 남기면 실시간으로 쌓인다.
- 기본은 개발/미리보기에서만 켜진다. **실기기에서 켜려면** localStorage `tossbase_debug` = `'1'`(끄려면 `'0'`).
- **샘플 데이터 넣기**: 콘솔에서 `localStorage.setItem('monthlyout.charges.v1', JSON.stringify([...]))` 후 **새로고침**.
  스토어가 모듈 로드 시점에 한 번 읽으므로 해시 이동만으로는 반영되지 않는다.

## 배포

- `npm run release` = `vite build` + `ait build` + `ait deploy`. **`package.json`의 `__PUT_YOUR_CONSOLE_API_KEY__`를 콘솔에서 발급한 API 키로 교체**해야 동작한다.
  - `npx ait token add`로 `~/.ait/credentials`에 프로필을 저장한 뒤 `ait deploy --profile <이름>`을 쓰는 방식이 더 낫다(API 키를 package.json에 안 박아도 됨).
- 아티팩트는 프로젝트 루트에 `monthlyout.ait`로 떨어진다(`.gitignore`에 `*.ait` 포함).
- 배포 후 `deploymentId`와 `intoss-private://...` 스킴을 보고한다.
- 출시 전 확인: 기획서 11장 체크리스트(이름 중복·상표권·미니앱 이름 가이드·도메인) + `prompts/99-last-checklist.md`(비게임 내비바, 뒤로가기 중복 금지, 라이트 모드, 권한 사전 동의 등).

---

## 함정 · 노하우

- **SDK 3.x 출시하면 2.x로 롤백 불가.** 콘솔 QR로 실기기 테스트를 충분히 하고 출시한다.
- **3.x는 CORS Origin이 바뀐다.** 자체 API를 붙이게 되면 서버 허용 목록에 등록해야 한다.
  - `https://monthlyout.web.tossmini.com` — 실제 서비스 환경
  - `https://monthlyout.private-web.tossmini.com` — 콘솔 QR 테스트 환경
- **하단 여백·배너**: `env(safe-area-inset-bottom)`은 Android WebView에서 부정확하다 → **SDK 값**을 쓰는 `useSafeAreaInsets()`(`src/hooks/useSafeAreaInsets.ts`)로 `paddingBottom`을 준다. 근거와 배치 레시피는 [`docs/ios-android-bottom-spacing.md`](docs/ios-android-bottom-spacing.md) · [`docs/bottom-banner-placement.md`](docs/bottom-banner-placement.md).
- **포인트 지급을 붙이게 되면 먼저** [`docs/point-granting.md`](docs/point-granting.md)를 읽는다(`grantPromotionReward` 에러코드·멱등성).
- **날짜 계산은 `charges.ts`의 연월 헬퍼만 쓴다**(`addMonths`/`monthDiff`/`currentYearMonth`). `new Date()` 산술을 화면에서 직접 하지 않는다. 결제일 31은 "말일"로 표시된다(`formatBillingDay`).
- **biome**: 탭 들여쓰기 + 더블쿼트. `biome check .`는 범위가 너무 넓어 무관한 파일까지 포맷하니 **`biome check --write src`**로 스코프한다.
- **`import.meta.env`** → `src/vite-env.d.ts`에 `/// <reference types="vite/client" />`가 있어야 타입이 잡힌다. dev/prod 분기에 `import.meta.env.DEV` 사용.
- **뒤로가기**: `graniteEvent.addEventListener("backEvent", ...)`로 직접 스택을 관리(브라우저 히스토리 의존 X). 최초 화면에서 뒤로가기 = `closeView()`.

---

## 저장소 구조

```
docs/           매달얼마_기획서.md(원본 기획) + 구현 참조(포인트 지급·하단 여백·배너)
desigin/        toss-look.md (디자인 규칙)
design-preview/ 디자인 시각 검증용 HTML 목업
prompts/        베이스에서 온 워크플로우 문서 (99-last-checklist는 출시 전에 본다)
src/
  pages/        Home · ChargeForm · Settings · NotFound
  components/   ChargeRow · BannerAd · ErrorBoundary · FlowDebugPanel
  hooks/        useCharges · useSafeAreaInsets · useFullScreenAd
  services/     charges(계산) · chargeStore(저장) · 광고/포인트(미사용)
  design/       tokens.ts (간격·모서리·색)
  types/        도메인 타입
apps-in-toss.config.ts  appName monthlyout · 브랜드 · webBundleDir · 권한
vite.config.ts  웹 빌드 + @apps-in-toss/devtools 플러그인
.claude/        settings(권한) · launch(미리보기 서버)
```

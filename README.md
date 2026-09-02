# Toss InApp 샘플 템플릿

토스 WebView 미니앱을 빠르게 복제해서 쓸 수 있는 최소 템플릿입니다.
SDK 3.x 기준(`@apps-in-toss/web-framework` 3.1.1, `apps-in-toss.config.ts`)으로 맞춰져 있습니다.

## 1) 가장 먼저 바꿀 값

- `apps-in-toss.config.ts`
  - `appName` — 앱인토스 콘솔의 앱 이름과 완전히 동일해야 합니다
  - `brand.primaryColor` (3.x부터 `displayName`·`icon`은 콘솔에서 관리)
- `index.html`의 `<title>`
- `package.json`의 `name`
- `src/pages/Home.tsx`의 서비스 문구

## 2) 실행

```bash
npm install
npm run dev
```

브라우저(`http://localhost:5173`)에서 바로 뜹니다. `@apps-in-toss/devtools`가 토스 SDK를 mock으로
대체하고 우하단에 **AIT DevTools 패널**을 띄워 주므로, 토스 앱 없이도 플랫폼·권한·SafeArea·광고 결과 등을
바꿔가며 테스트할 수 있습니다. 실기기에서 LAN으로 붙어볼 땐 `npm run dev:web`(5179, `--host`).

## 3) 빌드

```bash
npm run build
```

`vite build`로 `dist/`를 만든 뒤 `ait build`가 그걸 `<appName>.ait` 아티팩트로 패키징합니다.
3.x의 `ait build`는 웹을 직접 빌드하지 않으므로 **이 순서를 지켜야** 합니다.

## 3-1) SDK 2.x 프로젝트에서 올라올 때

```bash
npx ait migrate v3
```

`granite.config.ts` → `apps-in-toss.config.ts` 변환, `build` 스크립트에 `&& ait build` 추가,
devtools 플러그인 주입까지 자동으로 해 줍니다. 실행 전에 커밋해 두세요.

> ⚠️ 3.x 번들을 한 번 출시하면 **2.x로 롤백할 수 없습니다.** 콘솔 QR로 실기기 테스트 후 출시하세요.
> ⚠️ 자체 API를 쓴다면 CORS 허용 목록에 `https://<appName>.web.tossmini.com`,
> `https://<appName>.private-web.tossmini.com`을 등록해야 합니다.

## 4) 템플릿 구조

- `src/App.tsx`: 라우팅 및 토스 backEvent 처리
- `src/pages/Home.tsx`: 홈(메뉴 허브)
- `src/pages/Feature.tsx`: 기능 화면 예시(입력/저장/진동)
- `src/pages/Settings.tsx`: 설정 화면 예시(로컬 저장)
- `src/services/templateStorage.ts`: 설정 저장소

## 5) AI 치환 포인트

- `TODO:` 주석이 있는 위치를 우선 치환
- `Template*` 타입/함수명을 도메인명으로 변경
- `feature`, `settings` 라우트를 실제 서비스 라우트로 변경

## 6) Claude Code로 시작하기

1. 이 폴더를 Claude Code로 연다. 루트 `CLAUDE.md`가 작업 가이드(자율 진행·플러그인·디자인·배포)를 담고 있다.
2. **기획안으로 시작**: `prompts/00-charter.md`를 헌장으로 따른다. 아이디어를 주거나 `prompts/01-app-console-input-template.md`를 채운 뒤 "이 기획대로 만들어줘"라고 하면, 기획→화면→구현→검증→배포까지 한 흐름으로 진행한다.
3. **토스 문서 검색**: `/docs-search`(또는 `.mcp.json`의 `apps-in-toss` MCP)로 SDK·TDS·정책 문서를 확인한다. SDK export는 node_modules가 grep되지 않으므로 문서나 `.d.ts`(Read)로 본다.
4. **프로젝트 검증**: `/project-validator`로 설정·구조를 점검한다.
5. **디자인**: `design-preview/`에 HTML 목업을 그려 미리보기로 시각 검증한 뒤 `src`에 토큰 기반으로 옮긴다.
6. **배포**: `package.json`의 API 키 placeholder를 콘솔 발급값으로 바꾸고 `npm run release`.

> 플러그인(`apps-in-toss-skills`)이 없다면: `claude plugin marketplace add toss/apps-in-toss-skills` 후 `claude plugin install knowledge-skills@apps-in-toss-skills`.
> `ax` MCP를 쓰려면 ax CLI가 필요하다: `scoop bucket add toss https://github.com/toss/scoop-bucket.git && scoop install ax`.

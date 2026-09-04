# 매달얼마 (MonthlyOut)

> 구독·할부·보험·대출 한번에 정리

카드 앱은 "이번 달 결제금액 87만원"이라는 숫자 하나만 보여준다. 그 안에 뭐가 들어 있는지는 알려주지 않는다.
**매달얼마**는 자동으로 빠져나가는 돈을 한 곳에 모아 **총액**을 보여준다. 알아야 줄일 수 있다.

Apps in Toss WebView 미니앱 (React + TypeScript + TDS, 로컬 저장).

```
─────────────────────────
 2026년 9월 고정과금
      562,000원
─────────────────────────
 자동차 할부   320,000  25일  7/12회차
 전세대출이자  180,000  15일
 실손보험       45,000  15일
 넷플릭스       17,000  25일
─────────────────────────
 6개월 뒤 320,000원이 풀립니다
```

- 금액 내림차순 정렬 — 줄일 대상이 자연스럽게 위로 온다.
- 할부는 **산 금액이 아니라 매달 빠지는 금액**으로 잡는다(현금 기준). 총액·회차는 참고 정보다.
- 끝나는 날이 있는 항목은 "언제 얼마가 풀리는지"까지 계산한다.

기획 배경·범위·원칙은 [`docs/매달얼마_기획서.md`](docs/매달얼마_기획서.md)에 있다. 기능을 더하기 전에 여기부터 읽는다.

## 실행

```bash
npm install
npm run dev        # http://localhost:5173
```

토스 앱 없이 브라우저에서 그대로 뜬다. `@apps-in-toss/devtools`가 토스 SDK를 mock으로 바꿔주고,
우하단 **AIT** 버튼으로 플랫폼·SafeArea·권한 등을 바꿔가며 테스트할 수 있다.
실기기에서 LAN으로 붙어볼 땐 `npm run dev:web`(5179, `--host`).

샘플 데이터를 넣어보려면 브라우저 콘솔에서:

```js
localStorage.setItem("monthlyout.charges.v1", JSON.stringify([
  { id: "1", name: "넷플릭스", amount: 17000, billingDay: 25, category: "subscription",
    method: { kind: "card", name: "신한카드" }, term: null, createdAt: 0, updatedAt: 0 },
]));
location.reload(); // 스토어는 모듈 로드 시 한 번만 읽는다
```

## 빌드 · 배포

```bash
npm run build      # vite build → dist/ → ait build → monthlyout.ait
npm run release    # build + ait deploy
```

`ait build`는 웹을 직접 빌드하지 않고 `dist/`를 패키징만 하므로 **이 순서를 지켜야 한다.**
배포하려면 `package.json`의 `__PUT_YOUR_CONSOLE_API_KEY__`를 콘솔 발급 키로 바꾸거나,
`npx ait token add`로 프로필을 만들어 `ait deploy --profile <이름>`을 쓴다.

검증은 `npx tsc --noEmit` → `npx biome check --write src` → `npm run build`.

## 구조

```
docs/     기획서 + 구현 참조(포인트 지급 · 하단 여백 · 배너 배치)
src/
  pages/       Home · Manage · Yearly · MonthDetail · ChargeForm · Settings
  services/    charges.ts(계산) · chargeStore.ts · confirmStore.ts(이체 확인)
  hooks/       useCharges · useConfirmations · useSafeAreaInsets
  components/  BottomNav · ChargeRow · CategoryBar · icons(SVG)
  design/      tokens.ts (간격 · 모서리 · 색)
desigin/  toss-look.md (디자인 규칙)
prompts/  출시 전 검수 체크리스트 등
```

계산 로직은 전부 `src/services/charges.ts`의 순수 함수다 —
월 총액·정렬(`activeCharges`, `monthlyTotal`), 회차·해제 시점(`installmentRound`, `nextRelease`),
출금 층 묶음(`withdrawalGroups`), 카드 고정분(`cardFixedTotal`).

## 화면

| 탭/화면 | 하는 일 |
|---|---|
| **홈** | 이번 달 총액, 카드/이체 얼마씩 나가는지, 카테고리 비율, 많이 나가는 항목 |
| **관리** | 등록한 항목을 카테고리별로 정리. + 버튼으로 추가 |
| **연간** | 1~12월 막대로 한눈에. 월을 누르면 그 달 상세로 |
| **상세** | 그 달 카테고리별 정리 + **이체 확인 체크**(잔고 부족으로 못 빠진 달 찾기용) |
| **설정** | 현황과 데이터 초기화 |

## 범위

**지금**: 항목 CRUD, 월 총액과 카드/이체 분리, 카테고리 비율, 연간 뷰, 월 상세, 이체 확인, 로컬 저장.
**다음**: 카드값 역산, 출금 달력, 결제일 알림, 종료 예정 알림, 백업.

서버도 계정도 없다. 데이터는 기기에만 남는다.

## Claude Code로 작업할 때

루트 [`CLAUDE.md`](CLAUDE.md)가 작업 지침이다 — 도메인 규칙(현금 기준·항목/출금 층), 코드 지도,
검증·배포 절차, 토스 SDK/TDS 함정이 정리돼 있다.
토스 문서는 `/docs-search`, 설정·구조 점검은 `/project-validator`(apps-in-toss-skills 플러그인).

# iOS / Android 하단 여백 처리 — 참조 가이드

> 토스 WebView에서 **iOS와 Android의 하단 여백(safe-area / 홈 인디케이터 / 제스처바)이 달라 보이는 문제**를 일관되게 만들기 위한 문서.
>
> 분석 기준일: 2026-06. 두 앱을 분석했고 **결론: haru-now에 정답이 있다.** inkling은 갭이 남는 구식 방법.

---

## ✅ 정답 — haru-now: SDK `SafeAreaInsets` API (이걸 따른다)

`../haru-now`는 iOS/Android 하단 인셋 차이를 **제대로 처리한다.** 단, `isIOS ? X : Y` 같은 OS 분기가 **아니라**, 토스 SDK의 네이티브 **`SafeAreaInsets`** API가 플랫폼별 올바른 값(iOS 홈 인디케이터 ≈34px / Android 네비·제스처바)을 자동으로 돌려준다. 우리는 그 값을 그대로 패딩으로 쓰면 된다.

이게 **inkling의 `env()`-only 방식보다 정확하다.** Android가 0을 잘못 보고하는 문제 없이, SDK가 네이티브에서 정확한 값을 준다.

### 1. 인셋 훅 — `src/features/layout/useSafeAreaInsets.ts`
SDK `SafeAreaInsets`를 안전한 fallback + 실시간 구독으로 감싼다:
```ts
import { SafeAreaInsets } from '@apps-in-toss/web-framework';

type Insets = { top: number; bottom: number; left: number; right: number };
const ZERO: Insets = { top: 0, bottom: 0, left: 0, right: 0 };

function read(): Insets {
  try { return SafeAreaInsets.get(); }   // 네이티브에서 플랫폼별 값
  catch { return ZERO; }                 // 데스크톱 dev에서 throw 시 0
}

export function useSafeAreaInsets(): Insets {
  const [insets, setInsets] = useState<Insets>(read);
  useEffect(() => {
    // 화면 회전·모드 변경 시 재수신
    const cleanup = SafeAreaInsets.subscribe({ onEvent: (d) => setInsets(d) });
    return cleanup;
  }, []);
  return insets;
}
```
주석 그대로: *"플랫폼별 안전영역 인셋(iOS 홈인디케이터 / Android 네비게이션 바 등)"*.

### 2. 적용 — `src/features/ads/BannerAd.tsx` (화면 최하단 요소)
하단 고정 요소가 **자기 높이 + 인셋**을 차지하고, 인셋만큼을 **콘텐츠 아래 패딩**으로 둔다:
```ts
const insets = useSafeAreaInsets();
const BANNER_HEIGHT = 90;
const root: React.CSSProperties = {
  height: BANNER_HEIGHT + insets.bottom,  // 총 높이가 인셋만큼 커짐
  paddingBottom: insets.bottom,           // 안전영역은 광고 "아래"에
};
```
주석: *"광고는 BANNER_HEIGHT로 고정, 안전영역(iOS 홈인디케이터 / Android 네비)은 그 아래 패딩으로 추가."* 배너가 `Home.tsx`의 마지막 요소(화면 바닥)라, 이 패딩이 양 OS에서 콘텐츠를 홈 인디케이터/제스처바로부터 띄운다.

### 3. 뷰포트 — `index.html`
```html
<meta name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```
`viewport-fit=cover` **필수** — WebView가 안전영역까지 확장돼야 SDK 인셋이 의미를 가진다.

### 4. SDK 계약 — `node_modules/@apps-in-toss/web-framework/dist/index.d.ts` (3.x — 2.x의 `@apps-in-toss/web-bridge`는 더 이상 설치되지 않음)
```ts
interface SafeAreaInsets { top: number; bottom: number; left: number; right: number; }
declare const SafeAreaInsets: {
  get: () => SafeAreaInsets;
  subscribe: typeof subscribeSafeAreaInsets;  // onEvent: 화면 모드 변경 시 발화
};
```
네이티브 브리지가 플랫폼별 값을 공급한다. `getOperatingSystem` 같은 OS 분기 API는 **쓰지 않는다.**

---

## 권장 패턴 (toss-base로 이식)

전체 재사용 패턴은 **훅 + 하단 최하단 요소에 `paddingBottom: insets.bottom`** + `index.html`의 `viewport-fit=cover`가 끝이다.

```ts
// 1) 위 useSafeAreaInsets 훅을 그대로 src에 추가
// 2) 하단 고정 CTA/네비/배너 등 "화면 바닥" 요소에 적용:
const insets = useSafeAreaInsets();
<div style={{ paddingBottom: insets.bottom }}>...</div>

// 3) 최소 바닥값이 필요하면(디자인상 항상 최소 여백 보장) — haru-now엔 없지만 권장:
paddingBottom: Math.max(insets.bottom, 16)
```

### 주의 / 한계 (haru-now 기준)
- haru-now는 **`insets.bottom`만** 소비한다. `top/left/right`는 읽되 안 씀. 상단 노치/좌우가 필요하면 같은 훅에서 꺼내 쓰면 됨.
- **최소 바닥값(floor) 없음.** SDK가 throw하면(데스크톱 dev) bottom=0. 디자인상 "항상 최소 N px"가 필요하면 `Math.max(insets.bottom, N)` 추가.
- 하단 고정 요소가 **여러 개**면 각각이 아니라 **가장 바깥 바닥 요소 하나**에만 인셋을 적용(중복 가산 방지).
- 메인 콘텐츠/팝업이 화면 바닥에 닿는다면 거기에도 `insets.bottom`을 적용해야 함(haru-now는 배너에만 적용 — 배너가 항상 바닥이라 충분했던 케이스).

---

## 참고 — inkling은 구식 방법 (갭 남음, 비추천)

`../inkling`도 분석했는데, inkling에는 **SDK 인셋도, OS 분기도 없다.** 순수 CSS `env(safe-area-inset-bottom)`만 양 OS 공통으로 쓴다:
```js
paddingBottom: 'env(safe-area-inset-bottom, 0px)'
paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)'  // 콘텐츠 패딩은 인셋 위에 가산
```
- 전제: `index.html`에 `viewport-fit=cover`(있음).
- **문제:** iOS WebView는 `env(safe-area-inset-bottom)` ≈34px를 주지만, **다수 Android WebView는 0**으로 보고하거나 edge-to-edge 설정에 따라 들쭉날쭉 → **바로 이게 불일치 갭의 원인.** inkling은 정규화(floor/clamp/SDK 재조정)가 없어 갭이 그대로 남는다.
- CSS만으로 가야 한다면 `max(env(safe-area-inset-bottom, 0px), 16px)` 바닥값으로 완화 가능하지만, **SDK `SafeAreaInsets`(haru-now 방식)가 더 정확하므로 그쪽을 1순위로 한다.**

---

## 요약 / 출처

- **권장(정답): haru-now의 SDK `SafeAreaInsets`** — `src/features/layout/useSafeAreaInsets.ts`, `src/features/ads/BannerAd.tsx`, `index.html`(viewport-fit=cover), SDK 타입은 3.x 기준 `@apps-in-toss/web-framework/dist/index.d.ts`(`SafeAreaInsets.{get,subscribe}` — `SafeArea`라는 동일 API 별칭도 있음).
- **비추천: inkling의 `env()`-only** — `src/pages/Home.tsx`, `src/components/{PostitWriter,MonthListOverlay}.tsx`. OS별 정확도 떨어져 갭이 남음.
- **할 일:** 위 훅을 toss-base `src`에 이식하고, 하단 고정 요소에 `paddingBottom: insets.bottom`(필요 시 `Math.max(..., N)`) 적용. 실제 iOS/Android 기기에서 검증.

# 하단 영역(배너·네비·safe-area) 배치 — 참조 가이드

> 토스 미니앱에서 **화면 하단(배너 광고 · 하단 네비 · 안전영역)을 어떻게 조립할지** 정하는 문서.
> 하단 배너가 있든 없든, 하단 네비가 있든 없든 이 규칙 하나로 조립한다.
>
> 분석 기준일: 2026-07. 여러 앱을 비교했고 **결론: thump에 정답이 있다.** 페이지마다 배너를 두는 방식은 라우트 전환 때마다 광고가 재로딩돼 eCPM이 떨어진다.
> 2026-07-09에 haru-now · inkling · soksok도 이 패턴으로 통일했다. (spent · blink · congdakcongdak은 원래부터 이 구조)
> 같은 날 "하단 요소가 떠 보이는" 원인 2가지(§placeholder 미접힘 / §safe-area env())를 spent에서 확정하고 전 앱에 수정 반영했다.

---

## ✅ 정답 — thump: App 최상위, `<Routes>` 바깥에 한 번만 마운트

핵심은 **"배너는 화면(라우트)이 아니라 앱에 속한다"**는 것. App 루트를 `100dvh` 세로 플렉스 컬럼으로 잡고, 라우트 영역만 `flex: 1` 스크롤로 두고, 배너는 그 아래 마지막 자식으로 **딱 한 번** 마운트한다. 화면이 바뀌어도 배너 컴포넌트는 언마운트되지 않으므로 광고가 재로딩되지 않는다.

### App.tsx — `thump/src/App.tsx` 구조 그대로

```tsx
export default function App() {
  return (
    // 화면(라우트)만 위 영역에서 교체되고, 하단 배너는 한 번만 마운트되어 유지된다.
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: brand.bg,
      }}
    >
      {/* ① 라우트 영역 — 여기만 스크롤 */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* ... */}
        </Routes>
      </div>

      {/* ② 하단 배너 — Routes 바깥, 마지막 자식. 앱 수명 동안 1회 마운트 */}
      <AdBanner />
    </div>
  );
}
```

### 배너 컴포넌트 계약 (`thump/src/components/AdBanner.tsx` + spent 교훈)

- `TossAds.initialize` → `onInitialized` → `attachBanner(groupId, element, opts)` 순서. 언마운트 시 `destroy()`.
- 컨테이너는 `width: 100%` + **`minHeight`만** 잡는다(문구형 60px / expanded 96px). 실제 높이는 광고 SDK가 결정한다 — `height` 고정 시 광고가 잘릴 수 있다.
- **⚠️ minHeight는 로드 전 placeholder로만 — 렌더되면 0으로 접는다 (떠 보임 원인 #1).**
  실제 도착한 광고가 placeholder(예: 96px)보다 작으면 광고 아래에 그 차이만큼 **빈 띠**가 남아 배너가 떠 보인다. spent에서 실기기로 확정한 버그. `onAdRendered` 콜백에서 상태를 올려 접는다:

  ```tsx
  const [rendered, setRendered] = useState(false);
  // attachBanner opts: callbacks: { onAdRendered: () => setRendered(true), ... }
  <div ref={slotRef} style={{ width: '100%', minHeight: rendered ? 0 : placeholder }} />
  ```
- **미지원 환경(샌드박스/구버전)이나 노필이면 `null`을 반환**해 빈 띠가 남지 않게 한다. (congdakcongdak `BottomBanner`의 `onUnavailable` → 높이 0 처리도 같은 취지)
- 이 계약은 전부 **toss-base `src/components/BannerAd.tsx`에 구현돼 있다** — 새 앱은 그대로 복사해 쓰면 된다.

### 페이지 쪽 규칙 — 루트 높이는 `100%`, `100dvh` 금지

배너가 하단 공간을 차지하므로 라우트 영역의 실제 높이는 `100dvh − 배너`다. 페이지 루트에 `100dvh`/`100vh`를 쓰면 **배너 높이만큼 넘쳐 불필요한 스크롤**이 생긴다.

```ts
// 페이지 루트 스타일
height: "100%",      // ✅ App 레벨 flex 영역을 채운다
// height: "100dvh"  // ❌ 배너 높이만큼 넘침
minHeight: "100%",   // 스크롤형 페이지는 이걸로
```

공용 `Screen` 셸이 있다면 셸의 `100dvh`를 `100%`로 바꾸면 전 페이지가 한 번에 해결된다(soksok `Screen.tsx` 사례).

### 하단 내비게이션(BottomNav)이 있는 앱의 순서

**콘텐츠 → BottomNav → 배너** 순서로, 배너가 **화면 최하단**이다. (blink · congdakcongdak · spent · soksok 모두 이 순서)
BottomNav는 탭 페이지에만 있어도 되지만(페이지 레벨), 배너는 항상 App 레벨이다.

### safe-area — "떠 보임" 원인 #2 (특히 Android)

- **`env(safe-area-inset-bottom)`은 쓰지 않는다.** Android WebView에서 값이 부정확해 하단 요소가 떠 보이거나(불필요한 여백) 제스처 바에 겹친다. iOS보다 **Android에서 떠 보임이 심하게 보이는 주범**. 정답은 SDK `SafeAreaInsets` 훅(`toss-base/src/hooks/useSafeAreaInsets.ts`) — 플랫폼별 정확한 값을 네이티브가 준다. 근거: [`ios-android-bottom-spacing.md`](./ios-android-bottom-spacing.md)
- **광고가 떠 있는 동안은 인셋 패딩을 주지 않는다(플러시).** 토스 배너 자체가 하단 여백을 포함하고 있어, 광고 아래에 인셋까지 깔면 이중 여백으로 떠 보인다. spent에서 실기기로 확인한 선호 배치.
- **광고가 없을 때(로딩/노필/미지원)만** 인셋 높이의 스페이서를 남겨, 위 요소(하단 네비 등)가 제스처 바/홈 인디케이터에 겹치지 않게 한다.

### 조립 레시피 — 배너 유무 × 하단 네비 유무

toss-base `BannerAd`의 `flushBottom` 모드가 위 safe-area 규칙을 캡슐화한다. 어떤 조합이든 App 레벨 flex column의 마지막 자식들만 바꾸면 된다:

```tsx
// ① 배너만 (thump · haru-now · inkling)
<div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{/* Routes */}</div>
<BannerAd adGroupId={ID} flushBottom />

// ② 배너 + 하단 네비 (spent · soksok · blink · congdak)
<div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{/* Routes */}</div>
<BottomNav />                        {/* 네비가 페이지 레벨이면 여기 생략 */}
<BannerAd adGroupId={ID} flushBottom />

// ③ 하단 네비만, 배너 없음 — 네비 아래에 SDK 인셋 패딩
const insets = useSafeAreaInsets();
<div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{/* Routes */}</div>
<div style={{ paddingBottom: insets.bottom }}>
  <BottomNav />
</div>

// ④ 아무것도 없음 — 스크롤 콘텐츠 마지막에 insets.bottom 여백만
```

**예외**: 고의로 띄운 플로팅 네비/FAB(카드형 떠 있는 디자인)는 이 규칙 대상이 아니다 — 자체 `bottom: insets.bottom + 여백`으로 배치한다. 이 문서가 없애려는 건 "플러시로 붙어야 할 요소가 의도치 않게 떠 보이는" 경우다.

---

## ❌ 안티패턴 — 페이지마다 배너 마운트

```tsx
// ❌ Home.tsx, Mine.tsx, ... 각 페이지 하단에 <BannerAd />
<BannerAd adGroupId={AD_GROUP_IDS.BANNER} variant="expanded" />
<BottomNav />
```

- 라우트 전환마다 `destroy()` → 재`attach` → **광고 재로딩·깜빡임 → eCPM 저하**. (thump가 이 문제를 겪고 App 레벨로 옮긴 이력이 주석에 남아 있다)
- 페이지마다 배치가 미세하게 달라져 화면 간 배너 위치가 튄다.
- 배너 없는 페이지로 이동하면 노출 기회 자체가 사라진다.

또 하나의 안티패턴: **`position: absolute/fixed`로 콘텐츠 위에 겹쳐 노출**(과거 inkling). 콘텐츠·모달과 z-index 싸움이 생기고 하단 UI를 가린다. thump처럼 플렉스로 **공간을 예약**하는 방식이 안전하다.

---

## DO / DON'T

- ✅ DO: 배너는 App 최상위, `<Routes>` 바깥, 플렉스 컬럼의 **마지막 자식**으로 1회 마운트.
- ✅ DO: 라우트 영역은 `flex: 1; minHeight: 0; overflowY: auto`.
- ✅ DO: 페이지 루트는 `height/minHeight: 100%`.
- ✅ DO: 배너 컨테이너는 `width: 100%` + `minHeight`만. 미지원/노필 시 `null` 반환.
- ✅ DO: **렌더 후 `minHeight`를 0으로 접기** (`onAdRendered` → `rendered` 상태). 광고 실제 높이만 차지.
- ✅ DO: safe-area는 SDK `SafeAreaInsets` 훅으로. 광고 표시 중엔 플러시, 광고 없을 때만 인셋 스페이서.
- ❌ DON'T: 페이지 컴포넌트 안에 배너 마운트 (라우트 전환 시 재로딩).
- ❌ DON'T: 페이지 루트에 `100dvh`/`100vh` (배너만큼 넘침).
- ❌ DON'T: absolute/fixed로 콘텐츠에 겹치기 (z-index·가림 문제).
- ❌ DON'T: 컨테이너 `height` 고정 (광고 잘림) / `minHeight` 렌더 후 방치 (아래 빈 띠 = 떠 보임).
- ❌ DON'T: `env(safe-area-inset-bottom)` — Android에서 부정확, 떠 보임/겹침의 주범.
- ❌ DON'T: 광고 아래 인셋 패딩 상시 유지 — 이중 여백으로 떠 보인다.

---

## 실제 적용 사례

| 앱 | 구조 |
| --- | --- |
| thump | **기준 구현.** App 플렉스 컬럼 + `<AdBanner />` 마지막 자식 |
| spent | App 최상위, TabBar 아래 고정 배너. **minHeight 접기 + 광고 표시 중 플러시를 실기기로 확정한 앱** |
| blink | Shell(단일 라우트) 최하단, BottomNav 아래. minHeight 접기 원조 구현 |
| congdakcongdak | App 레벨 `BottomBar`(Nav + BottomBanner) 고정 |
| haru-now · inkling · soksok | 2026-07-09 페이지 레벨 → App 레벨로 통일 |
| 전 앱 공통 | 2026-07-09 렌더 후 minHeight 접기 반영 (thump·soksok·congdak·haru-now·haruPassport·verdict·spent) |

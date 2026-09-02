# docs/ — 구현 참조 문서

실제 토스 미니앱들을 분석해, 새 앱 구현 시 **같은 버그를 반복하지 않도록** 정리한 참조 모음.
해당 기능을 구현하기 **전에** 먼저 읽는다.

- [`point-granting.md`](./point-granting.md) — **토스포인트 지급**. 서버 검증형(Cloudflare/checkly) vs 클라이언트 직접형(haru-now) 두 패턴, `grantPromotionReward` SDK 계약·에러코드, 멱등성·중복지급 방지, 선택 기준, DO/DON'T 체크리스트.
- [`ios-android-bottom-spacing.md`](./ios-android-bottom-spacing.md) — **iOS/Android 하단 여백** 일관화. 정답은 haru-now의 SDK `SafeAreaInsets` 훅(`paddingBottom: insets.bottom`). inkling의 `env()`-only 방식은 Android에서 갭이 남아 비추천.
- [`bottom-banner-placement.md`](./bottom-banner-placement.md) — **하단 영역(배너·네비·safe-area) 배치**. 정답은 thump: App 최상위 `100dvh` 플렉스 컬럼에서 `<Routes>`는 `flex:1` 스크롤 영역, 배너는 그 아래 마지막 자식으로 **1회만 마운트**(라우트 전환에도 광고 재로딩 없음). "떠 보임" 방지 2규칙 — ① 렌더 후 `minHeight` 0으로 접기(`onAdRendered`) ② safe-area는 `env()` 금지·SDK `SafeAreaInsets` 훅(광고 표시 중 플러시, 없을 때만 인셋). 배너 유무 × 하단 네비 조합별 조립 레시피 포함. 구현체 = `src/components/BannerAd.tsx`(`flushBottom`) + `src/hooks/useSafeAreaInsets.ts`.

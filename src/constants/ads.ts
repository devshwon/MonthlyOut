/**
 * 토스 인앱 광고 2.0 ver2 — 광고 그룹 ID 상수.
 *
 * ## 토스 앱 버전 호환성
 * - 전면형/리워드 (loadFullScreenAd/showFullScreenAd):
 *   - 5.247.0 이상: 토스 애즈 + AdMob 통합
 *   - 5.227.0 ~ 5.247.0 미만: AdMob 단독
 *   - 5.227.0 미만: 미지원 (`isSupported()` false)
 * - 배너 (TossAds.attachBanner):
 *   - 5.241.0 이상 지원
 *
 * ## 테스트 ID (개발 단계 필수)
 * 실제 광고 ID로 테스트하면 정책 위반 — 콘솔에서 발급한 운영 ID는 출시 직전에만 교체.
 *
 * 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/IntegratedAd.md
 */

/** 테스트용 광고 ID — 모든 환경에서 더미 광고 노출 */
export const TEST_AD_IDS = {
	/** 전면형 (Interstitial) */
	INTERSTITIAL: "ait-ad-test-interstitial-id",
	/** 보상형 (Rewarded) — userEarnedReward 이벤트 발생 */
	REWARDED: "ait-ad-test-rewarded-id",
	/** 배너 — 리스트형 (variant='expanded'에 적합) */
	BANNER: "ait-ad-test-banner-id",
	/** 배너 — 피드형 (네이티브 이미지) */
	BANNER_NATIVE: "ait-ad-test-native-image-id",
} as const;

/**
 * 운영 광고 ID — 콘솔 발급 후 채워넣으세요.
 * 개발 중에는 TEST_AD_IDS 사용. 출시 직전 IS_DEV 분기로 교체.
 */
export const PRODUCTION_AD_IDS = {
	INTERSTITIAL: "__PUT_PRODUCTION_INTERSTITIAL_ID__",
	REWARDED: "__PUT_PRODUCTION_REWARDED_ID__",
	BANNER: "__PUT_PRODUCTION_BANNER_ID__",
} as const;

const IS_DEV =
	typeof import.meta !== "undefined" && import.meta.env?.DEV === true;

/** 현재 환경에 맞는 광고 ID — 개발: 테스트 ID, 운영: 콘솔 발급 ID */
export const AD_GROUP_IDS = {
	INTERSTITIAL: IS_DEV
		? TEST_AD_IDS.INTERSTITIAL
		: PRODUCTION_AD_IDS.INTERSTITIAL,
	REWARDED: IS_DEV ? TEST_AD_IDS.REWARDED : PRODUCTION_AD_IDS.REWARDED,
	BANNER: IS_DEV ? TEST_AD_IDS.BANNER : PRODUCTION_AD_IDS.BANNER,
} as const;

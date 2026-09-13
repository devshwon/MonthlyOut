/**
 * 토스 인앱 광고 2.0 ver2 — 광고 그룹 ID와 "어디에 띄우는가"를 한곳에 모은다.
 *
 * **ID를 화면 코드에 흩어 놓지 않는다.** 같은 자리가 두 ID로 갈리거나 두 자리가 한 ID를
 * 나눠 쓰면 진단 리포트가 그대로 쪼개지고 뭉개진다 (ads-log `docs/attach-checklist.md` §0).
 *
 * ## 토스 앱 버전 호환성
 * - 전면형/리워드 (loadFullScreenAd/showFullScreenAd):
 *   - 5.247.0 이상: 토스 애즈 + AdMob 통합
 *   - 5.227.0 ~ 5.247.0 미만: AdMob 단독
 *   - 5.227.0 미만: 미지원 (`isSupported()` false)
 * - 배너 (TossAds.attachBanner): 5.241.0 이상
 *
 * 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/IntegratedAd.md
 */
import type { AdType } from "@/lib/ad-log";

/** 테스트용 광고 ID — 모든 환경에서 더미 광고 노출. 개발 빌드는 항상 이쪽. */
export const TEST_AD_IDS = {
	/** 전면형 (Interstitial) */
	INTERSTITIAL: "ait-ad-test-interstitial-id",
	/** 보상형 (Rewarded) — userEarnedReward 이벤트 발생 */
	REWARDED: "ait-ad-test-rewarded-id",
	/** 배너 — 문구형(리스트형). `variant="expanded"`에 적합 */
	BANNER: "ait-ad-test-banner-id",
	/** 배너 — 이미지형(피드형 네이티브) */
	BANNER_NATIVE: "ait-ad-test-native-image-id",
} as const;

/**
 * 운영 광고 ID — 앱인토스 콘솔 발급값이라 코드로 만들 수 없다.
 *
 * 리워드는 아직 발급받지 않았다. 자리표시자가 남아 있는 동안은 {@link REWARDED_READY}가
 * false라 호출부가 기능을 막아야 한다 — 자리표시자로 `load`를 부르면 콜백은 오는데
 * 과금은 안 되는 상태가 되고, 그걸 우리 로그만으로는 못 가른다(ads-log KI-30).
 */
export const PRODUCTION_AD_IDS = {
	INTERSTITIAL: "ait.v2.live.f72edad24bd74e3d",
	REWARDED: "__PUT_PRODUCTION_REWARDED_ID__",
	/** 문구형 배너 */
	BANNER: "ait.v2.live.f1fc88634a9d4fd1",
	/** 이미지형 배너 */
	BANNER_NATIVE: "ait.v2.live.b4acb2a6030a4e6b",
} as const;

const IS_DEV =
	typeof import.meta !== "undefined" && import.meta.env?.DEV === true;

/** 현재 환경에 맞는 광고 ID — 개발: 테스트 ID, 운영: 콘솔 발급 ID */
export const AD_GROUP_IDS = {
	INTERSTITIAL: IS_DEV
		? TEST_AD_IDS.INTERSTITIAL
		: PRODUCTION_AD_IDS.INTERSTITIAL,
	REWARDED: IS_DEV ? TEST_AD_IDS.REWARDED : PRODUCTION_AD_IDS.REWARDED,
	/** 문구형 — 하단 고정 배너 */
	BANNER: IS_DEV ? TEST_AD_IDS.BANNER : PRODUCTION_AD_IDS.BANNER,
	/** 이미지형 — 목록 사이에 끼워 넣는 인라인 배너 */
	BANNER_NATIVE: IS_DEV
		? TEST_AD_IDS.BANNER_NATIVE
		: PRODUCTION_AD_IDS.BANNER_NATIVE,
} as const;

/** 리워드 운영 ID가 실제로 발급됐는지. false면 리워드 기능을 화면에 노출하지 않는다. */
export const REWARDED_READY = !AD_GROUP_IDS.REWARDED.includes("PUT_PRODUCTION");

/* ── 진단 리포트의 자리 이름 ──────────────────────────────────────────────
 *
 * `placement`는 리포트의 **유일한 식별자**다. adGroupId를 그대로 쓰면 어느 자리인지
 * 알아볼 수 없고, 개발/운영 ID가 갈려 있으면 같은 자리가 두 줄로 쪼개진다.
 *
 * 전면·리워드는 **로드와 노출을 다른 이름으로 가른다**. 한 이름으로 묶으면
 * "못 받았다"와 "받았는데 못 띄웠다"를 영원히 구분할 수 없다 (ads-log KI-19).
 */

/** 하단 고정 배너 — App 셸에 한 장. */
export const BOTTOM_BANNER_PLACEMENT = "app_bottom";

/** 월 상세 — 요약과 목록 사이 인라인 이미지 배너. */
export const MONTH_INFEED_PLACEMENT = "month_infeed";

/** 전면광고 자리 이름의 뿌리. 서비스가 `_load` / `_show`를 붙여 쓴다. */
export const INTERSTITIAL_PLACEMENT = "interstitial";

/** 리워드광고 자리 이름의 뿌리. */
export const REWARDED_PLACEMENT = "rewarded";

/** adGroupId → 자리 이름의 뿌리. 전면·리워드 전용. */
export function placementOf(adGroupId: string): string {
	if (adGroupId === AD_GROUP_IDS.REWARDED) return REWARDED_PLACEMENT;
	if (adGroupId === AD_GROUP_IDS.INTERSTITIAL) return INTERSTITIAL_PLACEMENT;
	return "fullscreen_other";
}

/**
 * 진단 로그의 광고 **종류**. 호출부에 상수로 박지 않고 ID에서 뽑는다.
 *
 * 박아두면 리워드가 전면형으로 집계되고, 같은 자리의 로드/노출이 서로 다른 종류로
 * 갈려 진단이 안 된다. 하필 리워드와 전면은 단가 차이가 커서 이게 뭉개지면 "어느 쪽
 * eCPM이 빠졌나"에 답을 못 한다 (ads-log KI-24).
 */
export function adTypeOf(adGroupId: string): AdType {
	if (adGroupId === AD_GROUP_IDS.REWARDED) return "rewarded";
	if (adGroupId === AD_GROUP_IDS.INTERSTITIAL) return "interstitial";
	return "banner";
}

/**
 * 토스 광고 크리에이티브가 **자기 안에** 갖고 있는 여백(px). 실기기 측정값이다.
 *
 * 배너에 닿는 쪽은 우리가 주는 여백에서 이만큼 빼야 한다 — 안 빼면 두 겹이 되어
 * 광고가 떠 보인다. 다른 앱에서 하단 세이프에어리어와 숫자패드 양쪽에서 겪었다
 * (ads-log KI-32).
 */
export const CREATIVE_INNER_PADDING = 20;

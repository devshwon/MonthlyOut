import { useCallback, useEffect } from "react";
import {
	armFullScreenAd,
	initializeFullScreenAd,
	type ShowAdOptions,
	type ShowAdResult,
	showFullScreenAdSlot,
} from "@/services/fullScreenAd";

export type { ShowAdOptions, ShowAdResult };

/**
 * 전면형/리워드 광고 React 훅.
 *
 * - mount 시 슬롯 등록(멱등). **등록만 하고 받지는 않는다.**
 * - 모든 ready/loading 상태는 module-level singleton(fullScreenAd.ts)에서 유지
 *   → 컴포넌트 리렌더/언마운트로 광고 상태를 잃지 않음
 *
 * ## `arm` — 광고를 언제 받아올지
 *
 * **마운트만으로는 안 받는다.** `arm`이 true가 된 순간에 받는다. "사용자가 이 광고를
 * 볼 수 있는 상태"(버튼이 화면에 떴다 · 시트가 열렸다)를 그대로 넘기면 된다.
 * `arm`을 생략하면 `show()`를 부를 때 받으므로 몇 초 기다릴 수 있다 — 검수 7-4
 * ("재생 시점 실시간 로딩 금지")를 생각하면 볼 수 있는 자리에서는 켜두는 게 맞다.
 *
 * 마운트에 붙이면 광고를 볼 일이 없는 세션까지 매번 한 편씩 받아놓고 버린다.
 * 실패가 아니라서 어떤 판정에도 안 걸리고 eCPM만 조용히 깎인다 (ads-log KI-23).
 *
 * **"상태"를 넘기지 말 것.** `arm: level < 2`처럼 "아직 잠겨 있다"는 거의 모든 세션에
 * 참이라 마운트와 다를 게 없다. 다른 앱이 그 상태로 79세션에 69편을 받아 10편을
 * 띄웠다(14%). 조건이 참인 세션 수와 실제로 본 세션 수의 자릿수가 다르면 그건 상태다.
 *
 * @example 전면형 — 볼 수 있는 자리에 왔을 때만 미리 받는다
 * ```tsx
 * const ad = useFullScreenAd(AD_GROUP_IDS.INTERSTITIAL, { arm: sheetOpen });
 * const r = await ad.show();
 * if (r.ok) { ... }
 * ```
 *
 * @example 리워드 — userEarnedReward가 안 오는 광고그룹이 있어 impressed로 받는다
 * ```tsx
 * const rewardAd = useFullScreenAd(AD_GROUP_IDS.REWARDED, { arm: open });
 * const r = await rewardAd.show({ requireReward: true });
 * if (r.ok || r.impressed) grantPoints();   // ads-log KI-27
 * ```
 */
export function useFullScreenAd(
	adGroupId: string,
	options: { arm?: boolean } = {},
) {
	const { arm = false } = options;

	useEffect(() => {
		initializeFullScreenAd(adGroupId);
	}, [adGroupId]);

	useEffect(() => {
		armFullScreenAd(adGroupId, arm);
	}, [adGroupId, arm]);

	const show = useCallback(
		(showOptions?: ShowAdOptions): Promise<ShowAdResult> =>
			showFullScreenAdSlot(adGroupId, showOptions),
		[adGroupId],
	);

	/** 수동 프리로드 — 보통은 `arm`을 쓴다. */
	const preload = useCallback(
		() => armFullScreenAd(adGroupId, true),
		[adGroupId],
	);

	return { show, preload };
}

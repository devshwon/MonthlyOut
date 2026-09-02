import { useCallback, useEffect } from "react";
import {
	initializeFullScreenAd,
	type ShowAdOptions,
	type ShowAdResult,
	showFullScreenAdSlot,
} from "@/services/fullScreenAd";

export type { ShowAdOptions, ShowAdResult };

/**
 * 전면형/리워드 광고 React 훅.
 *
 * - mount 시 안전망으로 init (멱등 — main.tsx에서 이미 호출했어도 no-op)
 * - 모든 ready/loading 상태는 module-level singleton(fullScreenAd.ts)에서 유지
 *   → 컴포넌트 리렌더/언마운트로 광고 상태 잃지 않음
 *
 * @example 전면형 광고
 * ```tsx
 * const ad = useFullScreenAd(AD_GROUP_IDS.INTERSTITIAL);
 * const result = await ad.show();
 * if (result.ok) { ... }
 * ```
 *
 * @example 리워드 광고 — userEarnedReward로만 보상 지급
 * ```tsx
 * const rewardAd = useFullScreenAd(AD_GROUP_IDS.REWARDED);
 * const result = await rewardAd.show({ requireReward: true });
 * if (result.ok && result.reward) {
 *   grantPoints(result.reward.unitAmount);
 * }
 * ```
 */
export function useFullScreenAd(adGroupId: string) {
	useEffect(() => {
		initializeFullScreenAd(adGroupId);
	}, [adGroupId]);

	const show = useCallback(
		(options?: ShowAdOptions): Promise<ShowAdResult> =>
			showFullScreenAdSlot(adGroupId, options),
		[adGroupId],
	);

	const preload = useCallback(
		() => initializeFullScreenAd(adGroupId),
		[adGroupId],
	);

	return { show, preload };
}

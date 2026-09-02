/**
 * 전면형/리워드 광고 — module-level singleton.
 *
 * 토스 공식 가이드 충실 구현:
 * - `load → loaded 이벤트 → show → dismissed → 다음 load` 흐름
 * - `userEarnedReward` 이벤트로만 리워드 지급 (dismissed는 단순 닫기 — 보상 X)
 * - `isSupported()` 체크 후 미지원 환경 graceful fallback
 *
 * Hook으로 만들면 React 리렌더/언마운트로 ready 상태가 초기화됨 → singleton으로 영속.
 * 앱 시작 시 `initializeFullScreenAd(adGroupId)` 1회 호출 → preload + 자동 재로드.
 *
 * 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/IntegratedAd.md
 */
import {
	loadFullScreenAd,
	showFullScreenAd,
} from "@apps-in-toss/web-framework";

/** 리워드 광고 시청 결과 — userEarnedReward 발생 시 reward에 데이터 채워짐 */
export interface ShowAdResult {
	ok: boolean;
	reason?: "unsupported" | "failed" | "timeout" | "dismissed_no_reward";
	/** 리워드 데이터 — userEarnedReward 이벤트에서만 채워짐 (리워드 광고 한정) */
	reward?: {
		unitType: string;
		unitAmount: number;
	};
	/** 광고가 화면에 노출됐는지 (impression 이벤트 발생) — 수익 발생 시점 */
	impressed?: boolean;
}

export interface ShowAdOptions {
	/**
	 * true면 `userEarnedReward` 이벤트 없이 `dismissed`만 와도 실패로 간주 (리워드 광고용).
	 * false(기본)면 단순 시청 완료(dismissed)도 성공으로 처리 (전면형용).
	 */
	requireReward?: boolean;
}

const LOAD_WAIT_TIMEOUT_MS = 10_000;
const LOAD_POLL_INTERVAL_MS = 250;
const RELOAD_AFTER_SHOW_MS = 500;
const SECOND_PRELOAD_DELAY_MS = 600;

interface AdSlot {
	adGroupId: string;
	isReady: boolean;
	isLoading: boolean;
	loadCleanup: (() => void) | null;
	initialized: boolean;
}

const slots: Record<string, AdSlot> = {};

function getSlot(adGroupId: string): AdSlot {
	if (!slots[adGroupId]) {
		slots[adGroupId] = {
			adGroupId,
			isReady: false,
			isLoading: false,
			loadCleanup: null,
			initialized: false,
		};
	}
	return slots[adGroupId];
}

function isLoadSupported(): boolean {
	return loadFullScreenAd.isSupported?.() === true;
}

function isShowSupported(): boolean {
	return showFullScreenAd.isSupported?.() === true;
}

function preload(slot: AdSlot): void {
	if (!isLoadSupported()) {
		console.warn("[FullScreenAd] load not supported", slot.adGroupId);
		return;
	}
	if (slot.isLoading || slot.isReady) return;
	slot.isLoading = true;
	if (slot.loadCleanup) {
		try {
			slot.loadCleanup();
		} catch {
			/* ignore */
		}
		slot.loadCleanup = null;
	}
	try {
		console.log("[FullScreenAd] preload start", slot.adGroupId);
		slot.loadCleanup = loadFullScreenAd({
			options: { adGroupId: slot.adGroupId },
			onEvent: (event) => {
				if (event.type === "loaded") {
					slot.isReady = true;
					slot.isLoading = false;
					console.log("[FullScreenAd] loaded", slot.adGroupId);
				}
			},
			onError: (err) => {
				console.warn("[FullScreenAd] preload error", slot.adGroupId, err);
				slot.isReady = false;
				slot.isLoading = false;
			},
		});
	} catch (err) {
		console.warn("[FullScreenAd] preload exception", slot.adGroupId, err);
		slot.isLoading = false;
	}
}

/**
 * 앱 시작 시 1회 호출. 같은 adGroupId로 다시 부르면 no-op.
 * - 즉시 1차 preload + 600ms 후 2차 preload (SDK 첫 시도 실패 대비)
 * - visibilitychange 리스너 — 앱 복귀 시 미준비면 자동 재로드
 */
export function initializeFullScreenAd(adGroupId: string): void {
	const slot = getSlot(adGroupId);
	if (slot.initialized) return;
	slot.initialized = true;

	preload(slot);
	setTimeout(() => preload(slot), SECOND_PRELOAD_DELAY_MS);

	if (typeof document !== "undefined") {
		document.addEventListener("visibilitychange", () => {
			if (document.visibilityState !== "visible") return;
			if (!isLoadSupported()) return;
			if (!slot.isReady && !slot.isLoading) {
				preload(slot);
			}
		});
	}
}

/**
 * 광고 표시. ready면 즉시, 미준비면 폴링(최대 10초) 후 표시.
 *
 * - `requireReward: false` (기본): dismissed → ok (전면형 광고용)
 * - `requireReward: true`: dismissed → 보상 안 받음으로 처리 (리워드 광고용)
 *   userEarnedReward 이벤트 발생 시만 ok + reward 데이터 반환
 */
export function showFullScreenAdSlot(
	adGroupId: string,
	options: ShowAdOptions = {},
): Promise<ShowAdResult> {
	const { requireReward = false } = options;
	return new Promise((resolve) => {
		if (!isShowSupported()) {
			console.warn("[FullScreenAd] show not supported", adGroupId);
			resolve({ ok: false, reason: "unsupported" });
			return;
		}
		const slot = getSlot(adGroupId);
		if (!slot.initialized) initializeFullScreenAd(adGroupId);

		const launchShow = () => {
			let settled = false;
			let earnedReward: ShowAdResult["reward"] | undefined;
			let impressed = false;
			const finish = (result: ShowAdResult) => {
				if (settled) return;
				settled = true;
				resolve(result);
			};
			try {
				console.log("[FullScreenAd] showFullScreenAd call", adGroupId, {
					requireReward,
				});
				showFullScreenAd({
					options: { adGroupId },
					onEvent: (event) => {
						console.log("[FullScreenAd] show event", event.type);
						switch (event.type) {
							case "requested":
							case "show":
								slot.isReady = false; // ready 소비
								break;
							case "impression":
								impressed = true; // 수익 발생 시점
								break;
							case "userEarnedReward":
								// 공식 가이드: "userEarnedReward 이벤트가 발생했을 때만 리워드를 지급"
								earnedReward = event.data;
								break;
							case "dismissed":
								// 광고 닫힘 — 리워드 광고면 userEarnedReward 발생 여부로 판정
								if (requireReward && !earnedReward) {
									finish({
										ok: false,
										reason: "dismissed_no_reward",
										impressed,
									});
								} else {
									finish({ ok: true, reward: earnedReward, impressed });
								}
								setTimeout(() => preload(slot), RELOAD_AFTER_SHOW_MS);
								break;
							case "failedToShow":
								finish({ ok: false, reason: "failed", impressed });
								setTimeout(() => preload(slot), RELOAD_AFTER_SHOW_MS);
								break;
							default:
								break;
						}
					},
					onError: (err) => {
						console.warn("[FullScreenAd] show error", adGroupId, err);
						finish({ ok: false, reason: "failed", impressed });
						setTimeout(() => preload(slot), RELOAD_AFTER_SHOW_MS);
					},
				});
			} catch (err) {
				console.warn("[FullScreenAd] show exception", adGroupId, err);
				finish({ ok: false, reason: "failed" });
			}
		};

		if (slot.isReady) {
			launchShow();
			return;
		}
		if (!slot.isLoading) preload(slot);
		const startedAt = Date.now();
		const interval = setInterval(() => {
			if (slot.isReady) {
				clearInterval(interval);
				launchShow();
				return;
			}
			if (Date.now() - startedAt >= LOAD_WAIT_TIMEOUT_MS) {
				clearInterval(interval);
				console.warn("[FullScreenAd] load timeout", adGroupId);
				resolve({ ok: false, reason: "timeout" });
				return;
			}
			if (!slot.isLoading && !slot.isReady) preload(slot);
		}, LOAD_POLL_INTERVAL_MS);
	});
}

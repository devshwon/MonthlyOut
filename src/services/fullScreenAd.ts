/**
 * 전면형/리워드 광고 — module-level singleton.
 *
 * - `load → loaded 이벤트 → show → dismissed → 다음 load` 흐름
 * - `isSupported()` 체크 후 미지원 환경 graceful fallback
 *
 * Hook으로 만들면 React 리렌더/언마운트로 ready 상태가 초기화되므로 singleton으로
 * 영속시킨다.
 *
 * ## 진단 로그가 붙어 있다 (ads-log)
 *
 * **로드와 노출을 다른 자리 이름으로 가른다**(`interstitial` / `interstitial_show`).
 * 한 이름으로 묶으면 "못 받았다"와 "받았는데 못 띄웠다"를 영원히 구분할 수 없다
 * (KI-19). 그리고 전면·리워드는 viewable 이벤트가 없어서 `imp`가 **유일한 최종
 * 지표**다 — 노출 probe에 `impression()`을 안 열면 구조적으로 0이 되고, "광고가 안
 * 뜬다"로 오진한다 (KI-25 ★ 미탐).
 *
 * 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/IntegratedAd.md
 */
import {
	loadFullScreenAd,
	showFullScreenAd,
} from "@apps-in-toss/web-framework";
import { adTypeOf, placementOf } from "@/constants/ads";
import { type AdProbe, adProbe, markAd } from "@/lib/ad-log";

/** 리워드 광고 시청 결과 — userEarnedReward 발생 시 reward에 데이터 채워짐 */
export interface ShowAdResult {
	ok: boolean;
	reason?: "unsupported" | "failed" | "timeout" | "dismissed_no_reward";
	/** 리워드 데이터 — userEarnedReward 이벤트에서만 채워짐 (리워드 광고 한정) */
	reward?: {
		unitType: string;
		unitAmount: number;
	};
	/**
	 * 광고가 화면에 노출됐는지 (impression 이벤트 발생).
	 *
	 * 리워드 지급을 `userEarnedReward`에만 걸지 않는다 — 그 이벤트를 안 주는
	 * 광고그룹이 있다. 호출부는 `r.ok || r.impressed`로 받는다 (ads-log KI-27).
	 */
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
/**
 * 노출 구간 probe의 무응답 판정 시간.
 *
 * 이 구간은 `dismissed`(사용자가 광고를 닫음)가 와야 판정이 끝난다. 즉 이 값은
 * "광고 뜨는 데 걸리는 시간"이 아니라 **사용자가 광고를 보고 닫기까지 걸리는 시간**의
 * 상한이다. ad-log 기본값 8초를 그냥 쓰면 "8초 안에 안 닫으면 실패"가 되어, 정상
 * 노출되고 수익까지 난 슬롯이 timeout으로 집계된다 (ads-log KI-17).
 */
const SHOW_WAIT_TIMEOUT_MS = 60_000;
const LOAD_POLL_INTERVAL_MS = 250;
/**
 * 로드가 실패한 뒤 다시 쏘기까지 기다리는 시간.
 *
 * `show()`의 폴링 루프가 250ms마다 `preload`를 부르는데, TLS 오류처럼 `onError`가
 * 즉시 오는 실패에서는 그 루프가 10초 동안 **최대 40회**를 쏜다. 다른 앱에서 한
 * 세션이 이렇게 `render_fail` 31건을 만들어 그날 전면 실패율을 통째로 지배했다.
 * 실패 자체는 그 기기의 네트워크 문제지만, **한 사람의 문제가 리포트를 덮어 다른
 * 원인을 못 보게 만드는 건** 고칠 수 있다 (ads-log KI-06 · KI-36).
 */
const LOAD_RETRY_COOLDOWN_MS = 2_000;
const RELOAD_AFTER_SHOW_MS = 500;
const SECOND_PRELOAD_DELAY_MS = 600;

interface AdSlot {
	adGroupId: string;
	isReady: boolean;
	isLoading: boolean;
	/** 로드 시작 시각 — 응답이 영영 안 와 isLoading이 멈춘(stuck) 경우 감지용. */
	loadStartedAt: number;
	/** 마지막 로드 실패 시각 — 실패 직후 재시도를 막는다({@link LOAD_RETRY_COOLDOWN_MS}). */
	lastErrorAt: number;
	loadCleanup: (() => void) | null;
	initialized: boolean;
	/**
	 * 사용자가 이 광고를 볼 수 있는 상태인가 — **프리로드의 유일한 방아쇠다.**
	 *
	 * 마운트나 앱 진입에 붙이면 광고를 볼 일이 없는 세션까지 매번 한 편씩 받아놓고
	 * 버린다. 실패가 아니라서 어떤 판정에도 안 걸리고 eCPM만 조용히 깎인다 — 다른
	 * 앱 실측에서 155편을 받아 26편만 노출(17%)했다 (ads-log KI-23 ★ 수익 누수).
	 *
	 * **"아직 잠겨 있다" 같은 상태를 넘기면 안 된다.** 거의 모든 세션에 참이라
	 * 마운트와 다를 게 없다. 조건이 참인 세션 수와 실제로 본 세션 수의 자릿수가
	 * 다르면 그건 의도가 아니라 상태다.
	 */
	armed: boolean;
	/** 진행 중인 로드의 판정. 무응답이면 probe의 attachTimeout이 timeout으로 남긴다. */
	loadProbe: AdProbe | null;
	/** 미지원은 슬롯당 한 번만 남긴다 — preload는 복귀할 때마다 불린다. */
	unsupportedLogged: boolean;
}

const slots: Record<string, AdSlot> = {};

function getSlot(adGroupId: string): AdSlot {
	if (!slots[adGroupId]) {
		slots[adGroupId] = {
			adGroupId,
			isReady: false,
			isLoading: false,
			loadStartedAt: 0,
			lastErrorAt: 0,
			loadCleanup: null,
			initialized: false,
			armed: false,
			loadProbe: null,
			unsupportedLogged: false,
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

/** 로드 구간의 자리 이름. 노출 구간과 반드시 갈라야 한다 (KI-19). */
function loadPlacement(adGroupId: string): string {
	return placementOf(adGroupId);
}

/** 노출 구간의 자리 이름. */
function showPlacement(adGroupId: string): string {
	return `${placementOf(adGroupId)}_show`;
}

function preload(slot: AdSlot): void {
	if (!isLoadSupported()) {
		// 미지원도 기록해야 한다. 안 남기면 로그에서 "아무 일도 안 일어남"으로 보여
		// 광고가 왜 없는지 되짚을 수 없다 (ads-log KI-10).
		if (!slot.unsupportedLogged) {
			slot.unsupportedLogged = true;
			adProbe({
				placement: loadPlacement(slot.adGroupId),
				adType: adTypeOf(slot.adGroupId),
				adGroupId: slot.adGroupId,
			}).unsupported("loadFullScreenAd");
		}
		return;
	}
	if (slot.isReady) return;
	// 방금 실패한 로드를 곧바로 다시 쏘지 않는다. 이게 없으면 show()의 폴링 루프가
	// 실패 하나를 수십 건으로 부풀린다 — LOAD_RETRY_COOLDOWN_MS 주석 참고.
	if (Date.now() - slot.lastErrorAt < LOAD_RETRY_COOLDOWN_MS) return;
	// 로드 콜백(loaded/error)이 끝내 안 와 isLoading이 멈춘 경우 → 타임아웃이 지나면
	// 다시 시작한다. 이 가드가 없으면 isLoading이 영영 true로 남아 이후 preload가
	// 전부 무시되고, 앱을 껐다 켜기 전까지 전면광고가 다시는 안 뜬다 (ads-log KI-08).
	const stuck =
		slot.isLoading && Date.now() - slot.loadStartedAt > LOAD_WAIT_TIMEOUT_MS;
	if (slot.isLoading && !stuck) return;

	slot.isLoading = true;
	slot.loadStartedAt = Date.now();
	if (slot.loadCleanup) {
		try {
			slot.loadCleanup();
		} catch {
			/* ignore */
		}
		slot.loadCleanup = null;
	}

	// 로드 구간의 판정 1건. 컨테이너가 없으므로 el은 넘기지 않는다 — 넘기면 검사할
	// 엘리먼트 없이 viewable을 기다리다 not_viewable 오탐이 된다 (ads-log KI-01).
	const probe = adProbe({
		placement: loadPlacement(slot.adGroupId),
		adType: adTypeOf(slot.adGroupId),
		adGroupId: slot.adGroupId,
		attachTimeoutMs: LOAD_WAIT_TIMEOUT_MS,
	});
	slot.loadProbe = probe;

	try {
		slot.loadCleanup = loadFullScreenAd({
			options: { adGroupId: slot.adGroupId },
			onEvent: (event) => {
				if (event.type === "loaded") {
					slot.isReady = true;
					slot.isLoading = false;
					// 성공했으면 쿨다운을 푼다. 안 풀면 노출 직후 재프리로드가
					// 직전 실패에 걸려 건너뛴다.
					slot.lastErrorAt = 0;
					probe.rendered();
				}
			},
			onError: (err) => {
				slot.isReady = false;
				slot.isLoading = false;
				slot.lastErrorAt = Date.now();
				probe.renderFail(err);
			},
		});
	} catch (err) {
		slot.isLoading = false;
		slot.lastErrorAt = Date.now();
		probe.threw(err);
	}
}

/**
 * 슬롯을 등록한다. **여기서는 받지 않는다.**
 *
 * 이름이 `initialize`라 등록만 하는 것처럼 보이는데 실제로 load를 부르던 구현이
 * 여러 앱에서 발견됐다 — 진입점에서 부르니 모든 세션이 한 편씩 받아 버렸다
 * (ads-log KI-23). 받는 건 {@link armFullScreenAd}가 한다.
 *
 * 복귀 시 재로드 리스너는 **arm된 슬롯에만** 적용된다.
 */
export function initializeFullScreenAd(adGroupId: string): void {
	const slot = getSlot(adGroupId);
	if (slot.initialized) return;
	slot.initialized = true;

	if (typeof document !== "undefined") {
		document.addEventListener("visibilitychange", () => {
			if (document.visibilityState !== "visible") return;
			if (!slot.armed) return;
			if (!slot.isReady && !slot.isLoading) preload(slot);
		});
	}
}

/**
 * "사용자가 이 광고를 볼 수 있는 상태가 됐다"를 알린다 — 이때 미리 받는다.
 *
 * 검수 7-4("재생 시점 실시간 로딩 금지")를 만족시키되, 볼 일 없는 세션까지 받지는
 * 않는 지점이 여기다.
 */
export function armFullScreenAd(adGroupId: string, armed: boolean): void {
	const slot = getSlot(adGroupId);
	if (!slot.initialized) initializeFullScreenAd(adGroupId);
	if (slot.armed === armed) return;
	slot.armed = armed;
	if (!armed) return;

	preload(slot);
	// SDK 첫 시도가 조용히 실패하는 경우가 있어 한 번 더 찔러본다.
	setTimeout(() => preload(slot), SECOND_PRELOAD_DELAY_MS);
}

/**
 * 광고 표시. ready면 즉시, 미준비면 폴링(최대 10초) 후 표시.
 *
 * - `requireReward: false` (기본): dismissed → ok (전면형 광고용)
 * - `requireReward: true`: dismissed → 보상 안 받음으로 처리 (리워드 광고용)
 */
export function showFullScreenAdSlot(
	adGroupId: string,
	options: ShowAdOptions = {},
): Promise<ShowAdResult> {
	const { requireReward = false } = options;
	const placement = showPlacement(adGroupId);
	const adType = adTypeOf(adGroupId);

	return new Promise((resolve) => {
		if (!isShowSupported()) {
			adProbe({ placement, adType, adGroupId }).unsupported("showFullScreenAd");
			resolve({ ok: false, reason: "unsupported" });
			return;
		}
		const slot = getSlot(adGroupId);
		if (!slot.initialized) initializeFullScreenAd(adGroupId);

		const launchShow = () => {
			// 노출 구간의 판정 1건. 이 구간은 dismissed로 끝나므로 상한이 길다 (KI-17).
			const showProbe = adProbe({
				placement,
				adType,
				adGroupId,
				attachTimeoutMs: SHOW_WAIT_TIMEOUT_MS,
			});
			let settled = false;
			let earnedReward: ShowAdResult["reward"] | undefined;
			let impressed = false;
			const finish = (result: ShowAdResult) => {
				if (settled) return;
				settled = true;
				resolve(result);
			};

			try {
				showFullScreenAd({
					options: { adGroupId },
					onEvent: (event) => {
						switch (event.type) {
							case "requested":
							case "show":
								slot.isReady = false; // ready 소비
								showProbe.rendered();
								break;
							case "impression":
								// 전면·리워드는 viewable 이벤트가 없어 이게 유일한 최종
								// 지표다. 안 걸면 구조적으로 0이 된다 (ads-log KI-25).
								impressed = true;
								showProbe.impression();
								break;
							case "userEarnedReward":
								earnedReward = event.data;
								break;
							case "dismissed":
								if (requireReward && !earnedReward) {
									// 폴백으로 지급되는 건과 진짜 미지급을 가른다. 안 가르면
									// 폴백 성공까지 미지급으로 찍혀 KI-27의 탐지 신호
									// (no_reward == imp)가 영구 오탐이 된다 (ads-log KI-35).
									markAd(
										placement,
										adType,
										impressed ? "no_earned_event" : "no_reward",
									);
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
								showProbe.renderFail("failedToShow");
								finish({ ok: false, reason: "failed", impressed });
								setTimeout(() => preload(slot), RELOAD_AFTER_SHOW_MS);
								break;
							default:
								break;
						}
					},
					onError: (err) => {
						showProbe.renderFail(err);
						finish({ ok: false, reason: "failed", impressed });
						setTimeout(() => preload(slot), RELOAD_AFTER_SHOW_MS);
					},
				});
			} catch (err) {
				showProbe.threw(err);
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
				// 로드 실패 자체는 위 로드 probe가 이미 판정으로 남겼다. 여기서는
				// "사용자가 눌렀는데 끝내 광고가 없었다"는 UX 사실만 보조 카운터로
				// 센다 — 판정으로 또 올리면 같은 실패가 두 번 집계된다 (ads-log KI-12).
				markAd(placement, adType, "no_ad_on_tap");
				resolve({ ok: false, reason: "timeout" });
				return;
			}
			if (!slot.isLoading && !slot.isReady) preload(slot);
		}, LOAD_POLL_INTERVAL_MS);
	});
}

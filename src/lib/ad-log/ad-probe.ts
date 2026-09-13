/**
 * 광고 슬롯 1개의 생애를 추적해 최종 판정 1건을 남긴다.
 *
 * SDK 콜백을 그대로 받아 넘기기만 하면 되도록 설계했다 —
 * 기존 BannerAd.tsx의 callbacks 블록에 probe 호출 한 줄씩만 추가하면 끝.
 *
 * 판정은 슬롯당 정확히 한 번(settle)만 일어나고,
 *   - ok      → 카운터만 +1 (상세 없음)
 *   - 그 외   → 카운터 +1 + 상세 1행
 * 결론이 안 난 채 언마운트되면 아무것도 안 남긴다 (아래 '왜 버리는가' 참고).
 */
import { addIssue, count, relTime } from "./buffer";
import { getOptions, isActive } from "./config";
import { inspect } from "./obstruction";
import type { AdIssue, AdOutcome, AdType } from "./types";

export interface AdProbeOptions {
	/** 광고 '위치' 이름. adGroupId가 아니다 — 'home_bottom_banner'처럼 사람이 읽는 이름. */
	placement: string;
	adType: AdType;
	adGroupId?: string;
	/** 컨테이너. 가려짐 검사에 필요하다. 없으면 크기/가려짐 판정은 생략된다. */
	el?: HTMLElement | (() => HTMLElement | null);
	/** 화면 이름 — 미지정 시 init의 screen() 사용 */
	screen?: string;
	/** 이 슬롯만 다른 값을 쓰고 싶을 때 */
	viewableMs?: number;
	attachTimeoutMs?: number;
}

/**
 * 배너 SDK가 콜백에 실어주는 광고 식별자 — `BannerSlotEventPayload`의 일부다.
 * 콜백 인자를 **그대로** 넘기면 된다: `onAdImpression: (p) => probe.impression(p)`.
 *
 * **전면·리워드에는 이런 게 없다.** `showFullScreenAd`의 impression 이벤트는
 * `{ type: 'impression' }`뿐이라 넘길 것이 없다 — 배너 전용 계측이다.
 */
export interface AdEventPayload {
	adMetadata?: { requestId?: string; creativeId?: string } | null;
}

export interface AdProbe {
	/** attachBanner/load 직전에 호출 (생성 시 자동 시작되므로 보통 불필요) */
	attached(): void;
	rendered(): void;
	/**
	 * 노출 1건. **배너라면 SDK 콜백 인자를 그대로 넘긴다** — 넘기면 이 노출이
	 * 토스가 과금하는 노출인지까지 갈린다. 아래 `imp_reqid` 주석 참고.
	 */
	impression(payload?: AdEventPayload): void;
	viewable(): void;
	clicked(): void;
	nofill(): void;
	renderFail(err?: unknown): void;
	unsupported(why?: string): void;
	initFail(err?: unknown): void;
	/** attach 호출 자체가 throw했을 때 */
	threw(err: unknown): void;
	/**
	 * 판정과 무관한 보조 카운터를 1 올린다. **실패율 분모에 들어가지 않는다.**
	 *
	 * 광고 성패가 아닌 것(대기 시간, 프리로드 적중 여부 같은 자체 지표)을
	 * 남길 때 쓴다. 이런 걸 outcome으로 기록하면 광고가 멀쩡한데도 실패율이
	 * 올라가고, 임계치를 넘으면 알림까지 잘못 울려 알림을 못 믿게 된다.
	 *
	 * @example probe.mark("wait_slow")
	 */
	mark(name: string): void;
	/** 언마운트 시 반드시 호출 — 타이머 정리 */
	dispose(): void;
}

/**
 * 판정 outcome으로 예약된 이름들. mark 이름이 여기 걸리면 서버가 판정으로 집계해
 * 실패율에 섞여버리므로 자동으로 접두사를 붙인다.
 */
const RESERVED_OUTCOMES = new Set([
	"ok",
	"nofill",
	"unsupported",
	"init_fail",
	"attach_throw",
	"render_fail",
	"timeout",
	"not_viewable",
	"obstructed",
	"zero_size",
	"offscreen",
]);

function normalizeMark(name: string): string | null {
	// '|'는 서버가 카운터 키를 3등분하는 구분자라 들어가면 파싱이 깨진다.
	const n = String(name ?? "")
		.trim()
		.replace(/[|\s]+/g, "_")
		.slice(0, 24);
	if (!n) return null;
	return RESERVED_OUTCOMES.has(n) ? `mark_${n}`.slice(0, 24) : n;
}

// ── 백그라운드 전환 감지 (모듈 공용) ───────────────────────────
// 앱이 백그라운드로 가면 광고가 viewable이 안 되는 게 당연하다.
// 그걸 '가려짐'으로 기록하면 로그가 오탐으로 뒤덮인다.
let hideCount = 0;
let hideHooked = false;
function hookHide(): void {
	if (hideHooked || typeof document === "undefined") return;
	hideHooked = true;
	document.addEventListener(
		"visibilitychange",
		() => {
			if (document.visibilityState === "hidden") hideCount++;
		},
		{ passive: true },
	);
}

function msg(err: unknown): string | undefined {
	if (err == null) return undefined;
	if (typeof err === "string") return err.slice(0, 200);
	if (err instanceof Error) return `${err.name}: ${err.message}`.slice(0, 200);
	try {
		const o = err as { code?: unknown; message?: unknown };
		if (o.message || o.code)
			return `${o.code ?? ""} ${o.message ?? ""}`.trim().slice(0, 200);
		return JSON.stringify(err).slice(0, 200);
	} catch {
		return String(err).slice(0, 200);
	}
}

/** 아무것도 안 하는 probe — init 전이거나 비활성일 때 반환. 호출부에 분기를 안 만들려고. */
const NOOP: AdProbe = {
	attached() {},
	rendered() {},
	impression() {},
	viewable() {},
	clicked() {},
	nofill() {},
	renderFail() {},
	unsupported() {},
	initFail() {},
	threw() {},
	mark() {},
	dispose() {},
};

/**
 * probe 없이 보조 카운터만 1 올린다.
 *
 * 슬롯 생애와 무관한 지표(대기 시간, 프리로드 적중률 등)는 probe를 만들 이유가 없다.
 * 억지로 만들면 쓰지도 않는 attach 타임아웃이 돌아 엉뚱한 `timeout`이 기록된다.
 *
 * @example markAd("reward_gate", "interstitial", "wait_slow")
 */
export function markAd(placement: string, adType: AdType, name: string): void {
	if (!isActive()) return;
	const n = normalizeMark(name);
	if (!n) return;
	count(`${placement.replace(/\|/g, "/").slice(0, 64)}|${adType}|${n}`);
}

export function adProbe(opts: AdProbeOptions): AdProbe {
	if (!isActive()) return NOOP;
	const o = getOptions();
	if (!o) return NOOP;
	hookHide();

	const viewableMs = opts.viewableMs ?? o.viewableMs;
	const attachTimeoutMs = opts.attachTimeoutMs ?? o.attachTimeoutMs;
	const hideAtStart = hideCount;

	const tAttach = Date.now();
	let tRendered = 0;
	let settled = false;
	let disposed = false;
	let sawImpression = false;
	// 퍼널 단계는 슬롯당 최대 1번만 센다. rendered/impression 콜백이 두 번 오는 SDK도
	// 있는데, 그러면 fill이 요청보다 많아져 비율이 100%를 넘는 일이 생긴다.
	let stFill = false;
	let stImp = false;
	let stView = false;
	let attachTimer: ReturnType<typeof setTimeout> | null = null;
	let viewTimer: ReturnType<typeof setTimeout> | null = null;

	const clearTimers = () => {
		if (attachTimer) {
			clearTimeout(attachTimer);
			attachTimer = null;
		}
		if (viewTimer) {
			clearTimeout(viewTimer);
			viewTimer = null;
		}
	};

	const getEl = (): HTMLElement | null => {
		try {
			return typeof opts.el === "function" ? opts.el() : (opts.el ?? null);
		} catch {
			return null;
		}
	};

	// 카운터 키는 서버에서 '|'로 3등분되므로, placement에 '|'가 있으면 파싱이 깨진다.
	const safePlacement = opts.placement.replace(/\|/g, "/").slice(0, 64);
	const key = (outcome: string) => `${safePlacement}|${opts.adType}|${outcome}`;

	// ── 퍼널 단계 카운터 ──────────────────────────────────────────
	// 판정(outcome) 하나로는 "요청 대비 노출" 비율을 낼 수 없다. 판정은 슬롯당 1개라
	// 요청→채움→노출→viewable 네 단계가 한 값으로 압축되고, 게다가
	//   - unsupported·init_fail은 요청이 안 나갔는데도 분모에 들어가고
	//   - obstructed·not_viewable은 채워져 렌더까지 됐는데 실패로 집계된다
	// 그래서 ok/판정은 fill rate가 아니라 viewable rate에 가까워진다.
	//
	// 단계를 따로 세면 fill rate와 viewability를 분리할 수 있다. eCPM을 깎는 건
	// 후자(노출은 됐는데 안 보임)이므로 이 구분이 실제로 중요하다.
	//
	// 전부 SETTLED_OUTCOMES 밖의 이름이라 서버가 aux로 분류한다 — 실패율은 안 건드린다.
	//   req   요청 시도 (유효 요청 = req − unsupported − init_fail)
	//   fill  광고가 채워져 렌더 시작
	//   imp   노출
	//   view  수익 발생 지점
	count(key("req"));

	/**
	 * 이 노출에 광고 식별자(`adMetadata.requestId`)가 실려 있었는지 센다.
	 *
	 * ## 왜 이게 필요한가
	 * 우리 `imp`는 SDK가 `onAdImpression`을 불렀다는 뜻일 뿐이고, **토스가 과금하는
	 * 노출과 같지 않다.** web-bridge의 `wrapCallbacks`를 보면 토스 쪽 집계는
	 * `requestId`로 붙고, 그 값이 비어도 publisher 콜백은 그대로 호출된다:
	 *
	 *   onAdImpression: (payload) => {
	 *     tossAdEventLog({ ..., request_id: payload?.adMetadata?.requestId ?? "" });
	 *     callbacks.onAdImpression?.(mapEvent(payload));   // ← 우리 probe
	 *   }
	 *
	 * 그래서 attribution이 깨져도 우리 리포트는 노출 100%로 초록색이 된다. 실제로
	 * bitenglish·thump·checkly·blink가 우리 로그로는 노출 100%인데 토스 콘솔은
	 * 며칠째 0이었고, **우리 계측에 이 둘을 가를 지문이 없어서** 원인 판별이 거기서
	 * 막혔다. (blink는 존재할 수 없는 placeholder ID로 `loaded`를 57번 받았다 —
	 * 콜백은 실제 광고그룹이 아니어도 온다는 증거다.)
	 *
	 * ## 왜 두 개를 다 세는가
	 * 없는 쪽만 세면 "정상"과 "아직 payload를 안 넘기는 앱"이 똑같이 0으로 보인다.
	 * 둘을 다 세면 `imp_reqid + imp_no_reqid == imp`가 성립할 때만 그 앱이 이 계측을
	 * 실제로 태운 것이고, 둘 다 없으면 미적용이다 — 공백과 정상이 구분된다.
	 */
	const countReqId = (payload?: AdEventPayload): void => {
		// payload를 안 넘기는 호출부(전면·리워드, 미이관 배너)는 아무것도 세지 않는다.
		// 여기서 없는 걸 no_reqid로 세면 미이관 앱이 전부 100% 깨진 것으로 보인다.
		if (payload === undefined) return;
		count(key(payload?.adMetadata?.requestId ? "imp_reqid" : "imp_no_reqid"));
	};

	/** 백그라운드에 다녀왔으면 광고 판정을 신뢰할 수 없다. */
	const wentBackground = () =>
		hideCount !== hideAtStart ||
		(typeof document !== "undefined" && document.visibilityState === "hidden");

	function settle(
		outcome: AdOutcome,
		extra?: Partial<Pick<AdIssue, "r" | "b" | "w" | "h" | "rt">>,
	): void {
		if (settled) return;
		settled = true;
		clearTimers();

		count(key(outcome));
		if (outcome === "ok") return;

		const issue: AdIssue = {
			t: relTime(),
			p: safePlacement,
			a: opts.adType,
			o: outcome,
			s: opts.screen ?? safeScreen(),
			...extra,
		};
		if (opts.adGroupId) issue.g = opts.adGroupId.slice(-12);
		if (tRendered) issue.tr = tRendered - tAttach;
		addIssue(issue);
	}

	function safeScreen(): string | undefined {
		try {
			return o?.screen?.();
		} catch {
			return undefined;
		}
	}

	// attach 후 아무 콜백도 안 오는 경우 — SDK 무응답. 이것도 반드시 잡아야 할 문제다.
	attachTimer = setTimeout(() => {
		attachTimer = null;
		if (settled || disposed) return;
		if (wentBackground()) return; // 백그라운드면 콜백이 안 오는 게 정상
		settle("timeout", { r: `no callback in ${attachTimeoutMs}ms` });
	}, attachTimeoutMs);

	return {
		attached() {
			/* 생성 시점이 곧 attach — 호출부 가독성을 위해 존재만 시켜둔다 */
		},

		rendered() {
			if (disposed) return;
			// 단계 기록은 판정보다 먼저. 이미 settle된 뒤에 rendered가 와도
			// "채워졌다"는 사실 자체는 유효하다.
			if (!stFill) {
				stFill = true;
				count(key("fill"));
			}
			if (settled) return;
			tRendered = Date.now();
			if (attachTimer) {
				clearTimeout(attachTimer);
				attachTimer = null;
			}

			// strictViewable=false: 렌더됐으면 성공으로 본다 (기본값, 오탐 없음)
			//
			// 컨테이너가 없어도 마찬가지다. viewable을 기다리는 유일한 목적이
			// "안 보였을 때 DOM에서 원인을 캐는 것"인데, 검사할 엘리먼트가 없으면
			// 기다려봤자 알아낼 게 없다.
			//
			// 이 가드가 없으면 전면·리워드 광고가 전부 오탐이 된다. 그쪽 probe는
			// 보통 '로드 성공'에 rendered()를 부르고 viewable()은 부르지 않는데,
			// 그러면 8초 뒤 컨테이너 없는 DOM 검사를 거쳐 not_viewable로 찍힌다.
			// 광고는 멀쩡히 로드됐는데 100% 실패로 보이고, 표본이 쌓이면 알림까지
			// 잘못 울려서 정작 진짜 문제를 묻어버린다.
			if (!o.strictViewable || !getEl()) {
				settle("ok");
				return;
			}

			// strictViewable=true: viewable까지 봐야 진짜 성공. 안 오면 원인을 캐낸다.
			viewTimer = setTimeout(() => {
				viewTimer = null;
				if (settled || disposed) return;
				if (wentBackground()) return; // 오탐 방지 — 조용히 폐기

				const r = inspect(getEl());
				if (r.outcome === "ok") {
					settle("not_viewable", {
						r: sawImpression ? "impression only" : "no impression",
						w: r.w,
						h: r.h,
						rt: r.ratio,
					});
				} else {
					settle(r.outcome, {
						r: r.note,
						b: r.blocker,
						w: r.w,
						h: r.h,
						rt: r.ratio,
					});
				}
			}, viewableMs);
		},

		impression(payload) {
			if (disposed) return;
			sawImpression = true;
			if (!stImp) {
				stImp = true;
				count(key("imp"));
				countReqId(payload);
			}

			// 임프레션은 SDK가 응답했다는 확정적 증거다. attach 타임아웃은 "콜백이
			// 하나도 안 온다"를 잡는 장치이므로 여기서 반드시 꺼야 한다.
			//
			// 이 한 줄이 없으면 전면·리워드의 `_show` probe가 통째로 오탐이 된다.
			// 그쪽은 보통 `dismissed`(사용자가 광고를 닫음)에서 rendered()를 부르는데,
			// 닫기까지 기본값 8초를 넘기는 건 흔한 일이라 광고가 정상 노출되고
			// 수익까지 난 슬롯이 timeout으로 판정된다. 실제로 blink·lottofactory에서
			// imp가 찍힌 슬롯이 timeout으로 집계됐다. (ads-log KI-17)
			//
			// settle은 하지 않는다 — viewable/dismissed를 계속 기다려야 하고,
			// 끝내 결론이 안 나면 dispose()가 판단한다.
			if (attachTimer) {
				clearTimeout(attachTimer);
				attachTimer = null;
			}
		},

		viewable() {
			if (disposed) return;
			if (!stView) {
				stView = true;
				count(key("view"));
			}
			if (settled) {
				// 우리 타이머가 너무 짧아서 문제로 오판한 뒤 뒤늦게 viewable이 온 경우.
				// viewableMs 튜닝 지표로 쓰려고 카운터만 남긴다 (상세는 불필요).
				count(key("late_viewable"));
				return;
			}
			settle("ok");
		},

		clicked() {
			count(key("click"));
		},

		nofill() {
			settle("nofill");
		},

		renderFail(err) {
			settle("render_fail", { r: msg(err) });
		},

		unsupported(why) {
			settle("unsupported", { r: why?.slice(0, 200) });
		},

		initFail(err) {
			settle("init_fail", { r: msg(err) });
		},

		threw(err) {
			settle("attach_throw", { r: msg(err) });
		},

		mark(name) {
			// 판정과 독립적이다 — settle 이후에도, dispose 전이면 언제든 올릴 수 있다.
			if (disposed) return;
			const n = normalizeMark(name);
			if (n) count(key(n));
		},

		/**
		 * ## 왜 결론 없이 언마운트되면 버리는가
		 * 사용자가 광고 뜨기 전에 화면을 넘긴 건 버그가 아니다. 이걸 실패로 기록하면
		 * "빠르게 스크롤하는 사용자가 많은 화면"이 전부 문제로 보인다.
		 * 반대로 성공으로 세면 분모가 부풀어 실패율이 실제보다 낮게 보인다.
		 * 모르는 건 모르는 채로 버리는 게 맞다.
		 */
		dispose() {
			if (disposed) return;
			disposed = true;
			clearTimers();
			if (settled) return;

			// 렌더 + 임프레션까지 확인됐다면 성공으로 세도 안전하다.
			if (tRendered && sawImpression) {
				settled = true;
				count(key("ok"));

				// 다만 이건 **검사를 통과한 ok가 아니라 검사를 못 한 ok**다.
				// strictViewable이 켜져 있으면 viewable이 안 올 때 8초 뒤 inspect()가
				// 원인(obstructed/zero_size/offscreen)을 캐야 하는데, 그 전에 dispose가
				// 오면 바로 위 clearTimers()가 타이머를 죽여 검사가 한 번도 안 돈다.
				// ad-log는 백그라운드 전환 때 전송하며 probe를 dispose하므로, 렌더 후
				// viewableMs 안에 앱을 벗어난 슬롯이 전부 여기로 샌다.
				//
				// 판정을 빼지 않고 카운터만 따로 두는 이유: ok를 안 세면 이 슬롯이
				// 집계에서 통째로 빠져 분모가 줄고, 남은 실패가 도드라져 실패율이
				// 부풀어 오른다(ok 9 + nofill 1 → 10%가 100%로). 규모만 드러내고
				// 실패율은 건드리지 않는다. (ads-log KI-16)
				count(key("disposed_early"));
			}
		},
	};
}

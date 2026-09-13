/**
 * React 어댑터 (선택). 코어는 React를 모른다 — 이 파일만 React에 의존한다.
 *
 * probe는 useEffect 안에서 생성/파기되는데, attachBanner 콜백은 그보다 먼저 만들어질 수
 * 있다. 그래서 훅은 '고정된 껍데기'를 돌려주고 내부에서 현재 probe로 위임한다.
 * 덕분에 StrictMode의 이중 마운트에도 콜백 참조가 깨지지 않는다.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AdProbe, AdProbeOptions } from "./ad-probe";
import { adProbe } from "./ad-probe";

type ProbeKey = keyof AdProbe;

const METHODS: ProbeKey[] = [
	"attached",
	"rendered",
	"impression",
	"viewable",
	"clicked",
	"nofill",
	"renderFail",
	"unsupported",
	"initFail",
	"threw",
	"mark",
	"dispose",
];

/**
 * 재시도 간격 기본값. 노필은 재고가 다시 채워지기를 기다리는 것이므로 초 단위로
 * 조를 이유가 없다. 짧게 반복하면 배터리·네트워크만 쓰고 결과는 같다.
 */
const DEFAULT_RETRY_DELAYS_MS = [30_000, 60_000, 120_000];

/**
 * attach 후 콜백이 하나도 안 올 때 실패로 보고 다음 시도로 넘어가기까지의 시간.
 * probe도 자체 타임아웃으로 `timeout` 판정을 남기지만, 그건 로그일 뿐 화면의
 * 상태 기계를 풀어주지는 않는다.
 */
const DEFAULT_ATTACH_WATCHDOG_MS = 15_000;

export interface UseAdProbeResult<T extends HTMLElement = HTMLDivElement> {
	/**
	 * 광고 컨테이너에 붙일 ref — 가려짐 검사에 쓰인다.
	 *
	 * `React.RefObject<T>`를 쓰지 않고 구조적 타입으로 둔 이유:
	 * RefObject의 정의가 React 18(`{readonly current: T | null}`)과
	 * 19(`{current: T}`)에서 다르다. 이 형태는 두 버전 모두에서 JSX ref에 그대로 꽂힌다.
	 */
	ref: { current: T | null };
	/** SDK 콜백에 그대로 연결할 probe */
	probe: AdProbe;
}

/**
 * @example
 * const { ref, probe } = useAdProbe({ placement: "home_bottom", adType: "banner", adGroupId });
 * // ...
 * <div ref={ref} />
 * // callbacks: { onNoFill: () => probe.nofill(), ... }
 *
 * 배너에는 보통 {@link useAdSlot}을 쓴다 — 노필 재시도까지 함께 처리한다.
 */
export function useAdProbe<T extends HTMLElement = HTMLDivElement>(
	options: Omit<AdProbeOptions, "el">,
): UseAdProbeResult<T> {
	const { ref, probe } = useAdSlot<T>({ ...options, retryDelaysMs: [] });
	return { ref, probe };
}

/**
 * 슬롯의 상태.
 *
 * - `loading`  시도 진행 중 (자리를 예약해 둔다)
 * - `shown`    광고가 렌더됐다
 * - `waiting`  실패했고 재시도가 예약됐다 — **컨테이너를 DOM에 남겨둬야 한다.**
 *              화면에서는 높이 0으로 접는다
 * - `gone`     더 시도하지 않는다 (미지원·초기화 실패·재시도 소진)
 */
export type AdSlotState = "loading" | "shown" | "waiting" | "gone";

export interface UseAdSlotOptions extends Omit<AdProbeOptions, "el"> {
	/**
	 * 실패 후 다시 받아보는 간격. 기본 30s → 60s → 120s.
	 * `[]`를 주면 재시도하지 않는다(= 예전 useAdProbe 동작).
	 */
	retryDelaysMs?: number[];
	/** 콜백이 하나도 안 올 때 실패로 보고 넘어가기까지. 기본 15초. */
	attachWatchdogMs?: number;
}

export interface UseAdSlotResult<T extends HTMLElement = HTMLDivElement>
	extends UseAdProbeResult<T> {
	/**
	 * attach를 수행하는 useEffect의 **의존성에 반드시 넣는다.** 재시도할 때마다
	 * 1씩 늘어나므로, effect가 다시 돌면서 정리(destroy) 후 새로 붙는다.
	 */
	attemptKey: number;
	state: AdSlotState;
	/** 지금까지 실패한 횟수. 0이면 아직 실패 없음. */
	failures: number;
}

/**
 * 배너 한 자리의 생애를 관리한다 — 판정 기록 + 노필 재시도.
 *
 * ## 왜 모듈에 두는가
 *
 * `onNoFill` → 슬롯 영구 숨김은 앱마다 똑같이 반복된 실수다(ads-log KI-06).
 * 노필은 "지금 채울 광고가 없다"이지 "이 환경에서는 광고가 안 된다"가 아닌데,
 * 한 번 실패하면 그 실행 내내 배너가 사라져 **그 세션의 노출이 0이 된다.**
 *
 * 재시도를 앱마다 손으로 짜면 백오프·백그라운드 처리·시도별 판정 기록을 매번
 * 다시 틀린다. 그래서 여기 한 번만 둔다.
 *
 * ## 시도마다 새 판정
 *
 * probe는 슬롯당 한 번만 판정하므로, 재시도는 **새 probe**로 시작해야 한다.
 * 그러지 않으면 첫 시도의 노필만 남고 이후 성공/실패가 전부 유실된다.
 *
 * ## 백그라운드에서는 재시도하지 않는다
 *
 * 보이지도 않는 화면에 광고를 요청하면 그 노출은 어차피 viewable이 될 수 없다.
 * 타이머가 백그라운드에서 만료되면 화면이 돌아올 때까지 미룬다.
 *
 * @example
 * const { ref, probe, attemptKey, state } = useAdSlot({
 *   placement: "home_bottom", adType: "banner", adGroupId,
 * });
 *
 * useEffect(() => {
 *   // ... attachBanner(adGroupId, ref.current, { callbacks: { onNoFill: () => probe.nofill(), ... } })
 *   return () => attached?.destroy();
 * }, [attemptKey, adGroupId, probe, ref]);
 *
 * if (state === "gone") return null;          // 이때만 언마운트한다
 * const reserved = state === "waiting" ? 0 : 96;
 * return <div ref={ref} style={{ width: "100%", minHeight: reserved }} />;
 */
export function useAdSlot<T extends HTMLElement = HTMLDivElement>(
	options: UseAdSlotOptions,
): UseAdSlotResult<T> {
	const ref = useRef<T | null>(null);
	const inner = useRef<AdProbe | null>(null);

	const [attemptKey, setAttemptKey] = useState(0);
	const [state, setState] = useState<AdSlotState>("loading");
	const [failures, setFailures] = useState(0);

	const {
		placement,
		adType,
		adGroupId,
		screen,
		viewableMs,
		attachTimeoutMs,
		retryDelaysMs,
		attachWatchdogMs,
	} = options;

	// 배열 리터럴을 그대로 받으면 렌더마다 새 참조라 effect가 계속 재실행된다.
	const delaysKey = (retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS).join(",");
	const delays = useMemo(
		() => (delaysKey ? delaysKey.split(",").map(Number) : []),
		[delaysKey],
	);

	/**
	 * 이번 시도가 이미 결론 났는지. 판정은 슬롯당 한 번이므로, 늦게 도착한 콜백이
	 * 다음 시도의 상태를 건드리지 못하게 막는다.
	 */
	const decided = useRef(false);
	const failCount = useRef(0);

	/** 실패를 상태 기계에 알린다. `permanent`면 재시도하지 않는다. */
	const onFailure = useCallback(
		(permanent: boolean) => {
			if (decided.current) return;
			decided.current = true;
			const n = failCount.current + 1;
			failCount.current = n;
			setFailures(n);
			// 재시도 예산은 지금까지의 실패 횟수로 센다 — 배열 길이를 넘으면 끝.
			setState(permanent || n > delays.length ? "gone" : "waiting");
		},
		[delays.length],
	);

	const onSuccess = useCallback(() => {
		if (decided.current) return;
		decided.current = true;
		setState("shown");
	}, []);

	// probe를 갈아끼워도 이 객체의 정체성은 유지된다 → 콜백이 항상 현재 probe를 본다.
	//
	// 상태 전이를 probe 안이 아니라 여기서 가로채는 이유: 로깅이 꺼져 있으면
	// (개발·미리보기) adProbe가 NOOP을 돌려준다. 판정을 probe에 의존하면 그 환경에서
	// 재시도가 통째로 죽는다. 화면 동작은 로깅 여부와 무관해야 한다.
	const probe = useMemo<AdProbe>(() => {
		const f = {} as Record<string, (...a: unknown[]) => void>;
		for (const m of METHODS) {
			f[m] = (...args: unknown[]) => {
				if (m === "rendered") onSuccess();
				else if (m === "nofill" || m === "renderFail") onFailure(false);
				// 미지원·초기화 실패·attach throw는 다시 붙여도 결과가 같다.
				// (잘못된 adGroupId, 구버전 토스 앱, 컨테이너 없음)
				else if (m === "unsupported" || m === "initFail" || m === "threw")
					onFailure(true);

				const p = inner.current as unknown as Record<
					string,
					(...a: unknown[]) => void
				>;
				p?.[m]?.(...args);
			};
		}
		return f as unknown as AdProbe;
	}, [onSuccess, onFailure]);

	// 시도마다 새 probe = 새 판정. attemptKey가 바뀌면 이전 probe는 dispose된다.
	// biome-ignore lint/correctness/useExhaustiveDependencies: attemptKey는 본문에서 안 읽지만 재시도를 촉발하는 값이다 — 빼면 재시도해도 probe가 안 바뀐다.
	useEffect(() => {
		decided.current = false;
		inner.current = adProbe({
			placement,
			adType,
			adGroupId,
			screen,
			viewableMs,
			attachTimeoutMs,
			el: () => ref.current,
		});
		return () => {
			inner.current?.dispose();
			inner.current = null;
		};
	}, [
		attemptKey,
		placement,
		adType,
		adGroupId,
		screen,
		viewableMs,
		attachTimeoutMs,
	]);

	// 콜백이 하나도 안 오는 경우. probe는 자체 타임아웃으로 `timeout` 판정을 남기지만
	// 그건 로그일 뿐이라, 화면은 영영 loading에 머문다.
	useEffect(() => {
		if (state !== "loading") return;
		const ms = attachWatchdogMs ?? DEFAULT_ATTACH_WATCHDOG_MS;
		const t = setTimeout(() => onFailure(false), ms);
		return () => clearTimeout(t);
		// state만으로 충분하다 — 재시도는 waiting → loading 전이를 거치므로
		// 여기서 attemptKey를 또 볼 필요가 없다.
	}, [state, attachWatchdogMs, onFailure]);

	// 재시도 예약. 백그라운드에서 만료되면 화면이 돌아올 때까지 미룬다 —
	// 안 보이는 화면에 요청한 광고는 어차피 viewable이 될 수 없다.
	useEffect(() => {
		if (state !== "waiting") return;
		const delay = delays[failCount.current - 1] ?? delays[delays.length - 1];
		let cancelled = false;

		const go = () => {
			if (cancelled) return;
			setState("loading");
			setAttemptKey((k) => k + 1);
		};

		const fire = () => {
			if (cancelled) return;
			if (typeof document !== "undefined" && document.hidden) {
				const onVisible = () => {
					if (document.hidden) return;
					document.removeEventListener("visibilitychange", onVisible);
					go();
				};
				document.addEventListener("visibilitychange", onVisible);
				cleanupVisibility = () =>
					document.removeEventListener("visibilitychange", onVisible);
				return;
			}
			go();
		};

		let cleanupVisibility: (() => void) | null = null;
		const timer = setTimeout(fire, delay);
		return () => {
			cancelled = true;
			clearTimeout(timer);
			cleanupVisibility?.();
		};
	}, [state, delays]);

	return { ref, probe, attemptKey, state, failures };
}

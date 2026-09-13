/**
 * ad-log — 토스 미니앱 광고 진단 로거 (의존성 0).
 *
 * 앱 진입점에서 initAdLog() 한 번, 광고 컴포넌트에서 adProbe() 한 번이면 끝.
 * 실시간 모니터링이 아니라 "나중에 몰아 보고 고치기" 용도라, 전송은 세션 종료 시 1회다.
 *
 * @example
 * // main.tsx
 * initAdLog({
 *   endpoint: "https://log.example.com/v1/ad",
 *   app: "blink",
 *   appVersion: __APP_VERSION__,
 *   enabled: !import.meta.env.DEV,
 *   screen: () => location.pathname,
 * });
 */
import { current, drain, flushSaveNow, hasPending, initBuffer } from "./buffer";
import type { AdLogOptions } from "./config";
import { debugLog, getOptions, isActive, setOptions } from "./config";
import { isPlaceholder } from "./endpoint";
import { installGlobalErrorHooks } from "./errors";
import { send } from "./transport";

export type { AdEventPayload, AdProbe, AdProbeOptions } from "./ad-probe";
export { adProbe, markAd } from "./ad-probe";
export type { AdLogOptions } from "./config";
export { logError } from "./errors";
export { inspect as inspectAdSlot } from "./obstruction";
export type {
	AdIssue,
	AdLogPayload,
	AdOutcome,
	AdType,
	AppErrorEntry,
} from "./types";

let started = false;

/**
 * 로거 초기화. 앱당 1회.
 *
 * 실패해도 절대 throw하지 않는다 — 로깅이 앱을 죽이는 건 어떤 경우에도 용납 안 됨.
 */
export function initAdLog(options: AdLogOptions): void {
	if (started) return;
	try {
		const o = setOptions(options);
		if (!o.enabled) {
			debugLog("disabled");
			return;
		}

		// sync를 안 거친 소스가 그대로 빌드된 경우. 이대로 두면 존재하지 않는 주소로
		// 계속 요청을 쏘거나(최악의 경우) 남의 수집기로 데이터가 간다. 조용히 끈다.
		if (isPlaceholder(o.endpoint)) {
			console.warn(
				"[ad-log] endpoint가 설정되지 않아 비활성화됩니다. " +
					"ads-log에서 `npm run sync -- <앱경로>`를 실행했는지 확인하세요.",
			);
			setOptions({ ...options, enabled: false });
			return;
		}
		started = true;

		initBuffer(o.app);
		if (o.captureGlobalErrors) installGlobalErrorHooks();

		// ── 세션 종료 감지 ─────────────────────────────────────
		// 웹뷰에서 신뢰할 수 있는 건 사실상 visibilitychange→hidden 하나뿐이다.
		// beforeunload는 모바일에서 안 오는 경우가 많고, pagehide는 보조로만 쓴다.
		document.addEventListener(
			"visibilitychange",
			() => {
				if (document.visibilityState === "hidden") {
					flushSaveNow();
					if (hasPending()) send("beacon");
				}
			},
			{ passive: true },
		);
		window.addEventListener(
			"pagehide",
			() => {
				flushSaveNow();
				if (hasPending()) send("beacon");
			},
			{ passive: true },
		);

		// 지난 실행에서 못 보낸 게 있으면 지금 올린다.
		// 앱이 죽어서 남은 로그가 여기서 회수된다 — 가장 중요한 데이터가 보통 여기 있다.
		if (hasPending()) {
			setTimeout(() => send("fetch"), 2000); // 부팅 경로와 네트워크 경합 피하기
		}

		debugLog("init", o.app, o.endpoint);
	} catch (e) {
		// 여기서 터지면 그냥 로깅 없이 앱이 도는 게 맞다
		console.warn("[ad-log] init failed", e);
	}
}

/**
 * 즉시 전송. 보통 필요 없지만, 진단 중이거나 개발자 메뉴에서 강제로 올릴 때 쓴다.
 * 세션은 봉인되고 새 세션이 시작된다.
 */
export function flushAdLog(): void {
	if (!isActive()) return;
	flushSaveNow();
	if (hasPending()) send("fetch");
}

/** 개발용 — 지금까지 이 세션에 쌓인 내용을 들여다본다. */
export function peekAdLog() {
	return current();
}

/** 개발용 — 쌓인 걸 전송하지 않고 버린다. */
export function dropAdLog(): void {
	drain();
	const o = getOptions();
	if (o) {
		try {
			localStorage.removeItem(o.storageKey);
		} catch {
			/* ignore */
		}
	}
}

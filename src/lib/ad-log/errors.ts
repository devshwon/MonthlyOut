/**
 * 일반 예외 수집.
 *
 * 광고가 안 뜨는 원인의 상당수는 광고 코드가 아니라 그 위쪽에서 터진 예외다
 * (렌더 트리가 죽어서 컨테이너가 아예 안 붙는다든지). 광고 로그만 봐서는
 * "아무 일도 안 일어남"으로 보이므로, 예외도 같은 파이프라인에 태워야 원인이 이어진다.
 */
import { addError, relTime } from "./buffer";
import { getOptions, isActive } from "./config";
import type { AppErrorEntry } from "./types";

function stackTop(err: unknown): string | undefined {
	try {
		const st = (err as Error)?.stack;
		if (typeof st !== "string") return undefined;
		// 상위 3프레임이면 위치 특정에 충분하다. 전체는 beacon 용량만 먹는다.
		return st.split("\n").slice(0, 4).join("\n").slice(0, 500);
	} catch {
		return undefined;
	}
}

function message(err: unknown): string {
	if (typeof err === "string") return err.slice(0, 300);
	if (err instanceof Error) return `${err.name}: ${err.message}`.slice(0, 300);
	try {
		return JSON.stringify(err).slice(0, 300);
	} catch {
		return String(err).slice(0, 300);
	}
}

function screen(): string | undefined {
	try {
		return getOptions()?.screen?.();
	} catch {
		return undefined;
	}
}

/**
 * 예외 1건 기록. 어디서 불러도 안전하다 (init 전이면 무시).
 *
 * @example
 * try { risky() } catch (e) { logError(e, { where: "reward-grant" }); }
 */
export function logError(
	err: unknown,
	extra?: Record<string, string | number | boolean>,
	kind = "manual",
): void {
	if (!isActive()) return;
	const entry: AppErrorEntry = {
		t: relTime(),
		k: kind,
		m: message(err),
		st: stackTop(err),
		s: screen(),
	};
	if (extra) entry.x = extra;
	addError(entry);
}

let hooked = false;

/** window.onerror / unhandledrejection 후킹. init에서 자동 호출된다. */
export function installGlobalErrorHooks(): void {
	if (hooked || typeof window === "undefined") return;
	hooked = true;

	window.addEventListener("error", (ev) => {
		// 리소스 로드 실패(img/script)는 ErrorEvent.error가 없다 — 잡아도 노이즈라 건너뛴다
		if (!ev.error && !ev.message) return;
		logError(ev.error ?? ev.message, undefined, "error");
	});

	window.addEventListener("unhandledrejection", (ev) => {
		logError(ev.reason, undefined, "rejection");
	});
}

/** init 옵션과 전역 설정 보관. */
import { DEFAULT_ENDPOINT } from "./endpoint";
import type { AdLogContext } from "./types";

export interface AdLogOptions {
	/**
	 * 수집 엔드포인트. **보통 지정하지 않는다** — sync 시 endpoint.ts에 구워진 값을 쓴다.
	 * 특정 앱만 다른 수집기로 보내야 할 때만 덮어쓴다.
	 */
	endpoint?: string;
	/** 앱 식별자. Worker의 ALLOWED_APPS에 등록돼 있어야 수집된다. */
	app: string;
	/** 앱 버전 — 회귀 추적의 핵심 축이므로 꼭 넣을 것 */
	appVersion?: string;

	/** false면 완전 무동작 (개발 환경에서 끄기용). 기본 true */
	enabled?: boolean;
	/** 콘솔에 수집 내역을 찍는다. 기본 false */
	debug?: boolean;

	/** 현재 화면/라우트 이름을 돌려주는 함수 */
	screen?: () => string | undefined;

	/** 세션당 문제 상세 상한. 기본 30 */
	maxIssues?: number;
	/** 세션당 예외 상한. 기본 20 */
	maxErrors?: number;
	/** 세션당 카운터 키 상한. 기본 80 */
	maxCounters?: number;

	/** window.onerror / unhandledrejection 자동 후킹. 기본 true */
	captureGlobalErrors?: boolean;

	/**
	 * rendered 후 이 시간 안에 viewable이 안 오면 문제로 판정. 기본 5000ms.
	 *
	 * ⚠️ 토스 SDK의 onAdViewable 발화 조건을 실기기에서 검증하기 전에는
	 * `strictViewable: false`로 두는 걸 권장. 검증 전 켜두면 not_viewable
	 * 오탐이 로그를 덮어버린다.
	 */
	viewableMs?: number;
	/** not_viewable/obstructed 판정을 켤지. 기본 false (검증 후 켤 것) */
	strictViewable?: boolean;
	/** attach 후 어떤 콜백도 없을 때 timeout으로 판정할 시간. 기본 8000ms */
	attachTimeoutMs?: number;

	/** localStorage 스풀 키. 기본 'adlog.spool' */
	storageKey?: string;
	/** 페이로드 직렬화 상한 바이트. 넘으면 오래된 것부터 버린다. 기본 48000 */
	maxBodyBytes?: number;
}

export interface ResolvedOptions
	extends Required<Omit<AdLogOptions, "screen" | "appVersion">> {
	appVersion?: string;
	screen?: () => string | undefined;
}

const DEFAULTS = {
	endpoint: DEFAULT_ENDPOINT,
	enabled: true,
	debug: false,
	maxIssues: 30,
	maxErrors: 20,
	maxCounters: 80,
	captureGlobalErrors: true,
	viewableMs: 5000,
	strictViewable: false,
	attachTimeoutMs: 8000,
	storageKey: "adlog.spool",
	maxBodyBytes: 48000,
};

let opts: ResolvedOptions | null = null;

export function setOptions(o: AdLogOptions): ResolvedOptions {
	// 명시적 undefined가 기본값을 덮어쓰지 않도록 걸러낸다
	// (`initAdLog({ endpoint: process.env.X })`처럼 쓰는 경우가 실제로 있다)
	const given = Object.fromEntries(
		Object.entries(o).filter(([, v]) => v !== undefined),
	) as AdLogOptions;
	opts = { ...DEFAULTS, ...given };
	return opts;
}

export function getOptions(): ResolvedOptions | null {
	return opts;
}

/** init 전에 호출된 API는 조용히 무시된다 — 로거가 앱을 깨뜨리면 안 된다. */
export function isActive(): boolean {
	return !!opts && opts.enabled;
}

export function debugLog(...args: unknown[]): void {
	if (opts?.debug) console.log("[ad-log]", ...args);
}

/** 초기 컨텍스트 수집. 실패해도 절대 throw하지 않는다. */
export function collectContext(): AdLogContext {
	const ctx: AdLogContext = { av: opts?.appVersion };
	try {
		const ua = navigator.userAgent || "";
		ctx.ua = ua.slice(0, 200);

		// UA 파싱은 best-effort. 틀려도 ctx.ua 원문으로 사후 복구 가능.
		const ios = /iPhone|iPad|iPod/i.test(ua);
		const android = /Android/i.test(ua);
		ctx.os = ios ? "ios" : android ? "android" : "other";
		const m = ios
			? ua.match(/OS (\d+[._]\d+)/)
			: ua.match(/Android (\d+(?:\.\d+)?)/);
		if (m) ctx.osv = m[1].replace("_", ".");

		ctx.vw = Math.round(window.innerWidth);
		ctx.vh = Math.round(window.innerHeight);
		ctx.dpr = Math.round((window.devicePixelRatio || 1) * 100) / 100;
		ctx.lang = navigator.language;

		const conn = (navigator as { connection?: { effectiveType?: string } })
			.connection;
		if (conn?.effectiveType) ctx.net = conn.effectiveType;
	} catch {
		/* 컨텍스트는 있으면 좋은 것일 뿐 — 실패는 무시 */
	}
	return ctx;
}

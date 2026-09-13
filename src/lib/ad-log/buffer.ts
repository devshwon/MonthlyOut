/**
 * 세션 버퍼 + localStorage 스풀.
 *
 * ## 왜 스풀이 필요한가
 * 웹뷰는 OS가 언제든 죽인다. 메모리에만 들고 있으면 "앱이 죽을 정도로 심각한 문제"가
 * 난 세션의 로그가 정확히 그 이유로 유실된다 — 가장 보고 싶은 데이터가 가장 잘 없어진다.
 * 그래서 수집 즉시 localStorage에 적어두고, 전송에 성공해야 지운다.
 * 못 보낸 페이로드는 다음 실행 때 같이 올라간다.
 */
import { collectContext, debugLog, getOptions } from "./config";
import type { AdIssue, AdLogPayload, AppErrorEntry } from "./types";

interface Spool {
	/** 전송 대기 중인 지난 세션 페이로드들 */
	q: AdLogPayload[];
	/** 진행 중인 현재 세션 */
	cur?: AdLogPayload;
}

let spool: Spool = { q: [] };
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function newId(): string {
	try {
		if (crypto?.randomUUID) return crypto.randomUUID().slice(0, 18);
	} catch {
		/* fallthrough */
	}
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function readStorage(): Spool | null {
	const o = getOptions();
	if (!o) return null;
	try {
		const raw = localStorage.getItem(o.storageKey);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Spool;
		if (!parsed || !Array.isArray(parsed.q)) return null;
		return parsed;
	} catch {
		return null; // 손상된 스풀은 그냥 버린다
	}
}

function writeStorage(): void {
	const o = getOptions();
	if (!o) return;
	try {
		localStorage.setItem(o.storageKey, JSON.stringify(spool));
	} catch {
		// 용량 초과 등 — 스풀을 비우고 현재 세션만 유지해 재시도
		try {
			spool.q = [];
			localStorage.setItem(o.storageKey, JSON.stringify(spool));
		} catch {
			/* localStorage 자체가 막힌 환경 — 메모리로만 동작 */
		}
	}
}

/** 저장은 디바운스. 이슈 하나 쌓일 때마다 동기 write 하면 메인 스레드가 튄다. */
function scheduleSave(): void {
	if (saveTimer) return;
	saveTimer = setTimeout(() => {
		saveTimer = null;
		writeStorage();
	}, 1000);
}

export function flushSaveNow(): void {
	if (saveTimer) {
		clearTimeout(saveTimer);
		saveTimer = null;
	}
	writeStorage();
}

/**
 * 스풀 복원 + 새 세션 시작.
 * 이전 실행의 미완 세션(cur)은 그대로 대기열로 승격한다 — 앱이 죽어서 봉인을 못 했을 뿐,
 * 내용은 멀쩡하다.
 */
export function initBuffer(app: string): void {
	const prev = readStorage();
	spool = { q: [] };
	if (prev) {
		spool.q = prev.q.slice(-20); // 대기열이 무한정 자라지 않도록
		if (
			prev.cur &&
			(prev.cur.i.length || prev.cur.e.length || hasCount(prev.cur))
		) {
			prev.cur.t1 = prev.cur.t1 || Date.now();
			spool.q.push(prev.cur);
		}
	}
	spool.cur = {
		v: 1,
		app,
		sid: newId(),
		t0: Date.now(),
		t1: 0,
		ctx: collectContext(),
		c: {},
		i: [],
		e: [],
	};
	writeStorage();
	debugLog("session start", spool.cur.sid, `pending=${spool.q.length}`);
}

function hasCount(p: AdLogPayload): boolean {
	for (const _ in p.c) return true;
	return false;
}

export function current(): AdLogPayload | undefined {
	return spool.cur;
}

/** 세션 시작 기준 상대 시각. 절대 epoch를 매 항목에 넣는 것보다 훨씬 짧다. */
export function relTime(): number {
	return spool.cur ? Date.now() - spool.cur.t0 : 0;
}

/** 성공/실패 무관하게 결과 1건을 카운트. 성공은 이 함수만 호출된다. */
export function count(key: string): void {
	const o = getOptions();
	const cur = spool.cur;
	if (!cur || !o) return;
	if (cur.c[key] === undefined) {
		if (Object.keys(cur.c).length >= o.maxCounters) {
			cur.d = (cur.d ?? 0) + 1;
			return;
		}
		cur.c[key] = 0;
	}
	cur.c[key] += 1;
	scheduleSave();
}

/** 동일 문제 반복은 새 행이 아니라 n 증가. 배너 리마운트 폭주를 흡수한다. */
export function addIssue(issue: AdIssue): void {
	const o = getOptions();
	const cur = spool.cur;
	if (!cur || !o) return;

	const dup = cur.i.find(
		(x) =>
			x.p === issue.p &&
			x.a === issue.a &&
			x.o === issue.o &&
			x.r === issue.r &&
			x.b === issue.b &&
			x.s === issue.s,
	);
	if (dup) {
		dup.n = (dup.n ?? 1) + 1;
		scheduleSave();
		return;
	}
	if (cur.i.length >= o.maxIssues) {
		cur.d = (cur.d ?? 0) + 1;
		return;
	}
	cur.i.push(issue);
	debugLog("issue", issue.o, issue.p, issue.r ?? "", issue.b ?? "");
	scheduleSave();
}

export function addError(entry: AppErrorEntry): void {
	const o = getOptions();
	const cur = spool.cur;
	if (!cur || !o) return;

	const dup = cur.e.find(
		(x) => x.k === entry.k && x.m === entry.m && x.st === entry.st,
	);
	if (dup) {
		dup.n = (dup.n ?? 1) + 1;
		scheduleSave();
		return;
	}
	if (cur.e.length >= o.maxErrors) {
		cur.d = (cur.d ?? 0) + 1;
		return;
	}
	cur.e.push(entry);
	debugLog("error", entry.k, entry.m);
	scheduleSave();
}

/** 보낼 게 있는지 — 빈 페이로드로 네트워크를 때리지 않기 위한 체크. */
export function hasPending(): boolean {
	if (spool.q.length) return true;
	const cur = spool.cur;
	return !!cur && (cur.i.length > 0 || cur.e.length > 0 || hasCount(cur));
}

/**
 * 전송용 배열을 뽑는다. 현재 세션은 봉인해서 대기열에 넣고 새 세션을 연다.
 * (앱이 다시 포그라운드로 돌아오면 그때부터는 새 세션으로 쌓인다)
 */
export function drain(): AdLogPayload[] {
	const cur = spool.cur;
	if (cur && (cur.i.length || cur.e.length || hasCount(cur))) {
		cur.t1 = Date.now();
		spool.q.push(cur);
	}
	if (cur) {
		spool.cur = {
			v: 1,
			app: cur.app,
			sid: newId(),
			t0: Date.now(),
			t1: 0,
			ctx: cur.ctx,
			c: {},
			i: [],
			e: [],
		};
	}
	const out = spool.q;
	spool.q = [];
	flushSaveNow();
	return out;
}

/** 전송 실패 시 되돌려 넣는다 (fetch 경로에서만 — beacon은 결과를 알 수 없다). */
export function restore(payloads: AdLogPayload[]): void {
	spool.q = [...payloads, ...spool.q].slice(-20);
	flushSaveNow();
}

/**
 * 로컬 프로모션 지급 원장 — SDK Storage(앱 영속) + localStorage(fallback) 이중 기록.
 *
 * ## 목적
 * 자체 BE 없이 클라이언트 측에서 일별 지급 한도 추적 + 중복 지급 best-effort 방지.
 * 토스 공식 가이드: "함수 중복 호출 시 동일 유저에 리워드 중복 지급될 수 있어
 * 방어 로직을 반드시 적용해 주세요."
 *
 * ## 영속성 한계 (반드시 사용자 인지)
 * - SDK Storage(`@apps-in-toss/web-framework`의 Storage)는 앱 종료/재시작 시 유지
 * - 단, **앱 데이터 삭제/재설치 시 모든 클라 저장소(SDK Storage, localStorage) 초기화**
 * - 따라서 클라 측 한도는 best-effort. **진정한 멱등성은 토스 측이 보장**:
 *   - 토스 일일 캡 5,000원/인 (서버 측 강제)
 *   - userKey별 분당 호출 제한 10회
 *
 * ## 데이터 형식
 * 키: `<APP_NS>::<YYYY-MM-DD>::<promotionCode>` → 누적 금액(원) 문자열
 * 날짜는 KST 기준. 어제 키는 자연 소멸. 7일 초과 키는 호출 시점에 정리.
 */

import { Storage } from "@apps-in-toss/web-framework";

/** 다른 미니앱과 키 충돌 방지용 네임스페이스 — 앱마다 다르게 변경해도 OK */
const KEY_NAMESPACE = "aip-grant-v1";
const RETENTION_DAYS = 7;

function todayKey(promotionCode: string): string {
	const d = new Date();
	// KST 기준 YYYY-MM-DD
	const kstDateStr = d.toLocaleString("en-CA", {
		timeZone: "Asia/Seoul",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
	return `${KEY_NAMESPACE}::${kstDateStr}::${promotionCode}`;
}

function isSdkStorageAvailable(): boolean {
	try {
		return !!Storage && typeof Storage.getItem === "function";
	} catch {
		return false;
	}
}

async function sdkGet(key: string): Promise<string | null> {
	if (!isSdkStorageAvailable()) return null;
	try {
		return await Storage.getItem(key);
	} catch (err) {
		console.warn("[GrantLedger] SDK Storage.getItem failed", err);
		return null;
	}
}

async function sdkSet(key: string, value: string): Promise<boolean> {
	if (!isSdkStorageAvailable()) return false;
	try {
		await Storage.setItem(key, value);
		return true;
	} catch (err) {
		console.warn("[GrantLedger] SDK Storage.setItem failed", err);
		return false;
	}
}

function lsGet(key: string): string | null {
	try {
		if (typeof localStorage === "undefined") return null;
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function lsSet(key: string, value: string): boolean {
	try {
		if (typeof localStorage === "undefined") return false;
		localStorage.setItem(key, value);
		return true;
	} catch {
		return false;
	}
}

/** 두 저장소 모두에서 읽어 더 큰 값 채택 — 한쪽 소실 시에도 보수적 추정 */
async function readTotal(promotionCode: string): Promise<number> {
	const key = todayKey(promotionCode);
	const [sdkVal, lsVal] = await Promise.all([
		sdkGet(key),
		Promise.resolve(lsGet(key)),
	]);
	const sdkNum = sdkVal ? parseInt(sdkVal, 10) : 0;
	const lsNum = lsVal ? parseInt(lsVal, 10) : 0;
	const sdkSafe = Number.isFinite(sdkNum) ? sdkNum : 0;
	const lsSafe = Number.isFinite(lsNum) ? lsNum : 0;
	return Math.max(sdkSafe, lsSafe);
}

/** 두 저장소 모두에 동일 값 기록 (best-effort 이중화) */
async function writeTotal(promotionCode: string, total: number): Promise<void> {
	const key = todayKey(promotionCode);
	const value = String(Math.max(0, Math.floor(total)));
	await Promise.all([sdkSet(key, value), Promise.resolve(lsSet(key, value))]);
}

/** 오늘 누적 지급액 (원) */
export async function getTodayTotal(promotionCode: string): Promise<number> {
	return readTotal(promotionCode);
}

export interface CanGrantResult {
	ok: boolean;
	todayTotal: number;
	dailyLimit: number;
	remainingToday: number;
	reason?: "over_limit";
}

/**
 * 지급 가능 여부 체크. amount=0이면 현재 상태 조회용으로 사용 가능.
 */
export async function canGrant(
	promotionCode: string,
	amount: number,
	dailyLimit: number,
): Promise<CanGrantResult> {
	const todayTotal = await readTotal(promotionCode);
	const remainingToday = Math.max(0, dailyLimit - todayTotal);
	if (amount > remainingToday) {
		return {
			ok: false,
			todayTotal,
			dailyLimit,
			remainingToday,
			reason: "over_limit",
		};
	}
	return { ok: true, todayTotal, dailyLimit, remainingToday };
}

/** 지급 완료 후 누적 +amount */
export async function recordGrant(
	promotionCode: string,
	amount: number,
): Promise<void> {
	if (amount <= 0) return;
	const cur = await readTotal(promotionCode);
	await writeTotal(promotionCode, cur + amount);
}

/** 7일 초과 원장 키를 localStorage에서 청소 (SDK Storage는 listKeys 미제공) */
export function pruneOldLocalEntries(): void {
	try {
		if (typeof localStorage === "undefined") return;
		const now = Date.now();
		const keysToRemove: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const k = localStorage.key(i);
			if (!k?.startsWith(`${KEY_NAMESPACE}::`)) continue;
			const prefixLen = KEY_NAMESPACE.length + 2;
			const dateStr = k.substring(prefixLen, prefixLen + 10);
			const parsed = Date.parse(dateStr);
			if (!Number.isFinite(parsed)) continue;
			const ageDays = (now - parsed) / (24 * 60 * 60 * 1000);
			if (ageDays > RETENTION_DAYS) keysToRemove.push(k);
		}
		for (const k of keysToRemove) {
			localStorage.removeItem(k);
		}
		if (keysToRemove.length > 0) {
			console.log("[GrantLedger] pruned old entries", keysToRemove.length);
		}
	} catch (err) {
		console.warn("[GrantLedger] prune failed", err);
	}
}

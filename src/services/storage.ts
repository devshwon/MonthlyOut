/**
 * localStorage 접근 한 겹.
 *
 * 이 앱의 저장소는 전부 이걸 거친다 —
 * - 테스트(node)나 서버 환경에는 localStorage가 없거나 이름만 있고 동작하지 않는다
 * - 사파리 시크릿 모드처럼 접근 자체가 예외를 던지는 환경이 있다
 * 어느 경우든 앱이 죽지 않고 "저장 안 된 상태"로 굴러가야 한다.
 */
function storage(): Storage | null {
	try {
		if (typeof localStorage === "undefined") {
			return null;
		}
		if (typeof localStorage.getItem !== "function") {
			return null;
		}
		return localStorage;
	} catch {
		return null;
	}
}

export function readStorage(key: string): string | null {
	try {
		return storage()?.getItem(key) ?? null;
	} catch {
		return null;
	}
}

export function writeStorage(key: string, value: string): void {
	try {
		storage()?.setItem(key, value);
	} catch {
		// 용량 초과·권한 없음 — 화면 상태는 그대로 두고 저장만 포기한다.
	}
}

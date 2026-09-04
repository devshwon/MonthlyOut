import type { YearMonth } from "@/types";

const STORAGE_KEY = "monthlyout.confirmations.v1";

/**
 * "이체 확인" 체크 상태. `{ "2026-09": ["chargeId", ...] }` 형태로 월별로 쌓는다.
 *
 * 잔고 부족 등으로 이체가 안 빠지는 달이 있어서, 항목 자체가 아니라
 * **그 달의 그 항목**에 체크가 붙는다. 다음 달은 다시 비어 있는 게 정상이다.
 */
type ConfirmationMap = Record<YearMonth, string[]>;

let confirmations: ConfirmationMap = load();
const listeners = new Set<() => void>();

function load(): ConfirmationMap {
	if (typeof localStorage === "undefined") {
		return {};
	}

	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) {
		return {};
	}

	try {
		const parsed = JSON.parse(raw);
		if (typeof parsed !== "object" || parsed === null) {
			return {};
		}

		const result: ConfirmationMap = {};
		for (const [ym, ids] of Object.entries(parsed)) {
			if (Array.isArray(ids)) {
				result[ym] = ids.filter((id): id is string => typeof id === "string");
			}
		}
		return result;
	} catch {
		return {};
	}
}

function persist(next: ConfirmationMap): void {
	confirmations = next;

	if (typeof localStorage !== "undefined") {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		} catch {
			// 저장 실패해도 화면 상태는 유지한다.
		}
	}

	for (const listener of listeners) {
		listener();
	}
}

export function subscribeConfirmations(listener: () => void): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function getConfirmations(): ConfirmationMap {
	return confirmations;
}

export function isConfirmed(ym: YearMonth, chargeId: string): boolean {
	return confirmations[ym]?.includes(chargeId) ?? false;
}

export function toggleConfirmed(ym: YearMonth, chargeId: string): void {
	const current = confirmations[ym] ?? [];
	const next = current.includes(chargeId)
		? current.filter((id) => id !== chargeId)
		: [...current, chargeId];

	persist({ ...confirmations, [ym]: next });
}

export function clearConfirmations(): void {
	persist({});
}

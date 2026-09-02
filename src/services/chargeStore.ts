import type { ChargeDraft, FixedCharge } from "@/types";

const STORAGE_KEY = "monthlyout.charges.v1";

/**
 * 고정과금 항목 저장소.
 * 서버 없이 로컬에만 둔다(기획서 7장) — 화면 간 공유는 모듈 스코프 스토어 +
 * useSyncExternalStore(`useCharges`)로 처리한다.
 */
let charges: FixedCharge[] = load();
const listeners = new Set<() => void>();

function createId(): string {
	const uuid = globalThis.crypto?.randomUUID?.();
	return (
		uuid ??
		`c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
	);
}

function isFixedCharge(value: unknown): value is FixedCharge {
	if (typeof value !== "object" || value === null) {
		return false;
	}
	const charge = value as Partial<FixedCharge>;
	return (
		typeof charge.id === "string" &&
		typeof charge.name === "string" &&
		typeof charge.amount === "number" &&
		typeof charge.billingDay === "number"
	);
}

function load(): FixedCharge[] {
	if (typeof localStorage === "undefined") {
		return [];
	}

	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) {
		return [];
	}

	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.filter(isFixedCharge) : [];
	} catch {
		return [];
	}
}

function persist(next: FixedCharge[]): void {
	charges = next;

	if (typeof localStorage !== "undefined") {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		} catch {
			// 저장 실패(용량 초과 등)해도 화면 상태는 유지한다.
		}
	}

	for (const listener of listeners) {
		listener();
	}
}

export function subscribeCharges(listener: () => void): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function getCharges(): FixedCharge[] {
	return charges;
}

export function getCharge(id: string): FixedCharge | undefined {
	return charges.find((charge) => charge.id === id);
}

export function addCharge(draft: ChargeDraft): FixedCharge {
	const now = Date.now();
	const charge: FixedCharge = {
		...draft,
		id: createId(),
		createdAt: now,
		updatedAt: now,
	};
	persist([...charges, charge]);
	return charge;
}

export function updateCharge(id: string, draft: ChargeDraft): void {
	persist(
		charges.map((charge) =>
			charge.id === id
				? { ...charge, ...draft, updatedAt: Date.now() }
				: charge,
		),
	);
}

export function removeCharge(id: string): void {
	persist(charges.filter((charge) => charge.id !== id));
}

export function clearCharges(): void {
	persist([]);
}

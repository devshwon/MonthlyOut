import { readStorage, writeStorage } from "@/services/storage";
import type { YearMonth } from "@/types";

const STORAGE_KEY = "monthlyout.cardbills.v1";

/**
 * 그 달 카드 **청구액**. `{ "2026-09": 870000 }` 형태로 달마다 쌓는다.
 *
 * 앱이 아는 건 고정분까지고, 나머지(식비·쇼핑)는 알 길이 없다. 그래서 카드사가 매달
 * 알려주는 청구액을 사용자가 한 줄 적어 넣는다 — 기획서 5장 "카드값 역산"의 입력이다.
 *
 * **청구액은 카드 고정분을 이미 품고 있다.** 그래서 "쓸 수 있는 돈"을 셀 때
 * 고정지출 총액과 청구액을 같이 빼면 카드 고정분이 두 번 빠진다. 계산은
 * `monthlyOutflow()` 하나로만 한다.
 */
type CardBillMap = Record<YearMonth, number>;

let bills: CardBillMap = load();
const listeners = new Set<() => void>();

function load(): CardBillMap {
	const raw = readStorage(STORAGE_KEY);
	if (!raw) {
		return {};
	}

	try {
		const parsed = JSON.parse(raw);
		if (typeof parsed !== "object" || parsed === null) {
			return {};
		}

		const result: CardBillMap = {};
		for (const [ym, amount] of Object.entries(parsed)) {
			if (typeof amount === "number" && Number.isFinite(amount) && amount > 0) {
				result[ym] = amount;
			}
		}
		return result;
	} catch {
		return {};
	}
}

function persist(next: CardBillMap): void {
	bills = next;

	writeStorage(STORAGE_KEY, JSON.stringify(next));

	for (const listener of listeners) {
		listener();
	}
}

export function subscribeCardBills(listener: () => void): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function getCardBills(): CardBillMap {
	return bills;
}

export function getCardBill(ym: YearMonth): number | undefined {
	return bills[ym];
}

/** 0이나 빈 값을 넣으면 "안 적은 것"으로 되돌린다 — 0원 청구는 있을 수 없다. */
export function setCardBill(ym: YearMonth, amount: number): void {
	if (!Number.isFinite(amount) || amount <= 0) {
		removeCardBill(ym);
		return;
	}
	persist({ ...bills, [ym]: Math.round(amount) });
}

export function removeCardBill(ym: YearMonth): void {
	if (!(ym in bills)) {
		return;
	}
	const next = { ...bills };
	delete next[ym];
	persist(next);
}

export function clearCardBills(): void {
	persist({});
}

import { useSyncExternalStore } from "react";
import { getCardBills, subscribeCardBills } from "@/services/cardBillStore";
import type { YearMonth } from "@/types";

/** 그 달에 적어둔 카드 청구액. 안 적었으면 undefined. */
export function useCardBill(ym: YearMonth): number | undefined {
	const map = useSyncExternalStore(
		subscribeCardBills,
		getCardBills,
		getCardBills,
	);
	return map[ym];
}

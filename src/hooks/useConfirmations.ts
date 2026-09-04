import { useSyncExternalStore } from "react";
import {
	getConfirmations,
	subscribeConfirmations,
} from "@/services/confirmStore";
import type { YearMonth } from "@/types";

/** 이번 달 "이체 확인" 체크가 된 항목 id 집합. */
export function useConfirmedIds(ym: YearMonth): Set<string> {
	const map = useSyncExternalStore(
		subscribeConfirmations,
		getConfirmations,
		getConfirmations,
	);
	return new Set(map[ym] ?? []);
}

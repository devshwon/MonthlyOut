import { useSyncExternalStore } from "react";
import { getCharges, subscribeCharges } from "@/services/chargeStore";
import type { FixedCharge } from "@/types";

/** 저장된 고정과금 항목 전체. 등록·수정·삭제하면 모든 화면이 함께 갱신된다. */
export function useCharges(): FixedCharge[] {
	return useSyncExternalStore(subscribeCharges, getCharges, getCharges);
}

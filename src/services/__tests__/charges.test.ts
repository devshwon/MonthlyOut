import { describe, expect, it } from "vitest";
import {
	activeCharges,
	billingDayInMonth,
	categoryBreakdown,
	chargesDueOn,
	formatCompact,
	installmentRound,
	isActive,
	josa,
	monthlyTotal,
	nextRelease,
	savingTotal,
	totalByMethodKind,
	usedMethods,
} from "@/services/charges";
import { incomeForMonth, SINCE_BEGINNING } from "@/services/settingsStore";
import type { ChargeCategory, FixedCharge, PaymentMethodKind } from "@/types";

/** 2026-05에 등록한 항목을 기본으로 만든다. */
function charge(overrides: Partial<FixedCharge> = {}): FixedCharge {
	const createdAt = new Date(2026, 4, 10).getTime();
	return {
		id: overrides.id ?? "c1",
		name: overrides.name ?? "넷플릭스",
		amount: overrides.amount ?? 17000,
		billingDay: overrides.billingDay ?? 25,
		category: overrides.category ?? ("subscription" as ChargeCategory),
		method: overrides.method ?? {
			kind: "card" as PaymentMethodKind,
			name: "신한카드",
		},
		term: overrides.term ?? null,
		createdAt,
		updatedAt: createdAt,
		...overrides,
	};
}

describe("isActive — 언제부터 언제까지 잡히나", () => {
	it("등록한 달부터 잡힌다", () => {
		const c = charge();
		expect(isActive(c, "2026-04")).toBe(false);
		expect(isActive(c, "2026-05")).toBe(true);
		expect(isActive(c, "2026-12")).toBe(true);
	});

	it("해지한 달까지만 잡힌다", () => {
		const c = charge({ endedMonth: "2026-07" });
		expect(isActive(c, "2026-07")).toBe(true);
		expect(isActive(c, "2026-08")).toBe(false);
	});

	it("유기한 항목은 회차 범위 안에서만 잡힌다", () => {
		const c = charge({
			amount: 320000,
			term: { totalCount: 3, startMonth: "2026-05" },
		});
		expect(isActive(c, "2026-05")).toBe(true);
		expect(isActive(c, "2026-07")).toBe(true);
		expect(isActive(c, "2026-08")).toBe(false);
	});

	it("할부 시작이 등록보다 이전이면 등록한 달부터만 잡힌다", () => {
		const c = charge({ term: { totalCount: 12, startMonth: "2026-01" } });
		expect(isActive(c, "2026-03")).toBe(false);
		expect(isActive(c, "2026-05")).toBe(true);
		// 회차는 실제 시작월 기준이라 5번째다.
		expect(installmentRound(c, "2026-05")).toBe(5);
	});
});

describe("총액 — 저축은 빠진다", () => {
	const list = [
		charge({ id: "a", amount: 17000 }),
		charge({ id: "b", amount: 100000, category: "saving" }),
	];

	it("monthlyTotal은 저축을 뺀다", () => {
		expect(monthlyTotal(list, "2026-05")).toBe(17000);
	});

	it("savingTotal은 저축만 더한다", () => {
		expect(savingTotal(list, "2026-05")).toBe(100000);
	});

	it("카드·이체 합계도 저축을 뺀다", () => {
		const totals = totalByMethodKind(
			[
				charge({ id: "a", amount: 17000 }),
				charge({
					id: "b",
					amount: 100000,
					category: "saving",
					method: { kind: "account", name: "국민은행 통장" },
				}),
				charge({
					id: "c",
					amount: 45000,
					category: "insurance",
					method: { kind: "account", name: "국민은행 통장" },
				}),
			],
			"2026-05",
		);
		expect(totals).toEqual({ card: 17000, account: 45000, unset: 0 });
	});

	it("비율도 저축을 뺀 총액 기준이다", () => {
		const slices = categoryBreakdown(list, "2026-05");
		expect(slices).toHaveLength(1);
		expect(slices[0].ratio).toBe(1);
	});
});

describe("결제일", () => {
	it("31일 항목은 30일까지인 달에서 30일로 당겨진다", () => {
		const c = charge({ billingDay: 31 });
		expect(billingDayInMonth(c, "2026-06")).toBe(30);
		expect(billingDayInMonth(c, "2026-07")).toBe(31);
		expect(billingDayInMonth(c, "2027-02")).toBe(28);
	});

	it("chargesDueOn은 그날 빠지는 것만 고른다", () => {
		const list = [
			charge({ id: "a", billingDay: 25 }),
			charge({ id: "b", billingDay: 31 }),
		];
		expect(chargesDueOn(list, "2026-06", 30).map((c) => c.id)).toEqual(["b"]);
		expect(chargesDueOn(list, "2026-06", 25).map((c) => c.id)).toEqual(["a"]);
	});
});

describe("정렬·요약", () => {
	it("activeCharges는 금액 내림차순", () => {
		const list = [
			charge({ id: "a", amount: 17000 }),
			charge({ id: "b", amount: 320000 }),
		];
		expect(activeCharges(list, "2026-05").map((c) => c.id)).toEqual(["b", "a"]);
	});

	it("nextRelease는 가장 먼저 끝나는 달과 금액을 알려준다", () => {
		const list = [
			charge({
				id: "a",
				amount: 320000,
				term: { totalCount: 3, startMonth: "2026-05" },
			}),
			charge({ id: "b", amount: 17000 }),
		];
		const release = nextRelease(list, "2026-05");
		expect(release).toEqual({
			month: "2026-07",
			monthsLater: 3,
			amount: 320000,
		});
	});

	it("usedMethods는 많이 쓴 순, 같으면 최근 순", () => {
		const older = new Date(2026, 4, 1).getTime();
		const newer = new Date(2026, 4, 20).getTime();
		const list = [
			charge({ id: "a", method: { kind: "card", name: "신한카드" } }),
			charge({ id: "b", method: { kind: "card", name: "신한카드" } }),
			charge({
				id: "c",
				method: { kind: "card", name: "국민카드" },
				updatedAt: newer,
			}),
			charge({
				id: "d",
				method: { kind: "account", name: "국민은행 통장" },
				updatedAt: older,
			}),
		];
		expect(usedMethods(list).map((m) => m.name)).toEqual([
			"신한카드",
			"국민카드",
			"국민은행 통장",
		]);
	});
});

describe("표시 형식", () => {
	it("formatCompact는 칸에 들어가게 줄인다", () => {
		expect(formatCompact(0)).toBe("0");
		expect(formatCompact(9900)).toBe("9,900");
		expect(formatCompact(886000)).toBe("88.6만");
		expect(formatCompact(1200000)).toBe("120만");
	});

	it("josa는 받침에 따라 조사를 고른다", () => {
		expect(josa("학원·강의", "으로", "로")).toBe("로");
		expect(josa("OTT·영상", "으로", "로")).toBe("으로");
		expect(josa("ChatGPT", "으로", "로")).toBe("로");
	});
});

describe("월 수입 이력", () => {
	it("그 달에 적용되던 금액을 고른다", () => {
		const incomes = [
			{ fromMonth: SINCE_BEGINNING, amount: 3000000 },
			{ fromMonth: "2026-07", amount: 3400000 },
		];
		expect(incomeForMonth(incomes, "2026-06")).toBe(3000000);
		expect(incomeForMonth(incomes, "2026-07")).toBe(3400000);
		expect(incomeForMonth(incomes, "2026-12")).toBe(3400000);
	});

	it("시작 구간보다 앞선 달은 값이 없다", () => {
		expect(
			incomeForMonth([{ fromMonth: "2026-07", amount: 100 }], "2026-06"),
		).toBeUndefined();
	});
});

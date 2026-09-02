import type {
	ChargeCategory,
	FixedCharge,
	PaymentMethodKind,
	WithdrawalGroup,
	YearMonth,
} from "@/types";

export const CATEGORY_LABEL: Record<ChargeCategory, string> = {
	subscription: "구독",
	installment: "할부",
	insurance: "보험",
	loan: "대출",
	etc: "기타",
};

export const CATEGORY_ORDER: ChargeCategory[] = [
	"subscription",
	"installment",
	"insurance",
	"loan",
	"etc",
];

/** 기본으로 기한이 있는 분류(할부·대출)는 폼에서 유기한을 켜둔다. */
export const TERM_DEFAULT_CATEGORIES: ChargeCategory[] = [
	"installment",
	"loan",
];

export const METHOD_KIND_LABEL: Record<PaymentMethodKind, string> = {
	card: "카드",
	account: "통장",
};

// ─────────────────────────────────────────────
// 연월(YYYY-MM) 계산
// ─────────────────────────────────────────────

function monthIndex(ym: YearMonth): number {
	const [year, month] = ym.split("-").map(Number);
	if (!Number.isFinite(year) || !Number.isFinite(month)) {
		return Number.NaN;
	}
	return year * 12 + (month - 1);
}

function fromMonthIndex(index: number): YearMonth {
	const year = Math.floor(index / 12);
	const month = (index % 12) + 1;
	return `${year}-${String(month).padStart(2, "0")}`;
}

export function toYearMonth(date: Date): YearMonth {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function currentYearMonth(): YearMonth {
	return toYearMonth(new Date());
}

export function addMonths(ym: YearMonth, months: number): YearMonth {
	return fromMonthIndex(monthIndex(ym) + months);
}

/** to - from (개월). 같은 달이면 0. */
export function monthDiff(from: YearMonth, to: YearMonth): number {
	return monthIndex(to) - monthIndex(from);
}

export function isValidYearMonth(ym: string): boolean {
	if (!/^\d{4}-\d{2}$/.test(ym)) {
		return false;
	}
	const month = Number(ym.slice(5));
	return month >= 1 && month <= 12;
}

// ─────────────────────────────────────────────
// 항목 층 계산 (기획서 4-1 · 4-3)
// ─────────────────────────────────────────────

/** 해당 월이 몇 회차인지. 납입 기간 밖이거나 무기한이면 null. */
export function installmentRound(
	charge: FixedCharge,
	ym: YearMonth,
): number | null {
	if (!charge.term) {
		return null;
	}
	const round = monthDiff(charge.term.startMonth, ym) + 1;
	if (!Number.isFinite(round) || round < 1 || round > charge.term.totalCount) {
		return null;
	}
	return round;
}

/** 이번 달에 실제로 돈이 빠지는 항목인지. 무기한 항목은 항상 true. */
export function isActive(charge: FixedCharge, ym: YearMonth): boolean {
	if (!charge.term) {
		return true;
	}
	return installmentRound(charge, ym) !== null;
}

/** 마지막 납입이 있는 달. 무기한이면 null. */
export function lastBillingMonth(charge: FixedCharge): YearMonth | null {
	if (!charge.term) {
		return null;
	}
	return addMonths(charge.term.startMonth, charge.term.totalCount - 1);
}

/** 이번 달 이후로 더 내야 하는 횟수. 무기한이거나 기간 밖이면 null. */
export function remainingCount(
	charge: FixedCharge,
	ym: YearMonth,
): number | null {
	const round = installmentRound(charge, ym);
	if (round === null || !charge.term) {
		return null;
	}
	return charge.term.totalCount - round;
}

/** 이번 달 이후 남은 총 납입액(참고 정보). */
export function remainingAmount(
	charge: FixedCharge,
	ym: YearMonth,
): number | null {
	const count = remainingCount(charge, ym);
	return count === null ? null : count * charge.amount;
}

/** 이번 달 활성 항목을 금액 내림차순으로. 같은 금액이면 이름순. */
export function activeCharges(
	charges: FixedCharge[],
	ym: YearMonth,
): FixedCharge[] {
	return charges
		.filter((charge) => isActive(charge, ym))
		.sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
}

export function monthlyTotal(charges: FixedCharge[], ym: YearMonth): number {
	return activeCharges(charges, ym).reduce(
		(sum, charge) => sum + charge.amount,
		0,
	);
}

export interface ReleaseInfo {
	/** 마지막 납입이 있는 달 */
	month: YearMonth;
	/** 몇 개월 뒤부터 이 금액이 풀리는지 */
	monthsLater: number;
	/** 그때 풀리는 월 금액 합 */
	amount: number;
}

/**
 * 가장 먼저 끝나는 유기한 항목들 → "N개월 뒤 X원이 풀립니다"(기획서 4-3).
 * 같은 달에 끝나는 항목은 합산한다.
 */
export function nextRelease(
	charges: FixedCharge[],
	ym: YearMonth,
): ReleaseInfo | null {
	const byEndMonth = new Map<YearMonth, number>();

	for (const charge of activeCharges(charges, ym)) {
		const end = lastBillingMonth(charge);
		if (!end) {
			continue;
		}
		byEndMonth.set(end, (byEndMonth.get(end) ?? 0) + charge.amount);
	}

	let soonest: ReleaseInfo | null = null;
	for (const [month, amount] of byEndMonth) {
		const monthsLater = monthDiff(ym, month) + 1;
		if (!soonest || monthsLater < soonest.monthsLater) {
			soonest = { month, monthsLater, amount };
		}
	}
	return soonest;
}

// ─────────────────────────────────────────────
// 출금 층 (기획서 4-2) — 달력 화면(2차)의 재료
// ─────────────────────────────────────────────

/** 같은 수단 · 같은 날짜에 한 번에 빠지는 돈으로 묶는다. 날짜 오름차순. */
export function withdrawalGroups(
	charges: FixedCharge[],
	ym: YearMonth,
): WithdrawalGroup[] {
	const groups = new Map<string, WithdrawalGroup>();

	for (const charge of activeCharges(charges, ym)) {
		const methodKey = charge.method
			? `${charge.method.kind}:${charge.method.name}`
			: "none";
		const key = `${methodKey}@${charge.billingDay}`;
		const group = groups.get(key);

		if (group) {
			group.amount += charge.amount;
			group.charges.push(charge);
			continue;
		}

		groups.set(key, {
			key,
			method: charge.method,
			billingDay: charge.billingDay,
			amount: charge.amount,
			charges: [charge],
		});
	}

	return [...groups.values()].sort(
		(a, b) => a.billingDay - b.billingDay || b.amount - a.amount,
	);
}

/** 카드로 빠지는 고정분 합계 — 카드값 역산(2차)의 재료. */
export function cardFixedTotal(charges: FixedCharge[], ym: YearMonth): number {
	return activeCharges(charges, ym)
		.filter((charge) => charge.method?.kind === "card")
		.reduce((sum, charge) => sum + charge.amount, 0);
}

// ─────────────────────────────────────────────
// 표시 형식
// ─────────────────────────────────────────────

export function formatAmount(amount: number): string {
	return amount.toLocaleString("ko-KR");
}

export function formatKrw(amount: number): string {
	return `${formatAmount(amount)}원`;
}

export function formatBillingDay(day: number): string {
	return day >= 31 ? "말일" : `${day}일`;
}

export function formatYearMonth(ym: YearMonth): string {
	const [year, month] = ym.split("-");
	return `${year}년 ${Number(month)}월`;
}

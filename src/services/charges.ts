import type {
	ChargeCategory,
	FixedCharge,
	PaymentMethod,
	PaymentMethodKind,
	WithdrawalGroup,
	YearMonth,
} from "@/types";

export const CATEGORY_LABEL: Record<ChargeCategory, string> = {
	subscription: "구독",
	telecom: "통신",
	housing: "주거",
	insurance: "보험",
	loan: "대출",
	installment: "할부",
	delivery: "정기배송",
	health: "건강",
	education: "교육",
	transport: "교통",
	pet: "반려동물",
	saving: "저축",
	etc: "기타",
};

/** 폼에서 보여줄 때 쓰는 한 줄 예시. 사용자가 "내 것이 어디 들어가지?"를 덜 고민하게. */
export const CATEGORY_HINT: Record<ChargeCategory, string> = {
	subscription: "넷플릭스 · 음악 · 멤버십",
	telecom: "휴대폰 · 인터넷 · TV",
	housing: "월세 · 관리비 · 공과금",
	insurance: "실손 · 종신 · 자동차",
	loan: "원리금 · 이자",
	installment: "자동차 · 가전 · 휴대폰",
	delivery: "생필품 · 식품 · 건강식품",
	health: "헬스장 · 필라테스 · 요가",
	education: "학원 · 강의 · 학습지",
	transport: "정기권 · 주차 · 리스",
	pet: "사료 정기배송 · 펫보험",
	saving: "적금 · 청약 · 연금",
	etc: "그 밖에 매달 나가는 것",
};

export const CATEGORY_ORDER: ChargeCategory[] = [
	"subscription",
	"telecom",
	"housing",
	"insurance",
	"loan",
	"installment",
	"delivery",
	"health",
	"education",
	"transport",
	"pet",
	"saving",
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

/**
 * 이 항목을 기록하기 시작한 달. 등록한 달 이전은 집계하지 않는다.
 *
 * 정리를 시작한 달부터가 실제로 믿을 수 있는 수치다 — 그 전 달들은 무엇을
 * 빠뜨렸는지 알 수 없어서, 채워 넣으면 오히려 틀린 숫자가 된다.
 */
export function trackedFromMonth(charge: FixedCharge): YearMonth {
	return toYearMonth(new Date(charge.createdAt));
}

/** 해지한 항목인지(마지막 납부 달이 정해졌는지). */
export function isEnded(charge: FixedCharge): boolean {
	return Boolean(charge.endedMonth);
}

/** 이번 달에 실제로 돈이 빠지는 항목인지. 등록 이전·해지 이후 달은 false. */
export function isActive(charge: FixedCharge, ym: YearMonth): boolean {
	if (monthDiff(trackedFromMonth(charge), ym) < 0) {
		return false;
	}
	// 해지한 달까지는 나갔고, 그 다음 달부터는 나가지 않는다.
	if (charge.endedMonth && monthDiff(charge.endedMonth, ym) > 0) {
		return false;
	}
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

/**
 * 저축은 **고정지출 총액에 넣지 않는다.**
 * 적금·청약·연금은 사라지는 돈이 아니라 옮기는 돈이라, 총액에 섞으면
 * "매달 이만큼 없어진다"는 숫자가 과장된다. 목록에는 그대로 보이고 따로 합산한다.
 */
export function isSaving(charge: FixedCharge): boolean {
	return charge.category === "saving";
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

/** 이번 달 고정지출 총액. 저축은 빠진다. */
export function monthlyTotal(charges: FixedCharge[], ym: YearMonth): number {
	return activeCharges(charges, ym)
		.filter((charge) => !isSaving(charge))
		.reduce((sum, charge) => sum + charge.amount, 0);
}

/** 이번 달 저축으로 옮기는 금액. 총액과 따로 보여준다. */
export function savingTotal(charges: FixedCharge[], ym: YearMonth): number {
	return activeCharges(charges, ym)
		.filter(isSaving)
		.reduce((sum, charge) => sum + charge.amount, 0);
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
/**
 * 출금 층 — 그 달에 **언제, 어디서** 얼마가 빠지는지(기획서 4-2).
 *
 * 항목 층이 "넷플릭스 17,000"이라면 여기는 "25일 신한카드 337,000"이다. 잔고 사고는
 * 항상 이 단위에서 나므로, 이번 달 화면의 확인 체크리스트는 이 순서로 세운다.
 * 같은 날·같은 수단이 한 묶음이고, 묶음 안은 큰 금액이 먼저다.
 *
 * 저축도 포함한다 — 총액에서는 빼지만(규칙 7) 그날 통장에서 나가는 건 사실이라,
 * 빼면 통장과 안 맞는 목록이 된다. 화면에서 "총액 제외" 배지로 구분한다.
 */
export function withdrawalGroups(
	charges: FixedCharge[],
	ym: YearMonth,
): WithdrawalGroup[] {
	const groups = new Map<string, WithdrawalGroup>();

	for (const charge of activeCharges(charges, ym)) {
		const methodKey = charge.method
			? `${charge.method.kind}:${charge.method.name}`
			: "none";
		// 31일 항목은 2월엔 28일에 빠진다 — 그 달 기준으로 보정한 날로 묶어야
		// "28일 국민은행"과 "31일 국민은행"이 다른 출금으로 갈리지 않는다.
		const day = billingDayInMonth(charge, ym);
		const key = `${methodKey}@${day}`;
		const group = groups.get(key);

		if (group) {
			group.amount += charge.amount;
			group.charges.push(charge);
			continue;
		}

		groups.set(key, {
			key,
			method: charge.method,
			billingDay: day,
			amount: charge.amount,
			charges: [charge],
		});
	}

	for (const group of groups.values()) {
		group.charges.sort(
			(a, b) => b.amount - a.amount || a.name.localeCompare(b.name),
		);
	}

	return [...groups.values()].sort(
		(a, b) => a.billingDay - b.billingDay || b.amount - a.amount,
	);
}

export interface MonthOutflow {
	/** 카드로 빠져나갈 돈 */
	card: number;
	/** 카드 청구액을 사용자가 적었는지. false면 앱이 아는 고정분뿐이라 실제보다 작다. */
	cardIsBill: boolean;
	/** 카드 청구액 중 앱이 아는 고정분 — "최소 X원은 확정"의 X */
	cardFixed: number;
	/** 카드가 아닌 것 전부(이체·수단 미지정, 저축 포함) */
	account: number;
	/** 이번 달 통장에서 빠져나갈 돈 */
	total: number;
}

/**
 * 이번 달 **통장에서 빠져나갈 돈**. "쓸 수 있는 돈"은 월 수입에서 이걸 뺀 값이다.
 *
 * 고정지출 총액(`monthlyTotal`)과 다른 수를 세는 함수다. 총액은 "매달 자동으로 나가는
 * 돈이 얼마인가"를 묻고, 이건 "이번 달에 통장에서 얼마가 빠지나"를 묻는다.
 *
 * **카드 청구액은 카드 고정분을 이미 품고 있다.** 그래서 청구액을 적었으면 카드 쪽은
 * 청구액으로 **대체한다** — 총액에 청구액을 더하면 카드 고정분이 두 번 빠진다
 * (기획서 4-1의 이중과금과 같은 실수를 수단 층에서 반복하는 것이다).
 *
 * **저축도 뺀다.** 총액에서는 옮기는 돈이라 빼지만(규칙 7), 이번 달에 쓸 수 있느냐를
 * 물으면 답은 "못 쓴다"다. 청약에 10만 원이 나가면 그 10만 원은 쓸 수 없다.
 */
export function monthlyOutflow(
	charges: FixedCharge[],
	ym: YearMonth,
	cardBill?: number,
): MonthOutflow {
	const active = activeCharges(charges, ym);

	let cardFixed = 0;
	let account = 0;
	for (const charge of active) {
		if (charge.method?.kind === "card") {
			cardFixed += charge.amount;
		} else {
			account += charge.amount;
		}
	}

	const cardIsBill = typeof cardBill === "number" && cardBill > 0;
	const card = cardIsBill ? (cardBill as number) : cardFixed;

	return { card, cardIsBill, cardFixed, account, total: card + account };
}

/** 카드로 빠지는 고정분 합계 — 카드값 역산(2차)의 재료. */
export function cardFixedTotal(charges: FixedCharge[], ym: YearMonth): number {
	return activeCharges(charges, ym)
		.filter((charge) => !isSaving(charge) && charge.method?.kind === "card")
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

// ─────────────────────────────────────────────
// 집계 (홈 · 연간 · 상세 화면 재료)
// ─────────────────────────────────────────────

export interface MethodTotals {
	/** 카드로 빠지는 합계 */
	card: number;
	/** 통장에서 이체되는 합계 */
	account: number;
	/** 결제수단을 안 적은 항목 */
	unset: number;
}

export function totalByMethodKind(
	charges: FixedCharge[],
	ym: YearMonth,
): MethodTotals {
	const totals: MethodTotals = { card: 0, account: 0, unset: 0 };

	for (const charge of activeCharges(charges, ym).filter(
		(charge) => !isSaving(charge),
	)) {
		if (charge.method?.kind === "card") {
			totals.card += charge.amount;
		} else if (charge.method?.kind === "account") {
			totals.account += charge.amount;
		} else {
			totals.unset += charge.amount;
		}
	}
	return totals;
}

export interface CategorySlice {
	category: ChargeCategory;
	amount: number;
	/** 0~1 */
	ratio: number;
	count: number;
}

/** 이번 달 카테고리별 금액. 금액 내림차순, 0원 카테고리는 뺀다. */
export function categoryBreakdown(
	charges: FixedCharge[],
	ym: YearMonth,
): CategorySlice[] {
	const list = activeCharges(charges, ym).filter((charge) => !isSaving(charge));
	const total = list.reduce((sum, charge) => sum + charge.amount, 0);
	const byCategory = new Map<
		ChargeCategory,
		{ amount: number; count: number }
	>();

	for (const charge of list) {
		const prev = byCategory.get(charge.category) ?? { amount: 0, count: 0 };
		byCategory.set(charge.category, {
			amount: prev.amount + charge.amount,
			count: prev.count + 1,
		});
	}

	return [...byCategory.entries()]
		.map(([category, { amount, count }]) => ({
			category,
			amount,
			count,
			ratio: total > 0 ? amount / total : 0,
		}))
		.sort((a, b) => b.amount - a.amount);
}

export interface CategoryGroup {
	category: ChargeCategory;
	charges: FixedCharge[];
	amount: number;
}

/**
 * 관리 화면용 카테고리별 묶음.
 * 이번 달 활성 여부와 무관하게 **등록된 전체**를 보여준다(끝난 할부도 기록으로 남는다).
 *
 * 묶음도, 묶음 안도 **큰 금액이 먼저**다(기획서 2장: 줄일 대상이 자연스럽게 위로 오게).
 * 카테고리 고정 순서로 두면 5천 원짜리 구독이 30만 원 할부보다 위에 놓인다.
 * 금액이 같으면 카테고리 고정 순서로 안정시킨다.
 */
export function groupByCategory(charges: FixedCharge[]): CategoryGroup[] {
	const groups: CategoryGroup[] = [];

	for (const category of CATEGORY_ORDER) {
		const list = charges
			.filter((charge) => charge.category === category)
			.sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));

		if (list.length === 0) {
			continue;
		}
		groups.push({
			category,
			charges: list,
			amount: list.reduce((sum, charge) => sum + charge.amount, 0),
		});
	}
	return groups.sort((a, b) => b.amount - a.amount);
}

export interface MonthTotal {
	ym: YearMonth;
	month: number;
	total: number;
}

/** 해당 연도 1~12월의 월별 고정지출. */
export function yearlyTotals(
	charges: FixedCharge[],
	year: number,
): MonthTotal[] {
	return Array.from({ length: 12 }, (_, index) => {
		const ym = `${year}-${String(index + 1).padStart(2, "0")}`;
		return { ym, month: index + 1, total: monthlyTotal(charges, ym) };
	});
}

/** 해당 연도 카테고리별 합계(12개월 누적). 금액 내림차순. */
export function yearlyCategoryTotals(
	charges: FixedCharge[],
	year: number,
): CategorySlice[] {
	const byCategory = new Map<
		ChargeCategory,
		{ amount: number; count: number }
	>();
	let total = 0;

	for (let month = 1; month <= 12; month += 1) {
		const ym = `${year}-${String(month).padStart(2, "0")}`;
		for (const charge of activeCharges(charges, ym).filter(
			(charge) => !isSaving(charge),
		)) {
			const prev = byCategory.get(charge.category) ?? { amount: 0, count: 0 };
			byCategory.set(charge.category, {
				amount: prev.amount + charge.amount,
				count: prev.count + 1,
			});
			total += charge.amount;
		}
	}

	return [...byCategory.entries()]
		.map(([category, { amount, count }]) => ({
			category,
			amount,
			count,
			ratio: total > 0 ? amount / total : 0,
		}))
		.sort((a, b) => b.amount - a.amount);
}

/** 이번 달 통장에서 이체되는 항목을 날짜 순으로. 상세 화면의 체크리스트 재료. */
export function transferCharges(
	charges: FixedCharge[],
	ym: YearMonth,
): FixedCharge[] {
	return activeCharges(charges, ym)
		.filter((charge) => charge.method?.kind === "account")
		.sort((a, b) => a.billingDay - b.billingDay || b.amount - a.amount);
}

/** 이번 달 카드에서 빠지는 항목을 날짜 순으로. */
export function cardCharges(
	charges: FixedCharge[],
	ym: YearMonth,
): FixedCharge[] {
	return activeCharges(charges, ym)
		.filter((charge) => charge.method?.kind !== "account")
		.sort((a, b) => a.billingDay - b.billingDay || b.amount - a.amount);
}

/**
 * 받침 유무에 따라 조사를 고른다 — "학원·강의**로**" / "넷플릭스**으로**".
 * 단어가 아니라 **조사만** 돌려주므로 따옴표로 감싼 뒤에도 붙일 수 있다.
 */
export function josa(
	word: string,
	withBatchim: string,
	withoutBatchim: string,
): string {
	const last = word.trim().slice(-1);
	const code = last.charCodeAt(0);
	// 한글 음절이 아니면 받침이 없는 쪽으로 읽는다.
	if (Number.isNaN(code) || code < 0xac00 || code > 0xd7a3) {
		return withoutBatchim;
	}
	return (code - 0xac00) % 28 !== 0 ? withBatchim : withoutBatchim;
}

/**
 * 이미 등록한 항목들이 쓰는 결제수단 목록. 많이 쓴 순서.
 * 카드·통장은 보통 한두 개라, 다음 등록 때 다시 타이핑하지 않게 하려고 뽑는다.
 */
export function usedMethods(charges: FixedCharge[]): PaymentMethod[] {
	const counts = new Map<
		string,
		{ method: PaymentMethod; count: number; lastUsed: number }
	>();

	for (const charge of charges) {
		const name = charge.method?.name?.trim();
		if (!charge.method || !name) {
			continue;
		}
		const key = `${charge.method.kind}:${name}`;
		const prev = counts.get(key);
		counts.set(key, {
			method: { kind: charge.method.kind, name },
			count: (prev?.count ?? 0) + 1,
			lastUsed: Math.max(prev?.lastUsed ?? 0, charge.updatedAt),
		});
	}

	// 많이 쓴 것 먼저, 같으면 최근에 쓴 것 먼저.
	return [...counts.values()]
		.sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed)
		.map((entry) => entry.method);
}

/** 그 달에 실제로 빠지는 날. 31일 설정인데 30일까지인 달이면 30일로 당긴다. */
export function billingDayInMonth(charge: FixedCharge, ym: YearMonth): number {
	const [year, month] = ym.split("-").map(Number);
	const lastDay = new Date(year, month, 0).getDate();
	return Math.min(charge.billingDay, lastDay);
}

/** 그 달의 특정 날짜에 빠지는 항목들. 금액 내림차순. */
export function chargesDueOn(
	charges: FixedCharge[],
	ym: YearMonth,
	day: number,
): FixedCharge[] {
	return activeCharges(charges, ym).filter(
		(charge) => billingDayInMonth(charge, ym) === day,
	);
}

/** 칸에 들어가게 줄인 금액. 886,000 → "88.6만" */
export function formatCompact(amount: number): string {
	if (amount === 0) {
		return "0";
	}
	if (amount < 10000) {
		return formatAmount(amount);
	}
	const man = amount / 10000;
	if (man >= 100) {
		return `${Math.round(man).toLocaleString("ko-KR")}만`;
	}
	const rounded = Math.round(man * 10) / 10;
	return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}만`;
}

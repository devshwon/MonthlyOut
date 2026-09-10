import { monthDiff, toYearMonth } from "@/services/charges";
import { readStorage, writeStorage } from "@/services/storage";
import type { YearMonth } from "@/types";

const STORAGE_KEY = "monthlyout.settings.v1";

/**
 * "처음부터"를 뜻하는 시작 월. 연봉협상 전 금액처럼 언제부터였는지 모를 때 쓴다.
 * 실제 기록은 항목 등록월부터라 이보다 앞선 달은 어차피 화면에 없다.
 */
export const SINCE_BEGINNING: YearMonth = "2000-01";

/** 월 수입 한 구간 — `fromMonth`부터 다음 구간 전까지 이 금액이었다. */
export interface IncomeEntry {
	fromMonth: YearMonth;
	amount: number;
}

export interface AppSettings {
	/** 월 수입 이력. 시작 월 오름차순. */
	incomes: IncomeEntry[];
	/** 토스 알림 수신에 동의했는지(스마트발송 캠페인 대상) */
	notificationAgreed?: boolean;
}

let settings: AppSettings = load();
const listeners = new Set<() => void>();

function sortIncomes(list: IncomeEntry[]): IncomeEntry[] {
	return [...list].sort((a, b) => monthDiff(b.fromMonth, a.fromMonth));
}

function load(): AppSettings {
	const raw = readStorage(STORAGE_KEY);
	if (!raw) {
		return { incomes: [] };
	}

	try {
		const parsed = JSON.parse(raw);
		if (typeof parsed !== "object" || parsed === null) {
			return { incomes: [] };
		}

		const incomes: IncomeEntry[] = Array.isArray(parsed.incomes)
			? parsed.incomes.filter(
					(entry: unknown): entry is IncomeEntry =>
						typeof entry === "object" &&
						entry !== null &&
						typeof (entry as IncomeEntry).amount === "number" &&
						typeof (entry as IncomeEntry).fromMonth === "string",
				)
			: // 예전 형식(단일 금액)에서 올라온 데이터 — 처음부터 그 금액이었던 걸로 본다.
				typeof parsed.monthlyIncome === "number" && parsed.monthlyIncome > 0
				? [{ fromMonth: SINCE_BEGINNING, amount: parsed.monthlyIncome }]
				: [];

		return {
			incomes: sortIncomes(incomes),
			notificationAgreed:
				typeof parsed.notificationAgreed === "boolean"
					? parsed.notificationAgreed
					: undefined,
		};
	} catch {
		return { incomes: [] };
	}
}

function persist(next: AppSettings): void {
	settings = next;
	writeStorage(STORAGE_KEY, JSON.stringify(next));
	for (const listener of listeners) {
		listener();
	}
}

export function subscribeSettings(listener: () => void): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function getSettings(): AppSettings {
	return settings;
}

export function setNotificationAgreed(agreed: boolean): void {
	persist({ ...settings, notificationAgreed: agreed });
}

/**
 * 월 수입을 적는다.
 *
 * @param fromMonth 이 달부터 새 금액. 생략하면 **처음부터** 이 금액이었던 걸로 보고
 *                  기존 이력을 전부 대체한다(연봉협상 전 기록을 남길 필요가 없을 때).
 */
export function setIncome(amount: number, fromMonth?: YearMonth): void {
	if (amount <= 0) {
		persist({ ...settings, incomes: [] });
		return;
	}

	if (!fromMonth) {
		persist({
			...settings,
			incomes: [{ fromMonth: SINCE_BEGINNING, amount }],
		});
		return;
	}

	const rest = settings.incomes.filter(
		(entry) => entry.fromMonth !== fromMonth,
	);
	persist({
		...settings,
		incomes: sortIncomes([...rest, { fromMonth, amount }]),
	});
}

/** 잘못 적은 구간 지우기. */
export function removeIncome(fromMonth: YearMonth): void {
	persist({
		...settings,
		incomes: settings.incomes.filter((entry) => entry.fromMonth !== fromMonth),
	});
}

/** 그 달에 적용되는 수입. 해당 구간이 없으면 undefined. */
export function incomeForMonth(
	incomes: IncomeEntry[],
	ym: YearMonth,
): number | undefined {
	// monthDiff(from, to)는 to - from이라, 오름차순은 monthDiff(b, a)로 비교한다.
	const applied = incomes
		.filter((entry) => monthDiff(entry.fromMonth, ym) >= 0)
		.sort((a, b) => monthDiff(b.fromMonth, a.fromMonth));
	return applied[applied.length - 1]?.amount;
}

/** 이번 달 기준 수입(설정 화면에서 보여줄 현재값). */
export function currentIncome(incomes: IncomeEntry[]): number | undefined {
	return incomeForMonth(incomes, toYearMonth(new Date()));
}

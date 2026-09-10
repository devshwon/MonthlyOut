const STORAGE_KEY = "monthlyout.settings.v1";

/**
 * 앱 설정. 항목과 달리 개수가 적고 화면 여러 곳에서 읽어서 한 곳에 모아둔다.
 */
export interface AppSettings {
	/** 매달 들어오는 돈. 적어두면 고정지출을 뺀 "쓸 수 있는 돈"을 계산한다. */
	monthlyIncome?: number;
	/** 토스 알림 수신에 동의했는지(스마트발송 캠페인 대상) */
	notificationAgreed?: boolean;
}

let settings: AppSettings = load();
const listeners = new Set<() => void>();

function load(): AppSettings {
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
		const result: AppSettings = {};
		if (typeof parsed.monthlyIncome === "number" && parsed.monthlyIncome > 0) {
			result.monthlyIncome = parsed.monthlyIncome;
		}
		if (typeof parsed.notificationAgreed === "boolean") {
			result.notificationAgreed = parsed.notificationAgreed;
		}
		return result;
	} catch {
		return {};
	}
}

function persist(next: AppSettings): void {
	settings = next;
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

export function subscribeSettings(listener: () => void): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function getSettings(): AppSettings {
	return settings;
}

export function updateSettings(patch: Partial<AppSettings>): void {
	persist({ ...settings, ...patch });
}

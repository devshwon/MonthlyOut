import { formatKrw } from "@/services/charges";

export interface TipContext {
	/** 등록된 항목 수 */
	chargeCount: number;
	/** 이 달에 실제로 빠지는 항목 수 */
	activeCount: number;
	/** 아직 확인 안 한 이체 건수 */
	unconfirmedTransfers: number;
	/** 구독 항목 수 */
	subscriptionCount: number;
	/** 이 달 총액 */
	total: number;
	/** 곧 풀리는 금액이 있으면 */
	release: { monthsLater: number; amount: number } | null;
}

/** 아무것도 없을 때 — 시작을 권하는 말들 */
const EMPTY_TIPS = [
	"조금 귀찮더라도 고정지출 한 번 정리해볼까요?",
	"넷플릭스부터 넣어봐요. 30초면 끝나요.",
	"매달 나가는 걸 다 더하면 얼마일까요?",
	"한 번만 넣어두면 12개월 동안 안 건드려도 돼요.",
];

/** 평소에 툭툭 던지는 말들 */
const IDLE_TIPS = [
	"이 돈은 아무것도 안 해도 매달 나가요.",
	"줄일 건 위에서부터 찾는 게 빨라요.",
	"안 쓰는 구독, 하나쯤 있지 않나요?",
	"할부가 끝나는 달은 통장이 조금 넉넉해져요.",
	"카드값이 이상하면 고정분부터 빼고 보세요.",
	"오늘도 잘 지키고 있어요.",
];

/**
 * 상황에 맞는 말을 앞에, 일반적인 말을 뒤에 둔 문구 목록.
 * 캐릭터를 누르면 이 목록에서 랜덤으로 다음 문구를 고른다.
 */
export function buildTips(context: TipContext): string[] {
	if (context.chargeCount === 0) {
		return EMPTY_TIPS;
	}

	const situational: string[] = [];

	if (context.unconfirmedTransfers > 0) {
		situational.push(
			`이체 ${context.unconfirmedTransfers}건이 아직 확인 전이에요.`,
		);
	}
	if (context.release) {
		situational.push(
			`${context.release.monthsLater}개월만 버티면 ${formatKrw(context.release.amount)}이 풀려요.`,
		);
	}
	if (context.subscriptionCount >= 3) {
		situational.push(
			`구독만 ${context.subscriptionCount}개예요. 다 쓰고 있는 게 맞을까요?`,
		);
	}
	if (context.total > 0) {
		situational.push(
			`올해 이대로면 ${formatKrw(context.total * 12)}이 나가요.`,
		);
	}
	if (context.activeCount === 0) {
		situational.push("이 달엔 빠지는 게 없네요. 좋은 달이에요.");
	}

	return [...situational, ...IDLE_TIPS];
}

/** 지금 문구를 빼고 랜덤으로 하나 고른다. */
export function pickNextTip(tips: string[], current: string): string {
	const candidates = tips.filter((tip) => tip !== current);
	if (candidates.length === 0) {
		return current;
	}
	return candidates[Math.floor(Math.random() * candidates.length)];
}

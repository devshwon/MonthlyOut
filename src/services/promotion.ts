/**
 * 토스 프로모션 (포인트 지급) — 비게임 + 게임 카테고리 모두 지원.
 *
 * - 비게임 미니앱: `grantPromotionReward` 사용 (이 템플릿 기본값)
 * - 게임 미니앱: `grantPromotionRewardForGame` 사용 (혜택탭 노출)
 *
 * ## 흐름
 * 1. `canGrant` — 로컬 원장에서 일일 한도 체크
 * 2. amount > MAX_GRANT_PER_CALL이면 25원씩 N번 분할 호출
 * 3. 성공한 만큼 `recordGrant`로 누적 기록
 * 4. 토스 서버가 멱등성 보증 (errorCode 4113 = 중복 지급 차단)
 *
 * ## 중복 지급 방지
 * - 클라 측: SDK Storage + localStorage 이중 기록 (best-effort)
 * - 토스 측: userKey별 분당 10회 호출 제한 + 일일 5,000원 캡
 *
 * 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/비게임/promotion.md
 */
import {
	grantPromotionRewardForGame,
	grantPromotionReward as sdkGrantPromotionReward,
} from "@apps-in-toss/web-framework";
import { DAILY_GRANT_LIMIT, MAX_GRANT_PER_CALL } from "@/constants/promotion";
import { canGrant, recordGrant } from "./localGrantLedger";

export type PromotionFailReason =
	| "unsupported" // 앱 버전 미지원 (undefined 응답) — 토스앱 5.232.0 미만
	| "unknown" // 'ERROR' 또는 예외
	| "not_found" // 4100: 프로모션 정보 없음
	| "not_running" // 4109: 실행중 아님 (예산 소진 등 자동 종료 포함)
	| "cannot_grant" // 4110: 시스템 오류 — 재지급 권장
	| "not_found_history" // 4111: 지급 내역 없음
	| "insufficient_funds" // 4112: 프로모션 머니 부족
	| "duplicate" // 4113: 이미 지급된 내역 (서버 측 멱등 응답)
	| "over_limit_per_call" // 4114: 1회 지급 금액 초과
	| "over_budget" // 4116: 최대 지급 금액이 예산 초과
	| "over_limit" // 로컬 원장 일일 한도 초과
	| "not_game"; // 40000: 게임 카테고리 아님 (grantPromotionRewardForGame 호출 시)

export interface PromotionResult {
	ok: boolean;
	rewardKey?: string;
	reason?: PromotionFailReason;
	rawCode?: string;
	rawMessage?: string;
	remainingToday?: number;
	dailyLimit?: number;
}

const ERROR_CODE_MAP: Record<string, PromotionFailReason> = {
	"40000": "not_game",
	"4100": "not_found",
	"4109": "not_running",
	"4110": "cannot_grant",
	"4111": "not_found_history",
	"4112": "insufficient_funds",
	"4113": "duplicate",
	"4114": "over_limit_per_call",
	"4116": "over_budget",
};

const REASON_MESSAGES: Record<PromotionFailReason, string> = {
	unsupported: "앱 버전이 낮아 포인트를 지급할 수 없어요",
	unknown: "포인트 지급 중 오류가 발생했어요",
	not_found: "프로모션을 찾을 수 없어요",
	not_running: "프로모션이 실행 중이 아니에요",
	cannot_grant: "지금은 포인트를 지급할 수 없어요",
	not_found_history: "지급 내역을 찾을 수 없어요",
	insufficient_funds: "프로모션 잔액이 부족해요",
	duplicate: "이미 지급된 내역이에요",
	over_limit_per_call: "1회 지급 금액을 초과했어요",
	over_budget: "예산을 초과했어요",
	over_limit: "오늘 받을 수 있는 한도를 초과했어요",
	not_game: "게임 카테고리 미니앱에서만 지급 가능해요",
};

export function getPromotionFailMessage(reason: PromotionFailReason): string {
	return REASON_MESSAGES[reason];
}

/** 미니앱 카테고리 — 운영 시 한 번 결정해서 grantPromotionWithLedger에 전달 */
export type AppCategory = "nongame" | "game";

/**
 * SDK 1회 호출 (분할되지 않은 amount). 토스 응답을 PromotionResult로 변환.
 */
async function grantOnce(
	promotionCode: string,
	amount: number,
	category: AppCategory,
): Promise<PromotionResult> {
	const isTestMode = promotionCode.startsWith("TEST_");
	console.log("[Promotion] grant SDK call", {
		promotionCode,
		amount,
		category,
		isTestMode,
	});
	try {
		const result =
			category === "game"
				? await grantPromotionRewardForGame({
						params: { promotionCode, amount },
					})
				: await sdkGrantPromotionReward({ params: { promotionCode, amount } });
		console.log("[Promotion] grant raw result", result);

		if (result === undefined) {
			return { ok: false, reason: "unsupported" };
		}
		if (result === "ERROR") {
			return { ok: false, reason: "unknown" };
		}
		if (typeof result === "object" && "key" in result) {
			return { ok: true, rewardKey: (result as { key: string }).key };
		}
		if (typeof result === "object" && "errorCode" in result) {
			const r = result as { errorCode: string; message?: string };
			const reason = ERROR_CODE_MAP[r.errorCode] ?? "unknown";
			return {
				ok: false,
				reason,
				rawCode: r.errorCode,
				rawMessage: r.message,
			};
		}
		if (isTestMode) {
			console.log("[Promotion] TEST mode — unknown result shape treated as ok");
			return { ok: true, rewardKey: "TEST_MODE" };
		}
		return {
			ok: false,
			reason: "unknown",
			rawMessage: `unknown shape: ${JSON.stringify(result).slice(0, 100)}`,
		};
	} catch (err) {
		console.warn("[Promotion] grant exception", err);
		return {
			ok: false,
			reason: "unknown",
			rawMessage: err instanceof Error ? err.message : String(err),
		};
	}
}

/**
 * 프로모션 포인트 지급 — 로컬 한도 체크 + chunked SDK 호출 + 누적 기록.
 *
 * @param promotionCode 콘솔에서 발급한 프로모션 코드 (또는 'TEST_*' 접두사)
 * @param amount 지급할 토스 포인트 (원)
 * @param category 'nongame' (기본) | 'game'
 */
export async function grantPromotionWithLedger(
	promotionCode: string,
	amount: number,
	category: AppCategory = "nongame",
): Promise<PromotionResult> {
	// 1) 로컬 원장 일일 한도 체크
	const limitCheck = await canGrant(promotionCode, amount, DAILY_GRANT_LIMIT);
	if (!limitCheck.ok) {
		console.warn("[Promotion] over_limit (local ledger)", limitCheck);
		return {
			ok: false,
			reason: "over_limit",
			remainingToday: limitCheck.remainingToday,
			dailyLimit: limitCheck.dailyLimit,
		};
	}
	console.log("[Promotion] local limit ok", limitCheck);

	// 2) MAX_GRANT_PER_CALL(=25원) 초과 시 분할 호출
	const chunks: number[] = [];
	let rem = amount;
	while (rem > 0) {
		const c = Math.min(MAX_GRANT_PER_CALL, rem);
		chunks.push(c);
		rem -= c;
	}
	console.log("[Promotion] chunked grant", { total: amount, chunks });

	let granted = 0;
	let lastGrant: PromotionResult = { ok: false, reason: "unknown" };
	for (let i = 0; i < chunks.length; i++) {
		const c = chunks[i];
		console.log(`[Promotion] chunk ${i + 1}/${chunks.length}`, { amount: c });
		const r = await grantOnce(promotionCode, c, category);
		lastGrant = r;
		if (!r.ok) {
			console.warn(`[Promotion] chunk ${i + 1}/${chunks.length} failed`, r);
			break;
		}
		granted += c;
	}

	const allOk = granted === amount;

	// 3) 성공분만 누적 기록
	if (granted > 0) {
		try {
			await recordGrant(promotionCode, granted);
		} catch (err) {
			console.warn("[Promotion] recordGrant failed", err);
		}
	}

	// 4) 최신 한도 정보 회신
	const after = await canGrant(promotionCode, 0, DAILY_GRANT_LIMIT);
	const limitInfo = {
		remainingToday: after.remainingToday,
		dailyLimit: after.dailyLimit,
	};

	if (allOk) {
		return { ok: true, rewardKey: lastGrant.rewardKey, ...limitInfo };
	}
	return { ...lastGrant, ...limitInfo };
}

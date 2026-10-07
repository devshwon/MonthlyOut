/**
 * 첫 항목 등록 보상 — 첫 고정지출을 저장하면 토스포인트 {@link FIRST_CHARGE_REWARD}원.
 *
 * 항목이 0개면 이 앱은 보여줄 숫자가 없다. 첫 저장을 넘기는 순간 총액 칠판이 채워지니
 * 보상은 거기 한 번만 건다 — 매달·매일 주는 보상은 규칙 9(입력 최소화)와 안 맞는다.
 *
 * 지급은 클라이언트가 SDK로 바로 한다(docs/point-granting.md Pattern B). 항목 데이터는
 * 어디에도 올라가지 않는다. 토스 프로모션은 **1인 하루 한도**(5원)까지만 막아 준다 —
 * "1인 1회" 설정은 없다. 그래서 같은 기기에서 다시 부르지 않게 하는 건 여기 기록이 맡는다.
 *
 * 상태는 둘뿐이다.
 * - `granted` — 받았다(또는 토스가 "이미 받음"이라고 했다). 다시 부르지 않는다.
 * - `pending` — 불렀는데 못 받았다. 다음 새 항목을 저장할 때 한 번 더 부른다.
 *   첫 저장 한 번에만 걸면 일시 오류·낮은 앱 버전으로 못 받은 사람은 영영 못 받는다.
 */
import {
	FIRST_CHARGE_REWARD,
	FIRST_CHARGE_REWARD_READY,
	PROMOTION_CODES,
} from "@/constants/promotion";
import { pushFlowDebugEvent } from "@/utils/flowDebug";
import { grantPromotionWithLedger, type PromotionResult } from "./promotion";
import { readStorage, writeStorage } from "./storage";

export const FIRST_CHARGE_REWARD_KEY = "monthlyout.reward.v1";

export type FirstChargeRewardStatus = "granted" | "pending";

export function readRewardStatus(): FirstChargeRewardStatus | undefined {
	const raw = readStorage(FIRST_CHARGE_REWARD_KEY);
	return raw === "granted" || raw === "pending" ? raw : undefined;
}

function writeRewardStatus(status: FirstChargeRewardStatus): void {
	writeStorage(FIRST_CHARGE_REWARD_KEY, status);
}

/**
 * 이번 저장에서 보상을 불러야 하는가.
 *
 * 저장 **전** 항목 수를 받는다. 이미 항목이 있던 사람(이 기능 전에 적어둔 사람 포함)은
 * 첫 등록이 아니니 받지 않는다 — 단, 전에 불렀다가 못 받은 사람(`pending`)은 예외.
 */
export function shouldGrantFirstChargeReward(
	chargesBeforeSave: number,
	status: FirstChargeRewardStatus | undefined = readRewardStatus(),
	ready: boolean = FIRST_CHARGE_REWARD_READY,
): boolean {
	if (!ready || status === "granted") {
		return false;
	}
	return chargesBeforeSave === 0 || status === "pending";
}

/** 빈 화면에 "첫 항목을 적으면 5원" 문구를 낼지. 이미 받은 사람에겐 안 보인다. */
export function canOfferFirstChargeReward(chargeCount: number): boolean {
	return shouldGrantFirstChargeReward(chargeCount);
}

/**
 * 토스가 "이미 줬다"고 답한 경우. 4113(중복)·4114(하루 한도)는
 * 오류가 아니라 정상 멱등 응답이다 — 데이터를 지우고 다시 적은 사람이 여기 온다.
 */
function alreadyGranted(result: PromotionResult): boolean {
	return (
		result.reason === "duplicate" || result.reason === "over_limit_per_call"
	);
}

let inFlight = false;

/**
 * 보상을 부른다. **저장을 막지 않게** 결과를 기다리지 말고 던져두고 쓴다.
 * 실제로 새로 받았을 때만 true — 토스트는 그때만 띄운다.
 */
export async function claimFirstChargeReward(): Promise<boolean> {
	if (inFlight) {
		return false;
	}
	inFlight = true;
	// 부르기 전에 남긴다 — 응답 전에 앱이 닫혀도 다음 저장에서 한 번 더 부를 수 있게.
	writeRewardStatus("pending");
	try {
		const result = await grantPromotionWithLedger(
			PROMOTION_CODES.FIRST_CHARGE,
			FIRST_CHARGE_REWARD,
		);
		pushFlowDebugEvent(
			"first_charge_reward",
			result.ok
				? "ok"
				: `${result.reason}${result.rawCode ? ` (${result.rawCode})` : ""}`,
		);
		if (result.ok) {
			writeRewardStatus("granted");
			return true;
		}
		if (alreadyGranted(result)) {
			writeRewardStatus("granted");
		}
		return false;
	} finally {
		inFlight = false;
	}
}

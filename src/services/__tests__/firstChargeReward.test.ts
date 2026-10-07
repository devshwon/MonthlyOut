import { beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({
	grantPromotionReward: vi.fn(),
	grantPromotionRewardForGame: vi.fn(),
}));

vi.mock("@apps-in-toss/web-framework", () => ({
	grantPromotionReward: sdk.grantPromotionReward,
	grantPromotionRewardForGame: sdk.grantPromotionRewardForGame,
	// 원장은 SDK Storage가 없으면 localStorage만 쓴다.
	Storage: undefined,
}));

import {
	claimFirstChargeReward,
	FIRST_CHARGE_REWARD_KEY,
	readRewardStatus,
	shouldGrantFirstChargeReward,
} from "@/services/firstChargeReward";

/**
 * 첫 항목 등록 보상.
 *
 * 틀리면 두 방향 다 나쁘다 — 느슨하면 이미 쓰던 사람이 저장할 때마다 SDK를 부르고,
 * 빡빡하면 일시 오류로 못 받은 사람이 "5원 준다더니"로 남는다.
 */
describe("shouldGrantFirstChargeReward", () => {
	it("항목이 없던 상태에서 처음 저장하면 부른다", () => {
		expect(shouldGrantFirstChargeReward(0, undefined, true)).toBe(true);
	});

	it("이미 항목이 있던 사람은 첫 등록이 아니라 안 부른다", () => {
		expect(shouldGrantFirstChargeReward(3, undefined, true)).toBe(false);
	});

	it("전에 못 받았으면(pending) 항목이 있어도 한 번 더 부른다", () => {
		expect(shouldGrantFirstChargeReward(1, "pending", true)).toBe(true);
	});

	it("받았으면 다 지우고 다시 적어도 안 부른다", () => {
		expect(shouldGrantFirstChargeReward(0, "granted", true)).toBe(false);
	});

	it("프로모션 코드가 자리표시자면 안 부른다", () => {
		expect(shouldGrantFirstChargeReward(0, undefined, false)).toBe(false);
	});
});

describe("claimFirstChargeReward", () => {
	beforeEach(() => {
		localStorage.clear();
		sdk.grantPromotionReward.mockReset();
	});

	it("받으면 granted로 남기고 true", async () => {
		sdk.grantPromotionReward.mockResolvedValue({ key: "reward-key" });
		await expect(claimFirstChargeReward()).resolves.toBe(true);
		expect(readRewardStatus()).toBe("granted");
		expect(sdk.grantPromotionReward).toHaveBeenCalledWith({
			params: { promotionCode: expect.any(String), amount: 5 },
		});
	});

	it("토스가 이미 줬다고 하면(4113) granted지만 토스트는 안 띄운다", async () => {
		sdk.grantPromotionReward.mockResolvedValue({ errorCode: "4113" });
		await expect(claimFirstChargeReward()).resolves.toBe(false);
		expect(readRewardStatus()).toBe("granted");
	});

	it("4113이 code 필드로 와도 이미 받은 것으로 본다", async () => {
		sdk.grantPromotionReward.mockResolvedValue({ code: "4113" });
		await expect(claimFirstChargeReward()).resolves.toBe(false);
		expect(readRewardStatus()).toBe("granted");
	});

	it("일시 오류면 pending으로 남겨 다음 저장에서 다시 부른다", async () => {
		sdk.grantPromotionReward.mockResolvedValue({ errorCode: "4110" });
		await expect(claimFirstChargeReward()).resolves.toBe(false);
		expect(localStorage.getItem(FIRST_CHARGE_REWARD_KEY)).toBe("pending");
	});

	it("앱 버전이 낮아 undefined면 pending", async () => {
		sdk.grantPromotionReward.mockResolvedValue(undefined);
		await expect(claimFirstChargeReward()).resolves.toBe(false);
		expect(readRewardStatus()).toBe("pending");
	});

	it("SDK가 예외를 던져도 저장 흐름을 죽이지 않는다", async () => {
		sdk.grantPromotionReward.mockRejectedValue(new Error("bridge"));
		await expect(claimFirstChargeReward()).resolves.toBe(false);
		expect(readRewardStatus()).toBe("pending");
	});

	it("응답 전에 또 부르면 두 번째는 SDK를 안 부른다", async () => {
		sdk.grantPromotionReward.mockResolvedValue({ key: "k" });
		const [first, second] = await Promise.all([
			claimFirstChargeReward(),
			claimFirstChargeReward(),
		]);
		expect([first, second]).toEqual([true, false]);
		expect(sdk.grantPromotionReward).toHaveBeenCalledTimes(1);
	});
});

import { beforeEach, describe, expect, it } from "vitest";
import { canShowInterstitial, markInterstitialShown } from "@/services/adGate";

/**
 * 전면광고를 하루 한 번으로 묶는 게이트.
 *
 * 여기서 틀리면 두 방향 다 나쁘다 — 느슨하면 저장할 때마다 광고가 뜨고,
 * 빡빡하면 며칠씩 광고가 안 뜨는데 둘 다 화면만 봐서는 눈치채기 어렵다.
 */
describe("adGate", () => {
	const day = (iso: string) => new Date(`${iso}T09:00:00`);

	beforeEach(() => {
		localStorage.clear();
	});

	it("아무것도 안 봤으면 띄울 수 있다", () => {
		expect(canShowInterstitial(day("2026-09-14"))).toBe(true);
	});

	it("같은 날 두 번째는 막는다", () => {
		markInterstitialShown(day("2026-09-14"));
		expect(canShowInterstitial(day("2026-09-14"))).toBe(false);
	});

	it("날이 바뀌면 다시 띄운다", () => {
		markInterstitialShown(day("2026-09-14"));
		expect(canShowInterstitial(day("2026-09-15"))).toBe(true);
	});

	it("자정 직전과 직후를 다른 날로 센다", () => {
		markInterstitialShown(new Date("2026-09-14T23:59:59"));
		expect(canShowInterstitial(new Date("2026-09-14T23:59:59"))).toBe(false);
		expect(canShowInterstitial(new Date("2026-09-15T00:00:01"))).toBe(true);
	});

	it("달·해가 넘어가도 날짜로만 센다", () => {
		markInterstitialShown(day("2026-12-31"));
		expect(canShowInterstitial(day("2027-01-01"))).toBe(true);
	});

	it("저장된 값이 깨져 있으면 막지 않는다", () => {
		// 못 읽는 것 때문에 광고를 영영 못 띄우는 쪽이 더 나쁘다.
		localStorage.setItem("monthlyout.ads.v1", "{깨진 JSON");
		expect(canShowInterstitial(day("2026-09-14"))).toBe(true);
	});

	it("다른 값이 들어 있어도 지우지 않는다", () => {
		localStorage.setItem(
			"monthlyout.ads.v1",
			JSON.stringify({ somethingElse: 1 }),
		);
		markInterstitialShown(day("2026-09-14"));
		const saved = JSON.parse(
			localStorage.getItem("monthlyout.ads.v1") as string,
		);
		expect(saved.somethingElse).toBe(1);
		expect(saved.lastInterstitialDate).toBe("2026-09-14");
	});
});

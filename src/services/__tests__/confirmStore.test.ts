import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	clearConfirmations,
	isConfirmed,
	subscribeConfirmations,
	toggleConfirmed,
} from "@/services/confirmStore";

/**
 * 이체 확인 체크.
 *
 * 핵심 규칙은 **달마다 따로 쌓인다**는 것 하나다. 잔고 부족처럼 이체가 안 빠지는 달이
 * 있어서 체크는 항목이 아니라 "그 달의 그 항목"에 붙는다 — 이게 새면 지난달 체크가
 * 이번 달에 이미 확인한 것처럼 보이고, 사용자는 안 빠진 돈을 빠진 줄 안다.
 */
describe("confirmStore", () => {
	beforeEach(() => {
		clearConfirmations();
	});

	it("체크한 달에만 붙는다", () => {
		toggleConfirmed("2026-09", "a");

		expect(isConfirmed("2026-09", "a")).toBe(true);
		expect(isConfirmed("2026-10", "a")).toBe(false);
		expect(isConfirmed("2026-08", "a")).toBe(false);
	});

	it("같은 항목을 다시 누르면 풀린다", () => {
		toggleConfirmed("2026-09", "a");
		toggleConfirmed("2026-09", "a");

		expect(isConfirmed("2026-09", "a")).toBe(false);
	});

	it("한 항목을 풀어도 같은 달 다른 항목은 그대로다", () => {
		toggleConfirmed("2026-09", "a");
		toggleConfirmed("2026-09", "b");
		toggleConfirmed("2026-09", "a");

		expect(isConfirmed("2026-09", "a")).toBe(false);
		expect(isConfirmed("2026-09", "b")).toBe(true);
	});

	it("바뀔 때마다 화면에 알린다", () => {
		const listener = vi.fn();
		const unsubscribe = subscribeConfirmations(listener);

		toggleConfirmed("2026-09", "a");
		expect(listener).toHaveBeenCalledTimes(1);

		unsubscribe();
		toggleConfirmed("2026-09", "b");
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it("초기화하면 모든 달이 비워진다", () => {
		toggleConfirmed("2026-09", "a");
		toggleConfirmed("2026-10", "b");

		clearConfirmations();

		expect(isConfirmed("2026-09", "a")).toBe(false);
		expect(isConfirmed("2026-10", "b")).toBe(false);
	});
});

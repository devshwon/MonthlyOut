import { useEffect, useState } from "react";

/**
 * 숫자가 굴러 올라가는 연출은 **앱을 켠 뒤 한 번만** 본다.
 * 탭을 오갈 때마다 다시 굴리면 피곤하니, 끝까지 재생된 뒤에 잠근다.
 * (재생 도중 화면이 다시 마운트되면 처음부터 다시 굴러도 괜찮다.)
 */
let introFinished = false;

function prefersReducedMotion(): boolean {
	if (typeof window === "undefined" || !window.matchMedia) {
		return false;
	}
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * 0에서 목표 금액까지 굴러 올라가는 숫자.
 * 이미 한 번 재생했거나 `enabled`가 false면 목표값을 그대로 돌려준다.
 */
export function useCountUp(
	target: number,
	{
		enabled = true,
		duration = 1100,
	}: { enabled?: boolean; duration?: number } = {},
): number {
	const play = enabled && !introFinished && !prefersReducedMotion();
	const [value, setValue] = useState(play ? 0 : target);

	useEffect(() => {
		if (!play) {
			setValue(target);
			return;
		}

		let frame = 0;
		const start = performance.now();
		// 화면이 가려져 있으면 requestAnimationFrame이 멈춘다 — 숫자가 0에 머무르지 않도록
		// 재생 시간이 지나면 목표값으로 확정한다.
		const guard = setTimeout(() => {
			cancelAnimationFrame(frame);
			setValue(target);
			introFinished = true;
		}, duration + 400);

		const tick = (now: number) => {
			const progress = Math.min((now - start) / duration, 1);
			// easeOutCubic — 빠르게 올라가다 목표에서 부드럽게 멈춘다.
			const eased = 1 - (1 - progress) ** 3;
			setValue(Math.round(target * eased));

			if (progress < 1) {
				frame = requestAnimationFrame(tick);
				return;
			}
			introFinished = true;
			clearTimeout(guard);
		};

		frame = requestAnimationFrame(tick);
		return () => {
			cancelAnimationFrame(frame);
			clearTimeout(guard);
		};
	}, [target, play, duration]);

	return value;
}

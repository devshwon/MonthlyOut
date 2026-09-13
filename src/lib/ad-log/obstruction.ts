/**
 * "광고가 렌더는 됐는데 왜 안 보이는가"를 DOM에서 직접 알아낸다.
 *
 * SDK 콜백은 '광고가 안 보였다'까지만 알려주고 이유는 안 알려준다. 이유를 모르면
 * 고칠 수가 없으므로, viewable이 안 왔을 때만 이 검사를 돌려 원인을 붙인다.
 */
import type { AdOutcome } from "./types";

export interface Inspection {
	outcome: Extract<AdOutcome, "ok" | "zero_size" | "offscreen" | "obstructed">;
	w: number;
	h: number;
	/** 뷰포트와 겹치는 면적 비 (0~1) */
	ratio: number;
	/** outcome이 obstructed일 때 범인 셀렉터 */
	blocker?: string;
	/** 부가 설명 (예: 'opacity:0') */
	note?: string;
}

/** 'DIV#bottom-sheet.overlay.dim' — 로그에서 바로 찾아갈 수 있을 만큼만. */
function describe(el: Element): string {
	let s = el.tagName;
	const id = (el as HTMLElement).id;
	if (id) s += `#${id}`;
	const cls = el.getAttribute("class");
	if (cls) {
		const parts = cls.trim().split(/\s+/).slice(0, 3).join(".");
		if (parts) s += `.${parts}`;
	}
	return s.slice(0, 80);
}

/**
 * 컨테이너를 검사해 판정을 돌려준다. 절대 throw하지 않는다.
 *
 * 판정 우선순위: 크기 붕괴 → 뷰포트 이탈 → 가려짐 → 정상.
 * (크기가 0이면 가려짐 검사는 의미가 없으므로 먼저 걸러야 한다)
 */
export function inspect(el: HTMLElement | null): Inspection {
	const fallback: Inspection = { outcome: "ok", w: 0, h: 0, ratio: 0 };
	if (!el) return fallback;

	try {
		const r = el.getBoundingClientRect();
		const w = Math.round(r.width);
		const h = Math.round(r.height);

		// ── 1. 크기 붕괴 / 시각적 무효화 ────────────────────────
		if (w < 8 || h < 8) {
			return { outcome: "zero_size", w, h, ratio: 0, note: "rect" };
		}
		const cs = getComputedStyle(el);
		if (cs.display === "none" || cs.visibility === "hidden") {
			return {
				outcome: "zero_size",
				w,
				h,
				ratio: 0,
				note: `css:${cs.display}/${cs.visibility}`,
			};
		}
		const op = Number.parseFloat(cs.opacity || "1");
		if (!Number.isNaN(op) && op < 0.1) {
			return { outcome: "zero_size", w, h, ratio: 0, note: `opacity:${op}` };
		}

		// ── 2. 뷰포트 이탈 ──────────────────────────────────────
		// visualViewport를 우선 쓴다 — 키보드가 올라오면 innerHeight는 그대로인데
		// 실제 보이는 영역은 줄어든다. 그 상태로 광고가 키보드 뒤에 깔리는 게 흔한 케이스.
		const vv = window.visualViewport;
		const vw = Math.round(vv?.width ?? window.innerWidth);
		const vh = Math.round(vv?.height ?? window.innerHeight);

		const ix = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
		const iy = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
		const ratio = Math.round(((ix * iy) / (r.width * r.height)) * 100) / 100;

		if (ratio < 0.5) {
			return { outcome: "offscreen", w, h, ratio, note: `vv:${vw}x${vh}` };
		}

		// ── 3. 가려짐 (히트 테스트) ─────────────────────────────
		// 컨테이너 안쪽 5점을 찍어 각 지점의 최상위 요소를 확인한다.
		// 광고 자신(또는 자손)이 아니면 뭔가가 위에 덮여 있다는 뜻.
		const pad = 6;
		const pts: [number, number][] = [
			[r.left + r.width / 2, r.top + r.height / 2],
			[r.left + pad, r.top + pad],
			[r.right - pad, r.top + pad],
			[r.left + pad, r.bottom - pad],
			[r.right - pad, r.bottom - pad],
		];

		let tested = 0;
		let blocked = 0;
		const blockers = new Map<string, number>();

		for (const [x, y] of pts) {
			// 뷰포트 밖 좌표는 항상 null을 돌려주므로 표본에서 제외한다.
			// (그건 2단계에서 이미 판정했어야 할 문제다)
			if (x < 0 || y < 0 || x >= vw || y >= vh) continue;
			tested++;
			const hit = document.elementFromPoint(x, y);
			if (!hit) continue;
			if (hit === el || el.contains(hit)) continue;
			blocked++;
			const key = describe(hit);
			blockers.set(key, (blockers.get(key) ?? 0) + 1);
		}

		// 과반이 막혔을 때만 인정. 모서리 하나가 딴 요소에 걸치는 건 정상 레이아웃에서도 흔하다.
		if (tested >= 3 && blocked > tested / 2) {
			let top = "";
			let best = 0;
			for (const [k, n] of blockers) {
				if (n > best) {
					best = n;
					top = k;
				}
			}
			return {
				outcome: "obstructed",
				w,
				h,
				ratio,
				blocker: top,
				note: `${blocked}/${tested}`,
			};
		}

		return { outcome: "ok", w, h, ratio };
	} catch {
		return fallback;
	}
}

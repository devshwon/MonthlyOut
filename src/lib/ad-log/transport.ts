/**
 * 전송. 두 가지 경로가 있고 쓰는 상황이 다르다.
 *
 * 1. sendBeacon — 세션 종료(visibilitychange → hidden) 전용.
 *    웹뷰가 백그라운드로 가면 fetch는 중간에 끊기지만 beacon은 브라우저가 책임지고 보낸다.
 *    대신 성공/실패를 알 수 없어서, 보낸 뒤 스풀을 낙관적으로 비운다.
 *
 * 2. fetch(keepalive) — 포그라운드 명시 flush 전용.
 *    응답을 받을 수 있으므로 실패하면 스풀에 되돌린다.
 *
 * ## Content-Type이 text/plain인 이유
 * application/json으로 보내면 CORS preflight(OPTIONS)가 뜬다. sendBeacon은 preflight를
 * 제대로 처리하지 못해 조용히 유실된다. text/plain은 단순 요청이라 preflight가 없다.
 * Worker 쪽에서 req.text() → JSON.parse로 받는다.
 */

import { drain, hasPending, restore } from "./buffer";
import { debugLog, getOptions } from "./config";
import type { AdLogBody, AdLogPayload } from "./types";

const CT = "text/plain;charset=UTF-8";

/** beacon 한계(대략 64KB)를 넘지 않도록 오래된 페이로드부터 버린다. */
function serialize(
	batch: AdLogPayload[],
	limit: number,
): {
	body: string;
	sent: AdLogPayload[];
} {
	let list = batch;
	let body = JSON.stringify({ v: 1, batch: list } satisfies AdLogBody);
	while (body.length > limit && list.length > 1) {
		list = list.slice(1); // 오래된 것부터 희생
		body = JSON.stringify({ v: 1, batch: list } satisfies AdLogBody);
	}
	// 페이로드 1개인데도 넘치면 이슈/에러를 잘라낸다
	if (body.length > limit && list.length === 1) {
		const p = { ...list[0] };
		while (body.length > limit && (p.i.length > 1 || p.e.length > 0)) {
			if (p.e.length) p.e = p.e.slice(0, -1);
			else p.i = p.i.slice(0, -1);
			p.d = (p.d ?? 0) + 1;
			list = [p];
			body = JSON.stringify({ v: 1, batch: list } satisfies AdLogBody);
		}
	}
	return { body, sent: list };
}

/**
 * @param mode 'beacon'은 세션 종료용(결과 확인 불가), 'fetch'는 포그라운드용(실패 시 복원)
 */
export function send(mode: "beacon" | "fetch"): void {
	const o = getOptions();
	if (!o?.enabled) return;
	if (!hasPending()) return;

	const batch = drain();
	if (!batch.length) return;

	const { body, sent } = serialize(batch, o.maxBodyBytes);
	debugLog(`send(${mode})`, `${sent.length} payload`, `${body.length}B`);

	if (mode === "beacon") {
		try {
			if (navigator.sendBeacon) {
				const ok = navigator.sendBeacon(
					o.endpoint,
					new Blob([body], { type: CT }),
				);
				if (ok) return;
			}
		} catch {
			/* beacon 실패 → fetch로 폴백 */
		}
		// beacon이 거부(큐 포화 등)되면 keepalive fetch로 한 번 더 시도.
		// 백그라운드 전환 중이라 성공 보장은 없지만 안 하는 것보다 낫다.
		try {
			void fetch(o.endpoint, {
				method: "POST",
				body,
				keepalive: true,
				mode: "cors",
				credentials: "omit",
				headers: { "Content-Type": CT },
			}).catch(() => {});
		} catch {
			/* 무시 — 로거가 앱을 방해하면 안 된다 */
		}
		return;
	}

	// fetch 경로: 실패하면 되돌려서 다음 기회에 재시도
	try {
		void fetch(o.endpoint, {
			method: "POST",
			body,
			keepalive: true,
			mode: "cors",
			credentials: "omit",
			headers: { "Content-Type": CT },
		})
			.then((res) => {
				if (!res.ok && res.status >= 500) restore(sent);
				// 4xx는 우리가 뭘 잘못 보낸 것 — 재시도해도 똑같으니 버린다
			})
			.catch(() => restore(sent));
	} catch {
		restore(sent);
	}
}

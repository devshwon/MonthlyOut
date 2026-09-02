/**
 * 토스 스마트 발송 알림 동의 (옵트인) — 자체 BE 없이 SDK만 사용.
 *
 * ## 동작
 * 1. 사용자가 알림 토글 ON → `requestReminderAgreement()` 호출
 * 2. 토스가 동의 UI 표시 → agreed/rejected 결과
 * 3. 매일 발송은 토스 콘솔의 '스마트 발송 → 정기 발송' 캠페인이 담당
 * 4. FE는 동의 수집 + 로컬 선호 저장만 처리
 *
 * ## 토스 콘솔 설정 필요
 * - '스마트 발송 → 알림 동의문' 에 templateCode 등록
 * - '스마트 발송 → 기능성 캠페인 → 정기 발송' 에 메시지/스케줄 등록
 */
import { requestNotificationAgreement } from "@apps-in-toss/web-framework";

export type ReminderAgreement = "agreed" | "rejected" | "unsupported";

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * 토스 스마트 발송 알림 수신 동의 요청.
 *
 * @param templateCode 콘솔 '알림 동의문'에 등록한 코드 (앱마다 다름)
 * @param timeoutMs 동의 UI 응답 대기 (콘솔 미등록 시 콜백 미발생 대비)
 *
 * @returns 'agreed' | 'rejected' | 'unsupported'
 */
export function requestReminderAgreement(
	templateCode: string,
	timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<ReminderAgreement> {
	return new Promise<ReminderAgreement>((resolve) => {
		let settled = false;
		let cleanup: (() => void) | undefined;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const finish = (result: ReminderAgreement) => {
			if (settled) return;
			settled = true;
			if (timer) clearTimeout(timer);
			try {
				cleanup?.();
			} catch {
				/* ignore */
			}
			resolve(result);
		};
		// 동의문이 콘솔에 미등록이면 UI가 안 뜨고 콜백도 없을 수 있어, 타임아웃으로 토글이 멈추지 않게 한다.
		timer = setTimeout(() => finish("unsupported"), timeoutMs);

		try {
			cleanup = requestNotificationAgreement({
				options: { templateCode },
				onEvent: ({ type }) =>
					finish(type === "agreementRejected" ? "rejected" : "agreed"),
				onError: (e) => {
					console.error("[reminder] 알림 동의 요청 실패", e);
					finish("unsupported");
				},
			});
		} catch (e) {
			console.error("[reminder] requestNotificationAgreement 호출 실패", e);
			finish("unsupported");
		}
	});
}

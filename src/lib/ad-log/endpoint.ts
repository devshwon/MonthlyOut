/**
 * 수집 엔드포인트 — **이 파일은 sync 스크립트가 덮어쓴다. 손으로 고치지 말 것.**
 *
 * ## 왜 여기에 박아두나
 * 앱 개발자가 URL을 알 필요가 없게 하려고. 앱 코드에는 `initAdLog({ app: "blink" })`만
 * 남고, 어디로 보내는지는 라이브러리가 안다.
 *
 * ## 앱 번들에 URL이 들어가는 건 괜찮은가
 * 괜찮다. 이건 비밀이 아니다. D1 database_id·계정 ID·API 토큰은 전부 Worker 쪽에만
 * 있고 클라이언트로 내려오지 않는다. 여기 있는 건 "어디로 POST할지"뿐이고,
 * 그건 어차피 네트워크 탭에서 다 보인다.
 *
 * ## 계정을 갈아탈 때
 * 이 값이 **커스텀 도메인**이면 DNS만 다시 붙이면 끝이다. 앱은 손 안 댄다.
 * `*.workers.dev`를 박으면 계정을 옮기는 순간 앱 전부를 재배포·재심사해야 한다.
 * (토스 미니앱은 번들 심사를 거치므로 이건 사실상 되돌릴 수 없는 실수다)
 *
 * @see ads-log/README.md 「배포와 계정 이전」
 */

/** sync 시 .env의 ADS_LOG_ENDPOINT로 치환된다. */
export const DEFAULT_ENDPOINT = "https://log.wonkeylab.kr/v1/ad";

/** 치환이 안 된 상태 — 이대로 배포되면 로거를 꺼야 한다. */
export const ENDPOINT_PLACEHOLDER = "__ADS_LOG_ENDPOINT__";

export function isPlaceholder(url: string | undefined): boolean {
	return !url || url === ENDPOINT_PLACEHOLDER || url.includes("__ADS_LOG_");
}

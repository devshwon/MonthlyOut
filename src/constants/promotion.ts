/**
 * 토스 프로모션 (포인트 지급) — 프로모션 코드 상수 + 운영 정책.
 *
 * ## 토스 앱 버전
 * 토스앱 5.232.0 이상에서 지원. 미만 버전: undefined 반환 + 업데이트 안내.
 *
 * ## API 종류
 * - `grantPromotionReward` — **비게임 카테고리 미니앱**용
 * - `grantPromotionRewardForGame` — **게임 카테고리 미니앱**용 (혜택탭 노출)
 *
 * 본 템플릿은 비게임 기본 + 게임 옵션 둘 다 샘플로 제공해요. 카테고리에 맞춰 사용.
 *
 * ## 호출 제한
 * - userKey별 분당 최대 10회 (초과 시 에러)
 * - 1회 지급 캡: `MAX_GRANT_PER_CALL` (콘솔에서 설정한 값과 정합 필요)
 *
 * ## 중복 방지 (필수)
 * 함수 중복 호출 시 같은 사용자에 리워드 중복 지급될 수 있어 **방어 로직 필수**.
 * → `localGrantLedger.ts`가 SDK Storage + localStorage 이중 기록으로 best-effort 방지.
 *
 * ## 테스트 모드
 * 실제 프로모션 시작 전 **테스트 코드로 1회 이상 호출** 필요 (승인 상태 전환 트리거).
 * 'TEST_' 접두사를 붙이면 promotion.ts가 BE 호출/저장소 기록을 우회.
 *
 * 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/비게임/promotion.md
 */

/** 토스 프로모션 1회 지급 캡 (콘솔 설정값과 일치해야 함) */
export const MAX_GRANT_PER_CALL = 25;

/** 일일 한도 (토스 정책 1인당 5,000원/일) */
export const DAILY_GRANT_LIMIT = 5000;

/**
 * 프로모션 코드 — 콘솔에서 발급한 ULID 형식 (예: `01KRN0TXQF1EGK9QNEG9GMZSD4`).
 *
 * 검수 전 테스트: `TEST_` 접두사를 붙이면 `grantPromotionWithLedger`가
 * 로컬 기록/SDK 응답을 너그럽게 처리해요.
 */
export const PROMOTION_CODES = {
	/**
	 * 첫 항목 등록 보상 — 콘솔 "첫 고정지출 등록하면 5원"(id 60651, 예산 2,000원).
	 * 1회 {@link FIRST_CHARGE_REWARD}원 · **1인 하루 한도 5원**. 콘솔에는 "1인 1회" 설정이 없어서
	 * 토스가 막는 건 하루 단위다 — 같은 날 두 번은 4114로 막히지만, 데이터를 지우고
	 * 다음 날 다시 적으면 한 번 더 받을 수 있다. 5원이라 감수한다.
	 *
	 * 시작 전 필수 테스트(isTested)는 앞에 `TEST_`를 붙인 코드로 QR 앱에서 한 번 지급해
	 * 통과시킨다(TEST_ 번들 deploymentId 01a11509-1e07-7a7d-9921-b41e7ae0c2f8).
	 * 통과 전에는 프로모션을 RUNNING으로 못 바꾸고, 그동안 지급은 4109로 실패해 pending에 남는다.
	 */
	FIRST_CHARGE: "01M4AGFXD06GZC0BX3BHXWV28A",
} as const;

/** 첫 항목 등록 보상 금액(원). 콘솔 프로모션의 1회 지급액과 반드시 같아야 한다(다르면 4114). */
export const FIRST_CHARGE_REWARD = 5;

/**
 * 콘솔에 프로모션이 실제로 만들어졌는지. false면 보상 문구도 지급 호출도 내지 않는다 —
 * 자리표시자로 부르면 4100이 돌아오는데, 사용자에겐 "5원 준다더니 안 준다"로 보인다.
 * 개발 빌드에서는 화면 확인을 위해 켜둔다(mock SDK라 실제 지급은 없다).
 */
export const FIRST_CHARGE_REWARD_READY =
	!PROMOTION_CODES.FIRST_CHARGE.includes("PUT_FIRST_CHARGE") ||
	import.meta.env.DEV;

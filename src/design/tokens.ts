export const spacing = {
	xxs: 4,
	xs: 8,
	sm: 12,
	md: 16,
	lg: 20,
	xl: 24,
	xxl: 32,
	xxxl: 40,
	xxxxl: 48,
} as const;

export type SpacingKey = keyof typeof spacing;

export function spacingPx(key: SpacingKey): string {
	return `${spacing[key]}px`;
}

export const radius = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	xxl: 24,
	full: 9999,
} as const;

export type RadiusKey = keyof typeof radius;

export function radiusPx(key: RadiusKey): string {
	return key === "full" ? "9999px" : `${radius[key]}px`;
}

/**
 * 토스 팔레트 기준 색 토큰. 임의 hex 대신 여기서만 가져다 쓴다.
 * (desigin/toss-look.md — "토큰만 사용")
 */
export const colors = {
	/** 화면 배경 */
	background: "#F2F4F6",
	/** 카드·리스트 표면 */
	surface: "#FFFFFF",
	/** 구분선 */
	border: "#E5E8EB",
	/** 본문 강조 */
	textPrimary: "#191F28",
	/** 본문 */
	textSecondary: "#4E5968",
	/** 보조 설명 */
	textTertiary: "#8B95A1",
	/** 브랜드 */
	primary: "#3182F6",
	/** 금액이 풀리는 등 긍정 신호 */
	positive: "#15C26B",
	/** 삭제 등 위험 액션 */
	danger: "#F04452",
} as const;

export type ColorKey = keyof typeof colors;

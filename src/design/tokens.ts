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
	background: "#F4F6F9",
	/** 카드·리스트 표면 */
	surface: "#FFFFFF",
	/** 한 단계 낮은 표면(칩·트랙) */
	surfaceSunken: "#EEF1F5",
	/** 구분선 */
	border: "#E5E8EB",
	/** 본문 강조 */
	textPrimary: "#191F28",
	/** 본문 */
	textSecondary: "#4E5968",
	/** 보조 설명 */
	textTertiary: "#8B95A1",
	/** 어두운 배경 위 텍스트 */
	textOnDark: "#FFFFFF",
	/** 브랜드 */
	primary: "#3182F6",
	primarySoft: "#E8F1FE",
	/** 금액이 풀리는 등 긍정 신호 */
	positive: "#12B76A",
	positiveSoft: "#E4F7EE",
	/** 삭제 등 위험 액션 */
	danger: "#F04452",
} as const;

export type ColorKey = keyof typeof colors;

/** 히어로 카드 배경. 총액을 앉히는 자리라 화면당 하나만 쓴다. */
export const heroGradient = "linear-gradient(135deg, #3D7BF7 0%, #6A5AF9 100%)";

export const shadow = {
	card: "0 2px 8px rgba(25, 31, 40, 0.05)",
	floating: "0 6px 20px rgba(25, 31, 40, 0.16)",
	hero: "0 10px 24px rgba(61, 123, 247, 0.28)",
} as const;

/** 카테고리 색. 비율 바·아이콘·배지가 같은 색을 공유해야 한눈에 읽힌다. */
export const categoryColors = {
	subscription: "#7C5CFF",
	installment: "#3182F6",
	insurance: "#12B5A5",
	loan: "#FF8A3D",
	etc: "#98A2B3",
} as const;

/** 카테고리 아이콘 배경용 옅은 색. */
export const categorySoftColors = {
	subscription: "#F0ECFF",
	installment: "#E8F1FE",
	insurance: "#E3F7F5",
	loan: "#FFF0E5",
	etc: "#F0F2F5",
} as const;

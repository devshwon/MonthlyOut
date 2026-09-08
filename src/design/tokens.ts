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
	/** 화면 배경 — 교실 종이 같은 따뜻한 밝은 톤 */
	background: "#F6F4EF",
	/** 카드·리스트 표면 */
	surface: "#FFFFFF",
	/** 한 단계 낮은 표면(칩·트랙) */
	surfaceSunken: "#EFEDE7",
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
	/**
	 * 액션 색. 칠판에서 가져온 초록이라 이 앱의 색으로 읽힌다.
	 * 토스 파랑(primary)은 링크·선택 표시처럼 시스템 신호에만 남긴다.
	 */
	accent: "#2F4A40",
	accentPressed: "#264037",
	accentSoft: "#E9EFEC",
	/** 금액이 풀리는 등 긍정 신호 */
	positive: "#12B76A",
	positiveSoft: "#E4F7EE",
	/** 삭제 등 위험 액션 */
	danger: "#F04452",
} as const;

export type ColorKey = keyof typeof colors;

/**
 * 칠판. 총액처럼 "선생님이 칠판에 적어준 숫자" 느낌을 주는 자리에만 쓴다.
 * 화면 전체를 어둡게 칠하지는 않는다 — 미니앱은 라이트 모드가 원칙이다
 * (prompts/99-last-checklist.md 3-2).
 */
export const boardColors = {
	/** 칠판 면 */
	surface: "#2F4A40",
	surfaceDeep: "#264037",
	/** 나무 프레임 */
	wood: "#C89257",
	woodDeep: "#A9733C",
	/** 분필 글씨 */
	chalk: "#F4F3EC",
	/** 흐린 분필(보조 텍스트·선) */
	chalkDim: "rgba(244, 243, 236, 0.62)",
	/** 분필 자국이 남은 면 */
	chalkFaint: "rgba(244, 243, 236, 0.18)",
} as const;

/** 칠판 면 — 가운데가 살짝 밝은 진짜 칠판 느낌 */
export const boardSurface =
	"radial-gradient(120% 90% at 50% 35%, #35544A 0%, #2F4A40 45%, #26403F 100%)";

export const shadow = {
	card: "0 2px 8px rgba(25, 31, 40, 0.05)",
	floating: "0 6px 20px rgba(25, 31, 40, 0.16)",
	hero: "0 10px 24px rgba(61, 123, 247, 0.28)",
} as const;

/** 카테고리 색. 비율 바·아이콘·배지가 같은 색을 공유해야 한눈에 읽힌다. */
export const categoryColors = {
	subscription: "#7C5CFF",
	telecom: "#22A6F2",
	housing: "#F08C3A",
	insurance: "#12B5A5",
	loan: "#F2564D",
	installment: "#3182F6",
	delivery: "#00B2A9",
	health: "#EC5F9B",
	education: "#57A93A",
	transport: "#5A67D8",
	pet: "#B87333",
	saving: "#E0A400",
	etc: "#98A2B3",
} as const;

/** 카테고리 아이콘 배경용 옅은 색. */
export const categorySoftColors = {
	subscription: "#F0ECFF",
	telecom: "#E4F4FE",
	housing: "#FEF0E4",
	insurance: "#E3F7F5",
	loan: "#FDEAE9",
	installment: "#E8F1FE",
	delivery: "#E0F5F3",
	health: "#FDEBF3",
	education: "#EDF6E8",
	transport: "#ECEEFB",
	pet: "#F7EEE4",
	saving: "#FDF3DC",
	etc: "#F0F2F5",
} as const;

/** 돈 캐릭터('머니') 색. 캐릭터를 그림으로 교체하더라도 말풍선 색은 여기를 쓴다. */
export const characterColors = {
	coin: "#FFD34E",
	coinDeep: "#F2A93B",
	coinEdge: "#E08C1F",
	face: "#5B3A00",
	blush: "#FF9E9E",
	bubble: "#FFFFFF",
} as const;

/**
 * 노트. 칠판(홈·연간)이 "누가 적어준 숫자"라면, 관리·등록은 "내가 적는 곳"이라
 * 괘선 있는 종이로 잡는다.
 */
export const paperColors = {
	/** 종이 면 */
	surface: "#FFFDF7",
	/** 가로 괘선 */
	rule: "#DDE7F1",
	/** 왼쪽 여백선(빨간 줄) */
	margin: "#F0C9C9",
} as const;

/** 괘선 간격. 행 높이를 여기에 맞추면 글씨가 줄 위에 앉은 것처럼 보인다. */
export const paperRuleHeight = 32;

/** 괘선 + 왼쪽 여백선을 한 번에 그리는 배경. */
export const paperBackground = [
	`repeating-linear-gradient(180deg, transparent 0 ${paperRuleHeight - 1}px, ${paperColors.rule} ${paperRuleHeight - 1}px ${paperRuleHeight}px)`,
	`linear-gradient(90deg, transparent 0 21px, ${paperColors.margin} 21px 22px, transparent 22px)`,
].join(", ");

/**
 * 손으로 슥 그린 동그라미 느낌의 테두리 반경.
 * 네 모서리를 서로 다르게 줘서 컴퍼스로 그린 원처럼 보이지 않게 한다.
 */
export const handDrawnRadius = "46% 54% 50% 50% / 55% 45% 55% 45%";

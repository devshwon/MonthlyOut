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

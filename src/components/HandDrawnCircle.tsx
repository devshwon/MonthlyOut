import { colors, radius } from "@/design/tokens";

/** 선택한 입력값을 감싸는 공통 강조 테두리. */
export function HandDrawnCircle({
	color = colors.primary,
}: {
	color?: string;
}) {
	return (
		<span
			aria-hidden="true"
			style={{
				position: "absolute",
				inset: 0,
				border: `1.5px solid ${color}`,
				borderRadius: radius.md,
				pointerEvents: "none",
			}}
		/>
	);
}

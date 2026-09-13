import { paperColors } from "@/design/tokens";

/**
 * 빨간펜으로 채점하듯 슥 그린 동그라미.
 *
 * CSS `border-radius`로 만든 타원은 너무 반듯해서 "그린 것" 같지 않다.
 * 한 바퀴 돌고 살짝 지나친 획을 SVG로 그려 손맛을 낸다.
 * 부모에 `position: relative`를 주고 이 컴포넌트를 얹는다.
 */
export function HandDrawnCircle({
	color = paperColors.redPen,
}: {
	color?: string;
}) {
	return (
		<svg
			style={{
				position: "absolute",
				inset: -6,
				width: "calc(100% + 12px)",
				height: "calc(100% + 12px)",
				pointerEvents: "none",
			}}
			viewBox="0 0 100 60"
			preserveAspectRatio="none"
			fill="none"
			aria-hidden="true"
		>
			<title>선택됨</title>
			<path
				d="M52 5C27 4 7 14 6 28c-1 15 20 27 47 27 26 0 41-12 41-26C94 15 74 6 47 6c-9 0-17 2-23 5"
				stroke={color}
				strokeWidth="2.2"
				strokeLinecap="round"
				vectorEffect="non-scaling-stroke"
				opacity="0.9"
			/>
		</svg>
	);
}

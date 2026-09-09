import { paperColors } from "@/design/tokens";

/**
 * 빨간펜으로 그은 체크.
 *
 * 초록 동그라미는 앱 UI 기본값처럼 보인다 — 노트에 적어두고 처리한 걸 표시하는
 * 관습은 옆에 체크를 긋는 것이라, 손으로 그은 획으로 그린다.
 */
export function HandDrawnCheck({
	size = 22,
	color = paperColors.redPen,
}: {
	size?: number;
	color?: string;
}) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
		>
			<title>완료</title>
			<path
				d="M4 13.2c1.6 1 3.1 2.4 4.4 4.2 2-5 4.8-8.6 8.4-11.4"
				stroke={color}
				strokeWidth="2.6"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

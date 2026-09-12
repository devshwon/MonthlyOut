import { colors } from "@/design/tokens";

/** 결제 확인 상태를 표시하는 공통 체크. */
export function HandDrawnCheck({
	size = 22,
	color = colors.primary,
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

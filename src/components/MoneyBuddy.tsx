import { characterColors } from "@/design/tokens";

/**
 * 돈 캐릭터 '머니'.
 *
 * 지금은 SVG로 직접 그렸다 — 해상도에 상관없이 또렷하고 색을 토큰에 맞출 수 있다.
 * 나중에 그림 파일로 바꾸고 싶으면 **이 컴포넌트 안만** 교체하면 된다
 * (`<img src={...} width={size} height={size} alt="" />`).
 */
export function MoneyBuddy({ size = 64 }: { size?: number }) {
	const c = characterColors;

	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 72 72"
			fill="none"
			aria-hidden="true"
			focusable="false"
		>
			<title>돈 캐릭터</title>
			<ellipse cx="36" cy="65" rx="20" ry="3.5" fill="#000" opacity="0.06" />
			<circle cx="36" cy="35" r="27" fill={c.coinDeep} />
			<circle cx="36" cy="33" r="26" fill={c.coin} />
			<circle
				cx="36"
				cy="33"
				r="21"
				stroke={c.coinEdge}
				strokeWidth="1.6"
				opacity="0.5"
			/>
			{/* 눈 */}
			<circle cx="28" cy="31" r="2.8" fill={c.face} />
			<circle cx="44" cy="31" r="2.8" fill={c.face} />
			{/* 볼 */}
			<ellipse cx="23" cy="38" rx="4" ry="2.6" fill={c.blush} opacity="0.6" />
			<ellipse cx="49" cy="38" rx="4" ry="2.6" fill={c.blush} opacity="0.6" />
			{/* 웃는 입 */}
			<path
				d="M30 39.5c1.8 2.6 4 3.9 6 3.9s4.2-1.3 6-3.9"
				stroke={c.face}
				strokeWidth="2.4"
				strokeLinecap="round"
			/>
			{/* 반짝임 */}
			<path
				d="M55 14.5v5M52.5 17h5"
				stroke={c.coin}
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}

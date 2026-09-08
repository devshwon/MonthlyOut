import { characterColors } from "@/design/tokens";

interface Props {
	size?: number;
	/** 분필을 들고 있는 모습(칠판 옆에 세울 때) */
	holdingChalk?: boolean;
}

/**
 * 돈 캐릭터 '머니'. 동글동글한 동전 몸통에 팔다리가 붙어 있다.
 *
 * 지금은 SVG로 직접 그렸다 — 해상도에 상관없이 또렷하고 색을 토큰에 맞출 수 있다.
 * 나중에 그림 파일로 바꾸고 싶으면 **이 컴포넌트 안만** 교체하면 된다
 * (`<img src={...} width={size} alt="" />`).
 */
export function MoneyBuddy({ size = 64, holdingChalk = false }: Props) {
	const c = characterColors;
	// 가로세로 비율(92:96)을 유지한다(분필까지 들어가는 폭).
	const height = Math.round((size * 96) / 92);

	return (
		<svg
			width={size}
			height={height}
			viewBox="0 0 92 96"
			fill="none"
			aria-hidden="true"
			focusable="false"
		>
			<title>돈 캐릭터</title>
			<ellipse cx="40" cy="90" rx="22" ry="4" fill="#000" opacity="0.08" />

			{/* 다리 */}
			<path
				d="M32 68v12M48 68v12"
				stroke={c.coinEdge}
				strokeWidth="6"
				strokeLinecap="round"
			/>
			<ellipse cx="30" cy="84" rx="7.5" ry="5" fill={c.coinEdge} />
			<ellipse cx="50" cy="84" rx="7.5" ry="5" fill={c.coinEdge} />

			{/* 몸통(동전) */}
			<circle cx="40" cy="40" r="31" fill={c.coinDeep} />
			<circle cx="40" cy="38" r="30" fill={c.coin} />
			<circle
				cx="40"
				cy="38"
				r="24"
				stroke={c.coinEdge}
				strokeWidth="1.8"
				opacity="0.45"
			/>

			{/* 얼굴 */}
			<circle cx="31" cy="35" r="3.4" fill={c.face} />
			<circle cx="49" cy="35" r="3.4" fill={c.face} />
			<circle cx="32.2" cy="33.8" r="1.1" fill="#FFF" opacity="0.9" />
			<circle cx="50.2" cy="33.8" r="1.1" fill="#FFF" opacity="0.9" />
			<ellipse cx="24" cy="43" rx="4.6" ry="3" fill={c.blush} opacity="0.6" />
			<ellipse cx="56" cy="43" rx="4.6" ry="3" fill={c.blush} opacity="0.6" />
			<path
				d="M33 44.5c2 3 4.4 4.5 7 4.5s5-1.5 7-4.5"
				stroke={c.face}
				strokeWidth="2.6"
				strokeLinecap="round"
			/>

			{/* 왼팔 */}
			<path
				d="M22 52c-3 3.5-3.5 7.5-2 11"
				stroke={c.coinEdge}
				strokeWidth="5.5"
				strokeLinecap="round"
			/>

			{/* 오른팔 — 몸통 위로 그려야 팔이 보인다. 분필을 들면 위로 뻗는다 */}
			{holdingChalk ? (
				<>
					<path
						d="M58 50c6 -3 11 -8 14 -14"
						stroke={c.coinEdge}
						strokeWidth="5.5"
						strokeLinecap="round"
					/>
					<circle cx="74" cy="33" r="5.2" fill={c.coinEdge} />
				</>
			) : (
				<path
					d="M64 52c3 3.5 3.5 7.5 2 11"
					stroke={c.coinEdge}
					strokeWidth="5.5"
					strokeLinecap="round"
				/>
			)}

			{/* 손에 쥔 분필 — 몸통 밖으로 확실히 나오게 */}
			{holdingChalk ? (
				<g transform="rotate(32 78 24)">
					<rect
						x="74"
						y="10"
						width="8"
						height="26"
						rx="3.5"
						fill="#F7F6EF"
						stroke="#D8D6CB"
						strokeWidth="1"
					/>
					<rect x="74" y="10" width="8" height="7" rx="3.5" fill="#FFFDF6" />
				</g>
			) : null}
		</svg>
	);
}

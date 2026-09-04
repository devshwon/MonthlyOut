import type { ChargeCategory } from "@/types";

/**
 * 직접 그린 라인 아이콘 세트.
 * 이모지 대신 쓰는 이유 — 플랫폼마다 모양이 달라지지 않고, 색·굵기를 토큰에 맞출 수 있다.
 * 모두 24×24 그리드, `currentColor` 기준이라 부모의 color만 바꾸면 된다.
 */
interface IconProps {
	size?: number;
	color?: string;
	strokeWidth?: number;
	filled?: boolean;
}

function Svg({
	size = 24,
	color = "currentColor",
	strokeWidth = 1.8,
	children,
}: IconProps & { children: React.ReactNode }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke={color}
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			focusable="false"
		>
			{children}
		</svg>
	);
}

export function IconHome(props: IconProps) {
	return (
		<Svg {...props}>
			<path d="M4 10.5 12 4l8 6.5" />
			<path d="M6 10v9.5h12V10" />
			<path d="M10 19.5V14h4v5.5" />
		</Svg>
	);
}

export function IconManage(props: IconProps) {
	return (
		<Svg {...props}>
			<rect x="3.5" y="5" width="17" height="5" rx="2" />
			<rect x="3.5" y="14" width="17" height="5" rx="2" />
			<path d="M7.5 7.5h.01M7.5 16.5h.01" />
		</Svg>
	);
}

export function IconYearly(props: IconProps) {
	return (
		<Svg {...props}>
			<path d="M4 20V6" />
			<path d="M4 20h16" />
			<path d="M8.5 20v-5" />
			<path d="M13 20v-9" />
			<path d="M17.5 20V8" />
		</Svg>
	);
}

export function IconSettings(props: IconProps) {
	return (
		<Svg {...props}>
			<circle cx="12" cy="12" r="3" />
			<path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M17.9 6.1l-1.4 1.4M7.5 16.5l-1.4 1.4M17.9 17.9l-1.4-1.4M7.5 7.5 6.1 6.1" />
		</Svg>
	);
}

export function IconPlus(props: IconProps) {
	return (
		<Svg strokeWidth={2.2} {...props}>
			<path d="M12 5v14M5 12h14" />
		</Svg>
	);
}

export function IconCheck(props: IconProps) {
	return (
		<Svg strokeWidth={2.4} {...props}>
			<path d="m5 12.5 4.5 4.5L19 7.5" />
		</Svg>
	);
}

export function IconChevronRight(props: IconProps) {
	return (
		<Svg {...props}>
			<path d="m9.5 5 7 7-7 7" />
		</Svg>
	);
}

export function IconChevronLeft(props: IconProps) {
	return (
		<Svg {...props}>
			<path d="m14.5 5-7 7 7 7" />
		</Svg>
	);
}

/** 카드 결제 */
export function IconCard(props: IconProps) {
	return (
		<Svg {...props}>
			<rect x="3" y="5.5" width="18" height="13" rx="3" />
			<path d="M3 10h18" />
			<path d="M7 14.5h3" />
		</Svg>
	);
}

/** 통장 이체 */
export function IconBank(props: IconProps) {
	return (
		<Svg {...props}>
			<path d="M4 10h16" />
			<path d="M12 3.5 20 8H4l8-4.5Z" />
			<path d="M6.5 10v7M12 10v7M17.5 10v7" />
			<path d="M4 20h16" />
		</Svg>
	);
}

/** 구독 */
function IconPlay(props: IconProps) {
	return (
		<Svg {...props}>
			<circle cx="12" cy="12" r="8.5" />
			<path d="M10 8.8 15.5 12 10 15.2V8.8Z" />
		</Svg>
	);
}

/** 보험 */
function IconShield(props: IconProps) {
	return (
		<Svg {...props}>
			<path d="M12 3.5 19 6v6c0 4-3 7-7 8.5C8 19 5 16 5 12V6l7-2.5Z" />
			<path d="m9.2 12 2 2 3.6-3.6" />
		</Svg>
	);
}

/** 대출 */
function IconLoan(props: IconProps) {
	return (
		<Svg {...props}>
			<circle cx="12" cy="12" r="8.5" />
			<path d="M14.5 9.2c-.6-.8-1.5-1.2-2.6-1.2-1.6 0-2.6.9-2.6 2 0 2.6 5.2 1.4 5.2 4 0 1.2-1.1 2.1-2.7 2.1-1.2 0-2.1-.4-2.8-1.3" />
			<path d="M12 6.2v11.6" />
		</Svg>
	);
}

/** 기타 */
function IconDots(props: IconProps) {
	return (
		<Svg strokeWidth={2.4} {...props}>
			<path d="M7 12h.01M12 12h.01M17 12h.01" />
		</Svg>
	);
}

const CATEGORY_ICON: Record<ChargeCategory, (props: IconProps) => JSX.Element> =
	{
		subscription: IconPlay,
		installment: IconCard,
		insurance: IconShield,
		loan: IconLoan,
		etc: IconDots,
	};

export function CategoryIcon({
	category,
	...props
}: IconProps & { category: ChargeCategory }) {
	const Icon = CATEGORY_ICON[category];
	return <Icon {...props} />;
}

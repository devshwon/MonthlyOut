import { Paragraph } from "@toss/tds-mobile";
import { colors, radius, shadow, spacing } from "@/design/tokens";

interface Props {
	children: React.ReactNode;
	onClick: () => void;
	disabled?: boolean;
	/** 아이콘 등 텍스트 왼쪽에 붙는 요소 */
	left?: React.ReactNode;
	/** 화면 폭을 채우지 않고 내용만큼(플로팅 버튼용) */
	inline?: boolean;
	floating?: boolean;
}

const s = {
	base: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.xs,
		height: 54,
		border: "none",
		borderRadius: radius.full,
		cursor: "pointer",
	} satisfies React.CSSProperties,
};

/**
 * 앱의 주 액션 버튼.
 *
 * TDS Button 대신 쓰는 이유 — 색을 칠판 초록(`colors.accent`)으로 맞추기 위해서다.
 * 높이(54)·라운드·비활성 처리는 TDS 규격을 그대로 따라 이질감이 없게 한다.
 */
export function PrimaryButton({
	children,
	onClick,
	disabled = false,
	left,
	inline = false,
	floating = false,
}: Props) {
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onClick}
			style={{
				...s.base,
				width: inline ? "auto" : "100%",
				padding: inline ? `0 ${spacing.lg}px 0 ${spacing.md}px` : 0,
				backgroundColor: disabled ? colors.surfaceSunken : colors.accent,
				boxShadow: floating ? shadow.floating : "none",
				cursor: disabled ? "default" : "pointer",
			}}
		>
			{left}
			<Paragraph
				typography="t5"
				fontWeight="bold"
				color={disabled ? colors.textTertiary : colors.textOnDark}
			>
				<Paragraph.Text>{children}</Paragraph.Text>
			</Paragraph>
		</button>
	);
}

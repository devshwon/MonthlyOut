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
		borderRadius: radius.lg,
		cursor: "pointer",
	} satisfies React.CSSProperties,
};

/** 앱 전체에서 사용하는 주요 액션 버튼. */
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

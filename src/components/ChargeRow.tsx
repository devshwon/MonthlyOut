import { Paragraph } from "@toss/tds-mobile";
import { colors, radius, spacing } from "@/design/tokens";
import {
	CATEGORY_LABEL,
	formatBillingDay,
	formatKrw,
	installmentRound,
	METHOD_KIND_LABEL,
} from "@/services/charges";
import type { FixedCharge, YearMonth } from "@/types";

const s = {
	row: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.sm,
		width: "100%",
		padding: `${spacing.md}px ${spacing.md}px`,
		border: "none",
		borderRadius: radius.lg,
		backgroundColor: colors.surface,
		textAlign: "left" as const,
		cursor: "pointer",
	} satisfies React.CSSProperties,
	left: { minWidth: 0 } satisfies React.CSSProperties,
	nameLine: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xxs,
	} satisfies React.CSSProperties,
	badge: {
		flexShrink: 0,
		padding: `2px ${spacing.xs}px`,
		borderRadius: radius.full,
		backgroundColor: colors.background,
	} satisfies React.CSSProperties,
	meta: { marginTop: spacing.xxs } satisfies React.CSSProperties,
	amount: { flexShrink: 0 } satisfies React.CSSProperties,
};

interface Props {
	charge: FixedCharge;
	yearMonth: YearMonth;
	onClick: () => void;
}

/** 홈 리스트의 한 줄. 금액이 시선의 종착점이 되도록 오른쪽 정렬한다. */
export function ChargeRow({ charge, yearMonth, onClick }: Props) {
	const round = installmentRound(charge, yearMonth);
	const meta = [
		formatBillingDay(charge.billingDay),
		charge.method
			? `${charge.method.name || METHOD_KIND_LABEL[charge.method.kind]}`
			: null,
		charge.term && round ? `${round}/${charge.term.totalCount}회차` : null,
	].filter(Boolean);

	return (
		<button type="button" style={s.row} onClick={onClick}>
			<div style={s.left}>
				<div style={s.nameLine}>
					<Paragraph
						typography="t6"
						fontWeight="bold"
						color={colors.textPrimary}
					>
						<Paragraph.Text>{charge.name}</Paragraph.Text>
					</Paragraph>
					<span style={s.badge}>
						<Paragraph typography="t7" color={colors.textTertiary}>
							<Paragraph.Text>{CATEGORY_LABEL[charge.category]}</Paragraph.Text>
						</Paragraph>
					</span>
				</div>
				<Paragraph typography="t7" color={colors.textTertiary} style={s.meta}>
					<Paragraph.Text>{meta.join(" · ")}</Paragraph.Text>
				</Paragraph>
			</div>

			<Paragraph
				typography="t5"
				fontWeight="bold"
				color={colors.textPrimary}
				style={s.amount}
			>
				<Paragraph.Text>{formatKrw(charge.amount)}</Paragraph.Text>
			</Paragraph>
		</button>
	);
}

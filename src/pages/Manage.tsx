import { Paragraph } from "@toss/tds-mobile";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChargeRow } from "@/components/ChargeRow";
import { CategoryIcon, IconChevronRight, IconPlus } from "@/components/icons";
import {
	categoryColors,
	categorySoftColors,
	colors,
	radius,
	shadow,
	spacing,
} from "@/design/tokens";
import { useCharges } from "@/hooks/useCharges";
import {
	CATEGORY_LABEL,
	currentYearMonth,
	formatKrw,
	groupByCategory,
	isActive,
	monthlyTotal,
} from "@/services/charges";

const s = {
	page: {
		padding: `${spacing.xs}px ${spacing.md}px ${spacing.xs}px`,
	} satisfies React.CSSProperties,
	header: {
		padding: `${spacing.xs}px 0 ${spacing.md}px`,
	} satisfies React.CSSProperties,
	summary: { marginTop: spacing.xxs } satisfies React.CSSProperties,
	section: {
		marginBottom: spacing.sm,
		borderRadius: radius.xl,
		backgroundColor: colors.surface,
		boxShadow: shadow.card,
		overflow: "hidden",
	} satisfies React.CSSProperties,
	sectionHead: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		padding: `${spacing.sm}px ${spacing.md}px`,
		borderBottom: `1px solid ${colors.border}`,
	} satisfies React.CSSProperties,
	sectionDot: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: 26,
		height: 26,
		borderRadius: radius.full,
	} satisfies React.CSSProperties,
	sectionLabel: { flex: 1 } satisfies React.CSSProperties,
	empty: {
		marginTop: spacing.xxl,
		textAlign: "center" as const,
	} satisfies React.CSSProperties,
	emptyDescription: { marginTop: spacing.xs } satisfies React.CSSProperties,
	fabRow: {
		position: "sticky" as const,
		bottom: spacing.md,
		display: "flex",
		justifyContent: "flex-end",
		marginTop: spacing.md,
		pointerEvents: "none" as const,
	} satisfies React.CSSProperties,
	fab: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xxs,
		height: 52,
		padding: `0 ${spacing.lg}px`,
		border: "none",
		borderRadius: radius.full,
		backgroundColor: colors.primary,
		boxShadow: shadow.floating,
		cursor: "pointer",
		pointerEvents: "auto" as const,
	} satisfies React.CSSProperties,
};

export default function ManagePage() {
	const navigate = useNavigate();
	const charges = useCharges();
	const ym = useMemo(() => currentYearMonth(), []);
	const groups = groupByCategory(charges);

	return (
		<div style={s.page}>
			<div style={s.header}>
				<Paragraph typography="t4" fontWeight="bold" color={colors.textPrimary}>
					<Paragraph.Text>관리</Paragraph.Text>
				</Paragraph>
				<Paragraph
					typography="t7"
					color={colors.textTertiary}
					style={s.summary}
				>
					<Paragraph.Text>
						{charges.length === 0
							? "고정지출을 등록해두면 매달 알아서 계산해요"
							: `등록한 항목 ${charges.length}개 · 이번 달 ${formatKrw(monthlyTotal(charges, ym))}`}
					</Paragraph.Text>
				</Paragraph>
			</div>

			{groups.length === 0 ? (
				<div style={s.empty}>
					<Paragraph
						typography="t6"
						fontWeight="bold"
						color={colors.textPrimary}
					>
						<Paragraph.Text>아직 등록한 항목이 없어요</Paragraph.Text>
					</Paragraph>
					<Paragraph
						typography="t7"
						color={colors.textTertiary}
						style={s.emptyDescription}
					>
						<Paragraph.Text>아래 + 버튼으로 하나씩 넣어보세요.</Paragraph.Text>
					</Paragraph>
				</div>
			) : (
				groups.map((group) => (
					<div key={group.category} style={s.section}>
						<div style={s.sectionHead}>
							<span
								style={{
									...s.sectionDot,
									backgroundColor: categorySoftColors[group.category],
								}}
							>
								<CategoryIcon
									category={group.category}
									size={16}
									color={categoryColors[group.category]}
								/>
							</span>
							<Paragraph
								typography="t6"
								fontWeight="bold"
								color={colors.textPrimary}
								style={s.sectionLabel}
							>
								<Paragraph.Text>
									{`${CATEGORY_LABEL[group.category]} ${group.charges.length}`}
								</Paragraph.Text>
							</Paragraph>
							<Paragraph typography="t7" color={colors.textTertiary}>
								<Paragraph.Text>{formatKrw(group.amount)}</Paragraph.Text>
							</Paragraph>
						</div>

						{group.charges.map((charge) => (
							<ChargeRow
								key={charge.id}
								charge={charge}
								yearMonth={ym}
								dimmed={!isActive(charge, ym)}
								onClick={() => navigate(`/charge/${charge.id}`)}
								accessory={
									<IconChevronRight size={16} color={colors.textTertiary} />
								}
							/>
						))}
					</div>
				))
			)}

			<div style={s.fabRow}>
				<button
					type="button"
					style={s.fab}
					onClick={() => navigate("/charge/new")}
				>
					<IconPlus size={20} color={colors.textOnDark} />
					<Paragraph
						typography="t6"
						fontWeight="bold"
						color={colors.textOnDark}
					>
						<Paragraph.Text>항목 추가</Paragraph.Text>
					</Paragraph>
				</button>
			</div>
		</div>
	);
}

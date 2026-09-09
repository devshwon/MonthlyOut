import { Paragraph } from "@toss/tds-mobile";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { navSpace } from "@/components/BottomNav";
import { ChargeRow } from "@/components/ChargeRow";
import {
	CategoryIcon,
	IconCheck,
	IconChevronRight,
	IconPencil,
} from "@/components/icons";
import {
	categoryColors,
	categorySoftColors,
	colors,
	paperBackground,
	paperColors,
	radius,
	shadow,
	spacing,
} from "@/design/tokens";
import { useCharges } from "@/hooks/useCharges";
import { useConfirmedIds } from "@/hooks/useConfirmations";
import { useSafeAreaInsets } from "@/hooks/useSafeAreaInsets";
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
		padding: `${spacing.xs}px 0 ${spacing.sm}px`,
	} satisfies React.CSSProperties,
	titleWrap: { display: "inline-block" } satisfies React.CSSProperties,
	/** 제목 아래 손으로 그은 밑줄 */
	titleUnderline: {
		height: 5,
		marginTop: -2,
		borderRadius: radius.full,
		backgroundColor: colors.accentSoft,
		transform: "rotate(-0.6deg)",
	} satisfies React.CSSProperties,
	summary: { marginTop: spacing.xxs } satisfies React.CSSProperties,
	section: {
		marginBottom: spacing.sm,
		borderRadius: radius.xl,
		backgroundColor: colors.surface,
		boxShadow: shadow.card,
		overflow: "hidden",
	} satisfies React.CSSProperties,
	/**
	 * 괘선은 **행 목록에만** 깐다. 헤더까지 덮으면 첫 줄부터 어긋나서
	 * 글씨가 줄 사이에 뜬다(행 높이 64 = 괘선 32 × 2).
	 */
	sectionRows: {
		backgroundColor: paperColors.surface,
		backgroundImage: paperBackground,
	} satisfies React.CSSProperties,
	sectionHead: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		padding: `${spacing.sm}px ${spacing.md}px`,
		// 헤더는 괘선 위에 덮어 흰 띠로 둔다 — 줄과 겹치면 지저분하다.
		backgroundColor: colors.surface,
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
	rowTail: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xxs,
	} satisfies React.CSSProperties,
	/** 이번 달에 빠진 걸 확인한 항목 */
	doneMark: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: 18,
		height: 18,
		borderRadius: radius.full,
		backgroundColor: colors.positive,
	} satisfies React.CSSProperties,
	empty: {
		marginTop: spacing.xxl,
		textAlign: "center" as const,
	} satisfies React.CSSProperties,
	emptyDescription: { marginTop: spacing.xs } satisfies React.CSSProperties,
	fabRow: {
		position: "sticky" as const,
		display: "flex",
		justifyContent: "flex-end",
		marginTop: spacing.md,
		pointerEvents: "none" as const,
	} satisfies React.CSSProperties,
	/**
	 * "적는다"는 동작을 연필로 보여주는 추가 버튼.
	 * 나무색은 칠판 프레임에만 쓴다 — 액션 버튼까지 나무로 하면 화면에서 겉돈다.
	 */
	fab: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		height: 54,
		padding: `0 ${spacing.lg}px 0 ${spacing.md}px`,
		border: "none",
		borderRadius: radius.full,
		backgroundColor: colors.accent,
		boxShadow: shadow.floating,
		cursor: "pointer",
		pointerEvents: "auto" as const,
	} satisfies React.CSSProperties,
	fabPencil: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: 32,
		height: 32,
		borderRadius: radius.full,
		backgroundColor: "rgba(255,255,255,0.9)",
	} satisfies React.CSSProperties,
};

export default function ManagePage() {
	const navigate = useNavigate();
	const charges = useCharges();
	const insets = useSafeAreaInsets();
	const ym = useMemo(() => currentYearMonth(), []);
	const confirmed = useConfirmedIds(ym);
	const groups = groupByCategory(charges);

	return (
		<div style={s.page}>
			<div style={s.header}>
				<div style={s.titleWrap}>
					<Paragraph
						typography="t4"
						fontWeight="bold"
						color={colors.textPrimary}
					>
						<Paragraph.Text>관리</Paragraph.Text>
					</Paragraph>
					<div style={s.titleUnderline} />
				</div>
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

						<div style={s.sectionRows}>
							{group.charges.map((charge) => (
								<ChargeRow
									key={charge.id}
									charge={charge}
									yearMonth={ym}
									paper
									dimmed={!isActive(charge, ym)}
									onClick={() => navigate(`/charge/${charge.id}`)}
									accessory={
										<div style={s.rowTail}>
											{confirmed.has(charge.id) ? (
												<span style={s.doneMark}>
													<IconCheck size={12} color={colors.textOnDark} />
												</span>
											) : null}
											<IconChevronRight size={16} color={colors.textTertiary} />
										</div>
									}
								/>
							))}
						</div>
					</div>
				))
			)}

			<div
				style={{ ...s.fabRow, bottom: navSpace(insets.bottom) + spacing.xs }}
			>
				<button
					type="button"
					style={s.fab}
					onClick={() => navigate("/charge/new")}
				>
					<span style={s.fabPencil}>
						<IconPencil size={19} color={colors.accent} />
					</span>
					<Paragraph
						typography="t6"
						fontWeight="bold"
						color={colors.textOnDark}
					>
						<Paragraph.Text>항목 적기</Paragraph.Text>
					</Paragraph>
				</button>
			</div>
		</div>
	);
}

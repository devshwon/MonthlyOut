import { Paragraph } from "@toss/tds-mobile";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { navSpace } from "@/components/BottomNav";
import { ChargeRow } from "@/components/ChargeRow";
import { HandDrawnCheck } from "@/components/HandDrawnCheck";
import { CategoryIcon, IconChevronRight, IconPencil } from "@/components/icons";
import { MoneyBuddy } from "@/components/MoneyBuddy";
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
import {
	CATEGORY_LABEL,
	currentYearMonth,
	formatKrw,
	groupByCategory,
	isActive,
	isEnded,
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
	/** 저축처럼 총액에 넣지 않는 묶음 표시 */
	exceptBadge: {
		padding: `1px ${spacing.xs}px`,
		borderRadius: radius.full,
		backgroundColor: colors.surfaceSunken,
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
	footer: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		padding: `${spacing.md}px ${spacing.xxs}px 0`,
	} satisfies React.CSSProperties,
	footerBubble: {
		flex: 1,
		padding: `${spacing.xs}px ${spacing.sm}px`,
		borderRadius: radius.lg,
		backgroundColor: colors.surface,
		boxShadow: shadow.card,
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
	/** 연필만으로도 "적는다"는 게 읽힌다 — 목록을 덜 가리게 원형으로 둔다 */
	fab: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: 56,
		height: 56,
		border: "none",
		borderRadius: radius.full,
		backgroundColor: colors.accent,
		boxShadow: shadow.floating,
		cursor: "pointer",
		pointerEvents: "auto" as const,
	} satisfies React.CSSProperties,
};

export default function ManagePage() {
	const navigate = useNavigate();
	const charges = useCharges();
	const ym = useMemo(() => currentYearMonth(), []);
	const confirmed = useConfirmedIds(ym);
	const groups = groupByCategory(charges);

	/**
	 * 목록 끝에서 캐릭터가 건네는 한 줄. **사실만 말한다** — 무엇을 줄이라는 조언은
	 * 하지 않는다(기획서 2장: 추천·상담은 이 앱이 하지 않는 일).
	 */
	const summaryLine = (() => {
		const biggest = groups.reduce(
			(max, group) => (group.amount > max.amount ? group : max),
			groups[0],
		);
		const subscriptions = charges.filter(
			(charge) => charge.category === "subscription",
		);

		if (subscriptions.length >= 3) {
			const amount = subscriptions.reduce(
				(sum, charge) => sum + charge.amount,
				0,
			);
			return `구독만 ${subscriptions.length}개, 매달 ${formatKrw(amount)}이에요.`;
		}
		if (biggest) {
			return `${CATEGORY_LABEL[biggest.category]}에 가장 많이 나가요 · ${formatKrw(biggest.amount)}`;
		}
		return `${charges.length}개를 적어뒀어요.`;
	})();

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
							{group.category === "saving" ? (
								<span style={s.exceptBadge}>
									<Paragraph typography="t7" color={colors.textTertiary}>
										<Paragraph.Text>총액 제외</Paragraph.Text>
									</Paragraph>
								</span>
							) : null}
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
									badge={isEnded(charge) ? "해지" : undefined}
									onClick={() => navigate(`/charge/${charge.id}`)}
									accessory={
										<div style={s.rowTail}>
											{confirmed.has(charge.id) ? (
												<HandDrawnCheck size={18} />
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

			{groups.length > 0 ? (
				<div style={s.footer}>
					<MoneyBuddy size={48} />
					<div style={s.footerBubble}>
						<Paragraph typography="t7" color={colors.textSecondary}>
							<Paragraph.Text>{summaryLine}</Paragraph.Text>
						</Paragraph>
					</div>
				</div>
			) : null}

			<div style={{ ...s.fabRow, bottom: navSpace() + spacing.xs }}>
				<button
					type="button"
					style={s.fab}
					aria-label="항목 적기"
					onClick={() => navigate("/charge/new")}
				>
					<IconPencil size={24} color={colors.textOnDark} />
				</button>
			</div>
		</div>
	);
}

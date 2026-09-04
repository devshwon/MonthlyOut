import { Paragraph } from "@toss/tds-mobile";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChargeRow } from "@/components/ChargeRow";
import {
	CategoryIcon,
	IconBank,
	IconCard,
	IconCheck,
	IconChevronLeft,
	IconChevronRight,
} from "@/components/icons";
import {
	categoryColors,
	categorySoftColors,
	colors,
	radius,
	shadow,
	spacing,
} from "@/design/tokens";
import { useCharges } from "@/hooks/useCharges";
import { useConfirmedIds } from "@/hooks/useConfirmations";
import {
	activeCharges,
	addMonths,
	CATEGORY_LABEL,
	currentYearMonth,
	formatBillingDay,
	formatKrw,
	formatYearMonth,
	groupByCategory,
	isValidYearMonth,
	monthlyTotal,
	totalByMethodKind,
	transferCharges,
} from "@/services/charges";
import { toggleConfirmed } from "@/services/confirmStore";

const s = {
	page: {
		padding: `${spacing.xs}px ${spacing.md}px ${spacing.xxl}px`,
	} satisfies React.CSSProperties,
	topBar: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		height: 48,
	} satisfies React.CSSProperties,
	iconButton: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: 36,
		height: 36,
		border: "none",
		borderRadius: radius.full,
		background: "none",
		cursor: "pointer",
	} satisfies React.CSSProperties,
	monthSwitch: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xxs,
	} satisfies React.CSSProperties,
	summary: {
		padding: spacing.lg,
		marginBottom: spacing.sm,
		borderRadius: radius.xxl,
		backgroundColor: colors.surface,
		boxShadow: shadow.card,
	} satisfies React.CSSProperties,
	summaryTotal: { marginTop: spacing.xxs } satisfies React.CSSProperties,
	methodRow: {
		display: "flex",
		gap: spacing.sm,
		marginTop: spacing.md,
		paddingTop: spacing.md,
		borderTop: `1px solid ${colors.border}`,
	} satisfies React.CSSProperties,
	methodItem: {
		display: "flex",
		flex: 1,
		alignItems: "center",
		gap: spacing.xs,
	} satisfies React.CSSProperties,
	card: {
		marginBottom: spacing.sm,
		borderRadius: radius.xl,
		backgroundColor: colors.surface,
		boxShadow: shadow.card,
		overflow: "hidden",
	} satisfies React.CSSProperties,
	cardHead: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		padding: `${spacing.sm}px ${spacing.md}px`,
		borderBottom: `1px solid ${colors.border}`,
	} satisfies React.CSSProperties,
	headLabel: { flex: 1 } satisfies React.CSSProperties,
	hint: {
		padding: `${spacing.xs}px ${spacing.md}px ${spacing.sm}px`,
	} satisfies React.CSSProperties,
	transferRow: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		padding: `${spacing.sm}px ${spacing.md}px`,
	} satisfies React.CSSProperties,
	day: {
		flexShrink: 0,
		width: 44,
	} satisfies React.CSSProperties,
	transferBody: { flex: 1, minWidth: 0 } satisfies React.CSSProperties,
	checkButton: {
		display: "flex",
		flexShrink: 0,
		alignItems: "center",
		justifyContent: "center",
		width: 30,
		height: 30,
		borderRadius: radius.full,
		cursor: "pointer",
	} satisfies React.CSSProperties,
	sectionDot: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: 26,
		height: 26,
		borderRadius: radius.full,
	} satisfies React.CSSProperties,
	empty: {
		padding: `${spacing.xxl}px ${spacing.md}px`,
		textAlign: "center" as const,
	} satisfies React.CSSProperties,
};

export default function MonthDetailPage() {
	const navigate = useNavigate();
	const params = useParams<{ ym: string }>();
	const fallback = useMemo(() => currentYearMonth(), []);
	const ym = params.ym && isValidYearMonth(params.ym) ? params.ym : fallback;

	const charges = useCharges();
	const confirmed = useConfirmedIds(ym);

	const active = activeCharges(charges, ym);
	const total = monthlyTotal(charges, ym);
	const methods = totalByMethodKind(charges, ym);
	const transfers = transferCharges(charges, ym);
	const confirmedCount = transfers.filter((charge) =>
		confirmed.has(charge.id),
	).length;
	const groups = groupByCategory(active);

	return (
		<div style={s.page}>
			<div style={s.topBar}>
				<button
					type="button"
					style={s.iconButton}
					aria-label="뒤로"
					onClick={() => navigate(-1)}
				>
					<IconChevronLeft size={22} color={colors.textSecondary} />
				</button>

				<div style={s.monthSwitch}>
					<button
						type="button"
						style={s.iconButton}
						aria-label="이전 달"
						onClick={() =>
							navigate(`/month/${addMonths(ym, -1)}`, { replace: true })
						}
					>
						<IconChevronLeft size={18} color={colors.textTertiary} />
					</button>
					<Paragraph
						typography="t6"
						fontWeight="bold"
						color={colors.textPrimary}
					>
						<Paragraph.Text>{formatYearMonth(ym)}</Paragraph.Text>
					</Paragraph>
					<button
						type="button"
						style={s.iconButton}
						aria-label="다음 달"
						onClick={() =>
							navigate(`/month/${addMonths(ym, 1)}`, { replace: true })
						}
					>
						<IconChevronRight size={18} color={colors.textTertiary} />
					</button>
				</div>

				<div style={{ width: 36 }} />
			</div>

			<div style={s.summary}>
				<Paragraph typography="t7" color={colors.textTertiary}>
					<Paragraph.Text>{`${formatYearMonth(ym)} 고정지출`}</Paragraph.Text>
				</Paragraph>
				<Paragraph
					typography="t3"
					fontWeight="bold"
					color={colors.textPrimary}
					style={s.summaryTotal}
				>
					<Paragraph.Text>{formatKrw(total)}</Paragraph.Text>
				</Paragraph>

				<div style={s.methodRow}>
					<div style={s.methodItem}>
						<IconCard size={18} color={colors.primary} />
						<div>
							<Paragraph typography="t7" color={colors.textTertiary}>
								<Paragraph.Text>카드</Paragraph.Text>
							</Paragraph>
							<Paragraph
								typography="t6"
								fontWeight="bold"
								color={colors.textPrimary}
							>
								<Paragraph.Text>{formatKrw(methods.card)}</Paragraph.Text>
							</Paragraph>
						</div>
					</div>
					<div style={s.methodItem}>
						<IconBank size={18} color={colors.positive} />
						<div>
							<Paragraph typography="t7" color={colors.textTertiary}>
								<Paragraph.Text>이체</Paragraph.Text>
							</Paragraph>
							<Paragraph
								typography="t6"
								fontWeight="bold"
								color={colors.textPrimary}
							>
								<Paragraph.Text>{formatKrw(methods.account)}</Paragraph.Text>
							</Paragraph>
						</div>
					</div>
				</div>
			</div>

			{transfers.length > 0 ? (
				<div style={s.card}>
					<div style={s.cardHead}>
						<span
							style={{ ...s.sectionDot, backgroundColor: colors.positiveSoft }}
						>
							<IconBank size={16} color={colors.positive} />
						</span>
						<Paragraph
							typography="t6"
							fontWeight="bold"
							color={colors.textPrimary}
							style={s.headLabel}
						>
							<Paragraph.Text>이체 확인</Paragraph.Text>
						</Paragraph>
						<Paragraph
							typography="t7"
							fontWeight="bold"
							color={
								confirmedCount === transfers.length
									? colors.positive
									: colors.textTertiary
							}
						>
							<Paragraph.Text>{`${confirmedCount}/${transfers.length}`}</Paragraph.Text>
						</Paragraph>
					</div>

					<div style={s.hint}>
						<Paragraph typography="t7" color={colors.textTertiary}>
							<Paragraph.Text>
								빠져나간 걸 확인했으면 체크해 두세요. 잔고가 모자라 못 빠진 달을
								찾기 쉬워져요.
							</Paragraph.Text>
						</Paragraph>
					</div>

					{transfers.map((charge) => {
						const done = confirmed.has(charge.id);

						return (
							<div key={charge.id} style={s.transferRow}>
								<div style={s.day}>
									<Paragraph
										typography="t6"
										fontWeight="bold"
										color={done ? colors.textTertiary : colors.textSecondary}
									>
										<Paragraph.Text>
											{formatBillingDay(charge.billingDay)}
										</Paragraph.Text>
									</Paragraph>
								</div>

								<div style={s.transferBody}>
									<Paragraph
										typography="t6"
										fontWeight="bold"
										color={done ? colors.textTertiary : colors.textPrimary}
									>
										<Paragraph.Text>{charge.name}</Paragraph.Text>
									</Paragraph>
									<Paragraph typography="t7" color={colors.textTertiary}>
										<Paragraph.Text>
											{`${formatKrw(charge.amount)}${charge.method?.name ? ` · ${charge.method.name}` : ""}`}
										</Paragraph.Text>
									</Paragraph>
								</div>

								<button
									type="button"
									aria-label={done ? "이체 확인 취소" : "이체 확인"}
									aria-pressed={done}
									style={{
										...s.checkButton,
										border: done ? "none" : `1.5px solid ${colors.border}`,
										backgroundColor: done ? colors.positive : colors.surface,
									}}
									onClick={() => toggleConfirmed(ym, charge.id)}
								>
									{done ? (
										<IconCheck size={16} color={colors.textOnDark} />
									) : null}
								</button>
							</div>
						);
					})}
				</div>
			) : null}

			{groups.length === 0 ? (
				<div style={s.empty}>
					<Paragraph
						typography="t6"
						fontWeight="bold"
						color={colors.textPrimary}
					>
						<Paragraph.Text>이 달에 빠지는 항목이 없어요</Paragraph.Text>
					</Paragraph>
				</div>
			) : (
				groups.map((group) => (
					<div key={group.category} style={s.card}>
						<div style={s.cardHead}>
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
								style={s.headLabel}
							>
								<Paragraph.Text>
									{CATEGORY_LABEL[group.category]}
								</Paragraph.Text>
							</Paragraph>
							<Paragraph
								typography="t7"
								fontWeight="bold"
								color={colors.textSecondary}
							>
								<Paragraph.Text>{formatKrw(group.amount)}</Paragraph.Text>
							</Paragraph>
						</div>

						{group.charges.map((charge) => (
							<ChargeRow
								key={charge.id}
								charge={charge}
								yearMonth={ym}
								onClick={() => navigate(`/charge/${charge.id}`)}
							/>
						))}
					</div>
				))
			)}
		</div>
	);
}

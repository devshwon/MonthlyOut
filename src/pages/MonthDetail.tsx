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
	paperBackground,
	paperColors,
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
		padding: `${spacing.xs}px ${spacing.md}px ${spacing.lg}px`,
	} satisfies React.CSSProperties,
	topBar: {
		display: "flex",
		alignItems: "center",
		// 월 이동만 남기고 가운데 정렬한다 — 왼쪽 끝에 두면 토스 내비바의
		// 뒤로가기와 헷갈린다(검수 2-6: 뒤로가기 중복 노출 금지).
		justifyContent: "center",
		height: 44,
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
		padding: spacing.md,
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
	/** 카테고리마다 카드를 쪼개면 같은 모양이 일곱 번 반복돼 스크롤만 길어진다 */
	groupRows: {
		backgroundColor: paperColors.surface,
		backgroundImage: paperBackground,
	} satisfies React.CSSProperties,
	listHint: {
		padding: `0 ${spacing.xxs}px ${spacing.xs}px`,
	} satisfies React.CSSProperties,
	todayRow: {
		display: "flex",
		justifyContent: "center",
		marginBottom: spacing.xs,
	} satisfies React.CSSProperties,
	todayButton: {
		padding: `${spacing.xxs}px ${spacing.sm}px`,
		border: "none",
		borderRadius: radius.full,
		backgroundColor: colors.accentSoft,
		cursor: "pointer",
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
		// 괘선 위에 흰 띠로 덮어 줄과 겹치지 않게 한다.
		backgroundColor: colors.surface,
		borderBottom: `1px solid ${colors.border}`,
	} satisfies React.CSSProperties,
	headLabel: { flex: 1 } satisfies React.CSSProperties,
	checkPlaceholder: {
		display: "block",
		width: 30,
		height: 30,
	} satisfies React.CSSProperties,
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

/** 이체가 실제로 빠졌는지 표시하는 체크. 목록 오른쪽에 붙는다. */
function ConfirmButton({
	done,
	onToggle,
}: {
	done: boolean;
	onToggle: () => void;
}) {
	return (
		<button
			type="button"
			aria-label={done ? "이체 확인 취소" : "이체 확인"}
			aria-pressed={done}
			style={{
				...s.checkButton,
				border: done ? "none" : `1.5px solid ${colors.border}`,
				backgroundColor: done ? colors.positive : colors.surface,
			}}
			onClick={onToggle}
		>
			{done ? <IconCheck size={16} color={colors.textOnDark} /> : null}
		</button>
	);
}

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
			</div>

			{ym !== fallback ? (
				<div style={s.todayRow}>
					<button
						type="button"
						style={s.todayButton}
						onClick={() => navigate(`/month/${fallback}`, { replace: true })}
					>
						<Paragraph typography="t7" fontWeight="bold" color={colors.accent}>
							<Paragraph.Text>이번 달로</Paragraph.Text>
						</Paragraph>
					</button>
				</div>
			) : null}

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
								<Paragraph.Text>
									{transfers.length > 0
										? `이체 · ${confirmedCount}/${transfers.length} 확인`
										: "이체"}
								</Paragraph.Text>
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
				<>
					{transfers.length > confirmedCount ? (
						<Paragraph
							typography="t7"
							color={colors.textTertiary}
							style={s.listHint}
						>
							<Paragraph.Text>
								이체는 빠져나간 걸 확인하면 오른쪽 동그라미를 눌러 체크해
								두세요.
							</Paragraph.Text>
						</Paragraph>
					) : null}

					<div style={s.card}>
						{groups.map((group, index) => (
							<div key={group.category}>
								<div
									style={{
										...s.cardHead,
										...(index > 0
											? { borderTop: `1px solid ${colors.border}` }
											: null),
									}}
								>
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

								<div style={s.groupRows}>
									{group.charges.map((charge) => (
										<ChargeRow
											key={charge.id}
											charge={charge}
											yearMonth={ym}
											paper
											onClick={() => navigate(`/charge/${charge.id}`)}
											accessory={
												charge.method?.kind === "account" ? (
													<ConfirmButton
														done={confirmed.has(charge.id)}
														onToggle={() => toggleConfirmed(ym, charge.id)}
													/>
												) : (
													// 체크가 없는 행에도 같은 자리를 비워 금액을 나란히 맞춘다.
													<span style={s.checkPlaceholder} />
												)
											}
										/>
									))}
								</div>
							</div>
						))}
					</div>
				</>
			)}
		</div>
	);
}

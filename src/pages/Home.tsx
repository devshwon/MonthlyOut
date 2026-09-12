import { Paragraph } from "@toss/tds-mobile";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AllowanceSheet } from "@/components/AllowanceSheet";
import { ConfirmButton } from "@/components/ConfirmButton";
import {
	CategoryIcon,
	IconBank,
	IconCard,
	IconChevronLeft,
	IconChevronRight,
	IconSettings,
} from "@/components/icons";
import { MoneyBuddy } from "@/components/MoneyBuddy";
import { PrimaryButton } from "@/components/PrimaryButton";
import {
	boardColors,
	boardSurface,
	categoryColors,
	categorySoftColors,
	colors,
	radius,
	shadow,
	spacing,
} from "@/design/tokens";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useCharges } from "@/hooks/useCharges";
import { useConfirmedIds } from "@/hooks/useConfirmations";
import { useCountUp } from "@/hooks/useCountUp";
import {
	activeCharges,
	addMonths,
	CATEGORY_LABEL,
	categoryBreakdown,
	chargesDueOn,
	currentYearMonth,
	formatAmount,
	formatKrw,
	formatYearMonth,
	isSaving,
	monthlyTotal,
	nextRelease,
	savingTotal,
	totalByMethodKind,
	transferCharges,
} from "@/services/charges";
import { toggleConfirmed } from "@/services/confirmStore";
import { incomeForMonth } from "@/services/settingsStore";
import { buildTips, pickNextTip } from "@/services/tips";
import type { ChargeCategory } from "@/types";

/** 빈 화면에서 "이렇게 채워져요"를 보여주는 예시. 저장되는 값이 아니다. */
const EMPTY_PREVIEW = [
	{ category: "subscription", name: "넷플릭스", amount: 17000 },
	{ category: "insurance", name: "실손보험", amount: 45000 },
	{ category: "installment", name: "자동차 할부", amount: 320000 },
] as const;

const s = {
	page: {
		padding: `${spacing.md}px ${spacing.lg}px ${spacing.lg}px`,
	} satisfies React.CSSProperties,
	header: {
		position: "relative" as const,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		height: 44,
	} satisfies React.CSSProperties,
	monthStepper: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xxs,
	} satisfies React.CSSProperties,
	stepButton: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: 44,
		height: 44,
		border: "none",
		borderRadius: radius.full,
		background: "none",
		cursor: "pointer",
	} satisfies React.CSSProperties,
	settingsButton: {
		position: "absolute" as const,
		right: 0,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: 44,
		height: 44,
		border: "none",
		borderRadius: radius.full,
		background: "none",
		cursor: "pointer",
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
		backgroundColor: colors.primarySoft,
		cursor: "pointer",
	} satisfies React.CSSProperties,
	boardWrap: {
		position: "relative" as const,
		paddingBottom: 0,
		marginTop: spacing.sm,
	} satisfies React.CSSProperties,
	board: {
		padding: `${spacing.xl}px`,
		border: `1px solid ${colors.surface}`,
		borderRadius: radius.xl,
		background: boardSurface,
		boxShadow: shadow.card,
	} satisfies React.CSSProperties,
	buddyOnTray: {
		position: "absolute" as const,
		right: spacing.lg,
		top: spacing.lg,
		padding: 0,
		border: "none",
		background: "none",
		cursor: "pointer",
	} satisfies React.CSSProperties,
	chalkCaption: {
		textAlign: "left" as const,
	} satisfies React.CSSProperties,
	heroAmountRow: {
		display: "flex",
		gap: spacing.xxs,
		alignItems: "baseline",
		marginTop: spacing.sm,
	} satisfies React.CSSProperties,
	heroNumber: {
		fontVariantNumeric: "tabular-nums",
		letterSpacing: "-0.04em",
		fontSize: "clamp(26px, 8.5vw, 38px)",
		overflowWrap: "anywhere" as const,
	} satisfies React.CSSProperties,
	heroUnit: { flexShrink: 0 } satisfies React.CSSProperties,
	heroFooter: {
		display: "flex",
		justifyContent: "flex-start",
		marginTop: spacing.md,
	} satisfies React.CSSProperties,
	heroPill: {
		padding: `${spacing.xxs}px ${spacing.sm}px`,
		borderRadius: radius.full,
		backgroundColor: colors.primarySoft,
	} satisfies React.CSSProperties,
	methodRow: {
		display: "flex",
		gap: spacing.xs,
		marginTop: spacing.sm,
	} satisfies React.CSSProperties,
	methodCard: {
		flex: 1,
		padding: spacing.lg,
		borderRadius: radius.xl,
		backgroundColor: colors.surface,
		boxShadow: shadow.card,
	} satisfies React.CSSProperties,
	methodHead: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xxs,
	} satisfies React.CSSProperties,
	methodAmount: { marginTop: spacing.xs } satisfies React.CSSProperties,
	card: {
		padding: spacing.lg,
		marginTop: spacing.md,
		borderRadius: radius.xl,
		backgroundColor: colors.surface,
		boxShadow: shadow.card,
	} satisfies React.CSSProperties,
	cardHead: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.xs,
		marginBottom: spacing.md,
	} satisfies React.CSSProperties,
	sliceRow: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		width: "100%",
		padding: `${spacing.xs}px 0`,
		border: "none",
		background: "none",
		cursor: "pointer",
	} satisfies React.CSSProperties,
	sliceDot: {
		flexShrink: 0,
		width: 8,
		height: 8,
		borderRadius: radius.full,
	} satisfies React.CSSProperties,
	sliceLabel: {
		flex: 1,
		textAlign: "left" as const,
	} satisfies React.CSSProperties,
	sliceItems: {
		padding: `${spacing.xxs}px 0 ${spacing.xs}px ${spacing.md}px`,
	} satisfies React.CSSProperties,
	sliceItem: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		width: "100%",
		padding: `${spacing.xxs}px 0`,
		border: "none",
		background: "none",
		cursor: "pointer",
	} satisfies React.CSSProperties,
	sliceItemName: {
		flex: 1,
		textAlign: "left" as const,
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap" as const,
	} satisfies React.CSSProperties,
	leftoverRow: {
		display: "flex",
		justifyContent: "center",
		width: "100%",
		padding: `${spacing.xs}px 0 0`,
		border: "none",
		background: "none",
		cursor: "pointer",
	} satisfies React.CSSProperties,
	/** 말풍선 왼쪽에 나란히 두는 후원 버튼 */
	allowanceButton: {
		flexShrink: 0,
		padding: `${spacing.xs}px ${spacing.sm}px`,
		border: `1px solid ${colors.accentSoft}`,
		borderRadius: radius.full,
		backgroundColor: colors.surface,
		boxShadow: shadow.card,
		cursor: "pointer",
	} satisfies React.CSSProperties,
	tipButton: {
		flex: 1,
		minWidth: 0,
		display: "flex",
		justifyContent: "flex-end",
		padding: 0,
		border: "none",
		background: "none",
		cursor: "pointer",
	} satisfies React.CSSProperties,
	savingNote: {
		padding: `${spacing.xs}px ${spacing.xxs}px 0`,
		textAlign: "center" as const,
	} satisfies React.CSSProperties,
	dueExpand: {
		display: "flex",
		justifyContent: "center",
		width: "100%",
		padding: `${spacing.xs}px 0 ${spacing.xxs}px`,
		border: "none",
		background: "none",
		cursor: "pointer",
	} satisfies React.CSSProperties,
	dueRow: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		padding: `${spacing.xs}px 0`,
	} satisfies React.CSSProperties,
	dueIcon: {
		display: "flex",
		flexShrink: 0,
		alignItems: "center",
		justifyContent: "center",
		width: 28,
		height: 28,
		borderRadius: radius.sm,
	} satisfies React.CSSProperties,
	dueBody: { flex: 1, minWidth: 0 } satisfies React.CSSProperties,
	buddyRow: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		width: "100%",
		padding: `${spacing.xs}px 0 0`,
	} satisfies React.CSSProperties,
	bubble: {
		position: "relative" as const,
		width: "100%",
		padding: `${spacing.sm}px ${spacing.md}px`,
		borderRadius: radius.lg,
		backgroundColor: colors.surface,
		boxShadow: shadow.card,
		textAlign: "left" as const,
	} satisfies React.CSSProperties,
	empty: {
		marginTop: spacing.sm,
		padding: `${spacing.lg}px ${spacing.lg}px ${spacing.xl}px`,
		borderRadius: radius.xxl,
		backgroundColor: colors.surface,
		boxShadow: shadow.card,
		textAlign: "center" as const,
	} satisfies React.CSSProperties,
	emptyBubble: {
		display: "inline-block",
		padding: `${spacing.md}px ${spacing.lg}px`,
		marginBottom: spacing.md,
		borderRadius: radius.full,
		backgroundColor: colors.primarySoft,
	} satisfies React.CSSProperties,
	emptyTitle: { marginTop: spacing.xxs } satisfies React.CSSProperties,
	emptyDescription: { marginTop: spacing.xs } satisfies React.CSSProperties,
	/** "이렇게 채워져요" 미리보기 — 점선 안에 흐린 예시 줄 */
	previewBox: {
		marginTop: spacing.lg,
		padding: `${spacing.sm}px ${spacing.md}px`,
		border: `1px dashed ${colors.border}`,
		borderRadius: radius.lg,
		backgroundColor: colors.background,
	} satisfies React.CSSProperties,
	previewRow: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		padding: `${spacing.xs}px 0`,
		opacity: 0.65,
	} satisfies React.CSSProperties,
	previewIcon: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: 28,
		height: 28,
		borderRadius: radius.sm,
	} satisfies React.CSSProperties,
	previewName: { flex: 1 } satisfies React.CSSProperties,
	emptyCta: { marginTop: spacing.md } satisfies React.CSSProperties,
};

export default function HomePage() {
	const navigate = useNavigate();
	const charges = useCharges();
	const thisMonth = useMemo(() => currentYearMonth(), []);
	const [ym, setYm] = useState(thisMonth);
	const confirmed = useConfirmedIds(ym);
	const settings = useAppSettings();

	const visible = activeCharges(charges, ym).filter(
		(charge) => !isSaving(charge),
	);
	const total = monthlyTotal(charges, ym);
	const methods = totalByMethodKind(charges, ym);
	const slices = categoryBreakdown(charges, ym);
	const release = nextRelease(charges, ym);
	const saving = savingTotal(charges, ym);
	// 과거 달을 보고 있으면 그때 적용되던 수입으로 계산한다.
	const income = incomeForMonth(settings.incomes, ym);
	const transfers = transferCharges(charges, ym);
	// 오늘 빠지는 것들 — 이번 달을 보고 있을 때만 의미가 있다.
	const today = new Date().getDate();
	const dueToday = ym === thisMonth ? chargesDueOn(charges, ym, today) : [];
	const dueTodayTotal = dueToday.reduce(
		(sum, charge) => sum + charge.amount,
		0,
	);
	const dueTodayDone = dueToday.filter((charge) =>
		confirmed.has(charge.id),
	).length;
	// 확인한 건 아래로 내린다 — 남은 일이 위에 모이게.
	const dueTodaySorted = [...dueToday].sort(
		(a, b) => Number(confirmed.has(a.id)) - Number(confirmed.has(b.id)),
	);
	const dueTodayAllDone =
		dueToday.length > 0 && dueTodayDone === dueToday.length;
	const confirmedCount = transfers.filter((charge) =>
		confirmed.has(charge.id),
	).length;

	// 앱을 켠 뒤 첫 홈 진입에서만 숫자가 굴러 올라간다(훅이 스스로 잠근다).
	const shownTotal = useCountUp(total, { enabled: ym === thisMonth });

	const tips = buildTips({
		chargeCount: charges.length,
		activeCount: visible.length,
		unconfirmedTransfers: transfers.length - confirmedCount,
		subscriptionCount: charges.filter(
			(charge) => charge.category === "subscription",
		).length,
		total,
		release,
	});
	const [openCategory, setOpenCategory] = useState<ChargeCategory | null>(null);
	const [showDoneToday, setShowDoneToday] = useState(false);
	const [allowanceOpen, setAllowanceOpen] = useState(false);
	const [tip, setTip] = useState(() => tips[0]);
	const currentTip = tips.includes(tip) ? tip : tips[0];
	// 캐릭터와 말풍선 어느 쪽을 눌러도 다음 이야기로 넘어간다.
	const showNextTip = () => setTip(pickNextTip(tips, currentTip));

	return (
		<div style={s.page}>
			<div style={s.header}>
				<div style={s.monthStepper}>
					<button
						type="button"
						style={s.stepButton}
						aria-label="전달"
						onClick={() => setYm((value) => addMonths(value, -1))}
					>
						<IconChevronLeft size={18} color={colors.textTertiary} />
					</button>
					<Paragraph
						typography="t5"
						fontWeight="bold"
						color={colors.textPrimary}
					>
						<Paragraph.Text>{formatYearMonth(ym)}</Paragraph.Text>
					</Paragraph>
					<button
						type="button"
						style={s.stepButton}
						aria-label="다음 달"
						onClick={() => setYm((value) => addMonths(value, 1))}
					>
						<IconChevronRight size={18} color={colors.textTertiary} />
					</button>
				</div>

				<button
					type="button"
					style={s.settingsButton}
					aria-label="설정"
					onClick={() => navigate("/settings")}
				>
					<IconSettings size={22} color={colors.textTertiary} />
				</button>
			</div>

			{ym !== thisMonth ? (
				<div style={s.todayRow}>
					<button
						type="button"
						style={s.todayButton}
						onClick={() => setYm(thisMonth)}
					>
						<Paragraph typography="t7" fontWeight="bold" color={colors.primary}>
							<Paragraph.Text>이번 달로</Paragraph.Text>
						</Paragraph>
					</button>
				</div>
			) : null}

			<div style={s.boardWrap}>
				<div style={s.board}>
					<Paragraph
						typography="t7"
						color={boardColors.chalk}
						style={s.chalkCaption}
					>
						<Paragraph.Text>이번 달 고정지출</Paragraph.Text>
					</Paragraph>

					<div style={s.heroAmountRow}>
						<Paragraph
							typography="t2"
							fontWeight="bold"
							color={boardColors.chalk}
							style={s.heroNumber}
						>
							<Paragraph.Text>{formatAmount(shownTotal)}</Paragraph.Text>
						</Paragraph>
						<Paragraph
							typography="t5"
							fontWeight="bold"
							color={boardColors.chalkDim}
							style={s.heroUnit}
						>
							<Paragraph.Text>원</Paragraph.Text>
						</Paragraph>
					</div>

					{release ? (
						<div style={s.heroFooter}>
							<div style={s.heroPill}>
								<Paragraph
									typography="t7"
									fontWeight="bold"
									color={boardColors.chalk}
								>
									<Paragraph.Text>
										{`${release.monthsLater}개월 뒤 ${formatAmount(release.amount)}원 풀려요`}
									</Paragraph.Text>
								</Paragraph>
							</div>
						</div>
					) : (
						<div style={s.heroFooter}>
							<div style={s.heroPill}>
								<Paragraph typography="t7" color={boardColors.chalkDim}>
									<Paragraph.Text>
										{visible.length > 0
											? `고정지출 ${visible.length}개`
											: "첫 지출을 등록해 보세요"}
									</Paragraph.Text>
								</Paragraph>
							</div>
						</div>
					)}
				</div>

				<button
					type="button"
					style={s.buddyOnTray}
					aria-label="다른 이야기 듣기"
					onClick={showNextTip}
				>
					<MoneyBuddy size={44} />
				</button>
			</div>

			<AllowanceSheet
				open={allowanceOpen}
				onClose={() => setAllowanceOpen(false)}
			/>

			<div style={s.buddyRow}>
				{/* 칠판 위 캐릭터에게 주는 용돈 — 광고 한 편이 후원이 된다 */}
				<button
					type="button"
					style={s.allowanceButton}
					onClick={() => setAllowanceOpen(true)}
				>
					<Paragraph typography="t7" fontWeight="bold" color={colors.accent}>
						<Paragraph.Text>용돈 주기</Paragraph.Text>
					</Paragraph>
				</button>

				<button
					type="button"
					style={s.tipButton}
					aria-label="다른 이야기 듣기"
					onClick={showNextTip}
				>
					<div style={s.bubble}>
						<Paragraph typography="t7" color={colors.textSecondary}>
							<Paragraph.Text>{currentTip}</Paragraph.Text>
						</Paragraph>
					</div>
				</button>
			</div>

			{income && income > total ? (
				<button
					type="button"
					style={s.leftoverRow}
					onClick={() => navigate(`/month/${ym}`)}
				>
					<Paragraph typography="t7" color={colors.textSecondary}>
						<Paragraph.Text>
							{`이번 달은 ${formatKrw(income - total)} 안에서 쓰면 돼요`}
						</Paragraph.Text>
					</Paragraph>
				</button>
			) : income ? (
				<div style={s.leftoverRow}>
					<Paragraph typography="t7" color={colors.danger}>
						<Paragraph.Text>
							{`고정지출이 수입보다 ${formatKrw(total - income)} 많아요`}
						</Paragraph.Text>
					</Paragraph>
				</div>
			) : charges.length > 0 ? (
				<button
					type="button"
					style={s.leftoverRow}
					onClick={() => navigate("/settings")}
				>
					<Paragraph typography="t7" color={colors.textTertiary}>
						<Paragraph.Text>
							월급을 적어두면 쓸 수 있는 돈을 알려드려요
						</Paragraph.Text>
					</Paragraph>
				</button>
			) : null}

			{charges.length === 0 ? (
				<div style={s.empty}>
					<Paragraph
						typography="t5"
						fontWeight="bold"
						color={colors.textPrimary}
						style={s.emptyTitle}
					>
						<Paragraph.Text>매달 나가는 돈, 한눈에</Paragraph.Text>
					</Paragraph>
					<Paragraph
						typography="t7"
						color={colors.textTertiary}
						style={s.emptyDescription}
					>
						<Paragraph.Text>
							구독료부터 할부까지 한곳에서 관리해요
						</Paragraph.Text>
					</Paragraph>

					<div style={s.previewBox}>
						{EMPTY_PREVIEW.map((item) => (
							<div key={item.name} style={s.previewRow}>
								<span
									style={{
										...s.previewIcon,
										backgroundColor: categorySoftColors[item.category],
									}}
								>
									<CategoryIcon
										category={item.category}
										size={16}
										color={categoryColors[item.category]}
									/>
								</span>
								<Paragraph
									typography="t7"
									fontWeight="bold"
									color={colors.textSecondary}
									style={s.previewName}
								>
									<Paragraph.Text>{item.name}</Paragraph.Text>
								</Paragraph>
								<Paragraph typography="t7" color={colors.textTertiary}>
									<Paragraph.Text>{formatKrw(item.amount)}</Paragraph.Text>
								</Paragraph>
							</div>
						))}
					</div>

					<div style={s.emptyCta}>
						<PrimaryButton onClick={() => navigate("/charge/new")}>
							첫 고정지출 등록하기
						</PrimaryButton>
					</div>
				</div>
			) : (
				<>
					<div style={s.methodRow}>
						<div style={s.methodCard}>
							<div style={s.methodHead}>
								<IconCard size={18} color={colors.primary} />
								<Paragraph typography="t7" color={colors.textSecondary}>
									<Paragraph.Text>카드</Paragraph.Text>
								</Paragraph>
							</div>
							<Paragraph
								typography="t5"
								fontWeight="bold"
								color={colors.textPrimary}
								style={s.methodAmount}
							>
								<Paragraph.Text>{formatKrw(methods.card)}</Paragraph.Text>
							</Paragraph>
						</div>

						<div style={s.methodCard}>
							<div style={s.methodHead}>
								<IconBank size={18} color={colors.positive} />
								<Paragraph typography="t7" color={colors.textSecondary}>
									<Paragraph.Text>이체</Paragraph.Text>
								</Paragraph>
							</div>
							<Paragraph
								typography="t5"
								fontWeight="bold"
								color={colors.textPrimary}
								style={s.methodAmount}
							>
								<Paragraph.Text>{formatKrw(methods.account)}</Paragraph.Text>
							</Paragraph>
						</div>
					</div>

					{saving > 0 ? (
						<Paragraph
							typography="t7"
							color={colors.textTertiary}
							style={s.savingNote}
						>
							<Paragraph.Text>
								{`저축 ${formatKrw(saving)}은 총액에 넣지 않았어요`}
							</Paragraph.Text>
						</Paragraph>
					) : null}

					{dueToday.length > 0 ? (
						<div style={s.card}>
							<div style={s.cardHead}>
								<Paragraph
									typography="t6"
									fontWeight="bold"
									color={colors.textPrimary}
								>
									<Paragraph.Text>{`오늘 빠지는 돈 ${formatKrw(dueTodayTotal)}`}</Paragraph.Text>
								</Paragraph>
								<Paragraph
									typography="t7"
									fontWeight="bold"
									color={
										dueTodayDone === dueToday.length
											? colors.positive
											: colors.textTertiary
									}
								>
									<Paragraph.Text>{`${dueTodayDone}/${dueToday.length}`}</Paragraph.Text>
								</Paragraph>
							</div>

							{dueTodayAllDone && !showDoneToday ? (
								<button
									type="button"
									style={s.dueExpand}
									onClick={() => setShowDoneToday(true)}
								>
									<Paragraph typography="t7" color={colors.textTertiary}>
										<Paragraph.Text>
											{`오늘 건 다 확인했어요 · ${dueToday.length}건 보기`}
										</Paragraph.Text>
									</Paragraph>
								</button>
							) : null}

							{dueTodayAllDone && !showDoneToday
								? null
								: dueTodaySorted.map((charge) => (
										<div
											key={charge.id}
											style={{
												...s.dueRow,
												opacity: confirmed.has(charge.id) ? 0.5 : 1,
											}}
										>
											<span
												style={{
													...s.dueIcon,
													backgroundColor: categorySoftColors[charge.category],
												}}
											>
												<CategoryIcon
													category={charge.category}
													size={16}
													color={categoryColors[charge.category]}
												/>
											</span>
											<div style={s.dueBody}>
												<Paragraph
													typography="t6"
													fontWeight="bold"
													color={colors.textPrimary}
												>
													<Paragraph.Text>{charge.name}</Paragraph.Text>
												</Paragraph>
												<Paragraph typography="t7" color={colors.textTertiary}>
													<Paragraph.Text>
														{`${formatKrw(charge.amount)}${charge.method?.name ? ` · ${charge.method.name}` : ""}`}
													</Paragraph.Text>
												</Paragraph>
											</div>
											<ConfirmButton
												done={confirmed.has(charge.id)}
												onToggle={() => toggleConfirmed(ym, charge.id)}
											/>
										</div>
									))}
						</div>
					) : null}

					{slices.length > 0 ? (
						<div style={s.card}>
							<div style={s.cardHead}>
								<Paragraph
									typography="t6"
									fontWeight="bold"
									color={colors.textPrimary}
								>
									<Paragraph.Text>어디에 나가고 있나요</Paragraph.Text>
								</Paragraph>
							</div>

							{slices.map((slice) => {
								const open = openCategory === slice.category;
								const items = visible.filter(
									(charge) => charge.category === slice.category,
								);

								return (
									<div key={slice.category}>
										<button
											type="button"
											aria-expanded={open}
											style={s.sliceRow}
											onClick={() =>
												setOpenCategory(open ? null : slice.category)
											}
										>
											<span
												style={{
													...s.sliceDot,
													backgroundColor: categoryColors[slice.category],
												}}
											/>
											<Paragraph
												typography="t7"
												color={colors.textSecondary}
												style={s.sliceLabel}
											>
												<Paragraph.Text>
													{`${CATEGORY_LABEL[slice.category]} ${Math.round(slice.ratio * 100)}%`}
												</Paragraph.Text>
											</Paragraph>
											<Paragraph
												typography="t7"
												fontWeight="bold"
												color={colors.textPrimary}
											>
												<Paragraph.Text>
													{formatKrw(slice.amount)}
												</Paragraph.Text>
											</Paragraph>
											<span
												style={{
													display: "flex",
													transform: open ? "rotate(90deg)" : "none",
													transition: "transform 120ms ease",
												}}
											>
												<IconChevronRight
													size={14}
													color={colors.textTertiary}
												/>
											</span>
										</button>

										{open ? (
											<div style={s.sliceItems}>
												{items.map((charge) => (
													<button
														key={charge.id}
														type="button"
														style={s.sliceItem}
														onClick={() => navigate(`/charge/${charge.id}`)}
													>
														<Paragraph
															typography="t7"
															color={colors.textSecondary}
															style={s.sliceItemName}
														>
															<Paragraph.Text>{charge.name}</Paragraph.Text>
														</Paragraph>
														<Paragraph
															typography="t7"
															color={colors.textTertiary}
														>
															<Paragraph.Text>
																{formatKrw(charge.amount)}
															</Paragraph.Text>
														</Paragraph>
													</button>
												))}
											</div>
										) : null}
									</div>
								);
							})}
						</div>
					) : null}
				</>
			)}
		</div>
	);
}

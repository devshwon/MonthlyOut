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
	chargesDueOn,
	currentYearMonth,
	formatAmount,
	formatKrw,
	formatYearMonth,
	isSaving,
	monthlyReserve,
	monthlyTotal,
	nextRelease,
	savingTotal,
	totalByMethodKind,
	transferCharges,
} from "@/services/charges";
import { toggleConfirmed } from "@/services/confirmStore";
import { incomeForMonth } from "@/services/settingsStore";
import { buildTips, pickNextTip } from "@/services/tips";

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
		paddingBottom: 18,
		marginTop: spacing.sm,
	} satisfies React.CSSProperties,
	board: {
		padding: `${spacing.xl}px ${spacing.lg}px ${spacing.xl + 20}px`,
		border: `4px solid ${boardColors.wood}`,
		borderRadius: radius.xl,
		background: boardSurface,
		boxShadow: `inset 0 1px 12px rgba(0,0,0,0.12), ${shadow.card}`,
	} satisfies React.CSSProperties,
	tray: {
		position: "absolute" as const,
		left: 0,
		right: 0,
		bottom: 10,
		height: 9,
		borderRadius: "0 0 8px 8px",
		background: `linear-gradient(180deg, ${boardColors.wood}, ${boardColors.woodDeep})`,
		boxShadow: "0 3px 6px rgba(0,0,0,0.10)",
	} satisfies React.CSSProperties,
	trayChalk: {
		position: "absolute" as const,
		left: spacing.xl,
		bottom: 19,
		width: 24,
		height: 5,
		borderRadius: radius.full,
		backgroundColor: boardColors.chalk,
	} satisfies React.CSSProperties,
	buddyOnTray: {
		position: "absolute" as const,
		right: spacing.lg,
		bottom: 22,
		padding: 0,
		border: "none",
		background: "none",
		cursor: "pointer",
	} satisfies React.CSSProperties,
	chalkCaption: {
		letterSpacing: "0.08em",
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
		maxWidth: "calc(100% - 44px)",
		padding: `${spacing.xxs}px ${spacing.sm}px`,
		borderRadius: radius.full,
		backgroundColor: boardColors.chalkWash,
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
	incomeCard: {
		marginTop: spacing.md,
		padding: spacing.md,
		borderRadius: radius.lg,
		backgroundColor: colors.surface,
		boxShadow: shadow.card,
	} satisfies React.CSSProperties,
	incomeButton: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		width: "100%",
		padding: 0,
		minHeight: 48,
		border: "none",
		background: "none",
		textAlign: "left" as const,
		cursor: "pointer",
	} satisfies React.CSSProperties,
	incomeIcon: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0,
		width: 40,
		height: 40,
		borderRadius: radius.md,
		backgroundColor: colors.accentSoft,
	} satisfies React.CSSProperties,
	leftoverNote: { marginTop: spacing.xxs } satisfies React.CSSProperties,
	incomeSummary: {
		marginTop: spacing.sm,
		paddingTop: spacing.sm,
		borderTop: `1px solid ${colors.border}`,
	} satisfies React.CSSProperties,
	allowanceButton: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.xs,
		width: "100%",
		minHeight: 44,
		marginTop: spacing.sm,
		padding: `${spacing.xs}px ${spacing.sm}px`,
		border: `1px solid ${colors.accentSoft}`,
		borderRadius: radius.md,
		backgroundColor: colors.accentSoft,
		cursor: "pointer",
	} satisfies React.CSSProperties,
	tipButton: {
		display: "block",
		width: "100%",
		minHeight: 44,
		padding: 0,
		border: "none",
		background: "none",
		textAlign: "left" as const,
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
	bubble: {
		position: "relative" as const,
		width: "100%",
		padding: spacing.md,
		borderRadius: radius.xl,
		backgroundColor: colors.surface,
		boxShadow: shadow.card,
		textAlign: "left" as const,
	} satisfies React.CSSProperties,
	bubbleTail: {
		position: "absolute" as const,
		right: spacing.lg + 18,
		top: -8,
		width: 18,
		height: 18,
		borderRadius: 3,
		backgroundColor: colors.surface,
		transform: "rotate(45deg)",
		pointerEvents: "none" as const,
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
	// "쓸 수 있는 돈"은 총액이 아니라 **통장에 남겨둬야 하는 돈**으로 센다.
	// 카드 고정분은 카드값에 이미 들어 있어 여기서 빼지 않는다(monthlyReserve 주석).
	const reserve = monthlyReserve(charges, ym);
	const methods = totalByMethodKind(charges, ym);
	const release = nextRelease(charges, ym);
	const saving = savingTotal(charges, ym);
	// 과거 달을 보고 있으면 그때 적용되던 수입으로 계산한다.
	const income = incomeForMonth(settings.incomes, ym);
	const left = income == null ? 0 : income - reserve.reserve;
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
							<Paragraph.Text>
								<span
									style={{
										fontSize: "clamp(30px, 9vw, 38px)",
										lineHeight: 1.25,
									}}
								>
									{formatAmount(shownTotal)}
								</span>
							</Paragraph.Text>
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

				<div style={s.tray} aria-hidden="true" />
				<span style={s.trayChalk} aria-hidden="true" />
				<button
					type="button"
					style={s.buddyOnTray}
					aria-label="다른 이야기 듣기"
					onClick={showNextTip}
				>
					<MoneyBuddy size={52} holdingChalk />
				</button>
			</div>

			<AllowanceSheet
				open={allowanceOpen}
				onClose={() => setAllowanceOpen(false)}
			/>

			<div style={s.bubble}>
				<span style={s.bubbleTail} aria-hidden="true" />
				<button
					type="button"
					style={s.tipButton}
					aria-label="고정이의 다른 이야기 듣기"
					onClick={showNextTip}
				>
					<Paragraph typography="t7" fontWeight="bold" color={colors.accent}>
						<Paragraph.Text>고정이의 한마디</Paragraph.Text>
					</Paragraph>
					<Paragraph
						typography="t7"
						color={colors.textSecondary}
						style={{ marginTop: spacing.xxs }}
					>
						<Paragraph.Text>{currentTip}</Paragraph.Text>
					</Paragraph>
				</button>
				<button
					type="button"
					style={s.allowanceButton}
					aria-haspopup="dialog"
					onClick={() => setAllowanceOpen(true)}
				>
					<span aria-hidden="true" style={{ color: colors.accent }}>
						♡
					</span>
					<Paragraph typography="t7" fontWeight="bold" color={colors.accent}>
						<Paragraph.Text>고정이 용돈 주기</Paragraph.Text>
					</Paragraph>
					<IconChevronRight size={16} color={colors.accent} />
				</button>
			</div>

			<div style={s.incomeCard}>
				<button
					type="button"
					style={s.incomeButton}
					onClick={() => navigate("/settings")}
				>
					<span style={s.incomeIcon}>
						<IconBank size={22} color={colors.accent} />
					</span>
					<span style={{ flex: 1, minWidth: 0 }}>
						<Paragraph
							typography="t6"
							fontWeight="bold"
							color={colors.textPrimary}
						>
							<Paragraph.Text>
								{income ? "월급 수정하기" : "월급 입력하기"}
							</Paragraph.Text>
						</Paragraph>
						<Paragraph
							typography="t7"
							color={colors.textTertiary}
							style={{ marginTop: spacing.xxs }}
						>
							<Paragraph.Text>
								{income
									? `등록한 월 수입 ${formatKrw(income)}`
									: "고정지출을 빼고 남는 돈을 확인해요"}
							</Paragraph.Text>
						</Paragraph>
					</span>
					<IconChevronRight size={20} color={colors.accent} />
				</button>
				{income ? (
					<div style={s.incomeSummary}>
						<Paragraph
							typography="t7"
							fontWeight="bold"
							color={left < 0 ? colors.danger : colors.textPrimary}
						>
							<Paragraph.Text>
								{left >= 0
									? reserve.cardFixed > 0
										? `${formatKrw(left)} 안에서 카드값 내고 쓰면 돼요`
										: `${formatKrw(left)} 안에서 쓰면 돼요`
									: `통장에서 빠질 돈이 월 수입보다 ${formatKrw(-left)} 많아요`}
							</Paragraph.Text>
						</Paragraph>
						{/*
						 * 카드 고정분을 왜 안 뺐는지 한 줄로 밝힌다. 안 적으면
						 * "고정지출은 10만인데 왜 4만만 뺐지"가 된다.
						 */}
						{left >= 0 && reserve.reserve > 0 ? (
							<Paragraph
								typography="t7"
								color={colors.textTertiary}
								style={s.leftoverNote}
							>
								<Paragraph.Text>
									{reserve.cardFixed > 0
										? `통장에서 빠질 ${formatKrw(reserve.reserve)}은 빼뒀어요 · 카드 고정분 ${formatKrw(reserve.cardFixed)}은 카드값에 들어 있어요`
										: `통장에서 빠질 ${formatKrw(reserve.reserve)}은 빼뒀어요`}
								</Paragraph.Text>
							</Paragraph>
						) : null}
					</div>
				) : null}
			</div>

			{charges.length === 0 ? (
				<div style={s.empty}>
					<Paragraph
						typography="t5"
						fontWeight="bold"
						color={colors.textPrimary}
						style={s.emptyTitle}
					>
						<Paragraph.Text>나의 지출 칠판을 채워볼까요?</Paragraph.Text>
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

					{/* 카테고리 구성은 "이번 달" 탭이 목록과 함께 보여준다 —
					    같은 그림을 홈에도 두면 화면만 길어지고 볼 곳이 갈린다. */}
				</>
			)}
		</div>
	);
}

import { Paragraph } from "@toss/tds-mobile";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CategoryBar } from "@/components/CategoryBar";
import { ChargeRow } from "@/components/ChargeRow";
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
import { useCharges } from "@/hooks/useCharges";
import { useConfirmedIds } from "@/hooks/useConfirmations";
import { useCountUp } from "@/hooks/useCountUp";
import {
	activeCharges,
	addMonths,
	categoryBreakdown,
	chargesDueOn,
	currentYearMonth,
	formatAmount,
	formatKrw,
	formatYearMonth,
	monthlyTotal,
	nextRelease,
	totalByMethodKind,
	transferCharges,
} from "@/services/charges";
import { toggleConfirmed } from "@/services/confirmStore";
import { buildTips, pickNextTip } from "@/services/tips";

/** 빈 화면에서 "이렇게 채워져요"를 보여주는 예시. 저장되는 값이 아니다. */
const EMPTY_PREVIEW = [
	{ category: "subscription", name: "넷플릭스", amount: 17000 },
	{ category: "insurance", name: "실손보험", amount: 45000 },
	{ category: "installment", name: "자동차 할부", amount: 320000 },
] as const;

const s = {
	page: {
		padding: `${spacing.xs}px ${spacing.md}px ${spacing.lg}px`,
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
		width: 32,
		height: 32,
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
		width: 36,
		height: 36,
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
		paddingBottom: 30,
	} satisfies React.CSSProperties,
	board: {
		padding: `${spacing.lg}px ${spacing.lg}px ${spacing.md}px`,
		border: `7px solid ${boardColors.wood}`,
		borderRadius: radius.xl,
		background: boardSurface,
		boxShadow: `inset 0 0 24px rgba(0,0,0,0.35), ${shadow.card}`,
	} satisfies React.CSSProperties,
	/** 칠판 아래 분필 선반 */
	/** 칠판과 같은 폭으로 — 좁으면 단차가 생겨 어긋나 보인다 */
	tray: {
		position: "absolute" as const,
		left: 0,
		right: 0,
		bottom: 6,
		height: 12,
		borderRadius: `0 0 ${radius.sm}px ${radius.sm}px`,
		background: `linear-gradient(180deg, ${boardColors.wood} 0%, ${boardColors.woodDeep} 100%)`,
		boxShadow: "0 3px 6px rgba(0,0,0,0.14)",
	} satisfies React.CSSProperties,
	trayChalk: {
		position: "absolute" as const,
		left: spacing.xl,
		bottom: 13,
		width: 26,
		height: 7,
		borderRadius: radius.full,
		backgroundColor: boardColors.chalk,
		opacity: 0.9,
	} satisfies React.CSSProperties,
	trayChalkShort: {
		position: "absolute" as const,
		left: spacing.xl + 34,
		bottom: 13,
		width: 14,
		height: 7,
		borderRadius: radius.full,
		backgroundColor: "#BFE0D6",
		opacity: 0.85,
	} satisfies React.CSSProperties,
	/** 선반 위에 두 발로 서서 칠판 옆을 지킨다. 눌러도 말풍선이 바뀐다. */
	buddyOnTray: {
		position: "absolute" as const,
		// 칠판 밖으로 삐져나가면 잘려 보인다 — 선반 위 안쪽에 세운다.
		right: spacing.xl,
		bottom: 14,
		padding: 0,
		border: "none",
		background: "none",
		cursor: "pointer",
	} satisfies React.CSSProperties,
	chalkCaption: {
		textAlign: "center" as const,
		// "고 정 지 출" — 자간을 벌린 만큼 마지막 글자 뒤에 여백이 생겨서 들여쓰기로 보정한다.
		letterSpacing: "0.4em",
		textIndent: "0.4em",
		textShadow: "0 0 8px rgba(244,243,236,0.35)",
	} satisfies React.CSSProperties,
	chalkRule: {
		height: 1,
		margin: `${spacing.sm}px auto 0`,
		width: 132,
		backgroundImage: `repeating-linear-gradient(90deg, ${boardColors.chalkDim} 0 6px, transparent 6px 12px)`,
	} satisfies React.CSSProperties,
	heroAmountRow: {
		display: "grid",
		gridTemplateColumns: "1fr auto 1fr",
		alignItems: "baseline",
		marginTop: spacing.md,
	} satisfies React.CSSProperties,
	heroNumber: {
		gridColumn: 2,
		textAlign: "center" as const,
		textShadow: "0 0 10px rgba(244,243,236,0.35)",
	} satisfies React.CSSProperties,
	heroUnit: {
		gridColumn: 3,
		justifySelf: "end" as const,
	} satisfies React.CSSProperties,
	heroFooter: {
		display: "flex",
		justifyContent: "center",
		marginTop: spacing.md,
	} satisfies React.CSSProperties,
	heroPill: {
		padding: `${spacing.xxs}px ${spacing.sm}px`,
		borderRadius: radius.full,
		border: `1px dashed ${boardColors.chalkDim}`,
	} satisfies React.CSSProperties,
	methodRow: {
		display: "flex",
		gap: spacing.xs,
		marginTop: spacing.sm,
	} satisfies React.CSSProperties,
	methodCard: {
		flex: 1,
		padding: spacing.md,
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
		padding: spacing.md,
		marginTop: spacing.sm,
		borderRadius: radius.xl,
		backgroundColor: colors.surface,
		boxShadow: shadow.card,
	} satisfies React.CSSProperties,
	cardButton: {
		display: "block",
		width: "100%",
		border: "none",
		textAlign: "left" as const,
		cursor: "pointer",
	} satisfies React.CSSProperties,
	cardHead: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.xs,
		marginBottom: spacing.sm,
	} satisfies React.CSSProperties,
	progressTrack: {
		height: 8,
		marginTop: spacing.sm,
		borderRadius: radius.full,
		backgroundColor: colors.surfaceSunken,
		overflow: "hidden",
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
	listCard: {
		marginTop: spacing.sm,
		borderRadius: radius.xl,
		backgroundColor: colors.surface,
		boxShadow: shadow.card,
		overflow: "hidden",
	} satisfies React.CSSProperties,
	listHead: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		padding: `${spacing.md}px ${spacing.md}px ${spacing.xs}px`,
	} satisfies React.CSSProperties,
	moreButton: {
		display: "flex",
		alignItems: "center",
		gap: 2,
		padding: 0,
		border: "none",
		background: "none",
		cursor: "pointer",
	} satisfies React.CSSProperties,
	buddyRow: {
		display: "flex",
		justifyContent: "flex-end",
		width: "100%",
		padding: `${spacing.xs}px 0 0`,
		border: "none",
		background: "none",
		cursor: "pointer",
	} satisfies React.CSSProperties,
	bubble: {
		position: "relative" as const,
		maxWidth: "88%",
		padding: `${spacing.sm}px ${spacing.md}px`,
		borderRadius: radius.lg,
		backgroundColor: colors.surface,
		boxShadow: shadow.card,
		textAlign: "left" as const,
	} satisfies React.CSSProperties,
	/** 칠판 위 캐릭터에서 말이 나오는 것처럼 꼬리를 오른쪽 위로 */
	bubbleTail: {
		position: "absolute" as const,
		right: 22,
		top: -4,
		width: 10,
		height: 10,
		borderRadius: 2,
		backgroundColor: colors.surface,
		transform: "rotate(45deg)",
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
		padding: `${spacing.xs}px ${spacing.md}px`,
		marginBottom: spacing.sm,
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

	const visible = activeCharges(charges, ym);
	const total = monthlyTotal(charges, ym);
	const methods = totalByMethodKind(charges, ym);
	const slices = categoryBreakdown(charges, ym);
	const release = nextRelease(charges, ym);
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
						<Paragraph.Text>고정지출</Paragraph.Text>
					</Paragraph>
					<div style={s.chalkRule} />

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
											: "아직 적을 게 없어요"}
									</Paragraph.Text>
								</Paragraph>
							</div>
						</div>
					)}
				</div>

				<div style={s.tray} />
				<span style={s.trayChalk} />
				<span style={s.trayChalkShort} />
				<button
					type="button"
					style={s.buddyOnTray}
					aria-label="다른 이야기 듣기"
					onClick={showNextTip}
				>
					<MoneyBuddy size={66} holdingChalk />
				</button>
			</div>

			<button
				type="button"
				style={s.buddyRow}
				aria-label="다른 이야기 듣기"
				onClick={showNextTip}
			>
				<div style={s.bubble}>
					<span style={s.bubbleTail} />
					<Paragraph typography="t7" color={colors.textSecondary}>
						<Paragraph.Text>{currentTip}</Paragraph.Text>
					</Paragraph>
				</div>
			</button>

			{charges.length === 0 ? (
				<div style={s.empty}>
					<Paragraph
						typography="t5"
						fontWeight="bold"
						color={colors.textPrimary}
						style={s.emptyTitle}
					>
						<Paragraph.Text>칠판이 아직 비어 있어요</Paragraph.Text>
					</Paragraph>
					<Paragraph
						typography="t7"
						color={colors.textTertiary}
						style={s.emptyDescription}
					>
						<Paragraph.Text>하나씩 적어두면 이렇게 채워져요</Paragraph.Text>
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
						<PrimaryButton onClick={() => navigate("/manage")}>
							관리에서 첫 항목 적기
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

							{dueToday.map((charge) => (
								<div key={charge.id} style={s.dueRow}>
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

					{transfers.length > 0 ? (
						<button
							type="button"
							style={{ ...s.card, ...s.cardButton }}
							onClick={() => navigate(`/month/${ym}`)}
						>
							<div style={s.cardHead}>
								<Paragraph
									typography="t6"
									fontWeight="bold"
									color={colors.textPrimary}
								>
									<Paragraph.Text>이체 확인</Paragraph.Text>
								</Paragraph>
								<div style={{ display: "flex", alignItems: "center", gap: 2 }}>
									<Paragraph typography="t7" color={colors.textTertiary}>
										<Paragraph.Text>{`${confirmedCount}/${transfers.length}건`}</Paragraph.Text>
									</Paragraph>
									<IconChevronRight size={16} color={colors.textTertiary} />
								</div>
							</div>
							<Paragraph typography="t7" color={colors.textTertiary}>
								<Paragraph.Text>
									{confirmedCount === transfers.length
										? "이 달 이체는 모두 확인했어요"
										: `아직 ${transfers.length - confirmedCount}건이 남았어요`}
								</Paragraph.Text>
							</Paragraph>
							<div style={s.progressTrack}>
								<div
									style={{
										width: `${(confirmedCount / transfers.length) * 100}%`,
										height: "100%",
										borderRadius: radius.full,
										backgroundColor: colors.positive,
									}}
								/>
							</div>
						</button>
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
							<CategoryBar slices={slices} />
						</div>
					) : null}

					{visible.length > 0 ? (
						<div style={s.listCard}>
							<div style={s.listHead}>
								<Paragraph
									typography="t6"
									fontWeight="bold"
									color={colors.textPrimary}
								>
									<Paragraph.Text>많이 나가는 항목</Paragraph.Text>
								</Paragraph>
								<button
									type="button"
									style={s.moreButton}
									onClick={() => navigate(`/month/${ym}`)}
								>
									<Paragraph typography="t7" color={colors.textTertiary}>
										<Paragraph.Text>전체 보기</Paragraph.Text>
									</Paragraph>
									<IconChevronRight size={14} color={colors.textTertiary} />
								</button>
							</div>

							{visible.slice(0, 3).map((charge) => (
								<ChargeRow
									key={charge.id}
									charge={charge}
									yearMonth={ym}
									onClick={() => navigate(`/charge/${charge.id}`)}
								/>
							))}
						</div>
					) : (
						<div style={s.card}>
							<Paragraph typography="t7" color={colors.textTertiary}>
								<Paragraph.Text>이 달에 빠지는 항목이 없어요.</Paragraph.Text>
							</Paragraph>
						</div>
					)}
				</>
			)}
		</div>
	);
}

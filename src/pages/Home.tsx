import { Button, Paragraph } from "@toss/tds-mobile";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CategoryBar } from "@/components/CategoryBar";
import { ChargeRow } from "@/components/ChargeRow";
import {
	IconBank,
	IconCard,
	IconChevronLeft,
	IconChevronRight,
	IconSettings,
} from "@/components/icons";
import { MoneyBuddy } from "@/components/MoneyBuddy";
import { colors, heroGradient, radius, shadow, spacing } from "@/design/tokens";
import { useCharges } from "@/hooks/useCharges";
import { useConfirmedIds } from "@/hooks/useConfirmations";
import { useCountUp } from "@/hooks/useCountUp";
import {
	activeCharges,
	addMonths,
	categoryBreakdown,
	currentYearMonth,
	formatAmount,
	formatKrw,
	formatYearMonth,
	monthlyTotal,
	nextRelease,
	totalByMethodKind,
	transferCharges,
} from "@/services/charges";
import { buildTips, pickNextTip } from "@/services/tips";

const s = {
	page: {
		padding: `${spacing.xs}px ${spacing.md}px ${spacing.xl}px`,
	} satisfies React.CSSProperties,
	header: {
		position: "relative" as const,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		height: 48,
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
	hero: {
		padding: `${spacing.xl}px ${spacing.lg}px`,
		borderRadius: radius.xxl,
		background: heroGradient,
		boxShadow: shadow.hero,
	} satisfies React.CSSProperties,
	heroCaption: {
		textAlign: "center" as const,
		// "고 정 지 출" — 자간을 벌린 만큼 마지막 글자 뒤에 여백이 생겨서 들여쓰기로 보정한다.
		letterSpacing: "0.4em",
		textIndent: "0.4em",
		opacity: 0.9,
	} satisfies React.CSSProperties,
	heroAmountRow: {
		display: "grid",
		gridTemplateColumns: "1fr auto 1fr",
		alignItems: "baseline",
		marginTop: spacing.sm,
	} satisfies React.CSSProperties,
	heroNumber: {
		gridColumn: 2,
		textAlign: "center" as const,
	} satisfies React.CSSProperties,
	heroUnit: {
		gridColumn: 3,
		justifySelf: "end" as const,
		opacity: 0.9,
	} satisfies React.CSSProperties,
	heroFooter: {
		display: "flex",
		justifyContent: "center",
		marginTop: spacing.md,
	} satisfies React.CSSProperties,
	heroPill: {
		padding: `${spacing.xxs}px ${spacing.sm}px`,
		borderRadius: radius.full,
		backgroundColor: "rgba(255, 255, 255, 0.18)",
	} satisfies React.CSSProperties,
	methodRow: {
		display: "flex",
		gap: spacing.xs,
		marginTop: spacing.md,
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
		marginTop: spacing.md,
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
	listCard: {
		marginTop: spacing.md,
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
		alignItems: "center",
		gap: spacing.xs,
		width: "100%",
		padding: `${spacing.md}px 0 0`,
		border: "none",
		background: "none",
		textAlign: "left" as const,
		cursor: "pointer",
	} satisfies React.CSSProperties,
	bubble: {
		position: "relative" as const,
		flex: 1,
		padding: `${spacing.sm}px ${spacing.md}px`,
		borderRadius: radius.lg,
		backgroundColor: colors.surface,
		boxShadow: shadow.card,
	} satisfies React.CSSProperties,
	bubbleTail: {
		position: "absolute" as const,
		left: -5,
		top: "50%",
		width: 10,
		height: 10,
		marginTop: -5,
		borderRadius: 2,
		backgroundColor: colors.surface,
		transform: "rotate(45deg)",
	} satisfies React.CSSProperties,
	empty: {
		marginTop: spacing.md,
		padding: `${spacing.xl}px ${spacing.lg}px ${spacing.xxl}px`,
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
	emptyTitle: { marginTop: spacing.sm } satisfies React.CSSProperties,
	emptyDescription: { marginTop: spacing.xs } satisfies React.CSSProperties,
	emptyCta: { marginTop: spacing.lg } satisfies React.CSSProperties,
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

			<div style={s.hero}>
				<Paragraph
					typography="t7"
					color={colors.textOnDark}
					style={s.heroCaption}
				>
					<Paragraph.Text>고정지출</Paragraph.Text>
				</Paragraph>

				<div style={s.heroAmountRow}>
					<Paragraph
						typography="t2"
						fontWeight="bold"
						color={colors.textOnDark}
						style={s.heroNumber}
					>
						<Paragraph.Text>{formatAmount(shownTotal)}</Paragraph.Text>
					</Paragraph>
					<Paragraph
						typography="t5"
						fontWeight="bold"
						color={colors.textOnDark}
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
								color={colors.textOnDark}
							>
								<Paragraph.Text>
									{`${release.monthsLater}개월 뒤 ${formatAmount(release.amount)}원 풀려요`}
								</Paragraph.Text>
							</Paragraph>
						</div>
					</div>
				) : visible.length > 0 ? (
					<div style={s.heroFooter}>
						<div style={s.heroPill}>
							<Paragraph typography="t7" color={colors.textOnDark}>
								<Paragraph.Text>{`고정지출 ${visible.length}개`}</Paragraph.Text>
							</Paragraph>
						</div>
					</div>
				) : null}
			</div>

			{charges.length === 0 ? (
				<div style={s.empty}>
					<div style={s.emptyBubble}>
						<Paragraph typography="t7" fontWeight="bold" color={colors.primary}>
							<Paragraph.Text>{currentTip}</Paragraph.Text>
						</Paragraph>
					</div>
					<MoneyBuddy size={88} />
					<Paragraph
						typography="t5"
						fontWeight="bold"
						color={colors.textPrimary}
						style={s.emptyTitle}
					>
						<Paragraph.Text>아직 넣은 항목이 없어요</Paragraph.Text>
					</Paragraph>
					<Paragraph
						typography="t7"
						color={colors.textTertiary}
						style={s.emptyDescription}
					>
						<Paragraph.Text>
							아래 <b>관리</b> 탭에서 넷플릭스, 보험, 할부처럼
							<br />
							매달 알아서 빠지는 것부터 넣어보세요.
						</Paragraph.Text>
					</Paragraph>
					<div style={s.emptyCta}>
						<Button
							size="large"
							color="primary"
							variant="fill"
							display="block"
							onClick={() => navigate("/manage")}
						>
							관리로 가기
						</Button>
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

					<button
						type="button"
						style={s.buddyRow}
						aria-label="다른 이야기 듣기"
						onClick={() => setTip(pickNextTip(tips, currentTip))}
					>
						<MoneyBuddy size={56} />
						<div style={s.bubble}>
							<span style={s.bubbleTail} />
							<Paragraph typography="t7" color={colors.textSecondary}>
								<Paragraph.Text>{currentTip}</Paragraph.Text>
							</Paragraph>
						</div>
					</button>
				</>
			)}
		</div>
	);
}

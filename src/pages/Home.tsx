import { Button, Paragraph } from "@toss/tds-mobile";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CategoryBar } from "@/components/CategoryBar";
import { ChargeRow } from "@/components/ChargeRow";
import {
	IconBank,
	IconCard,
	IconChevronRight,
	IconPlus,
	IconSettings,
} from "@/components/icons";
import { colors, heroGradient, radius, shadow, spacing } from "@/design/tokens";
import { useCharges } from "@/hooks/useCharges";
import { useConfirmedIds } from "@/hooks/useConfirmations";
import {
	activeCharges,
	categoryBreakdown,
	currentYearMonth,
	formatAmount,
	formatKrw,
	monthlyTotal,
	nextRelease,
	totalByMethodKind,
	transferCharges,
} from "@/services/charges";

const s = {
	page: {
		padding: `${spacing.xs}px ${spacing.md}px ${spacing.xxl}px`,
	} satisfies React.CSSProperties,
	header: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		height: 48,
	} satisfies React.CSSProperties,
	iconButton: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: 40,
		height: 40,
		border: "none",
		borderRadius: radius.full,
		background: "none",
		cursor: "pointer",
	} satisfies React.CSSProperties,
	hero: {
		padding: `${spacing.xl}px ${spacing.lg}px`,
		borderRadius: radius.xxl,
		background: heroGradient,
		boxShadow: shadow.hero,
	} satisfies React.CSSProperties,
	heroCaption: { opacity: 0.85 } satisfies React.CSSProperties,
	heroTotal: { marginTop: spacing.xs } satisfies React.CSSProperties,
	heroFooter: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xxs,
		marginTop: spacing.md,
		padding: `${spacing.xs}px ${spacing.sm}px`,
		borderRadius: radius.full,
		backgroundColor: "rgba(255, 255, 255, 0.18)",
		alignSelf: "flex-start",
		width: "fit-content",
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
	empty: {
		marginTop: spacing.md,
		padding: `${spacing.xxl}px ${spacing.lg}px`,
		borderRadius: radius.xxl,
		backgroundColor: colors.surface,
		boxShadow: shadow.card,
		textAlign: "center" as const,
	} satisfies React.CSSProperties,
	emptyIcon: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: 56,
		height: 56,
		margin: "0 auto",
		borderRadius: radius.full,
		backgroundColor: colors.primarySoft,
	} satisfies React.CSSProperties,
	emptyText: { marginTop: spacing.md } satisfies React.CSSProperties,
	emptyDescription: { marginTop: spacing.xs } satisfies React.CSSProperties,
	emptyCta: { marginTop: spacing.lg } satisfies React.CSSProperties,
};

export default function HomePage() {
	const navigate = useNavigate();
	const charges = useCharges();
	const ym = useMemo(() => currentYearMonth(), []);
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
	const [year, month] = ym.split("-");

	return (
		<div style={s.page}>
			<div style={s.header}>
				<Paragraph typography="t5" fontWeight="bold" color={colors.textPrimary}>
					<Paragraph.Text>{`${year}년 ${Number(month)}월`}</Paragraph.Text>
				</Paragraph>
				<button
					type="button"
					style={s.iconButton}
					aria-label="설정"
					onClick={() => navigate("/settings")}
				>
					<IconSettings size={22} color={colors.textTertiary} />
				</button>
			</div>

			<div style={s.hero}>
				<Paragraph
					typography="t7"
					color={colors.textOnDark}
					style={s.heroCaption}
				>
					<Paragraph.Text>가만히 있어도 나가는 돈</Paragraph.Text>
				</Paragraph>
				<Paragraph
					typography="t2"
					fontWeight="bold"
					color={colors.textOnDark}
					style={s.heroTotal}
				>
					<Paragraph.Text>{formatKrw(total)}</Paragraph.Text>
				</Paragraph>

				{release ? (
					<div style={s.heroFooter}>
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
				) : visible.length > 0 ? (
					<div style={s.heroFooter}>
						<Paragraph typography="t7" color={colors.textOnDark}>
							<Paragraph.Text>{`고정지출 ${visible.length}개`}</Paragraph.Text>
						</Paragraph>
					</div>
				) : null}
			</div>

			{visible.length === 0 ? (
				<div style={s.empty}>
					<div style={s.emptyIcon}>
						<IconPlus size={26} color={colors.primary} />
					</div>
					<Paragraph
						typography="t5"
						fontWeight="bold"
						color={colors.textPrimary}
						style={s.emptyText}
					>
						<Paragraph.Text>첫 항목을 넣어볼까요?</Paragraph.Text>
					</Paragraph>
					<Paragraph
						typography="t7"
						color={colors.textTertiary}
						style={s.emptyDescription}
					>
						<Paragraph.Text>
							넷플릭스, 실손보험, 자동차 할부처럼
							<br />
							매달 알아서 빠지는 것부터 넣으면 돼요.
						</Paragraph.Text>
					</Paragraph>
					<div style={s.emptyCta}>
						<Button
							size="large"
							color="primary"
							variant="fill"
							display="block"
							onClick={() => navigate("/charge/new")}
						>
							항목 등록하기
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
										? "이번 달 이체는 모두 확인했어요"
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
				</>
			)}
		</div>
	);
}

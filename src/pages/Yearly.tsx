import { Paragraph } from "@toss/tds-mobile";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CategoryBar } from "@/components/CategoryBar";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";
import {
	boardColors,
	boardSurface,
	colors,
	radius,
	shadow,
	spacing,
} from "@/design/tokens";
import { useCharges } from "@/hooks/useCharges";
import {
	currentYearMonth,
	formatCompact,
	formatKrw,
	yearlyCategoryTotals,
	yearlyTotals,
} from "@/services/charges";

const s = {
	page: {
		padding: `${spacing.xs}px ${spacing.md}px ${spacing.lg}px`,
	} satisfies React.CSSProperties,
	header: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		padding: `${spacing.xs}px 0 ${spacing.sm}px`,
	} satisfies React.CSSProperties,
	yearSwitch: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
	} satisfies React.CSSProperties,
	iconButton: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: 32,
		height: 32,
		border: "none",
		borderRadius: radius.full,
		backgroundColor: colors.surface,
		boxShadow: shadow.card,
		cursor: "pointer",
	} satisfies React.CSSProperties,
	card: {
		padding: spacing.md,
		marginBottom: spacing.sm,
		borderRadius: radius.xl,
		backgroundColor: colors.surface,
		boxShadow: shadow.card,
	} satisfies React.CSSProperties,
	/** 1~12월 막대는 칠판에 분필로 그린 것처럼 */
	boardCard: {
		padding: `${spacing.md}px ${spacing.md}px ${spacing.sm}px`,
		marginBottom: spacing.sm,
		border: `7px solid ${boardColors.wood}`,
		borderRadius: radius.xl,
		background: boardSurface,
		boxShadow: `inset 0 0 24px rgba(0,0,0,0.35), ${shadow.card}`,
	} satisfies React.CSSProperties,
	summaryRow: {
		display: "flex",
		gap: spacing.md,
	} satisfies React.CSSProperties,
	summaryItem: { flex: 1 } satisfies React.CSSProperties,
	summaryValue: { marginTop: spacing.xxs } satisfies React.CSSProperties,
	/** 분필로 칸을 그어 달마다 적어둔 느낌 */
	monthGrid: {
		display: "grid",
		gridTemplateColumns: "repeat(3, 1fr)",
		gap: spacing.xs,
		marginTop: spacing.md,
	} satisfies React.CSSProperties,
	monthCell: {
		display: "flex",
		flexDirection: "column" as const,
		alignItems: "center",
		gap: 2,
		padding: `${spacing.sm}px ${spacing.xxs}px`,
		borderRadius: radius.md,
		cursor: "pointer",
	} satisfies React.CSSProperties,
	monthAmount: {
		textShadow: "0 0 8px rgba(244,243,236,0.3)",
	} satisfies React.CSSProperties,
	chartHint: {
		marginTop: spacing.sm,
		textAlign: "center" as const,
	} satisfies React.CSSProperties,
	cardTitle: { marginBottom: spacing.sm } satisfies React.CSSProperties,
	insight: {
		display: "flex",
		flexDirection: "column" as const,
		alignItems: "center",
		gap: 2,
		marginTop: spacing.md,
		padding: `${spacing.xs}px ${spacing.sm}px`,
		borderRadius: radius.md,
		border: `1px dashed ${boardColors.chalkDim}`,
	} satisfies React.CSSProperties,
};

export default function YearlyPage() {
	const navigate = useNavigate();
	const charges = useCharges();
	const thisYm = useMemo(() => currentYearMonth(), []);
	const thisYear = Number(thisYm.slice(0, 4));
	const [year, setYear] = useState(thisYear);

	const months = yearlyTotals(charges, year);
	const slices = yearlyCategoryTotals(charges, year);
	const yearTotal = months.reduce((sum, month) => sum + month.total, 0);
	const paidMonths = months.filter((month) => month.total > 0);
	const average =
		paidMonths.length > 0 ? Math.round(yearTotal / paidMonths.length) : 0;
	const peak = months.reduce(
		(max, month) => (month.total > max.total ? month : max),
		months[0],
	);
	const low = months.reduce(
		(min, month) => (month.total < min.total ? month : min),
		months[0],
	);
	const maxTotal = peak?.total ?? 0;
	// 열두 달이 다 같으면 "가장 많은 달"은 알려줄 게 없는 정보다.
	const hasSpread = maxTotal > 0 && peak.total !== low.total;

	return (
		<div style={s.page}>
			<div style={s.header}>
				<Paragraph typography="t4" fontWeight="bold" color={colors.textPrimary}>
					<Paragraph.Text>연간</Paragraph.Text>
				</Paragraph>
				<div style={s.yearSwitch}>
					<button
						type="button"
						style={s.iconButton}
						aria-label="이전 해"
						onClick={() => setYear((value) => value - 1)}
					>
						<IconChevronLeft size={16} color={colors.textSecondary} />
					</button>
					<Paragraph
						typography="t6"
						fontWeight="bold"
						color={colors.textPrimary}
					>
						<Paragraph.Text>{`${year}년`}</Paragraph.Text>
					</Paragraph>
					<button
						type="button"
						style={s.iconButton}
						aria-label="다음 해"
						onClick={() => setYear((value) => value + 1)}
					>
						<IconChevronRight size={16} color={colors.textSecondary} />
					</button>
				</div>
			</div>

			<div style={s.boardCard}>
				<div style={s.summaryRow}>
					<div style={s.summaryItem}>
						<Paragraph typography="t7" color={boardColors.chalkDim}>
							<Paragraph.Text>올해 나가는 돈</Paragraph.Text>
						</Paragraph>
						<Paragraph
							typography="t4"
							fontWeight="bold"
							color={boardColors.chalk}
							style={s.summaryValue}
						>
							<Paragraph.Text>{formatKrw(yearTotal)}</Paragraph.Text>
						</Paragraph>
					</div>
					<div style={s.summaryItem}>
						<Paragraph typography="t7" color={boardColors.chalkDim}>
							<Paragraph.Text>월 평균</Paragraph.Text>
						</Paragraph>
						<Paragraph
							typography="t4"
							fontWeight="bold"
							color={boardColors.chalkDim}
							style={s.summaryValue}
						>
							<Paragraph.Text>{formatKrw(average)}</Paragraph.Text>
						</Paragraph>
					</div>
				</div>

				<div style={s.monthGrid}>
					{months.map((month) => {
						const isThisMonth = month.ym === thisYm;

						return (
							<button
								key={month.ym}
								type="button"
								style={{
									...s.monthCell,
									backgroundColor: isThisMonth
										? "rgba(244, 243, 236, 0.14)"
										: "transparent",
									border: `1px ${isThisMonth ? "solid" : "dashed"} ${
										isThisMonth ? boardColors.chalk : boardColors.chalkFaint
									}`,
								}}
								onClick={() => navigate(`/month/${month.ym}`)}
							>
								<Paragraph
									typography="t7"
									fontWeight={isThisMonth ? "bold" : "regular"}
									color={isThisMonth ? boardColors.chalk : boardColors.chalkDim}
								>
									<Paragraph.Text>{`${month.month}월`}</Paragraph.Text>
								</Paragraph>
								<Paragraph
									typography="t6"
									fontWeight="bold"
									color={
										month.total === 0
											? boardColors.chalkFaint
											: boardColors.chalk
									}
									style={s.monthAmount}
								>
									<Paragraph.Text>
										{month.total === 0 ? "—" : formatCompact(month.total)}
									</Paragraph.Text>
								</Paragraph>
							</button>
						);
					})}
				</div>

				<Paragraph
					typography="t7"
					color={boardColors.chalkDim}
					style={s.chartHint}
				>
					<Paragraph.Text>월을 누르면 그 달 상세를 볼 수 있어요</Paragraph.Text>
				</Paragraph>

				{hasSpread ? (
					<div style={s.insight}>
						<Paragraph typography="t7" color={boardColors.chalk}>
							<Paragraph.Text>
								{`많은 달 ${peak.month}월 ${formatKrw(peak.total)}`}
							</Paragraph.Text>
						</Paragraph>
						<Paragraph typography="t7" color={boardColors.chalkDim}>
							<Paragraph.Text>
								{`적은 달 ${low.month}월 ${formatKrw(low.total)}`}
							</Paragraph.Text>
						</Paragraph>
					</div>
				) : null}
			</div>

			{slices.length > 0 ? (
				<div style={s.card}>
					<Paragraph
						typography="t6"
						fontWeight="bold"
						color={colors.textPrimary}
						style={s.cardTitle}
					>
						<Paragraph.Text>{`${year}년 카테고리별 합계`}</Paragraph.Text>
					</Paragraph>
					<CategoryBar slices={slices} legendLimit={5} />
				</div>
			) : (
				<div style={s.card}>
					<Paragraph typography="t7" color={colors.textTertiary}>
						<Paragraph.Text>
							{`${year}년에 잡힌 고정지출이 없어요.`}
						</Paragraph.Text>
					</Paragraph>
				</div>
			)}
		</div>
	);
}

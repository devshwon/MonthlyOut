import { Paragraph } from "@toss/tds-mobile";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CategoryBar } from "@/components/CategoryBar";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";
import { colors, radius, shadow, spacing } from "@/design/tokens";
import { useCharges } from "@/hooks/useCharges";
import {
	currentYearMonth,
	formatKrw,
	yearlyCategoryTotals,
	yearlyTotals,
} from "@/services/charges";

const CHART_HEIGHT = 132;

const s = {
	page: {
		padding: `${spacing.xs}px ${spacing.md}px ${spacing.xxl}px`,
	} satisfies React.CSSProperties,
	header: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		padding: `${spacing.xs}px 0 ${spacing.md}px`,
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
	summaryRow: {
		display: "flex",
		gap: spacing.md,
	} satisfies React.CSSProperties,
	summaryItem: { flex: 1 } satisfies React.CSSProperties,
	summaryValue: { marginTop: spacing.xxs } satisfies React.CSSProperties,
	chart: {
		display: "flex",
		alignItems: "flex-end",
		gap: spacing.xxs,
		height: CHART_HEIGHT,
		marginTop: spacing.md,
	} satisfies React.CSSProperties,
	barButton: {
		display: "flex",
		flex: 1,
		flexDirection: "column" as const,
		justifyContent: "flex-end",
		height: "100%",
		padding: 0,
		border: "none",
		background: "none",
		cursor: "pointer",
	} satisfies React.CSSProperties,
	labelRow: {
		display: "flex",
		gap: spacing.xxs,
		marginTop: spacing.xs,
	} satisfies React.CSSProperties,
	label: {
		flex: 1,
		textAlign: "center" as const,
	} satisfies React.CSSProperties,
	chartHint: {
		marginTop: spacing.sm,
		textAlign: "center" as const,
	} satisfies React.CSSProperties,
	cardTitle: { marginBottom: spacing.sm } satisfies React.CSSProperties,
	insight: {
		display: "flex",
		gap: spacing.xxs,
		marginTop: spacing.md,
		padding: `${spacing.xs}px ${spacing.sm}px`,
		borderRadius: radius.md,
		backgroundColor: colors.primarySoft,
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
	const maxTotal = peak?.total ?? 0;

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

			<div style={s.card}>
				<div style={s.summaryRow}>
					<div style={s.summaryItem}>
						<Paragraph typography="t7" color={colors.textTertiary}>
							<Paragraph.Text>올해 나가는 돈</Paragraph.Text>
						</Paragraph>
						<Paragraph
							typography="t4"
							fontWeight="bold"
							color={colors.textPrimary}
							style={s.summaryValue}
						>
							<Paragraph.Text>{formatKrw(yearTotal)}</Paragraph.Text>
						</Paragraph>
					</div>
					<div style={s.summaryItem}>
						<Paragraph typography="t7" color={colors.textTertiary}>
							<Paragraph.Text>월 평균</Paragraph.Text>
						</Paragraph>
						<Paragraph
							typography="t4"
							fontWeight="bold"
							color={colors.textSecondary}
							style={s.summaryValue}
						>
							<Paragraph.Text>{formatKrw(average)}</Paragraph.Text>
						</Paragraph>
					</div>
				</div>

				<div style={s.chart}>
					{months.map((month) => {
						const isThisMonth = month.ym === thisYm;
						const height =
							maxTotal > 0 ? Math.max((month.total / maxTotal) * 100, 2) : 2;

						return (
							<button
								key={month.ym}
								type="button"
								style={s.barButton}
								aria-label={`${month.month}월 ${formatKrw(month.total)}`}
								onClick={() => navigate(`/month/${month.ym}`)}
							>
								<div
									style={{
										height: `${height}%`,
										borderRadius: radius.sm,
										backgroundColor:
											month.total === 0
												? colors.surfaceSunken
												: isThisMonth
													? colors.primary
													: "#C6DCFB",
									}}
								/>
							</button>
						);
					})}
				</div>

				<div style={s.labelRow}>
					{months.map((month) => (
						<div key={month.ym} style={s.label}>
							<Paragraph
								typography="t7"
								fontWeight={month.ym === thisYm ? "bold" : "regular"}
								color={
									month.ym === thisYm ? colors.primary : colors.textTertiary
								}
							>
								<Paragraph.Text>{String(month.month)}</Paragraph.Text>
							</Paragraph>
						</div>
					))}
				</div>

				<Paragraph
					typography="t7"
					color={colors.textTertiary}
					style={s.chartHint}
				>
					<Paragraph.Text>월을 누르면 그 달 상세를 볼 수 있어요</Paragraph.Text>
				</Paragraph>

				{maxTotal > 0 ? (
					<div style={s.insight}>
						<Paragraph typography="t7" color={colors.textSecondary}>
							<Paragraph.Text>
								{`${peak.month}월이 가장 많아요 · ${formatKrw(peak.total)}`}
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

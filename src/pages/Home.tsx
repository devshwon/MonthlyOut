import { Button, Paragraph, TextButton } from "@toss/tds-mobile";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChargeRow } from "@/components/ChargeRow";
import { colors, radius, spacing } from "@/design/tokens";
import { useCharges } from "@/hooks/useCharges";
import { useSafeAreaInsets } from "@/hooks/useSafeAreaInsets";
import {
	activeCharges,
	currentYearMonth,
	formatAmount,
	formatKrw,
	formatYearMonth,
	monthlyTotal,
	nextRelease,
} from "@/services/charges";

const s = {
	screen: {
		display: "flex",
		flexDirection: "column" as const,
		minHeight: "100dvh",
		backgroundColor: colors.background,
	} satisfies React.CSSProperties,
	scroll: {
		flex: 1,
		overflowY: "auto" as const,
		padding: `${spacing.md}px ${spacing.md}px ${spacing.xl}px`,
	} satisfies React.CSSProperties,
	topBar: {
		display: "flex",
		alignItems: "center",
		justifyContent: "flex-end",
		height: spacing.xxl,
	} satisfies React.CSSProperties,
	summary: {
		padding: `${spacing.lg}px 0 ${spacing.xl}px`,
	} satisfies React.CSSProperties,
	total: { marginTop: spacing.xs } satisfies React.CSSProperties,
	summaryMeta: { marginTop: spacing.xs } satisfies React.CSSProperties,
	release: {
		display: "flex",
		gap: spacing.xxs,
		padding: `${spacing.sm}px ${spacing.md}px`,
		marginBottom: spacing.md,
		borderRadius: radius.md,
		backgroundColor: colors.surface,
	} satisfies React.CSSProperties,
	list: {
		display: "flex",
		flexDirection: "column" as const,
		gap: spacing.xs,
	} satisfies React.CSSProperties,
	empty: {
		padding: `${spacing.xxxl}px ${spacing.md}px`,
		borderRadius: radius.lg,
		backgroundColor: colors.surface,
		textAlign: "center" as const,
	} satisfies React.CSSProperties,
	emptyDescription: { marginTop: spacing.xs } satisfies React.CSSProperties,
	cta: {
		padding: `${spacing.sm}px ${spacing.md}px`,
		backgroundColor: colors.background,
	} satisfies React.CSSProperties,
};

export default function HomePage() {
	const navigate = useNavigate();
	const insets = useSafeAreaInsets();
	const charges = useCharges();
	const yearMonth = useMemo(() => currentYearMonth(), []);

	const visible = activeCharges(charges, yearMonth);
	const total = monthlyTotal(charges, yearMonth);
	const release = nextRelease(charges, yearMonth);

	return (
		<div style={s.screen}>
			<div style={s.scroll}>
				<div style={s.topBar}>
					<TextButton size="small" onClick={() => navigate("/settings")}>
						설정
					</TextButton>
				</div>

				<div style={s.summary}>
					<Paragraph typography="t7" color={colors.textTertiary}>
						<Paragraph.Text>
							{formatYearMonth(yearMonth)} 고정과금
						</Paragraph.Text>
					</Paragraph>
					<Paragraph
						typography="t2"
						fontWeight="bold"
						color={colors.textPrimary}
						style={s.total}
					>
						<Paragraph.Text>{formatKrw(total)}</Paragraph.Text>
					</Paragraph>
					{visible.length > 0 ? (
						<Paragraph
							typography="t7"
							color={colors.textSecondary}
							style={s.summaryMeta}
						>
							<Paragraph.Text>{`매달 자동으로 빠지는 항목 ${visible.length}개`}</Paragraph.Text>
						</Paragraph>
					) : null}
				</div>

				{release ? (
					<div style={s.release}>
						<Paragraph
							typography="t7"
							fontWeight="bold"
							color={colors.positive}
						>
							<Paragraph.Text>{`${release.monthsLater}개월 뒤`}</Paragraph.Text>
						</Paragraph>
						<Paragraph typography="t7" color={colors.textSecondary}>
							<Paragraph.Text>{`${formatAmount(release.amount)}원이 풀립니다`}</Paragraph.Text>
						</Paragraph>
					</div>
				) : null}

				{visible.length === 0 ? (
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
							<Paragraph.Text>
								구독·할부·보험·대출처럼 매달 알아서 빠지는 것부터 넣어보세요.
							</Paragraph.Text>
						</Paragraph>
					</div>
				) : (
					<div style={s.list}>
						{visible.map((charge) => (
							<ChargeRow
								key={charge.id}
								charge={charge}
								yearMonth={yearMonth}
								onClick={() => navigate(`/charge/${charge.id}`)}
							/>
						))}
					</div>
				)}
			</div>

			<div style={{ ...s.cta, paddingBottom: spacing.sm + insets.bottom }}>
				<Button
					size="large"
					color="primary"
					variant="fill"
					display="block"
					onClick={() => navigate("/charge/new")}
				>
					항목 추가
				</Button>
			</div>
		</div>
	);
}

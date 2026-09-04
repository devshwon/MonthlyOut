import { Paragraph } from "@toss/tds-mobile";
import { categoryColors, colors, radius, spacing } from "@/design/tokens";
import {
	CATEGORY_LABEL,
	type CategorySlice,
	formatKrw,
} from "@/services/charges";

const s = {
	bar: {
		display: "flex",
		gap: 2,
		height: 10,
		borderRadius: radius.full,
		overflow: "hidden",
		backgroundColor: colors.surfaceSunken,
	} satisfies React.CSSProperties,
	legend: {
		display: "flex",
		flexDirection: "column" as const,
		gap: spacing.xs,
		marginTop: spacing.md,
	} satisfies React.CSSProperties,
	legendRow: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
	} satisfies React.CSSProperties,
	dot: {
		flexShrink: 0,
		width: 8,
		height: 8,
		borderRadius: radius.full,
	} satisfies React.CSSProperties,
	label: { flex: 1 } satisfies React.CSSProperties,
};

interface Props {
	slices: CategorySlice[];
	/** 레전드에 보여줄 개수. 나머지는 "기타 N개"로 합친다. */
	legendLimit?: number;
}

/** 카테고리 비율 한 줄 + 상위 항목 레전드. 총액을 가리지 않을 만큼만 보여준다. */
export function CategoryBar({ slices, legendLimit = 3 }: Props) {
	if (slices.length === 0) {
		return null;
	}

	const shown = slices.slice(0, legendLimit);
	const rest = slices.slice(legendLimit);
	const restAmount = rest.reduce((sum, slice) => sum + slice.amount, 0);

	return (
		<div>
			<div style={s.bar}>
				{slices.map((slice) => (
					<div
						key={slice.category}
						style={{
							width: `${Math.max(slice.ratio * 100, 1.5)}%`,
							backgroundColor: categoryColors[slice.category],
						}}
					/>
				))}
			</div>

			<div style={s.legend}>
				{shown.map((slice) => (
					<div key={slice.category} style={s.legendRow}>
						<span
							style={{
								...s.dot,
								backgroundColor: categoryColors[slice.category],
							}}
						/>
						<Paragraph
							typography="t7"
							color={colors.textSecondary}
							style={s.label}
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
							<Paragraph.Text>{formatKrw(slice.amount)}</Paragraph.Text>
						</Paragraph>
					</div>
				))}

				{rest.length > 0 ? (
					<div style={s.legendRow}>
						<span style={{ ...s.dot, backgroundColor: colors.textTertiary }} />
						<Paragraph
							typography="t7"
							color={colors.textTertiary}
							style={s.label}
						>
							<Paragraph.Text>{`그 외 ${rest.length}개`}</Paragraph.Text>
						</Paragraph>
						<Paragraph typography="t7" color={colors.textTertiary}>
							<Paragraph.Text>{formatKrw(restAmount)}</Paragraph.Text>
						</Paragraph>
					</div>
				) : null}
			</div>
		</div>
	);
}

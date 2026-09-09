import { Paragraph } from "@toss/tds-mobile";
import { CategoryIcon } from "@/components/icons";
import {
	categoryColors,
	categorySoftColors,
	colors,
	radius,
	spacing,
} from "@/design/tokens";
import {
	formatBillingDay,
	formatKrw,
	installmentRound,
	METHOD_KIND_LABEL,
} from "@/services/charges";
import type { FixedCharge, YearMonth } from "@/types";

const s = {
	row: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		width: "100%",
		padding: `${spacing.sm}px ${spacing.md}px`,
	} satisfies React.CSSProperties,
	/** 행 본문(누르면 수정으로) — 액세서리가 버튼일 수 있어 따로 둔다 */
	main: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		flex: 1,
		minWidth: 0,
		padding: 0,
		border: "none",
		background: "none",
		textAlign: "left" as const,
		cursor: "pointer",
	} satisfies React.CSSProperties,
	iconWrap: {
		display: "flex",
		flexShrink: 0,
		alignItems: "center",
		justifyContent: "center",
		width: 40,
		height: 40,
		borderRadius: radius.md,
	} satisfies React.CSSProperties,
	body: { flex: 1, minWidth: 0 } satisfies React.CSSProperties,
	nameLine: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xxs,
	} satisfies React.CSSProperties,
	name: {
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap" as const,
	} satisfies React.CSSProperties,
	badge: {
		flexShrink: 0,
		padding: `1px ${spacing.xs}px`,
		borderRadius: radius.full,
		backgroundColor: colors.surfaceSunken,
	} satisfies React.CSSProperties,
	meta: { marginTop: 2 } satisfies React.CSSProperties,
	memo: {
		marginTop: 2,
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap" as const,
	} satisfies React.CSSProperties,
	tail: {
		display: "flex",
		flexShrink: 0,
		alignItems: "center",
		gap: spacing.xs,
	} satisfies React.CSSProperties,
	ended: { opacity: 0.45 } satisfies React.CSSProperties,
};

interface Props {
	charge: FixedCharge;
	yearMonth: YearMonth;
	onClick?: () => void;
	/** 금액 오른쪽에 붙는 요소(체크 버튼·화살표 등) */
	accessory?: React.ReactNode;
	/** 이번 달에 빠지지 않는 항목이면 흐리게 */
	dimmed?: boolean;
	/** 노트(괘선) 위에 놓일 때 — 왼쪽 여백선을 침범하지 않게 들여쓴다 */
	paper?: boolean;
}

/** 항목 한 줄. 카테고리 색·아이콘이 화면 전체에서 같은 의미로 반복된다. */
export function ChargeRow({
	charge,
	yearMonth,
	onClick,
	accessory,
	dimmed = false,
	paper = false,
}: Props) {
	const round = installmentRound(charge, yearMonth);
	const meta = [
		formatBillingDay(charge.billingDay),
		charge.method?.name ||
			(charge.method ? METHOD_KIND_LABEL[charge.method.kind] : null),
	].filter(Boolean);

	return (
		<div
			style={{
				...s.row,
				// 괘선 두 칸(32px × 2)에 딱 맞춰 글씨가 줄 위에 앉게 한다.
				...(paper ? { minHeight: 64 } : null),
				...(dimmed ? s.ended : null),
			}}
		>
			<button
				type="button"
				style={s.main}
				onClick={onClick}
				disabled={!onClick}
			>
				<div
					style={{
						...s.iconWrap,
						backgroundColor: categorySoftColors[charge.category],
					}}
				>
					<CategoryIcon
						category={charge.category}
						size={22}
						color={categoryColors[charge.category]}
					/>
				</div>

				<div style={s.body}>
					<div style={s.nameLine}>
						<Paragraph
							typography="t6"
							fontWeight="bold"
							color={colors.textPrimary}
							style={s.name}
						>
							<Paragraph.Text>{charge.name}</Paragraph.Text>
						</Paragraph>
						{charge.term && round ? (
							<span style={s.badge}>
								<Paragraph typography="t7" color={colors.textTertiary}>
									<Paragraph.Text>{`${round}/${charge.term.totalCount}회차`}</Paragraph.Text>
								</Paragraph>
							</span>
						) : null}
					</div>
					<Paragraph typography="t7" color={colors.textTertiary} style={s.meta}>
						<Paragraph.Text>{meta.join(" · ")}</Paragraph.Text>
					</Paragraph>
					{charge.memo ? (
						<Paragraph
							typography="t7"
							color={colors.textTertiary}
							style={s.memo}
						>
							<Paragraph.Text>{charge.memo}</Paragraph.Text>
						</Paragraph>
					) : null}
				</div>

				<Paragraph typography="t6" fontWeight="bold" color={colors.textPrimary}>
					<Paragraph.Text>{formatKrw(charge.amount)}</Paragraph.Text>
				</Paragraph>
			</button>

			{accessory ? <div style={s.tail}>{accessory}</div> : null}
		</div>
	);
}

import { Paragraph } from "@toss/tds-mobile";
import { useMemo, useState } from "react";
import { MoneyBuddy } from "@/components/MoneyBuddy";
import { colors, radius, shadow, spacing } from "@/design/tokens";
import { useCharges } from "@/hooks/useCharges";
import { clearCharges } from "@/services/chargeStore";
import {
	activeCharges,
	currentYearMonth,
	formatKrw,
	monthlyTotal,
} from "@/services/charges";
import { clearConfirmations } from "@/services/confirmStore";

const s = {
	page: {
		padding: `${spacing.xs}px ${spacing.md}px ${spacing.lg}px`,
	} satisfies React.CSSProperties,
	title: {
		padding: `${spacing.sm}px 0 ${spacing.md}px`,
	} satisfies React.CSSProperties,
	card: {
		padding: spacing.md,
		marginBottom: spacing.sm,
		borderRadius: radius.xl,
		backgroundColor: colors.surface,
		boxShadow: shadow.card,
	} satisfies React.CSSProperties,
	row: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.sm,
		paddingBottom: spacing.xs,
	} satisfies React.CSSProperties,
	hint: { marginTop: spacing.xs } satisfies React.CSSProperties,
	action: { marginTop: spacing.md } satisfies React.CSSProperties,
	/** 되돌릴 수 없는 동작이라 중립색 대신 위험색으로 */
	dangerButton: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
		height: 48,
		border: "none",
		borderRadius: radius.full,
	} satisfies React.CSSProperties,
	footer: {
		display: "flex",
		flexDirection: "column" as const,
		alignItems: "center",
		gap: spacing.xs,
		padding: `${spacing.xxl}px 0 ${spacing.md}px`,
	} satisfies React.CSSProperties,
	footerText: { textAlign: "center" as const } satisfies React.CSSProperties,
};

export default function SettingsPage() {
	const charges = useCharges();
	const ym = useMemo(() => currentYearMonth(), []);
	const [confirmingClear, setConfirmingClear] = useState(false);

	const handleClear = () => {
		if (!confirmingClear) {
			setConfirmingClear(true);
			return;
		}
		clearCharges();
		clearConfirmations();
		setConfirmingClear(false);
	};

	return (
		<div style={s.page}>
			<Paragraph
				typography="t4"
				fontWeight="bold"
				color={colors.textPrimary}
				style={s.title}
			>
				<Paragraph.Text>설정</Paragraph.Text>
			</Paragraph>

			<div style={s.card}>
				<div style={s.row}>
					<Paragraph typography="t6" color={colors.textSecondary}>
						<Paragraph.Text>등록한 항목</Paragraph.Text>
					</Paragraph>
					<Paragraph
						typography="t6"
						fontWeight="bold"
						color={colors.textPrimary}
					>
						<Paragraph.Text>{`${charges.length}개`}</Paragraph.Text>
					</Paragraph>
				</div>
				<div style={s.row}>
					<Paragraph typography="t6" color={colors.textSecondary}>
						<Paragraph.Text>이번 달 고정지출</Paragraph.Text>
					</Paragraph>
					<Paragraph
						typography="t6"
						fontWeight="bold"
						color={colors.textPrimary}
					>
						<Paragraph.Text>
							{formatKrw(monthlyTotal(charges, ym))}
						</Paragraph.Text>
					</Paragraph>
				</div>
				<Paragraph typography="t7" color={colors.textTertiary} style={s.hint}>
					<Paragraph.Text>
						{`이번 달에 실제로 빠지는 항목은 ${activeCharges(charges, ym).length}개예요.`}
					</Paragraph.Text>
				</Paragraph>
			</div>

			<div style={s.card}>
				<div style={s.row}>
					<Paragraph typography="t6" color={colors.textSecondary}>
						<Paragraph.Text>저장 위치</Paragraph.Text>
					</Paragraph>
					<Paragraph
						typography="t6"
						fontWeight="bold"
						color={colors.textPrimary}
					>
						<Paragraph.Text>이 기기</Paragraph.Text>
					</Paragraph>
				</div>
				<div style={s.row}>
					<Paragraph typography="t6" color={colors.textSecondary}>
						<Paragraph.Text>버전</Paragraph.Text>
					</Paragraph>
					<Paragraph
						typography="t6"
						fontWeight="bold"
						color={colors.textPrimary}
					>
						<Paragraph.Text>{__APP_VERSION__}</Paragraph.Text>
					</Paragraph>
				</div>
				<Paragraph typography="t7" color={colors.textTertiary} style={s.hint}>
					<Paragraph.Text>
						서버에 보내지 않아요. 앱을 지우면 등록한 항목도 함께 사라져요.
					</Paragraph.Text>
				</Paragraph>
			</div>

			<div style={s.card}>
				<Paragraph typography="t6" fontWeight="bold" color={colors.textPrimary}>
					<Paragraph.Text>데이터 초기화</Paragraph.Text>
				</Paragraph>
				<Paragraph typography="t7" color={colors.textTertiary} style={s.hint}>
					<Paragraph.Text>
						등록한 항목과 이체 확인 기록을 모두 지워요. 되돌릴 수 없어요.
					</Paragraph.Text>
				</Paragraph>
				<div style={s.action}>
					<button
						type="button"
						disabled={charges.length === 0}
						style={{
							...s.dangerButton,
							backgroundColor:
								charges.length === 0 ? colors.surfaceSunken : "#FDECEC",
							cursor: charges.length === 0 ? "default" : "pointer",
						}}
						onClick={handleClear}
					>
						<Paragraph
							typography="t6"
							fontWeight="bold"
							color={charges.length === 0 ? colors.textTertiary : colors.danger}
						>
							<Paragraph.Text>
								{confirmingClear
									? "한 번 더 누르면 모두 삭제돼요"
									: "모든 항목 삭제"}
							</Paragraph.Text>
						</Paragraph>
					</button>
				</div>
			</div>
			<div style={s.footer}>
				<MoneyBuddy size={54} />
				<Paragraph
					typography="t7"
					color={colors.textTertiary}
					style={s.footerText}
				>
					<Paragraph.Text>매달 나가는 돈, 여기 다 적어두면 돼요</Paragraph.Text>
				</Paragraph>
			</div>
		</div>
	);
}

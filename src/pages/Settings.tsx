import { Button, Paragraph } from "@toss/tds-mobile";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { colors, radius, spacing } from "@/design/tokens";
import { useCharges } from "@/hooks/useCharges";
import { clearCharges } from "@/services/chargeStore";
import {
	activeCharges,
	currentYearMonth,
	formatKrw,
	monthlyTotal,
} from "@/services/charges";

const s = {
	screen: {
		minHeight: "100dvh",
		backgroundColor: colors.background,
		padding: `${spacing.md}px ${spacing.md}px ${spacing.xl}px`,
	} satisfies React.CSSProperties,
	title: {
		padding: `${spacing.md}px 0 ${spacing.lg}px`,
	} satisfies React.CSSProperties,
	card: {
		padding: spacing.md,
		borderRadius: radius.lg,
		backgroundColor: colors.surface,
		marginBottom: spacing.md,
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
};

export default function SettingsPage() {
	const navigate = useNavigate();
	const charges = useCharges();
	const yearMonth = useMemo(() => currentYearMonth(), []);
	const [confirmingClear, setConfirmingClear] = useState(false);

	const handleClear = () => {
		if (!confirmingClear) {
			setConfirmingClear(true);
			return;
		}
		clearCharges();
		setConfirmingClear(false);
	};

	return (
		<div style={s.screen}>
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
						<Paragraph.Text>이번 달 고정과금</Paragraph.Text>
					</Paragraph>
					<Paragraph
						typography="t6"
						fontWeight="bold"
						color={colors.textPrimary}
					>
						<Paragraph.Text>
							{formatKrw(monthlyTotal(charges, yearMonth))}
						</Paragraph.Text>
					</Paragraph>
				</div>
				<Paragraph typography="t7" color={colors.textTertiary} style={s.hint}>
					<Paragraph.Text>
						{`이번 달에 실제로 빠지는 항목은 ${activeCharges(charges, yearMonth).length}개예요. 데이터는 이 기기에만 저장돼요.`}
					</Paragraph.Text>
				</Paragraph>
			</div>

			<div style={s.card}>
				<Paragraph typography="t6" fontWeight="bold" color={colors.textPrimary}>
					<Paragraph.Text>데이터 초기화</Paragraph.Text>
				</Paragraph>
				<Paragraph typography="t7" color={colors.textTertiary} style={s.hint}>
					<Paragraph.Text>
						등록한 항목을 모두 지워요. 되돌릴 수 없어요.
					</Paragraph.Text>
				</Paragraph>
				<div style={s.action}>
					<Button
						size="medium"
						color="dark"
						variant="weak"
						display="block"
						disabled={charges.length === 0}
						onClick={handleClear}
					>
						{confirmingClear
							? "한 번 더 누르면 모두 삭제돼요"
							: "모든 항목 삭제"}
					</Button>
				</div>
			</div>

			<Button
				size="large"
				color="dark"
				variant="weak"
				display="block"
				onClick={() => navigate("/", { replace: true })}
			>
				홈으로
			</Button>
		</div>
	);
}

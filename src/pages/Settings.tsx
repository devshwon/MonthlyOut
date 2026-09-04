import { Button, Paragraph } from "@toss/tds-mobile";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconChevronLeft } from "@/components/icons";
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
		padding: `${spacing.xs}px ${spacing.md}px ${spacing.xxl}px`,
	} satisfies React.CSSProperties,
	topBar: {
		display: "flex",
		alignItems: "center",
		height: 48,
	} satisfies React.CSSProperties,
	backButton: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: 36,
		height: 36,
		marginLeft: -spacing.xs,
		border: "none",
		borderRadius: radius.full,
		background: "none",
		cursor: "pointer",
	} satisfies React.CSSProperties,
	title: {
		padding: `${spacing.xs}px 0 ${spacing.lg}px`,
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
};

export default function SettingsPage() {
	const navigate = useNavigate();
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
			<div style={s.topBar}>
				<button
					type="button"
					style={s.backButton}
					aria-label="뒤로"
					onClick={() => navigate(-1)}
				>
					<IconChevronLeft size={22} color={colors.textSecondary} />
				</button>
			</div>

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
				<Paragraph typography="t6" fontWeight="bold" color={colors.textPrimary}>
					<Paragraph.Text>데이터는 이 기기에만 있어요</Paragraph.Text>
				</Paragraph>
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
		</div>
	);
}

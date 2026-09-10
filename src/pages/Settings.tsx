import { Paragraph, Switch, TextField } from "@toss/tds-mobile";
import { useMemo, useState } from "react";
import { MoneyBuddy } from "@/components/MoneyBuddy";
import { NOTIFICATION_TEMPLATE_CODE } from "@/constants/notification";
import { colors, radius, shadow, spacing } from "@/design/tokens";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useCharges } from "@/hooks/useCharges";
import { clearCharges } from "@/services/chargeStore";
import {
	activeCharges,
	currentYearMonth,
	formatAmount,
	formatKrw,
	monthlyTotal,
} from "@/services/charges";
import { clearConfirmations } from "@/services/confirmStore";
import { requestReminderAgreement } from "@/services/reminder";
import { updateSettings } from "@/services/settingsStore";

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
	const settings = useAppSettings();
	const [incomeText, setIncomeText] = useState(
		settings.monthlyIncome ? String(settings.monthlyIncome) : "",
	);
	const [requestingAgreement, setRequestingAgreement] = useState(false);
	const [agreementResult, setAgreementResult] = useState<string | null>(null);

	/**
	 * 알림은 SDK가 동의만 받고 발송은 콘솔 스마트발송이 한다.
	 * 그래서 토글을 켜는 건 "토스에 수신 동의를 남기는" 일이다.
	 */
	const handleNotification = async (checked: boolean) => {
		if (!checked) {
			updateSettings({ notificationAgreed: false });
			setAgreementResult(null);
			return;
		}

		setRequestingAgreement(true);
		const result = await requestReminderAgreement(NOTIFICATION_TEMPLATE_CODE);
		setRequestingAgreement(false);

		updateSettings({ notificationAgreed: result === "agreed" });
		setAgreementResult(result);
	};

	const notificationNote =
		agreementResult === "unsupported"
			? "이 버전의 토스 앱에서는 알림 동의를 받을 수 없어요."
			: agreementResult === "rejected"
				? "동의하지 않아서 알림은 오지 않아요."
				: settings.notificationAgreed
					? "결제일 즈음에 확인하라고 알려드려요."
					: "매달 나가는 날, 확인하라고 알려드릴게요.";

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
				<Paragraph typography="t6" fontWeight="bold" color={colors.textPrimary}>
					<Paragraph.Text>매달 들어오는 돈</Paragraph.Text>
				</Paragraph>
				<Paragraph typography="t7" color={colors.textTertiary} style={s.hint}>
					<Paragraph.Text>
						적어두면 고정지출을 뺀 "쓸 수 있는 돈"을 홈에서 알려줘요.
					</Paragraph.Text>
				</Paragraph>
				<div style={s.action}>
					<TextField
						variant="box"
						labelOption="sustain"
						label="월 수입 (선택)"
						placeholder="0"
						inputMode="numeric"
						suffix="원"
						value={incomeText ? formatAmount(Number(incomeText)) : ""}
						onChange={(event) => {
							const digits = event.target.value.replace(/\D/g, "").slice(0, 10);
							setIncomeText(digits);
							updateSettings({
								monthlyIncome: digits ? Number(digits) : undefined,
							});
						}}
					/>
				</div>
			</div>

			<div style={s.card}>
				<div style={s.row}>
					<div>
						<Paragraph
							typography="t6"
							fontWeight="bold"
							color={colors.textPrimary}
						>
							<Paragraph.Text>결제일 알림 받기</Paragraph.Text>
						</Paragraph>
						<Paragraph
							typography="t7"
							color={colors.textTertiary}
							style={s.hint}
						>
							<Paragraph.Text>{notificationNote}</Paragraph.Text>
						</Paragraph>
					</div>
					<Switch
						checked={Boolean(settings.notificationAgreed)}
						disabled={requestingAgreement}
						onChange={(_, checked) => handleNotification(checked)}
					/>
				</div>
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

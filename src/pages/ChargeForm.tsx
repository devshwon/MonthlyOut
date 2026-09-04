import {
	Button,
	Chip,
	ChipItem,
	Paragraph,
	Switch,
	TextButton,
	TextField,
} from "@toss/tds-mobile";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IconChevronLeft } from "@/components/icons";
import { colors, radius, shadow, spacing } from "@/design/tokens";
import { useSafeAreaInsets } from "@/hooks/useSafeAreaInsets";
import {
	addCharge,
	getCharge,
	removeCharge,
	updateCharge,
} from "@/services/chargeStore";
import {
	CATEGORY_LABEL,
	CATEGORY_ORDER,
	currentYearMonth,
	formatAmount,
	formatKrw,
	isValidYearMonth,
	METHOD_KIND_LABEL,
	TERM_DEFAULT_CATEGORIES,
} from "@/services/charges";
import type { ChargeCategory, ChargeDraft, PaymentMethodKind } from "@/types";

const s = {
	page: {
		padding: `${spacing.xs}px ${spacing.md}px 0`,
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
	field: { marginBottom: spacing.sm } satisfies React.CSSProperties,
	label: { marginBottom: spacing.xs } satisfies React.CSSProperties,
	hint: { marginTop: spacing.xs } satisfies React.CSSProperties,
	switchRow: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.sm,
	} satisfies React.CSSProperties,
	termFields: {
		marginTop: spacing.md,
		paddingTop: spacing.md,
		borderTop: `1px solid ${colors.border}`,
	} satisfies React.CSSProperties,
	deleteWrap: {
		display: "flex",
		justifyContent: "center",
		padding: `${spacing.md}px 0 ${spacing.xl}px`,
	} satisfies React.CSSProperties,
	cta: {
		position: "sticky" as const,
		bottom: 0,
		padding: `${spacing.sm}px 0`,
		marginTop: spacing.md,
		background: `linear-gradient(180deg, rgba(244,246,249,0) 0%, ${colors.background} 32%)`,
	} satisfies React.CSSProperties,
};

function onlyDigits(value: string, maxLength: number): string {
	return value.replace(/\D/g, "").slice(0, maxLength);
}

/** "202609" → "2026-09" */
function formatMonthInput(value: string): string {
	const digits = onlyDigits(value, 6);
	return digits.length <= 4
		? digits
		: `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

export default function ChargeFormPage() {
	const navigate = useNavigate();
	const insets = useSafeAreaInsets();
	const { id } = useParams<{ id: string }>();
	const editing = id && id !== "new" ? getCharge(id) : undefined;
	const thisMonth = useMemo(() => currentYearMonth(), []);

	const [name, setName] = useState(editing?.name ?? "");
	const [amountText, setAmountText] = useState(
		editing ? String(editing.amount) : "",
	);
	const [billingDayText, setBillingDayText] = useState(
		editing ? String(editing.billingDay) : "",
	);
	const [category, setCategory] = useState<ChargeCategory>(
		editing?.category ?? "subscription",
	);
	const [methodKind, setMethodKind] = useState<PaymentMethodKind>(
		editing?.method?.kind ?? "card",
	);
	const [methodName, setMethodName] = useState(editing?.method?.name ?? "");
	const [hasTerm, setHasTerm] = useState(Boolean(editing?.term));
	const [totalCountText, setTotalCountText] = useState(
		editing?.term ? String(editing.term.totalCount) : "",
	);
	const [startMonth, setStartMonth] = useState(
		editing?.term?.startMonth ?? thisMonth,
	);
	const [confirmingDelete, setConfirmingDelete] = useState(false);

	const amount = Number(amountText || 0);
	const billingDay = Math.min(Math.max(Number(billingDayText || 1), 1), 31);
	const totalCount = Number(totalCountText || 0);
	const termValid =
		!hasTerm || (totalCount > 0 && isValidYearMonth(startMonth));
	const canSave = name.trim().length > 0 && amount > 0 && termValid;

	const handleCategory = (next: ChargeCategory) => {
		setCategory(next);
		// 할부·대출은 기본이 유기한이다 — 사용자가 직접 끄기 전까지 켜준다.
		if (!editing && TERM_DEFAULT_CATEGORIES.includes(next)) {
			setHasTerm(true);
		}
	};

	const handleSave = () => {
		if (!canSave) {
			return;
		}

		const draft: ChargeDraft = {
			name: name.trim(),
			amount,
			billingDay,
			category,
			method: { kind: methodKind, name: methodName.trim() },
			term: hasTerm ? { totalCount, startMonth } : null,
		};

		if (editing) {
			updateCharge(editing.id, draft);
		} else {
			addCharge(draft);
		}
		navigate(-1);
	};

	const handleDelete = () => {
		if (!editing) {
			return;
		}
		if (!confirmingDelete) {
			setConfirmingDelete(true);
			return;
		}
		removeCharge(editing.id);
		navigate("/manage", { replace: true });
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
				<Paragraph.Text>
					{editing ? "항목 수정" : "무엇이 매달 나가나요?"}
				</Paragraph.Text>
			</Paragraph>

			<div style={s.card}>
				<div style={s.field}>
					<TextField
						variant="box"
						labelOption="sustain"
						label="이름"
						placeholder="예: 넷플릭스"
						value={name}
						onChange={(event) => setName(event.target.value)}
					/>
				</div>

				<div style={s.field}>
					<TextField
						variant="box"
						labelOption="sustain"
						label="매달 나가는 금액"
						placeholder="0"
						inputMode="numeric"
						suffix="원"
						value={amountText ? formatAmount(amount) : ""}
						onChange={(event) =>
							setAmountText(onlyDigits(event.target.value, 10))
						}
					/>
					<Paragraph typography="t7" color={colors.textTertiary} style={s.hint}>
						<Paragraph.Text>
							할부는 산 금액이 아니라 매달 빠지는 금액을 넣어요.
						</Paragraph.Text>
					</Paragraph>
				</div>

				<TextField
					variant="box"
					labelOption="sustain"
					label="결제일"
					placeholder="예: 25"
					inputMode="numeric"
					suffix="일"
					value={billingDayText}
					onChange={(event) =>
						setBillingDayText(onlyDigits(event.target.value, 2))
					}
				/>
			</div>

			<div style={s.card}>
				<Paragraph typography="t7" color={colors.textSecondary} style={s.label}>
					<Paragraph.Text>분류</Paragraph.Text>
				</Paragraph>
				<Chip kind="select" wrap margin="none">
					{CATEGORY_ORDER.map((value) => (
						<ChipItem
							key={value}
							selected={category === value}
							onClick={() => handleCategory(value)}
						>
							{CATEGORY_LABEL[value]}
						</ChipItem>
					))}
				</Chip>
			</div>

			<div style={s.card}>
				<Paragraph typography="t7" color={colors.textSecondary} style={s.label}>
					<Paragraph.Text>어디서 빠지나요</Paragraph.Text>
				</Paragraph>
				<Chip kind="select" margin="none">
					{(["card", "account"] as PaymentMethodKind[]).map((kind) => (
						<ChipItem
							key={kind}
							selected={methodKind === kind}
							onClick={() => setMethodKind(kind)}
						>
							{METHOD_KIND_LABEL[kind]}
						</ChipItem>
					))}
				</Chip>
				<div style={{ marginTop: spacing.sm }}>
					<TextField
						variant="box"
						labelOption="sustain"
						label={methodKind === "card" ? "카드 이름" : "통장 이름"}
						placeholder={
							methodKind === "card" ? "예: 신한카드" : "예: 국민은행 통장"
						}
						value={methodName}
						onChange={(event) => setMethodName(event.target.value)}
					/>
				</div>
			</div>

			<div style={s.card}>
				<div style={s.switchRow}>
					<div>
						<Paragraph
							typography="t6"
							fontWeight="bold"
							color={colors.textPrimary}
						>
							<Paragraph.Text>끝나는 날이 있어요</Paragraph.Text>
						</Paragraph>
						<Paragraph
							typography="t7"
							color={colors.textTertiary}
							style={s.hint}
						>
							<Paragraph.Text>할부·대출처럼 회차가 정해진 항목</Paragraph.Text>
						</Paragraph>
					</div>
					<Switch
						checked={hasTerm}
						onChange={(_, checked) => setHasTerm(checked)}
					/>
				</div>

				{hasTerm ? (
					<div style={s.termFields}>
						<div style={s.field}>
							<TextField
								variant="box"
								labelOption="sustain"
								label="총 회차"
								placeholder="예: 12"
								inputMode="numeric"
								suffix="회"
								value={totalCountText}
								onChange={(event) =>
									setTotalCountText(onlyDigits(event.target.value, 3))
								}
							/>
						</div>
						<TextField
							variant="box"
							labelOption="sustain"
							label="1회차가 빠지는 달"
							placeholder="2026-09"
							inputMode="numeric"
							value={startMonth}
							onChange={(event) =>
								setStartMonth(formatMonthInput(event.target.value))
							}
						/>
						{totalCount > 0 && amount > 0 && isValidYearMonth(startMonth) ? (
							<Paragraph
								typography="t7"
								color={colors.textTertiary}
								style={s.hint}
							>
								<Paragraph.Text>
									{`총 ${formatKrw(totalCount * amount)} · ${totalCount}회차로 나눠서 빠져요`}
								</Paragraph.Text>
							</Paragraph>
						) : null}
					</div>
				) : null}
			</div>

			<div style={{ ...s.cta, paddingBottom: spacing.sm + insets.bottom }}>
				<Button
					size="large"
					color="primary"
					variant="fill"
					display="block"
					disabled={!canSave}
					onClick={handleSave}
				>
					저장
				</Button>
			</div>

			{editing ? (
				<div style={s.deleteWrap}>
					<TextButton
						size="medium"
						color={colors.danger}
						onClick={handleDelete}
					>
						{confirmingDelete ? "한 번 더 누르면 삭제돼요" : "항목 삭제"}
					</TextButton>
				</div>
			) : null}
		</div>
	);
}

import {
	Button,
	Chip,
	ChipItem,
	Paragraph,
	Switch,
	TextArea,
	TextButton,
	TextField,
} from "@toss/tds-mobile";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CategoryIcon, IconPencil } from "@/components/icons";
import {
	categoryColors,
	categorySoftColors,
	colors,
	radius,
	shadow,
	spacing,
} from "@/design/tokens";
import { useSafeAreaInsets } from "@/hooks/useSafeAreaInsets";
import {
	CATEGORY_GROUPS,
	type CategoryGroupDef,
	findGroup,
	findSubCategory,
} from "@/services/categoryGroups";
import {
	addCharge,
	getCharge,
	removeCharge,
	updateCharge,
} from "@/services/chargeStore";
import {
	CATEGORY_HINT,
	currentYearMonth,
	formatAmount,
	formatKrw,
	isValidYearMonth,
	josa,
	METHOD_KIND_LABEL,
	TERM_DEFAULT_CATEGORIES,
} from "@/services/charges";
import type { ChargeCategory, ChargeDraft, PaymentMethodKind } from "@/types";

const s = {
	page: {
		padding: `${spacing.xs}px ${spacing.md}px 0`,
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
	categoryGrid: {
		display: "grid",
		gridTemplateColumns: "repeat(4, 1fr)",
		gap: spacing.xs,
	} satisfies React.CSSProperties,
	categoryTile: {
		display: "flex",
		flexDirection: "column" as const,
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.xxs,
		padding: `${spacing.sm}px 0`,
		borderRadius: radius.md,
		cursor: "pointer",
	} satisfies React.CSSProperties,
	subSection: { marginTop: spacing.md } satisfies React.CSSProperties,
	subGrid: {
		display: "grid",
		gridTemplateColumns: "repeat(3, 1fr)",
		gap: spacing.xs,
	} satisfies React.CSSProperties,
	subTile: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		minHeight: 38,
		padding: `${spacing.xs}px ${spacing.xxs}px`,
		borderRadius: radius.md,
		cursor: "pointer",
	} satisfies React.CSSProperties,
	presetGrid: {
		display: "grid",
		gridTemplateColumns: "repeat(2, 1fr)",
		gap: spacing.xs,
		marginBottom: spacing.sm,
	} satisfies React.CSSProperties,
	presetTile: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.xxs,
		minHeight: 38,
		padding: `${spacing.xs}px ${spacing.xxs}px`,
		borderRadius: radius.md,
		cursor: "pointer",
	} satisfies React.CSSProperties,
	presetName: {
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap" as const,
	} satisfies React.CSSProperties,
	subLabel: { marginBottom: spacing.xs } satisfies React.CSSProperties,
	categoryHint: {
		marginTop: spacing.sm,
		textAlign: "center" as const,
	} satisfies React.CSSProperties,
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
	const [group, setGroup] = useState<CategoryGroupDef>(() =>
		editing
			? findGroup(editing.category, editing.subCategory)
			: CATEGORY_GROUPS[0],
	);
	const [subCategoryId, setSubCategoryId] = useState<string | undefined>(
		editing?.subCategory,
	);
	const [memo, setMemo] = useState(editing?.memo ?? "");
	// 프리셋에 없는 이름을 쓰는 중인지(= 이름 칸을 직접 연 상태)
	const [customName, setCustomName] = useState(() => {
		if (!editing?.name) {
			return false;
		}
		const presets = findSubCategory(editing.subCategory)?.presets ?? [];
		return !presets.includes(editing.name);
	});
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

	// 세부를 골랐으면 그쪽 카테고리가, 아니면 대분류의 기본 카테고리가 통계 기준이 된다.
	const selectedSub = findSubCategory(subCategoryId);
	const category: ChargeCategory = selectedSub?.category ?? group.category;

	// 이름은 선택 입력이다. 비워두면 고른 세부 항목(없으면 대분류) 이름으로 저장한다.
	const presets = selectedSub?.presets ?? [];
	const fallbackName = selectedSub?.label ?? group.label;
	const finalName = name.trim() || fallbackName;

	const amount = Number(amountText || 0);
	const billingDay = Math.min(Math.max(Number(billingDayText || 1), 1), 31);
	const totalCount = Number(totalCountText || 0);
	const termValid =
		!hasTerm || (totalCount > 0 && isValidYearMonth(startMonth));
	const canSave = amount > 0 && termValid;

	const handleGroup = (next: CategoryGroupDef) => {
		setGroup(next);
		setSubCategoryId(undefined);
		setName("");
		setCustomName(false);
		// 할부·대출은 기본이 유기한이다 — 사용자가 직접 끄기 전까지 켜준다.
		if (!editing && TERM_DEFAULT_CATEGORIES.includes(next.category)) {
			setHasTerm(true);
		}
	};

	const handleSubCategory = (id: string) => {
		setSubCategoryId(subCategoryId === id ? undefined : id);
		setName("");
		setCustomName(false);
	};

	const handleSave = () => {
		if (!canSave) {
			return;
		}

		const draft: ChargeDraft = {
			name: finalName,
			amount,
			billingDay,
			category,
			subCategory: subCategoryId,
			memo: memo.trim() || undefined,
			method: { kind: methodKind, name: methodName.trim() },
			term: hasTerm ? { totalCount, startMonth } : null,
		};

		if (editing) {
			updateCharge(editing.id, draft);
			navigate(-1);
			return;
		}

		addCharge(draft);
		// 새로 적었으면 방금 넣은 줄이 보이는 관리 화면으로 보낸다.
		navigate("/manage", { replace: true });
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
				<Paragraph typography="t7" color={colors.textSecondary} style={s.label}>
					<Paragraph.Text>어떤 종류인가요</Paragraph.Text>
				</Paragraph>

				<div style={s.categoryGrid}>
					{CATEGORY_GROUPS.map((value) => {
						const selected = group.id === value.id;

						return (
							<button
								key={value.id}
								type="button"
								aria-pressed={selected}
								style={{
									...s.categoryTile,
									border: selected
										? `1.5px solid ${categoryColors[value.category]}`
										: "1.5px solid transparent",
									backgroundColor: selected
										? categorySoftColors[value.category]
										: colors.surfaceSunken,
								}}
								onClick={() => handleGroup(value)}
							>
								<CategoryIcon
									category={value.category}
									size={22}
									color={
										selected
											? categoryColors[value.category]
											: colors.textTertiary
									}
								/>
								<Paragraph
									typography="t7"
									fontWeight={selected ? "bold" : "regular"}
									color={selected ? colors.textPrimary : colors.textSecondary}
								>
									<Paragraph.Text>{value.label}</Paragraph.Text>
								</Paragraph>
							</button>
						);
					})}
				</div>

				<div style={s.subSection}>
					<Paragraph
						typography="t7"
						color={colors.textTertiary}
						style={s.subLabel}
					>
						<Paragraph.Text>
							{selectedSub ? "골라둔 세부 항목" : "세부 항목 (건너뛰어도 돼요)"}
						</Paragraph.Text>
					</Paragraph>
					<div style={s.subGrid}>
						{group.items.map((item) => {
							const selected = subCategoryId === item.id;

							return (
								<button
									key={item.id}
									type="button"
									aria-pressed={selected}
									style={{
										...s.subTile,
										border: selected
											? `1.5px solid ${categoryColors[item.category]}`
											: "1.5px solid transparent",
										backgroundColor: selected
											? categorySoftColors[item.category]
											: colors.surfaceSunken,
									}}
									onClick={() => handleSubCategory(item.id)}
								>
									<Paragraph
										typography="t7"
										fontWeight={selected ? "bold" : "regular"}
										color={selected ? colors.textPrimary : colors.textSecondary}
									>
										<Paragraph.Text>{item.label}</Paragraph.Text>
									</Paragraph>
								</button>
							);
						})}
					</div>
				</div>

				<Paragraph
					typography="t7"
					color={colors.textTertiary}
					style={s.categoryHint}
				>
					<Paragraph.Text>{CATEGORY_HINT[category]}</Paragraph.Text>
				</Paragraph>
			</div>

			<div style={s.card}>
				<div style={s.field}>
					<Paragraph
						typography="t7"
						color={colors.textSecondary}
						style={s.label}
					>
						<Paragraph.Text>이름 (선택)</Paragraph.Text>
					</Paragraph>

					{presets.length > 0 ? (
						<div style={s.presetGrid}>
							{presets.map((preset) => {
								const selected = !customName && name === preset;

								return (
									<button
										key={preset}
										type="button"
										aria-pressed={selected}
										style={{
											...s.presetTile,
											border: selected
												? `1.5px solid ${colors.primary}`
												: "1.5px solid transparent",
											backgroundColor: selected
												? colors.primarySoft
												: colors.surfaceSunken,
										}}
										onClick={() => {
											setName(preset);
											setCustomName(false);
										}}
									>
										<Paragraph
											typography="t7"
											fontWeight={selected ? "bold" : "regular"}
											color={
												selected ? colors.textPrimary : colors.textSecondary
											}
											style={s.presetName}
										>
											<Paragraph.Text>{preset}</Paragraph.Text>
										</Paragraph>
									</button>
								);
							})}

							<button
								type="button"
								aria-pressed={customName}
								style={{
									...s.presetTile,
									border: customName
										? `1.5px solid ${colors.primary}`
										: "1.5px solid transparent",
									backgroundColor: customName
										? colors.primarySoft
										: colors.surfaceSunken,
								}}
								onClick={() => {
									setCustomName(true);
									setName("");
								}}
							>
								<IconPencil size={13} color={colors.textTertiary} />
								<Paragraph
									typography="t7"
									fontWeight={customName ? "bold" : "regular"}
									color={customName ? colors.textPrimary : colors.textSecondary}
								>
									<Paragraph.Text>직접 입력</Paragraph.Text>
								</Paragraph>
							</button>
						</div>
					) : null}

					{presets.length === 0 || customName ? (
						<TextField
							variant="box"
							labelOption="sustain"
							label="이름"
							placeholder={fallbackName}
							value={name}
							onChange={(event) => setName(event.target.value)}
						/>
					) : null}

					{name.trim().length === 0 ? (
						<Paragraph
							typography="t7"
							color={colors.textTertiary}
							style={s.hint}
						>
							<Paragraph.Text>
								{`안 적으면 '${fallbackName}'${josa(fallbackName, "으로", "로")} 저장돼요`}
							</Paragraph.Text>
						</Paragraph>
					) : null}
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

			<div style={s.card}>
				<Paragraph typography="t7" color={colors.textSecondary} style={s.label}>
					<Paragraph.Text>메모 (선택)</Paragraph.Text>
				</Paragraph>
				<TextArea
					variant="box"
					placeholder="예: 가족 공유 계정, 12월에 해지 예정"
					minHeight={72}
					value={memo}
					onChange={(event) => setMemo(event.target.value)}
				/>
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

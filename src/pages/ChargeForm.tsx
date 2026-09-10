import {
	Paragraph,
	Switch,
	TextArea,
	TextButton,
	TextField,
} from "@toss/tds-mobile";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HandDrawnCircle } from "@/components/HandDrawnCircle";
import {
	CategoryIcon,
	IconBank,
	IconCard,
	IconChevronRight,
	IconPencil,
} from "@/components/icons";
import { PrimaryButton } from "@/components/PrimaryButton";
import {
	categoryColors,
	categorySoftColors,
	colors,
	paperColors,
	radius,
	shadow,
	spacing,
} from "@/design/tokens";
import { useCharges } from "@/hooks/useCharges";
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
	addMonths,
	CATEGORY_HINT,
	currentYearMonth,
	formatAmount,
	formatKrw,
	formatYearMonth,
	isValidYearMonth,
	josa,
	METHOD_KIND_LABEL,
	TERM_DEFAULT_CATEGORIES,
	usedMethods,
} from "@/services/charges";
import type { ChargeCategory, ChargeDraft, PaymentMethodKind } from "@/types";

const s = {
	page: {
		padding: `${spacing.xs}px ${spacing.md}px 0`,
	} satisfies React.CSSProperties,
	title: {
		padding: `${spacing.sm}px 0 ${spacing.md}px`,
	} satisfies React.CSSProperties,
	/**
	 * 등록도 "내가 적는 곳"이라 종이로 맞춘다.
	 * 다만 **괘선은 깔지 않는다** — 입력 요소 높이가 제각각이라 줄과 절대 안 맞는다.
	 */
	card: {
		padding: `${spacing.xs}px ${spacing.md}px ${spacing.md}px`,
		marginBottom: spacing.sm,
		borderRadius: radius.xl,
		backgroundColor: paperColors.surface,
		boxShadow: shadow.card,
	} satisfies React.CSSProperties,
	field: { marginBottom: spacing.sm } satisfies React.CSSProperties,
	label: { marginBottom: spacing.xs } satisfies React.CSSProperties,
	categoryGrid: {
		display: "grid",
		gridTemplateColumns: "repeat(4, 1fr)",
		gap: spacing.xs,
	} satisfies React.CSSProperties,
	/** 카드/통장도 종류와 같은 네모 타일로 — 칩만 혼자 다른 모양이면 겉돈다 */
	methodGrid: {
		display: "grid",
		gridTemplateColumns: "repeat(2, 1fr)",
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
	stepRow: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		width: "100%",
		padding: `${spacing.sm}px 0`,
		border: "none",
		background: "none",
		cursor: "pointer",
	} satisfies React.CSSProperties,
	stepLabel: {
		flexShrink: 0,
		width: 34,
		textAlign: "left" as const,
	} satisfies React.CSSProperties,
	stepValue: {
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap" as const,
	} satisfies React.CSSProperties,
	stepValueWrap: {
		flex: 1,
		minWidth: 0,
		padding: `${spacing.xxs}px ${spacing.xs}px`,
	} satisfies React.CSSProperties,
	/** 고른 값에는 동그라미가 그대로 남는다 — 접히고 나서도 뭘 골랐는지 보이게 */
	stepValueCircled: {
		position: "relative" as const,
		minWidth: 0,
		padding: `${spacing.xxs}px ${spacing.sm}px`,
		marginRight: "auto",
	} satisfies React.CSSProperties,
	rowDivider: {
		height: 1,
		backgroundColor: colors.border,
	} satisfies React.CSSProperties,
	subSection: { marginTop: spacing.md } satisfies React.CSSProperties,
	subGrid: {
		display: "grid",
		gridTemplateColumns: "repeat(3, 1fr)",
		gap: spacing.xs,
	} satisfies React.CSSProperties,
	subTile: {
		position: "relative" as const,
		display: "flex",
		border: "none",
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
		position: "relative" as const,
		display: "flex",
		border: "none",
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
	endGrid: {
		display: "grid",
		gridTemplateColumns: "repeat(3, 1fr)",
		gap: spacing.xs,
	} satisfies React.CSSProperties,
	endTile: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		minHeight: 38,
		border: "none",
		borderRadius: radius.md,
		backgroundColor: colors.surfaceSunken,
		cursor: "pointer",
	} satisfies React.CSSProperties,
	endResume: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
		minHeight: 38,
		border: "none",
		borderRadius: radius.md,
		backgroundColor: colors.accentSoft,
		cursor: "pointer",
	} satisfies React.CSSProperties,
	deleteWrap: {
		display: "flex",
		justifyContent: "center",
		padding: `${spacing.md}px 0 ${spacing.xl}px`,
	} satisfies React.CSSProperties,
	/** 떠 있는 저장 버튼. 배경을 깔면 버튼이 판 위에 얹힌 것처럼 보여 그냥 띄운다. */
	cta: {
		position: "sticky" as const,
		bottom: 0,
		paddingTop: spacing.sm,
		marginTop: spacing.md,
	} satisfies React.CSSProperties,
};

/** 접힌 단계 한 줄. 누르면 그 단계만 펼쳐진다. */
function StepRow({
	label,
	value,
	open,
	muted = false,
	onToggle,
}: {
	label: string;
	value: string;
	open: boolean;
	muted?: boolean;
	onToggle: () => void;
}) {
	return (
		<button
			type="button"
			aria-expanded={open}
			style={s.stepRow}
			onClick={onToggle}
		>
			<Paragraph
				typography="t7"
				color={colors.textTertiary}
				style={s.stepLabel}
			>
				<Paragraph.Text>{label}</Paragraph.Text>
			</Paragraph>
			<span style={muted ? s.stepValueWrap : s.stepValueCircled}>
				{muted ? null : <HandDrawnCircle />}
				<Paragraph
					typography="t6"
					fontWeight="bold"
					color={muted ? colors.textTertiary : colors.textPrimary}
					style={s.stepValue}
				>
					<Paragraph.Text>{value}</Paragraph.Text>
				</Paragraph>
			</span>
			<span
				style={{
					display: "flex",
					transform: open ? "rotate(90deg)" : "none",
					transition: "transform 120ms ease",
				}}
			>
				<IconChevronRight size={16} color={colors.textTertiary} />
			</span>
		</button>
	);
}

type Step = "group" | "sub" | "name";

/** 해지 시점 선택지. 값은 이번 달 기준 오프셋(마지막으로 나간 달). */
const END_CHOICES = [
	{ offset: -1, label: "지난달까지" },
	{ offset: 0, label: "이번 달까지" },
	{ offset: 1, label: "다음 달까지" },
] as const;

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
	// 카드·통장은 보통 한두 개다. 이미 쓰던 걸 기본으로 골라두고, 필요할 때만 추가한다.
	const charges = useCharges();
	const methodOptions = useMemo(() => usedMethods(charges), [charges]);
	const defaultMethod = methodOptions[0];

	const [methodKind, setMethodKind] = useState<PaymentMethodKind>(
		editing?.method?.kind ?? defaultMethod?.kind ?? "card",
	);
	const [methodName, setMethodName] = useState(
		editing ? (editing.method?.name ?? "") : (defaultMethod?.name ?? ""),
	);
	const [customMethod, setCustomMethod] = useState(() => {
		if (!editing) {
			return methodOptions.length === 0;
		}
		const name = editing.method?.name?.trim();
		if (!name) {
			return true;
		}
		return !methodOptions.some(
			(option) => option.kind === editing.method?.kind && option.name === name,
		);
	});
	const [hasTerm, setHasTerm] = useState(Boolean(editing?.term));
	const [totalCountText, setTotalCountText] = useState(
		editing?.term ? String(editing.term.totalCount) : "",
	);
	const [startMonth, setStartMonth] = useState(
		editing?.term?.startMonth ?? thisMonth,
	);
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	/**
	 * 열려 있는 단계들. 지연 없이 바로 반영하되, **다음 단계에서 고를 때**
	 * 이전 단계가 닫힌다 — 고르자마자 접히면 뭘 골랐는지 확인할 틈이 없다.
	 */
	const [openSections, setOpenSections] = useState<Step[]>(
		editing ? [] : ["group"],
	);
	const isOpen = (step: Step) => openSections.includes(step);
	const toggleSection = (step: Step) =>
		setOpenSections(isOpen(step) ? [] : [step]);

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

	const methodsForKind = methodOptions.filter(
		(option) => option.kind === methodKind,
	);

	const handleMethodKind = (kind: PaymentMethodKind) => {
		setMethodKind(kind);
		const first = methodOptions.find((option) => option.kind === kind);
		setMethodName(first?.name ?? "");
		setCustomMethod(!first);
	};

	const handleGroup = (next: CategoryGroupDef) => {
		setGroup(next);
		setSubCategoryId(undefined);
		setName("");
		setCustomName(false);
		// 종류는 열어둔 채 세부를 연다. 세부를 고를 때 종류가 닫힌다.
		setOpenSections(["group", "sub"]);
		// 할부·대출은 기본이 유기한이다 — 사용자가 직접 끄기 전까지 켜준다.
		if (!editing && TERM_DEFAULT_CATEGORIES.includes(next.category)) {
			setHasTerm(true);
		}
	};

	const handleSubCategory = (id: string) => {
		const next = subCategoryId === id ? undefined : id;
		setSubCategoryId(next);
		setName("");
		setCustomName(false);
		// 세부를 고르면 종류가 닫히고, 프리셋이 있으면 이름 고르기가 열린다.
		const hasPresets = (findSubCategory(next ?? "")?.presets?.length ?? 0) > 0;
		setOpenSections(next && hasPresets ? ["sub", "name"] : ["sub"]);
	};

	const toDraft = (): ChargeDraft => ({
		name: finalName,
		amount,
		billingDay,
		category,
		subCategory: subCategoryId,
		memo: memo.trim() || undefined,
		method: { kind: methodKind, name: methodName.trim() },
		term: hasTerm ? { totalCount, startMonth } : null,
		endedMonth: editing?.endedMonth,
	});

	const handleSave = () => {
		if (!canSave) {
			return;
		}

		const draft = toDraft();

		if (editing) {
			updateCharge(editing.id, draft);
			navigate(-1);
			return;
		}

		addCharge(draft);
		// 새로 적었으면 방금 넣은 줄이 보이는 관리 화면으로 보낸다.
		navigate("/manage", { replace: true });
	};

	/** 해지 시점 선택 — 5일 결제라면 해지해도 이번 달까진 나가는 게 보통이라 기본은 "이번 달까지". */
	const handleEnd = (offset: number) => {
		if (!editing) {
			return;
		}
		updateCharge(editing.id, {
			...toDraft(),
			endedMonth: addMonths(thisMonth, offset),
		});
		navigate(-1);
	};

	const handleResume = () => {
		if (!editing) {
			return;
		}
		updateCharge(editing.id, { ...toDraft(), endedMonth: undefined });
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
				<StepRow
					label="종류"
					value={group.label}
					open={isOpen("group")}
					onToggle={() => toggleSection("group")}
				/>
				{isOpen("group") ? (
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
											? `2px solid ${categoryColors[value.category]}`
											: "2px solid transparent",
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
				) : null}

				<div style={s.rowDivider} />

				<StepRow
					label="세부"
					value={selectedSub?.label ?? "고르지 않음"}
					muted={!selectedSub}
					open={isOpen("sub")}
					onToggle={() => toggleSection("sub")}
				/>
				{isOpen("sub") ? (
					<>
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
											backgroundColor: selected
												? categorySoftColors[item.category]
												: colors.surfaceSunken,
										}}
										onClick={() => handleSubCategory(item.id)}
									>
										{selected ? <HandDrawnCircle /> : null}
										<Paragraph
											typography="t7"
											fontWeight={selected ? "bold" : "regular"}
											color={
												selected ? colors.textPrimary : colors.textSecondary
											}
										>
											<Paragraph.Text>{item.label}</Paragraph.Text>
										</Paragraph>
									</button>
								);
							})}
						</div>
						<Paragraph
							typography="t7"
							color={colors.textTertiary}
							style={s.categoryHint}
						>
							<Paragraph.Text>{CATEGORY_HINT[category]}</Paragraph.Text>
						</Paragraph>
					</>
				) : null}

				<div style={s.rowDivider} />

				<StepRow
					label="이름"
					value={name.trim() || fallbackName}
					muted={name.trim().length === 0}
					open={isOpen("name")}
					onToggle={() => toggleSection("name")}
				/>
				{isOpen("name") ? (
					<>
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
												backgroundColor: selected
													? colors.accentSoft
													: colors.surfaceSunken,
											}}
											onClick={() => {
												setName(preset);
												setCustomName(false);
												// 이름을 정하면 세부가 닫힌다.
												setOpenSections(["name"]);
											}}
										>
											{selected ? <HandDrawnCircle /> : null}
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
										backgroundColor: customName
											? colors.accentSoft
											: colors.surfaceSunken,
									}}
									onClick={() => {
										setCustomName(true);
										setName("");
									}}
								>
									{customName ? <HandDrawnCircle /> : null}
									<IconPencil size={13} color={colors.textTertiary} />
									<Paragraph
										typography="t7"
										fontWeight={customName ? "bold" : "regular"}
										color={
											customName ? colors.textPrimary : colors.textSecondary
										}
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
					</>
				) : null}
			</div>

			<div style={s.card}>
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
				<div style={s.methodGrid}>
					{(["card", "account"] as PaymentMethodKind[]).map((kind) => {
						const selected = methodKind === kind;
						const tone = kind === "card" ? colors.primary : colors.positive;
						const toneSoft =
							kind === "card" ? colors.primarySoft : colors.positiveSoft;
						const Icon = kind === "card" ? IconCard : IconBank;

						return (
							<button
								key={kind}
								type="button"
								aria-pressed={selected}
								style={{
									...s.categoryTile,
									border: selected
										? `2px solid ${tone}`
										: "2px solid transparent",
									backgroundColor: selected ? toneSoft : colors.surfaceSunken,
								}}
								onClick={() => handleMethodKind(kind)}
							>
								<Icon size={22} color={selected ? tone : colors.textTertiary} />
								<Paragraph
									typography="t7"
									fontWeight={selected ? "bold" : "regular"}
									color={selected ? colors.textPrimary : colors.textSecondary}
								>
									<Paragraph.Text>{METHOD_KIND_LABEL[kind]}</Paragraph.Text>
								</Paragraph>
							</button>
						);
					})}
				</div>

				{methodsForKind.length > 0 ? (
					<div style={{ ...s.presetGrid, marginTop: spacing.sm }}>
						{methodsForKind.map((option) => {
							const selected = !customMethod && methodName === option.name;

							return (
								<button
									key={option.name}
									type="button"
									aria-pressed={selected}
									style={{
										...s.presetTile,
										backgroundColor: selected
											? colors.accentSoft
											: colors.surfaceSunken,
									}}
									onClick={() => {
										setMethodName(option.name);
										setCustomMethod(false);
									}}
								>
									{selected ? <HandDrawnCircle /> : null}
									<Paragraph
										typography="t7"
										fontWeight={selected ? "bold" : "regular"}
										color={selected ? colors.textPrimary : colors.textSecondary}
										style={s.presetName}
									>
										<Paragraph.Text>{option.name}</Paragraph.Text>
									</Paragraph>
								</button>
							);
						})}

						<button
							type="button"
							aria-pressed={customMethod}
							style={{
								...s.presetTile,
								backgroundColor: customMethod
									? colors.accentSoft
									: colors.surfaceSunken,
							}}
							onClick={() => {
								setCustomMethod(true);
								setMethodName("");
							}}
						>
							{customMethod ? <HandDrawnCircle /> : null}
							<IconPencil size={13} color={colors.textTertiary} />
							<Paragraph
								typography="t7"
								fontWeight={customMethod ? "bold" : "regular"}
								color={customMethod ? colors.textPrimary : colors.textSecondary}
							>
								<Paragraph.Text>새로 적기</Paragraph.Text>
							</Paragraph>
						</button>
					</div>
				) : null}

				{methodsForKind.length === 0 || customMethod ? (
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
				) : null}
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

			<div style={{ ...s.cta, paddingBottom: insets.bottom }}>
				<PrimaryButton disabled={!canSave} onClick={handleSave}>
					저장
				</PrimaryButton>
			</div>

			{editing ? (
				<div style={s.card}>
					<Paragraph
						typography="t7"
						color={colors.textSecondary}
						style={s.label}
					>
						<Paragraph.Text>
							{editing.endedMonth
								? `${formatYearMonth(editing.endedMonth)}까지 나갔어요`
								: "해지했나요?"}
						</Paragraph.Text>
					</Paragraph>

					{editing.endedMonth ? (
						<button type="button" style={s.endResume} onClick={handleResume}>
							<Paragraph
								typography="t7"
								fontWeight="bold"
								color={colors.accent}
							>
								<Paragraph.Text>다시 나가는 중으로 되돌리기</Paragraph.Text>
							</Paragraph>
						</button>
					) : (
						<>
							<div style={s.endGrid}>
								{END_CHOICES.map((choice) => (
									<button
										key={choice.offset}
										type="button"
										style={s.endTile}
										onClick={() => handleEnd(choice.offset)}
									>
										<Paragraph typography="t7" color={colors.textSecondary}>
											<Paragraph.Text>{choice.label}</Paragraph.Text>
										</Paragraph>
									</button>
								))}
							</div>
							<Paragraph
								typography="t7"
								color={colors.textTertiary}
								style={s.hint}
							>
								<Paragraph.Text>
									마지막으로 돈이 나간 달을 고르면, 그 달까지는 기록에 남고 다음
									달부터 빠져요.
								</Paragraph.Text>
							</Paragraph>
						</>
					)}
				</div>
			) : null}

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

import { Paragraph, TextField } from "@toss/tds-mobile";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BannerAd } from "@/components/BannerAd";
import { CategoryBar } from "@/components/CategoryBar";
import { ChargeRow } from "@/components/ChargeRow";
import { ConfirmButton } from "@/components/ConfirmButton";
import {
	IconBank,
	IconCard,
	IconChevronLeft,
	IconChevronRight,
} from "@/components/icons";
import { PrimaryButton } from "@/components/PrimaryButton";
import { AD_GROUP_IDS, MONTH_INFEED_PLACEMENT } from "@/constants/ads";
import {
	colors,
	paperBackground,
	paperColors,
	radius,
	shadow,
	spacing,
} from "@/design/tokens";
import { useCardBill } from "@/hooks/useCardBill";
import { useCharges } from "@/hooks/useCharges";
import { useConfirmedIds } from "@/hooks/useConfirmations";
import { removeCardBill, setCardBill } from "@/services/cardBillStore";
import {
	activeCharges,
	addMonths,
	categoryBreakdown,
	currentYearMonth,
	formatAmount,
	formatKrw,
	formatYearMonth,
	isSaving,
	isValidYearMonth,
	METHOD_KIND_LABEL,
	monthlyOutflow,
	monthlyTotal,
	totalByMethodKind,
	transferCharges,
	withdrawalGroups,
} from "@/services/charges";
import { toggleConfirmed } from "@/services/confirmStore";

const s = {
	page: {
		padding: `${spacing.md}px ${spacing.lg}px ${spacing.lg}px`,
	} satisfies React.CSSProperties,
	topBar: {
		display: "flex",
		alignItems: "center",
		// 월 이동만 남기고 가운데 정렬한다 — 왼쪽 끝에 두면 토스 내비바의
		// 뒤로가기와 헷갈린다(검수 2-6: 뒤로가기 중복 노출 금지).
		justifyContent: "center",
		height: 44,
	} satisfies React.CSSProperties,
	iconButton: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: 36,
		height: 36,
		border: "none",
		borderRadius: radius.full,
		background: "none",
		cursor: "pointer",
	} satisfies React.CSSProperties,
	monthSwitch: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xxs,
	} satisfies React.CSSProperties,
	summary: {
		padding: spacing.lg,
		marginBottom: spacing.md,
		borderRadius: radius.xxl,
		backgroundColor: colors.surface,
		boxShadow: shadow.card,
	} satisfies React.CSSProperties,
	summaryTotal: { marginTop: spacing.xxs } satisfies React.CSSProperties,
	methodRow: {
		display: "flex",
		gap: spacing.sm,
		marginTop: spacing.md,
		paddingTop: spacing.md,
		borderTop: `1px solid ${colors.border}`,
	} satisfies React.CSSProperties,
	methodItem: {
		display: "flex",
		flex: 1,
		alignItems: "center",
		gap: spacing.xs,
	} satisfies React.CSSProperties,
	/** 카테고리마다 카드를 쪼개면 같은 모양이 일곱 번 반복돼 스크롤만 길어진다 */
	groupRows: {
		backgroundColor: paperColors.surface,
		backgroundImage: paperBackground,
	} satisfies React.CSSProperties,
	inlineAd: {
		marginBottom: spacing.md,
		borderRadius: radius.xl,
		overflow: "hidden",
	} satisfies React.CSSProperties,
	listHint: { marginTop: spacing.xxs } satisfies React.CSSProperties,
	card: {
		marginBottom: spacing.md,
		borderRadius: radius.xl,
		backgroundColor: colors.surface,
		boxShadow: shadow.card,
		overflow: "hidden",
	} satisfies React.CSSProperties,
	billBox: {
		marginTop: spacing.md,
		paddingTop: spacing.md,
		borderTop: `1px solid ${colors.border}`,
	} satisfies React.CSSProperties,
	billButton: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		width: "100%",
		minHeight: 44,
		padding: 0,
		border: "none",
		background: "none",
		textAlign: "left" as const,
		cursor: "pointer",
	} satisfies React.CSSProperties,
	billBody: { flex: 1, minWidth: 0 } satisfies React.CSSProperties,
	billHint: { marginTop: spacing.xxs } satisfies React.CSSProperties,
	billActions: { marginTop: spacing.sm } satisfies React.CSSProperties,
	/** 날짜 머리. 괘선 위에 흰 띠로 덮어 줄과 겹치지 않게 한다. */
	dayHead: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		padding: `${spacing.sm}px ${spacing.md}px`,
		backgroundColor: colors.surface,
		borderBottom: `1px solid ${colors.border}`,
	} satisfies React.CSSProperties,
	/** 이미 지난 날 — 지우지 않고 힘만 뺀다 */
	dayHeadPast: { opacity: 0.6 } satisfies React.CSSProperties,
	headSpacer: { flex: 1 } satisfies React.CSSProperties,
	todayBadge: {
		padding: `1px ${spacing.xs}px`,
		borderRadius: radius.full,
		backgroundColor: colors.accentSoft,
	} satisfies React.CSSProperties,
	listHead: {
		padding: `0 ${spacing.xxs}px ${spacing.xs}px`,
	} satisfies React.CSSProperties,
	sectionTitle: { marginBottom: spacing.sm } satisfies React.CSSProperties,
	empty: {
		padding: `${spacing.xxl}px ${spacing.md}px`,
		textAlign: "center" as const,
	} satisfies React.CSSProperties,
};

export default function MonthDetailPage() {
	const navigate = useNavigate();
	const params = useParams<{ ym: string }>();
	const fallback = useMemo(() => currentYearMonth(), []);
	const ym = params.ym && isValidYearMonth(params.ym) ? params.ym : fallback;

	const charges = useCharges();
	const confirmed = useConfirmedIds(ym);
	const cardBill = useCardBill(ym);

	const active = activeCharges(charges, ym);
	const total = monthlyTotal(charges, ym);
	const methods = totalByMethodKind(charges, ym);
	const transfers = transferCharges(charges, ym);
	const confirmedCount = transfers.filter((charge) =>
		confirmed.has(charge.id),
	).length;
	const confirmedAllCount = active.filter((charge) =>
		confirmed.has(charge.id),
	).length;
	// 출금 층(기획서 4-2): 같은 날·같은 수단이 한 줄. 통장을 볼 때의 단위와 같다.
	const withdrawals = withdrawalGroups(charges, ym);
	const slices = categoryBreakdown(charges, ym);
	const isThisMonth = ym === fallback;
	const today = new Date().getDate();
	const outflow = monthlyOutflow(charges, ym, cardBill);

	const [editingBill, setEditingBill] = useState(false);
	const [billText, setBillText] = useState("");
	// 달을 넘기면 그 달의 값으로 갈아끼운다 — 8월 청구액이 9월 칸에 남아 있으면 안 된다.
	useEffect(() => {
		setEditingBill(false);
		setBillText(cardBill ? String(cardBill) : "");
	}, [cardBill]);

	return (
		<div style={s.page}>
			<div style={s.topBar}>
				<div style={s.monthSwitch}>
					<button
						type="button"
						style={s.iconButton}
						aria-label="이전 달"
						onClick={() =>
							navigate(`/month/${addMonths(ym, -1)}`, {
								replace: true,
								state: { stackReplace: true },
							})
						}
					>
						<IconChevronLeft size={18} color={colors.textTertiary} />
					</button>
					<Paragraph
						typography="t6"
						fontWeight="bold"
						color={colors.textPrimary}
					>
						<Paragraph.Text>{formatYearMonth(ym)}</Paragraph.Text>
					</Paragraph>
					<button
						type="button"
						style={s.iconButton}
						aria-label="다음 달"
						onClick={() =>
							navigate(`/month/${addMonths(ym, 1)}`, {
								replace: true,
								state: { stackReplace: true },
							})
						}
					>
						<IconChevronRight size={18} color={colors.textTertiary} />
					</button>
				</div>
			</div>

			<div style={s.summary}>
				<Paragraph typography="t7" color={colors.textTertiary}>
					<Paragraph.Text>{`${formatYearMonth(ym)} 고정지출`}</Paragraph.Text>
				</Paragraph>
				<Paragraph
					typography="t3"
					fontWeight="bold"
					color={colors.textPrimary}
					style={s.summaryTotal}
				>
					<Paragraph.Text>{formatKrw(total)}</Paragraph.Text>
				</Paragraph>

				<div style={s.methodRow}>
					<div style={s.methodItem}>
						<IconCard size={18} color={colors.primary} />
						<div>
							<Paragraph typography="t7" color={colors.textTertiary}>
								<Paragraph.Text>
									{cardBill ? "카드 청구액" : "카드 고정분"}
								</Paragraph.Text>
							</Paragraph>
							<Paragraph
								typography="t6"
								fontWeight="bold"
								color={colors.textPrimary}
							>
								<Paragraph.Text>
									{formatKrw(cardBill ?? methods.card)}
								</Paragraph.Text>
							</Paragraph>
						</div>
					</div>
					<div style={s.methodItem}>
						<IconBank size={18} color={colors.positive} />
						<div>
							<Paragraph typography="t7" color={colors.textTertiary}>
								<Paragraph.Text>
									{transfers.length > 0
										? `이체 · ${confirmedCount}/${transfers.length} 확인`
										: "이체"}
								</Paragraph.Text>
							</Paragraph>
							<Paragraph
								typography="t6"
								fontWeight="bold"
								color={colors.textPrimary}
							>
								<Paragraph.Text>{formatKrw(methods.account)}</Paragraph.Text>
							</Paragraph>
						</div>
					</div>
				</div>

				{/*
				 * 카드값은 카드사가 매달 알려주는 숫자라 사용자가 한 줄 적는다(기획서 5장).
				 * 앱이 아는 건 고정분까지이므로 **한계를 그대로 적는다** — "최소 X원은 확정"
				 * 이라고 말해야 오해가 없다.
				 */}
				<div style={s.billBox}>
					{editingBill ? (
						<>
							<TextField
								variant="box"
								labelOption="sustain"
								label={`${formatYearMonth(ym)} 카드 청구액`}
								placeholder="0"
								inputMode="numeric"
								suffix="원"
								value={billText ? formatAmount(Number(billText)) : ""}
								onChange={(event) =>
									setBillText(
										event.target.value.replace(/\D/g, "").slice(0, 10),
									)
								}
							/>
							<div style={s.billActions}>
								<PrimaryButton
									onClick={() => {
										const amount = Number(billText || 0);
										if (amount > 0) setCardBill(ym, amount);
										else removeCardBill(ym);
										setEditingBill(false);
									}}
								>
									{Number(billText || 0) > 0 ? "카드값 저장" : "적지 않기"}
								</PrimaryButton>
							</div>
						</>
					) : (
						<button
							type="button"
							style={s.billButton}
							onClick={() => setEditingBill(true)}
						>
							<span style={s.billBody}>
								<Paragraph typography="t7" color={colors.textSecondary}>
									<Paragraph.Text>
										{cardBill
											? `카드값 중 ${formatKrw(outflow.cardFixed)}은 고정분이에요`
											: "카드사에서 받은 청구액을 적으면 더 정확해요"}
									</Paragraph.Text>
								</Paragraph>
								{cardBill ? (
									<Paragraph
										typography="t7"
										color={colors.textTertiary}
										style={s.billHint}
									>
										<Paragraph.Text>
											{`나머지 ${formatKrw(Math.max(cardBill - outflow.cardFixed, 0))}은 이번 달에 쓴 돈이에요`}
										</Paragraph.Text>
									</Paragraph>
								) : null}
							</span>
							<Paragraph
								typography="t7"
								fontWeight="bold"
								color={colors.accent}
							>
								<Paragraph.Text>{cardBill ? "수정" : "적기"}</Paragraph.Text>
							</Paragraph>
						</button>
					)}
				</div>
			</div>

			{/* 요약과 목록 사이 — 읽는 흐름이 한 번 끊기는 자리라 광고가 덜 방해된다 */}
			<div style={s.inlineAd}>
				<BannerAd
					adGroupId={AD_GROUP_IDS.BANNER_NATIVE}
					placement={MONTH_INFEED_PLACEMENT}
					variant="card"
				/>
			</div>

			{withdrawals.length === 0 ? (
				<div style={s.empty}>
					<Paragraph
						typography="t6"
						fontWeight="bold"
						color={colors.textPrimary}
					>
						<Paragraph.Text>이 달에 빠지는 항목이 없어요</Paragraph.Text>
					</Paragraph>
				</div>
			) : (
				<>
					<div style={s.listHead}>
						<Paragraph
							typography="t6"
							fontWeight="bold"
							color={colors.textPrimary}
						>
							<Paragraph.Text>언제 빠지나요</Paragraph.Text>
						</Paragraph>
						{active.length > confirmedAllCount ? (
							<Paragraph
								typography="t7"
								color={colors.textTertiary}
								style={s.listHint}
							>
								<Paragraph.Text>
									빠져나간 걸 확인하면 오른쪽 동그라미를 눌러 두세요.
								</Paragraph.Text>
							</Paragraph>
						) : null}
					</div>

					<div style={s.card}>
						{withdrawals.map((group, index) => {
							// 오늘이 속한 달을 볼 때만 지난 날과 남은 날이 의미가 있다.
							const past = isThisMonth && group.billingDay < today;
							const isToday = isThisMonth && group.billingDay === today;
							const methodLabel = group.method
								? group.method.name || METHOD_KIND_LABEL[group.method.kind]
								: null;

							return (
								<div key={group.key}>
									<div
										style={{
											...s.dayHead,
											...(index > 0
												? { borderTop: `1px solid ${colors.border}` }
												: null),
											...(past ? s.dayHeadPast : null),
										}}
									>
										<Paragraph
											typography="t6"
											fontWeight="bold"
											color={past ? colors.textTertiary : colors.textPrimary}
										>
											<Paragraph.Text>
												{methodLabel
													? `${group.billingDay}일 · ${methodLabel}`
													: `${group.billingDay}일`}
											</Paragraph.Text>
										</Paragraph>
										{isToday ? (
											<span style={s.todayBadge}>
												<Paragraph
													typography="t7"
													fontWeight="bold"
													color={colors.accent}
												>
													<Paragraph.Text>오늘</Paragraph.Text>
												</Paragraph>
											</span>
										) : null}
										<span style={s.headSpacer} />
										<Paragraph
											typography="t7"
											fontWeight="bold"
											color={colors.textSecondary}
										>
											<Paragraph.Text>{formatKrw(group.amount)}</Paragraph.Text>
										</Paragraph>
									</div>

									<div style={s.groupRows}>
										{group.charges.map((charge) => (
											<ChargeRow
												key={charge.id}
												charge={charge}
												yearMonth={ym}
												paper
												hideBillingDay
												hideMethod
												badge={isSaving(charge) ? "총액 제외" : undefined}
												onClick={() => navigate(`/charge/${charge.id}`)}
												accessory={
													<ConfirmButton
														done={confirmed.has(charge.id)}
														onToggle={() => toggleConfirmed(ym, charge.id)}
													/>
												}
											/>
										))}
									</div>
								</div>
							);
						})}
					</div>

					{slices.length > 0 ? (
						<div style={s.summary}>
							<Paragraph
								typography="t6"
								fontWeight="bold"
								color={colors.textPrimary}
								style={s.sectionTitle}
							>
								<Paragraph.Text>어디에 나가고 있나요</Paragraph.Text>
							</Paragraph>
							<CategoryBar slices={slices} legendLimit={5} />
						</div>
					) : null}
				</>
			)}
		</div>
	);
}

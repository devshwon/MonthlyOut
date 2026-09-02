/**
 * 광고 + 리워드 통합 샘플 페이지.
 *
 * 데모 흐름:
 * 1. **전면형 광고** — 단순 시청 (dismissed = 완료)
 * 2. **리워드 광고 + 포인트 지급** — userEarnedReward 이벤트로만 grantPromotion 호출
 * 3. **배너 광고** — TossAds.attachBanner 자동 갱신
 * 4. **알림 동의** — requestNotificationAgreement 옵트인
 *
 * 실제 운영 시:
 * - `constants/ads.ts` PRODUCTION_AD_IDS, `constants/promotion.ts` PROMOTION_CODES 채움
 * - 카테고리(비게임/게임)에 맞춰 grantPromotionWithLedger 두 번째 인자 조정
 */
import { Button, Paragraph } from "@toss/tds-mobile";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BannerAd } from "@/components/BannerAd";
import { AD_GROUP_IDS } from "@/constants/ads";
import { DAILY_GRANT_LIMIT, PROMOTION_CODES } from "@/constants/promotion";
import { radius, spacing } from "@/design/tokens";
import { useFullScreenAd } from "@/hooks/useFullScreenAd";
import { canGrant } from "@/services/localGrantLedger";
import {
	getPromotionFailMessage,
	grantPromotionWithLedger,
	type PromotionResult,
} from "@/services/promotion";
import { requestReminderAgreement } from "@/services/reminder";

const REMINDER_TEMPLATE_CODE = "__PUT_REMINDER_TEMPLATE_CODE__";
const REWARD_PER_AD = 10; // 리워드 광고 1회 시청 보상 (원)

const s = {
	container: {
		minHeight: "100vh",
		backgroundColor: "#F9FAFB",
		padding: `${spacing.md}px ${spacing.sm}px`,
	} as React.CSSProperties,
	section: {
		backgroundColor: "#fff",
		border: "1px solid #E5E8EB",
		borderRadius: radius.lg,
		padding: spacing.md,
		marginBottom: spacing.md,
	} as React.CSSProperties,
	sectionTitle: { marginBottom: spacing.xs } as React.CSSProperties,
	sectionDesc: {
		color: "#6B7684",
		marginBottom: spacing.sm,
	} as React.CSSProperties,
	buttonGap: { marginTop: spacing.xs } as React.CSSProperties,
	toast: {
		padding: `${spacing.sm}px ${spacing.md}px`,
		borderRadius: radius.md,
		backgroundColor: "#F1F8E9",
		border: "1px solid #C5E1A5",
		color: "#33691E",
		marginTop: spacing.sm,
		fontSize: 14,
	} as React.CSSProperties,
	toastError: {
		backgroundColor: "#FFEBEE",
		borderColor: "#FFCDD2",
		color: "#C62828",
	} as React.CSSProperties,
	meta: {
		fontSize: 12,
		color: "#8B95A1",
		marginTop: spacing.xxs,
	} as React.CSSProperties,
};

export default function AdsAndRewardsPage() {
	const navigate = useNavigate();
	const interstitialAd = useFullScreenAd(AD_GROUP_IDS.INTERSTITIAL);
	const rewardedAd = useFullScreenAd(AD_GROUP_IDS.REWARDED);

	const [busy, setBusy] = useState<string | null>(null);
	const [message, setMessage] = useState<{
		text: string;
		error?: boolean;
	} | null>(null);
	const [todayEarned, setTodayEarned] = useState<number>(0);

	// ─── 전면형 광고 ───────────────────────────────
	const showInterstitial = async () => {
		if (busy) return;
		setBusy("interstitial");
		setMessage(null);
		try {
			const result = await interstitialAd.show();
			if (result.ok) {
				setMessage({ text: "광고 시청 완료!" });
			} else if (result.reason === "unsupported") {
				setMessage({ text: "광고를 표시할 수 없는 환경이에요", error: true });
			} else if (result.reason === "timeout") {
				setMessage({ text: "광고 로드 대기 시간 초과", error: true });
			} else {
				setMessage({ text: "광고 표시 실패", error: true });
			}
		} finally {
			setBusy(null);
		}
	};

	// ─── 리워드 광고 + 포인트 지급 ──────────────────
	// 공식 가이드: "userEarnedReward 이벤트가 발생했을 때만 리워드 지급. dismissed만으로는 지급 X"
	const showRewardedAndGrant = async () => {
		if (busy) return;
		setBusy("rewarded");
		setMessage(null);
		try {
			// 1) 리워드 광고 시청 — requireReward: true 이면 dismissed_no_reward도 실패로 처리
			const adResult = await rewardedAd.show({ requireReward: true });
			if (!adResult.ok) {
				if (adResult.reason === "unsupported") {
					setMessage({
						text: "리워드 광고를 표시할 수 없는 환경이에요",
						error: true,
					});
				} else if (adResult.reason === "dismissed_no_reward") {
					setMessage({
						text: "광고를 끝까지 봐야 포인트를 받을 수 있어요",
						error: true,
					});
				} else {
					setMessage({ text: "광고 표시 실패", error: true });
				}
				return;
			}

			// 2) 광고 시청 완료 → 토스 포인트 지급
			const promo: PromotionResult = await grantPromotionWithLedger(
				PROMOTION_CODES.REWARD_AD,
				REWARD_PER_AD,
				"nongame", // 게임 카테고리면 'game'
			);

			if (promo.ok) {
				setTodayEarned((prev) => prev + REWARD_PER_AD);
				setMessage({ text: `토스 포인트 ${REWARD_PER_AD}원 지급 완료!` });
			} else {
				const reason = promo.reason ?? "unknown";
				const detail =
					reason === "over_limit" && promo.remainingToday !== undefined
						? ` (오늘 ${promo.remainingToday}원 남음)`
						: "";
				setMessage({
					text: `${getPromotionFailMessage(reason)}${detail}`,
					error: true,
				});
			}
		} finally {
			setBusy(null);
		}
	};

	// ─── 알림 동의 ──────────────────────────────────
	const requestReminder = async () => {
		if (busy) return;
		setBusy("reminder");
		setMessage(null);
		try {
			const result = await requestReminderAgreement(REMINDER_TEMPLATE_CODE);
			if (result === "agreed") {
				setMessage({ text: "알림 동의 완료!" });
			} else if (result === "rejected") {
				setMessage({ text: "알림 동의를 거부했어요", error: true });
			} else {
				setMessage({
					text: "알림 기능을 사용할 수 없는 환경이에요",
					error: true,
				});
			}
		} finally {
			setBusy(null);
		}
	};

	// ─── 오늘 누적 조회 ──────────────────────────────
	const checkTodayTotal = async () => {
		const check = await canGrant(
			PROMOTION_CODES.REWARD_AD,
			0,
			DAILY_GRANT_LIMIT,
		);
		setMessage({
			text: `오늘 누적 ${check.todayTotal}원 / 한도 ${check.dailyLimit}원 (남음 ${check.remainingToday}원)`,
		});
	};

	return (
		<div style={s.container}>
			<Paragraph
				typography="t4"
				fontWeight="bold"
				color="#191F28"
				style={{ marginBottom: spacing.md }}
			>
				<Paragraph.Text>광고 + 리워드 샘플</Paragraph.Text>
			</Paragraph>

			{/* 1) 전면형 광고 */}
			<div style={s.section}>
				<Paragraph
					typography="t6"
					fontWeight="bold"
					color="#191F28"
					style={s.sectionTitle}
				>
					<Paragraph.Text>전면형 광고</Paragraph.Text>
				</Paragraph>
				<Paragraph typography="t7" style={s.sectionDesc}>
					<Paragraph.Text>
						단순 시청 — dismissed = 완료. 이벤트: requested → show → impression
						→ dismissed
					</Paragraph.Text>
				</Paragraph>
				<Button
					size="large"
					color="primary"
					variant="fill"
					display="block"
					disabled={busy === "interstitial"}
					onClick={showInterstitial}
				>
					{busy === "interstitial" ? "광고 로딩 중..." : "전면형 광고 보기"}
				</Button>
				<div style={s.meta}>adGroupId: {AD_GROUP_IDS.INTERSTITIAL}</div>
			</div>

			{/* 2) 리워드 광고 + 포인트 지급 */}
			<div style={s.section}>
				<Paragraph
					typography="t6"
					fontWeight="bold"
					color="#191F28"
					style={s.sectionTitle}
				>
					<Paragraph.Text>
						리워드 광고 + 토스 포인트 {REWARD_PER_AD}원
					</Paragraph.Text>
				</Paragraph>
				<Paragraph typography="t7" style={s.sectionDesc}>
					<Paragraph.Text>
						userEarnedReward 이벤트로만 포인트 지급. 도중 닫으면 지급 X.
					</Paragraph.Text>
				</Paragraph>
				<Button
					size="large"
					color="primary"
					variant="fill"
					display="block"
					disabled={busy === "rewarded"}
					onClick={showRewardedAndGrant}
				>
					{busy === "rewarded"
						? "광고 로딩 중..."
						: `광고 보고 ${REWARD_PER_AD}원 받기`}
				</Button>
				<div style={s.buttonGap}>
					<Button
						size="large"
						color="dark"
						variant="weak"
						display="block"
						onClick={checkTodayTotal}
					>
						오늘 누적 조회
					</Button>
				</div>
				<div style={s.meta}>
					이 세션 적립: {todayEarned}원 · 한도: {DAILY_GRANT_LIMIT}원/일
				</div>
				<div style={s.meta}>promotionCode: {PROMOTION_CODES.REWARD_AD}</div>
			</div>

			{/* 3) 배너 광고 */}
			<div style={s.section}>
				<Paragraph
					typography="t6"
					fontWeight="bold"
					color="#191F28"
					style={s.sectionTitle}
				>
					<Paragraph.Text>배너 광고</Paragraph.Text>
				</Paragraph>
				<Paragraph typography="t7" style={s.sectionDesc}>
					<Paragraph.Text>
						TossAds.attachBanner — 10초마다 자동 갱신, 화면 50%/1초 노출 시 수익
						발생.
					</Paragraph.Text>
				</Paragraph>
				<BannerAd adGroupId={AD_GROUP_IDS.BANNER} variant="expanded" />
				<div style={s.meta}>adGroupId: {AD_GROUP_IDS.BANNER}</div>
			</div>

			{/* 4) 알림 동의 */}
			<div style={s.section}>
				<Paragraph
					typography="t6"
					fontWeight="bold"
					color="#191F28"
					style={s.sectionTitle}
				>
					<Paragraph.Text>알림 수신 동의</Paragraph.Text>
				</Paragraph>
				<Paragraph typography="t7" style={s.sectionDesc}>
					<Paragraph.Text>
						토스 스마트 발송 옵트인. 실제 발송은 콘솔 '정기 발송' 캠페인이 담당.
					</Paragraph.Text>
				</Paragraph>
				<Button
					size="large"
					color="primary"
					variant="fill"
					display="block"
					disabled={busy === "reminder"}
					onClick={requestReminder}
				>
					{busy === "reminder" ? "요청 중..." : "알림 동의 요청"}
				</Button>
				<div style={s.meta}>templateCode: {REMINDER_TEMPLATE_CODE}</div>
			</div>

			{/* 결과 메시지 */}
			{message && (
				<div style={{ ...s.toast, ...(message.error ? s.toastError : {}) }}>
					{message.text}
				</div>
			)}

			<div style={{ marginTop: spacing.lg }}>
				<Button
					size="large"
					color="dark"
					variant="weak"
					display="block"
					onClick={() => navigate(-1)}
				>
					이전 화면
				</Button>
			</div>
		</div>
	);
}

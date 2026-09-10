import { Paragraph } from "@toss/tds-mobile";
import { useState } from "react";
import { MoneyBuddy } from "@/components/MoneyBuddy";
import { PrimaryButton } from "@/components/PrimaryButton";
import { AD_GROUP_IDS } from "@/constants/ads";
import { colors, radius, spacing } from "@/design/tokens";
import { useFullScreenAd } from "@/hooks/useFullScreenAd";

type Phase = "ask" | "playing" | "thanks" | "failed";

const s = {
	dim: {
		position: "fixed" as const,
		inset: 0,
		display: "flex",
		alignItems: "flex-end",
		justifyContent: "center",
		backgroundColor: "rgba(25, 31, 40, 0.45)",
		zIndex: 20,
	} satisfies React.CSSProperties,
	backdrop: {
		position: "absolute" as const,
		inset: 0,
		border: "none",
		background: "none",
		cursor: "default",
	} satisfies React.CSSProperties,
	sheet: {
		position: "relative" as const,
		width: "100%",
		maxWidth: 460,
		padding: `${spacing.xl}px ${spacing.lg}px ${spacing.lg}px`,
		borderRadius: `${radius.xxl}px ${radius.xxl}px 0 0`,
		backgroundColor: colors.surface,
		textAlign: "center" as const,
	} satisfies React.CSSProperties,
	title: { marginTop: spacing.sm } satisfies React.CSSProperties,
	body: { marginTop: spacing.xs } satisfies React.CSSProperties,
	cta: { marginTop: spacing.lg } satisfies React.CSSProperties,
	close: {
		width: "100%",
		padding: `${spacing.sm}px 0 0`,
		border: "none",
		background: "none",
		cursor: "pointer",
	} satisfies React.CSSProperties,
};

/**
 * "열심히 적고 있는 머니에게 용돈 주기" — 리워드 광고 한 편이 곧 후원이다.
 *
 * 보상을 사용자에게 주는 구조가 아니라 **앱을 후원하는** 구조라, 광고를 끝까지 본
 * 사실만 확인하고 고맙다는 말을 돌려준다. 뒤에 기능을 잠그지 않는다.
 */
export function AllowanceSheet({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const ad = useFullScreenAd(AD_GROUP_IDS.REWARDED);
	const [phase, setPhase] = useState<Phase>("ask");

	if (!open) {
		return null;
	}

	const handleWatch = async () => {
		setPhase("playing");
		// 보상을 사용자에게 주는 게 아니라 후원이라 `requireReward`를 켜지 않는다.
		// 광고가 노출되고 닫혔으면 그걸로 후원은 성립한다.
		const result = await ad.show();
		setPhase(result.ok || result.impressed ? "thanks" : "failed");
	};

	const close = () => {
		setPhase("ask");
		onClose();
	};

	return (
		<div style={s.dim}>
			{/* 바깥을 눌러 닫는 영역 — 버튼으로 둬야 키보드로도 닫을 수 있다 */}
			<button
				type="button"
				aria-label="닫기"
				style={s.backdrop}
				onClick={close}
			/>

			<div style={s.sheet}>
				<MoneyBuddy size={72} holdingChalk={phase !== "thanks"} />

				<Paragraph
					typography="t5"
					fontWeight="bold"
					color={colors.textPrimary}
					style={s.title}
				>
					<Paragraph.Text>
						{phase === "thanks"
							? "잘 받았어요, 고마워요"
							: phase === "failed"
								? "광고를 못 불러왔어요"
								: "머니에게 용돈 주기"}
					</Paragraph.Text>
				</Paragraph>

				<Paragraph typography="t7" color={colors.textTertiary} style={s.body}>
					<Paragraph.Text>
						{phase === "thanks"
							? "덕분에 계속 칠판을 지킬 수 있어요."
							: phase === "failed"
								? "잠시 뒤에 다시 시도해 주세요."
								: "광고를 한 편 보면 이 앱을 만드는 데 보탬이 돼요. 기능은 그대로 다 쓸 수 있어요."}
					</Paragraph.Text>
				</Paragraph>

				{phase === "thanks" ? null : (
					<div style={s.cta}>
						<PrimaryButton disabled={phase === "playing"} onClick={handleWatch}>
							{phase === "playing" ? "광고 준비 중" : "광고 보고 용돈 주기"}
						</PrimaryButton>
					</div>
				)}

				<button type="button" style={s.close} onClick={close}>
					<Paragraph typography="t7" color={colors.textTertiary}>
						<Paragraph.Text>
							{phase === "thanks" ? "닫기" : "다음에"}
						</Paragraph.Text>
					</Paragraph>
				</button>
			</div>
		</div>
	);
}

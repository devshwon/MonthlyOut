import { Paragraph } from "@toss/tds-mobile";
import { useEffect, useRef, useState } from "react";
import { MoneyBuddy } from "@/components/MoneyBuddy";
import { PrimaryButton } from "@/components/PrimaryButton";
import { AD_GROUP_IDS } from "@/constants/ads";
import { colors, radius, spacing } from "@/design/tokens";
import { useFullScreenAd } from "@/hooks/useFullScreenAd";
import { useSafeAreaInsets } from "@/hooks/useSafeAreaInsets";
import "./AllowanceSheet.css";

type Phase = "ask" | "playing" | "thanks" | "failed";

const s = {
	sheet: {
		padding: `${spacing.xl}px ${spacing.lg}px ${spacing.lg}px`,
		backgroundColor: colors.surface,
		textAlign: "center" as const,
	} satisfies React.CSSProperties,
	portrait: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: 96,
		height: 96,
		margin: "0 auto",
		borderRadius: radius.full,
		backgroundColor: colors.accentSoft,
	} satisfies React.CSSProperties,
	title: { marginTop: spacing.md } satisfies React.CSSProperties,
	body: {
		marginTop: spacing.xs,
		lineHeight: 1.7,
	} satisfies React.CSSProperties,
	note: {
		marginTop: spacing.lg,
		padding: spacing.sm,
		borderRadius: radius.md,
		backgroundColor: colors.background,
	} satisfies React.CSSProperties,
	cta: { marginTop: spacing.lg } satisfies React.CSSProperties,
	close: {
		width: "100%",
		minHeight: 48,
		marginTop: spacing.xs,
		padding: spacing.xs,
		border: "none",
		background: "none",
		cursor: "pointer",
	} satisfies React.CSSProperties,
};

/** 사용자가 선택한 전면광고 한 편으로 앱을 응원하는 시트. 결제나 사용자 보상은 없다. */
export function AllowanceSheet({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const ad = useFullScreenAd(AD_GROUP_IDS.INTERSTITIAL, { arm: open });
	const insets = useSafeAreaInsets();
	const [phase, setPhase] = useState<Phase>("ask");
	const dialogRef = useRef<HTMLDialogElement>(null);
	const watchingRef = useRef(false);
	const requestRef = useRef(0);

	useEffect(() => {
		const dialog = dialogRef.current;
		// showModal/close는 iOS 15.4부터 있다. 그 아래 기기에서 그냥 부르면 TypeError가
		// effect 밖으로 튀어 ErrorBoundary까지 올라가고 **앱 전체가 에러 화면**이 된다.
		// 응원 시트 하나 때문에 치를 값이 아니라, 없으면 시트만 조용히 안 열리게 둔다.
		if (open) {
			setPhase("ask");
			dialog?.showModal?.();
			dialog?.focus?.();
		} else {
			dialog?.close?.();
		}
		return () => {
			requestRef.current += 1;
			watchingRef.current = false;
		};
	}, [open]);

	const close = () => {
		if (watchingRef.current) return;
		onClose();
	};

	const handleWatch = async () => {
		if (watchingRef.current) return;
		watchingRef.current = true;
		const request = ++requestRef.current;
		setPhase("playing");
		try {
			const result = await ad.show();
			if (request !== requestRef.current) return;
			setPhase(result.ok || result.impressed ? "thanks" : "failed");
		} catch {
			if (request === requestRef.current) setPhase("failed");
		} finally {
			if (request === requestRef.current) watchingRef.current = false;
		}
	};

	return (
		// 바깥을 눌러 닫는 동작이다. 키보드로 닫는 길은 onCancel(Esc)이 이미 맡고 있고,
		// 여기에 키 핸들러를 더 달면 시트 안 어디서 키를 눌러도 닫히는 함정이 된다.
		// biome-ignore lint/a11y/useKeyWithClickEvents: Esc는 onCancel이 처리한다
		<dialog
			ref={dialogRef}
			className="allowance-dialog"
			tabIndex={-1}
			aria-labelledby="allowance-title"
			aria-describedby="allowance-description"
			onCancel={(event) => {
				event.preventDefault();
				close();
			}}
			onClick={(event) => {
				if (event.target === event.currentTarget) close();
			}}
		>
			<div style={{ ...s.sheet, paddingBottom: spacing.lg + insets.bottom }}>
				<div style={s.portrait}>
					<MoneyBuddy size={72} holdingChalk={phase !== "thanks"} />
				</div>
				<div aria-live="polite" aria-atomic="true">
					<h2
						id="allowance-title"
						style={{
							...s.title,
							fontSize: 22,
							lineHeight: 1.4,
							color: colors.textPrimary,
							marginBottom: 0,
						}}
					>
						{phase === "thanks"
							? "응원 잘 받았어요!"
							: phase === "failed"
								? "광고가 잠시 쉬고 있어요"
								: phase === "playing"
									? "광고를 준비하고 있어요"
									: "고정이를 응원해 주세요"}
					</h2>
					<p
						id="allowance-description"
						style={{
							...s.body,
							fontSize: 15,
							color: colors.textSecondary,
							marginBottom: 0,
						}}
					>
						{phase === "thanks" ? (
							<>
								소중한 시간 내줘서 고마워요.
								<br />
								덕분에 오늘도 힘내서 칠판을 지킬게요.
							</>
						) : phase === "failed" ? (
							<>
								지금은 광고를 불러오지 못했어요.
								<br />
								응원하려는 마음만으로도 고마워요.
							</>
						) : phase === "playing" ? (
							"잠시만 기다려 주세요."
						) : (
							<>
								광고 한 편이 고정이에게 작은 용돈이 돼요.
								<br />
								매달 함께할 수 있도록 힘을 보태주세요.
							</>
						)}
					</p>
				</div>
				{phase === "ask" ? (
					<div style={s.note}>
						<Paragraph typography="t7" color={colors.textTertiary}>
							<Paragraph.Text>
								결제 없이, 광고 시청으로 전하는 응원이에요.
							</Paragraph.Text>
						</Paragraph>
					</div>
				) : null}
				<div style={s.cta}>
					<PrimaryButton
						disabled={phase === "playing"}
						onClick={phase === "thanks" ? close : handleWatch}
					>
						{phase === "thanks"
							? "다시 칠판으로"
							: phase === "playing"
								? "광고 준비 중…"
								: phase === "failed"
									? "광고 다시 불러오기"
									: "광고 한 편으로 응원하기"}
					</PrimaryButton>
				</div>
				{phase !== "thanks" ? (
					<button
						type="button"
						style={s.close}
						disabled={phase === "playing"}
						onClick={close}
					>
						<Paragraph typography="t7" color={colors.textTertiary}>
							<Paragraph.Text>
								{phase === "failed"
									? "괜찮아요, 다음에 할게요"
									: "다음에 응원할게요"}
							</Paragraph.Text>
						</Paragraph>
					</button>
				) : null}
			</div>
		</dialog>
	);
}

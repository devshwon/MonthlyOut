/**
 * 토스 인앱 배너 광고 (Apps in Toss SDK 2.6.1+).
 *
 * - 토스앱 5.241.0+ 지원 (미만 버전: 빈 placeholder 노출)
 * - `TossAds.initialize` → `TossAds.attachBanner` 흐름
 * - 컴포넌트 언마운트 시 `destroy()` 호출로 메모리 누수 방지
 * - 같은 페이지에서 여러 번 사용해도 안전 (initialize는 모듈 레벨 singleton)
 *
 * ## 컨테이너 사이즈 (공식 가이드)
 * - 고정형 (variant='expanded'): width 100% + height 96px
 * - 인라인 (variant='card'): width 100% + height 미지정
 * - 단, 이 값은 로드 전 placeholder로만 쓰고, 렌더 후에는 minHeight를 0으로 접어
 *   광고 실제 높이만 차지하게 한다 — 실제 광고가 더 작을 때 아래 빈 띠(떠 보임) 방지.
 *
 * ## 화면 최하단 배치 (하단 고정 배너)
 * `flushBottom`을 켜면: 광고가 뜨는 동안은 화면 최하단에 플러시로 붙고,
 * 광고가 없을 때(로딩/노필/미지원)만 safe-area 스페이서를 남겨 위 요소(하단 네비 등)가
 * Android 제스처 바 / iOS 홈 인디케이터에 겹치지 않게 한다.
 * 배치 규칙 전체는 docs/bottom-banner-placement.md 참고.
 *
 * 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/BannerAd.md
 */
import { TossAds } from "@apps-in-toss/web-framework";
import { useEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "../hooks/useSafeAreaInsets";

export type BannerVariant = "card" | "expanded";
export type BannerTheme = "auto" | "light" | "dark";
export type BannerTone = "blackAndWhite" | "grey";

export interface BannerAdProps {
	adGroupId: string;
	variant?: BannerVariant;
	theme?: BannerTheme;
	tone?: BannerTone;
	/** 미지원/노필 시 보여줄 fallback 높이 (px) — 미지정 시 variant에 따라 자동 */
	fallbackHeight?: number;
	/**
	 * 화면 최하단(App 레벨 flex column 마지막 자식)에 마운트할 때 true.
	 * 광고가 뜨면 최하단 플러시, 광고가 없으면 safe-area 스페이서만 유지.
	 */
	flushBottom?: boolean;
	/** 컨테이너 추가 스타일 */
	style?: React.CSSProperties;
}

// ─── SDK 초기화 (모듈 레벨, 1회만) ────────────────────────
let initialized = false;
let initializing: Promise<boolean> | null = null;

function ensureInitialized(): Promise<boolean> {
	if (initialized) return Promise.resolve(true);
	if (initializing) return initializing;
	if (!TossAds?.initialize?.isSupported?.()) return Promise.resolve(false);

	initializing = new Promise<boolean>((resolve) => {
		try {
			TossAds.initialize({
				callbacks: {
					onInitialized: () => {
						initialized = true;
						console.log("[TossAds] initialized");
						resolve(true);
					},
					onInitializationFailed: (err) => {
						console.warn("[TossAds] init failed", err);
						resolve(false);
					},
				},
			});
		} catch (err) {
			console.warn("[TossAds] init exception", err);
			resolve(false);
		}
	});
	return initializing;
}

/**
 * 토스 인앱 배너 광고.
 *
 * @example
 * ```tsx
 * <BannerAd adGroupId={AD_GROUP_IDS.BANNER} variant="expanded" />
 * ```
 */
export function BannerAd({
	adGroupId,
	variant = "expanded",
	theme = "auto",
	tone = "blackAndWhite",
	fallbackHeight,
	flushBottom = false,
	style,
}: BannerAdProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [failed, setFailed] = useState(false);
	const [rendered, setRendered] = useState(false);
	const insets = useSafeAreaInsets();

	// 로드 전 placeholder 높이 — 렌더 후에는 0으로 접어 광고 실제 높이만 차지한다
	// (실제 광고가 이 값보다 작을 때 아래 빈 띠가 남는 것 방지, docs/bottom-banner-placement.md)
	const minHeight = fallbackHeight ?? (variant === "expanded" ? 96 : 64);

	useEffect(() => {
		let mounted = true;
		let destroy: (() => void) | null = null;

		(async () => {
			const ok = await ensureInitialized();
			if (!mounted || !ok || !containerRef.current) {
				if (mounted) setFailed(true);
				return;
			}
			if (!TossAds.attachBanner?.isSupported?.()) {
				setFailed(true);
				return;
			}

			try {
				const result = TossAds.attachBanner(adGroupId, containerRef.current, {
					theme,
					tone,
					variant,
					callbacks: {
						onAdRendered: (payload) => {
							console.log("[BannerAd] rendered", payload.slotId);
							if (mounted) setRendered(true);
						},
						onAdImpression: () => {
							console.log("[BannerAd] impression");
						},
						onAdViewable: () => {
							console.log("[BannerAd] viewable (수익 발생)");
						},
						onAdClicked: () => {
							console.log("[BannerAd] clicked");
						},
						onNoFill: () => {
							console.warn("[BannerAd] no fill");
							if (mounted) setFailed(true);
						},
						onAdFailedToRender: (payload) => {
							console.warn(
								"[BannerAd] failed to render",
								payload.error?.message,
							);
							if (mounted) setFailed(true);
						},
					},
				});
				if (result?.destroy) destroy = result.destroy;
			} catch (err) {
				console.warn("[BannerAd] attachBanner exception", err);
				if (mounted) setFailed(true);
			}
		})();

		return () => {
			mounted = false;
			if (destroy) {
				try {
					destroy();
				} catch {
					/* ignore */
				}
			}
		};
	}, [adGroupId, variant, theme, tone]);

	if (failed) {
		// 미지원/노필 — 인라인 배치는 공간만 차지하지 않게 완전히 숨긴다.
		// 최하단 배치는 위 요소(하단 네비 등)가 제스처 바에 겹치지 않게 safe-area 스페이서만 남긴다.
		if (flushBottom && insets.bottom > 0) {
			return <div style={{ width: "100%", height: insets.bottom }} />;
		}
		return null;
	}

	return (
		<div
			ref={containerRef}
			style={{
				width: "100%",
				minHeight: rendered ? 0 : minHeight,
				// 최하단 배치: 광고가 뜨면 플러시(패딩 0), 로딩 중에만 인셋을 잡아둔다
				paddingBottom: flushBottom && !rendered ? insets.bottom : 0,
				...style,
			}}
		/>
	);
}

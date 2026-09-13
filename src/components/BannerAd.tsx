/**
 * 토스 인앱 배너 광고 (Apps in Toss SDK 3.x).
 *
 * - 토스앱 5.241.0+ 지원 (미만: `isSupported()` false → 자리만 접는다)
 * - `TossAds.initialize` **완료를 기다린 뒤** `TossAds.attachBanner`
 * - 언마운트 시 `destroy()`
 *
 * ## 진단 로그가 붙어 있다 (ads-log)
 *
 * 이 컴포넌트의 콜백은 전부 `useAdSlot`이 준 `probe`로 흘러간다. 여기서 빠뜨리면
 * 리포트에 그 자리가 **아예 없는 줄**로 나타나고, 없는 행은 눈에 안 띄어서 몇 주씩
 * 방치된다. 특히 `onAdImpression`은 **payload를 그대로 넘겨야** 한다 —
 * `adMetadata.requestId`가 비어 있으면 토스가 세지 않는 노출인데, 안 넘기면
 * "우리는 100%, 콘솔은 0"을 우리 로그만으로는 영원히 못 가른다 (ads-log KI-30).
 *
 * ## 노필은 영구 실패가 아니다
 *
 * 예전엔 `onNoFill`에서 `setFailed(true)`로 컴포넌트를 숨겼다. 노필은 "지금 채울
 * 광고가 없다"이지 "이 환경에서는 안 된다"가 아닌데, 한 번 실패하면 그 실행 내내
 * 배너가 사라져 **그 세션의 노출이 0이 된다.** 재시도·판정 기록은 `useAdSlot`이
 * 맡는다 (ads-log KI-06).
 *
 * ## 컨테이너 사이즈
 * - 문구형/고정형 (`variant='expanded'`): width 100% + placeholder 96px
 * - 이미지형/인라인 (`variant='card'`): width 100% + placeholder 64px
 * 로드 전에만 placeholder로 자리를 잡고, 렌더 후에는 0으로 접어 광고 실제 높이만
 * 차지한다 — 실제 광고가 더 작을 때 아래 빈 띠가 남아 "떠 보이는" 것 방지.
 *
 * 배치 규칙 전체는 docs/bottom-banner-placement.md 참고.
 * 출처: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/BannerAd.md
 */
import { TossAds } from "@apps-in-toss/web-framework";
import { useEffect, useState } from "react";
import { adTypeOf } from "@/constants/ads";
import { useAdSlot } from "@/lib/ad-log/react";
import { useSafeAreaInsets } from "../hooks/useSafeAreaInsets";

export type BannerVariant = "card" | "expanded";
export type BannerTheme = "auto" | "light" | "dark";
export type BannerTone = "blackAndWhite" | "grey";

export interface BannerAdProps {
	adGroupId: string;
	/**
	 * 진단 리포트에서 이 자리를 가리키는 이름 — **화면마다 다르게 준다.**
	 * 같은 컴포넌트라도 자리가 다르면 다른 이름이어야 어디가 비었는지 보인다
	 * (ads-log `docs/attach-checklist.md` §0).
	 */
	placement: string;
	variant?: BannerVariant;
	theme?: BannerTheme;
	tone?: BannerTone;
	/** 로드 전 placeholder 높이 (px) — 미지정 시 variant에 따라 자동 */
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
type InitResult =
	| { ok: true }
	| { ok: false; reason: "unsupported" | "failed"; err?: unknown };

let initialized = false;
let initializing: Promise<InitResult> | null = null;

/**
 * initialize는 앱 수명 동안 한 번이면 된다. 슬롯마다 부르면 안 된다.
 *
 * **완료를 기다린 뒤 attach한다.** `attachBanner`를 초기화 전에 부르면 SDK가
 * `Call initialize() before attaching an ad`로 거절하고 콜백이 아예 안 와서 광고가
 * 조용히 없는 것이 된다. React는 자식 effect를 부모보다 **먼저** 실행하므로
 * App에서 initialize를 부르는 것만으로는 배너보다 앞선다는 보장이 없다 — 오히려
 * 항상 늦다. 그래서 호출부가 await 할 수 있는 모듈 싱글턴으로 둔다 (ads-log KI-15).
 *
 * 성공/실패를 boolean 하나로 뭉개지 않는다. "구버전 토스 앱이라 미지원"과 "초기화가
 * 실패"는 앞은 대응할 게 없고 뒤는 고쳐야 하는 문제라 로그에서 갈라야 한다 (KI-10).
 */
function ensureInitialized(): Promise<InitResult> {
	if (initialized) return Promise.resolve({ ok: true });
	if (initializing) return initializing;
	if (TossAds?.initialize?.isSupported?.() !== true) {
		return Promise.resolve({ ok: false, reason: "unsupported" });
	}

	initializing = new Promise<InitResult>((settle) => {
		try {
			TossAds.initialize({
				callbacks: {
					onInitialized: () => {
						initialized = true;
						settle({ ok: true });
					},
					onInitializationFailed: (err) =>
						settle({ ok: false, reason: "failed", err }),
				},
			});
		} catch (err) {
			settle({ ok: false, reason: "failed", err });
		}
	});
	return initializing;
}

/**
 * 토스 인앱 배너 광고.
 *
 * @example
 * ```tsx
 * <BannerAd
 *   adGroupId={AD_GROUP_IDS.BANNER}
 *   placement={BOTTOM_BANNER_PLACEMENT}
 *   variant="expanded"
 *   flushBottom
 * />
 * ```
 */
export function BannerAd({
	adGroupId,
	placement,
	variant = "expanded",
	theme = "auto",
	tone = "blackAndWhite",
	fallbackHeight,
	flushBottom = false,
	style,
}: BannerAdProps) {
	const { ref, probe, attemptKey, state } = useAdSlot<HTMLDivElement>({
		placement,
		// 종류를 상수로 박지 않고 ID에서 뽑는다 (ads-log KI-24).
		adType: adTypeOf(adGroupId),
		adGroupId,
	});

	const [rendered, setRendered] = useState(false);
	/** 렌더는 됐는데 실제 높이가 0으로 접힌 상태 — 예약 높이를 되살려야 한다. */
	const [collapsed, setCollapsed] = useState(false);
	const insets = useSafeAreaInsets();

	const minHeight = fallbackHeight ?? (variant === "expanded" ? 96 : 64);

	// biome-ignore lint/correctness/useExhaustiveDependencies: attemptKey는 본문에서 안 읽지만 재시도를 촉발하는 값이다 — 빼면 노필 뒤에 다시 붙지 않는다.
	useEffect(() => {
		// 취소 표시는 **이 effect 실행 것**이어야 한다. 컴포넌트 하나짜리 ref를
		// 공유하면, 정리된 실행이 기다리던 초기화가 끝났을 때 이미 다음 실행이 ref를
		// 되돌려 놔서 취소된 쪽도 attach를 계속한다 — 같은 자리에 광고가 두 장 붙는다.
		// (StrictMode의 이중 마운트에서 실제로 재현된다 — ads-log KI-31)
		let cancelled = false;
		let destroy: (() => void) | null = null;

		(async () => {
			const init = await ensureInitialized();
			if (cancelled) return;

			if (!init.ok) {
				if (init.reason === "unsupported") probe.unsupported("initialize");
				else probe.initFail(init.err);
				return;
			}
			const host = ref.current;
			if (host == null) return;

			if (TossAds.attachBanner?.isSupported?.() !== true) {
				probe.unsupported("attachBanner");
				return;
			}

			try {
				const result = TossAds.attachBanner(adGroupId, host, {
					theme,
					tone,
					variant,
					callbacks: {
						onAdRendered: () => {
							probe.rendered();
							if (!cancelled) setRendered(true);
						},
						// payload를 그대로 넘긴다 — requestId 지문이 여기 실려 있다 (KI-30).
						onAdImpression: (payload) => probe.impression(payload),
						onAdViewable: () => probe.viewable(),
						onAdClicked: () => probe.clicked(),
						// 화면 상태를 직접 바꾸지 않는다. 다시 받아볼지 접을지는
						// useAdSlot이 판단해 state로 알려준다 (KI-06).
						onNoFill: () => probe.nofill(),
						onAdFailedToRender: (payload) => probe.renderFail(payload.error),
					},
				});
				if (result?.destroy) destroy = result.destroy;
			} catch (err) {
				probe.threw(err);
			}
		})();

		return () => {
			cancelled = true;
			setRendered(false);
			if (destroy) {
				try {
					destroy();
				} catch {
					/* 정리 실패로 화면을 깨뜨리지 않는다 */
				}
			}
		};
		// attemptKey가 있어야 재시도 때 effect가 다시 돌아 새로 붙는다.
	}, [attemptKey, adGroupId, variant, theme, tone, probe, ref]);

	/**
	 * 렌더까지 됐는데 컨테이너 높이가 0이면 예약 높이를 되돌린다 (ads-log KI-05).
	 * 광고가 채워져도 그려질 공간이 없으면 노출이 0이 되는데, 노필·렌더실패와 달리
	 * 이 실패는 어떤 분기에도 안 걸려 조용히 샌다.
	 */
	useEffect(() => {
		if (!rendered) return;
		const el = ref.current;
		if (el == null) return;
		// 이미지가 늦게 채워지는 경우가 있어 한 박자 뒤에 잰다.
		const timer = window.setTimeout(() => {
			if (el.getBoundingClientRect().height < 8) setCollapsed(true);
		}, 400);
		return () => window.clearTimeout(timer);
	}, [rendered, ref]);

	// 더 시도하지 않는다(미지원·초기화 실패·재시도 소진).
	if (state === "gone") {
		// 인라인 배치는 공간을 차지하지 않게 완전히 숨긴다.
		// 최하단 배치는 **인셋만 남긴 자리를 그린다** — 이 자리가 있다는 전제로 위
		// 요소(플로팅 탭바)가 자기 세이프에어리어를 포기했기 때문에, 통째로 사라지면
		// 그 화면이 제스처 바/홈 인디케이터에 닿는다 (ads-log KI-32).
		if (flushBottom && insets.bottom > 0) {
			return <div style={{ flexShrink: 0, height: insets.bottom }} />;
		}
		return null;
	}

	// 재시도 대기 중에는 컨테이너를 DOM에 남겨야 한다(다음 시도의 attach 대상).
	// 화면에서만 접는다.
	const reserved =
		state === "waiting" ? 0 : rendered && !collapsed ? 0 : minHeight;

	// flexShrink:0을 빼지 말 것. 셸이 세로 flex라 넘칠 때 flex는 스크롤보다 압축을
	// 먼저 하는데, 렌더 후 minHeight가 0이라 이 자리는 바닥이 없어서 페이지 넘침을
	// 혼자 흡수해 실선 한 줄로 눌린다 (ads-log KI-29).
	//
	// ※ 하단 여백은 기존 규칙을 그대로 뒀다 — 광고가 뜨면 플러시(0), 로딩 중에만
	//   인셋을 잡아둔다(docs/bottom-banner-placement.md, navSpace()가 인셋을 안 더하는
	//   전제). 실기기에서 "다른 앱보다 배너가 떠 보인다"가 나오면 ads-log KI-32를
	//   볼 것 — 크리에이티브가 자체 여백 CREATIVE_INNER_PADDING(20px)을 갖고 있어서
	//   인셋을 그대로 더하면 두 겹이 된다. 그때의 정답은
	//   `max(8, insets.bottom - CREATIVE_INNER_PADDING)`이다.
	return (
		<div
			style={{
				flexShrink: 0,
				paddingBottom: flushBottom && !rendered ? insets.bottom : 0,
				...style,
			}}
		>
			<div ref={ref} style={{ width: "100%", minHeight: reserved }} />
		</div>
	);
}

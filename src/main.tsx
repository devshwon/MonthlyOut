import { TDSMobileAITProvider } from "@toss/tds-mobile-ait";
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initAdLog } from "@/lib/ad-log";
import App from "./App";

// 광고 진단 로그. **렌더보다 먼저** 부른다 — 전역 예외 후킹이 여기서 걸리므로 첫
// 렌더에서 터지는 예외까지 잡힌다. 광고가 안 뜨는 원인이 광고 코드가 아니라 그 위에서
// 터진 예외인 경우가 흔한데, 그러면 광고 로그에는 아무 흔적도 안 남는다.
//
// 값들은 취향이 아니라 13개 앱 실측 결과다(ads-log docs/attach-checklist.md §3).
// 바꾸려면 괄호 안 KI를 먼저 읽을 것.
initAdLog({
	app: "monthlyout", // ads-log의 ALLOWED_APPS와 철자까지 같아야 수집된다 (KI-02)
	appVersion: __APP_VERSION__,
	enabled: !import.meta.env.DEV,
	// 끄면 rendered 시점에 바로 ok로 확정하고 DOM을 한 번도 안 본다 — 가려짐·높이0·
	// 화면밖이 전부 ok로 묻힌다.
	//
	// 켠 근거(ads-log KI-11): 실기기 측정에서 렌더된 배너가 뒤이어 onAdViewable을 쐈다.
	// 13개 앱에서 켜고 돌린 결과 not_viewable 오탐은 전 기간 1건이었고, 대신 다른 앱의
	// 높이 0 붕괴와 화면밖 배너를 실제로 잡아냈다. 이 앱도 하루 뒤 late_viewable·
	// not_viewable 분포를 보고 재확인한다 — late_viewable이 크면 viewableMs를 올린다.
	strictViewable: true,
	// 8초로 두면 dispose(백그라운드 전환 = 로그 전송 시점)가 타이머를 먼저 죽여서
	// 가시성 검사가 아예 안 돈다 (KI-16).
	viewableMs: 3000,
	// HashRouter라 pathname은 해시 뒤에 있다.
	screen: () => location.hash.replace(/^#/, "") || "/",
});

const rootEl = document.getElementById("root");
if (rootEl) {
	const root = ReactDOM.createRoot(rootEl);
	root.render(
		<React.StrictMode>
			<ErrorBoundary>
				<TDSMobileAITProvider>
					<HashRouter>
						<App />
					</HashRouter>
				</TDSMobileAITProvider>
			</ErrorBoundary>
		</React.StrictMode>,
	);
}

// ── 전면·리워드 프리로드를 여기서 부르지 않는다 ──────────────────────────────
//
// 예전엔 진입 직후 idle에 `initializeFullScreenAd(REWARDED)`를 불렀다. 검수 7-4
// ("재생 시점 실시간 로딩 금지")를 지키려는 의도였는데, **광고를 볼 일이 없는 세션까지
// 매번 한 편씩 받아놓고 버리는** 형태가 된다. 실패가 아니라서 어떤 판정에도 안 걸리고
// eCPM만 조용히 깎인다 — 다른 앱 실측에서 155편을 받아 26편만 노출(17%)했다
// (ads-log KI-23 ★ 수익 누수). 게다가 리워드는 아직 운영 ID가 자리표시자라
// 받아봐야 과금되지 않는다.
//
// 검수 7-4는 "미리 받아둘 것"이지 "앱을 켜자마자 받을 것"이 아니다. 사전 로딩은
// `useFullScreenAd`의 `arm`에 **의도 신호**를 넘겨서 한다 — "사용자가 이 광고를 볼 수
// 있는 상태가 됐다"(버튼이 화면에 떴다·시트가 열렸다). 마운트나 "아직 잠겨 있다" 같은
// **상태**를 넘기면 거의 모든 세션에 참이라 마운트와 다를 게 없다.
//
//   const ad = useFullScreenAd(AD_GROUP_IDS.INTERSTITIAL, { arm: 볼_수_있는_상태 });
//   const r = await ad.show();

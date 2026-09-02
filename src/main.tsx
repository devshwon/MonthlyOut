import { TDSMobileAITProvider } from "@toss/tds-mobile-ait";
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AD_GROUP_IDS } from "@/constants/ads";
import { initializeFullScreenAd } from "@/services/fullScreenAd";
import { pruneOldLocalEntries } from "@/services/localGrantLedger";
import App from "./App";

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

// React 트리 렌더 후 idle 시점에 광고 SDK preload — 첫 클릭 즉시 노출 보장.
// (앱 시작 직후 자동 로그인은 정책상 금지: 사용자 액션에서만 ensureAccessToken 호출)
const startAdInit = () => {
	initializeFullScreenAd(AD_GROUP_IDS.INTERSTITIAL);
	initializeFullScreenAd(AD_GROUP_IDS.REWARDED);
	// 7일 초과된 로컬 원장 키 정리 (메모리/저장소 누적 방지)
	pruneOldLocalEntries();
};
const ric = (
	window as unknown as {
		requestIdleCallback?: (
			cb: () => void,
			opts?: { timeout?: number },
		) => number;
	}
).requestIdleCallback;
if (typeof ric === "function") {
	ric(startAdInit, { timeout: 1000 });
} else {
	setTimeout(startAdInit, 0);
}

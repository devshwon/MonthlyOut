import { TDSMobileAITProvider } from "@toss/tds-mobile-ait";
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AD_GROUP_IDS } from "@/constants/ads";
import { initializeFullScreenAd } from "@/services/fullScreenAd";
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

// 리워드 광고는 재생 시점에 로딩하면 검수에서 걸린다(7-4) — 진입 후 idle에 미리 받아둔다.
const preloadAds = () => {
	initializeFullScreenAd(AD_GROUP_IDS.REWARDED);
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
	ric(preloadAds, { timeout: 1500 });
} else {
	setTimeout(preloadAds, 0);
}

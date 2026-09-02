import { TDSMobileAITProvider } from "@toss/tds-mobile-ait";
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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

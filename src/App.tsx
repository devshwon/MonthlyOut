import { closeView, graniteEvent } from "@apps-in-toss/web-framework";
import { useEffect, useRef } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { FlowDebugPanel } from "@/components/FlowDebugPanel";
import ChargeFormPage from "@/pages/ChargeForm";
import HomePage from "@/pages/Home";
import NotFoundPage from "@/pages/NotFound";
import SettingsPage from "@/pages/Settings";
import { pushFlowDebugEvent } from "@/utils/flowDebug";

export default function App() {
	const location = useLocation();
	const navigate = useNavigate();
	const pathStackRef = useRef<string[]>([location.pathname || "/"]);

	useEffect(() => {
		const currentPath = location.pathname || "/";
		pushFlowDebugEvent("navigate", currentPath);
		const stack = pathStackRef.current;
		const top = stack[stack.length - 1];

		if (top !== currentPath) {
			stack.push(currentPath);
		}
	}, [location.pathname]);

	useEffect(() => {
		const subscription = graniteEvent.addEventListener("backEvent", {
			onEvent: () => {
				pushFlowDebugEvent("backEvent");
				const stack = pathStackRef.current;
				if (stack.length <= 1) {
					closeView();
					return;
				}

				// 현재 화면 pop 후 이전 화면으로 이동 (브라우저 히스토리 의존 제거)
				stack.pop();
				const previousPath = stack[stack.length - 1] || "/";
				navigate(previousPath, { replace: true });
			},
			onError: (error) => console.error("backEvent error:", error),
		});

		return () => {
			const cleanup = subscription as unknown;

			if (typeof cleanup === "function") {
				cleanup();
				return;
			}

			const removable = cleanup as { remove?: () => void } | null;
			if (removable?.remove) removable.remove();
		};
	}, [navigate]);

	return (
		<>
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/charge/new" element={<ChargeFormPage />} />
				<Route path="/charge/:id" element={<ChargeFormPage />} />
				<Route path="/settings" element={<SettingsPage />} />
				<Route path="*" element={<NotFoundPage />} />
			</Routes>
			<FlowDebugPanel />
		</>
	);
}

import { closeView, graniteEvent } from "@apps-in-toss/web-framework";
import { useEffect, useRef } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { FlowDebugPanel } from "@/components/FlowDebugPanel";
import { colors } from "@/design/tokens";
import { useSafeAreaInsets } from "@/hooks/useSafeAreaInsets";
import ChargeFormPage from "@/pages/ChargeForm";
import HomePage from "@/pages/Home";
import ManagePage from "@/pages/Manage";
import MonthDetailPage from "@/pages/MonthDetail";
import NotFoundPage from "@/pages/NotFound";
import SettingsPage from "@/pages/Settings";
import YearlyPage from "@/pages/Yearly";
import { pushFlowDebugEvent } from "@/utils/flowDebug";

/** 하단 탭을 띄우는 화면. 나머지(등록·상세·설정)는 스스로 뒤로가기를 가진다. */
const TAB_PATHS = ["/", "/manage", "/yearly"];

const s = {
	shell: {
		display: "flex",
		flexDirection: "column" as const,
		height: "100dvh",
		backgroundColor: colors.background,
	} satisfies React.CSSProperties,
	content: {
		flex: 1,
		overflowY: "auto" as const,
		WebkitOverflowScrolling: "touch" as const,
	} satisfies React.CSSProperties,
};

export default function App() {
	const location = useLocation();
	const navigate = useNavigate();
	const pathStackRef = useRef<string[]>([location.pathname || "/"]);
	const insets = useSafeAreaInsets();
	const currentPath = location.pathname || "/";
	const showNav = TAB_PATHS.includes(currentPath);

	useEffect(() => {
		pushFlowDebugEvent("navigate", currentPath);
		const stack = pathStackRef.current;
		const top = stack[stack.length - 1];

		if (top === currentPath) {
			return;
		}
		// 뒤로 간 경우(이전 항목으로 돌아옴)에는 쌓지 않고 걷어낸다.
		if (stack[stack.length - 2] === currentPath) {
			stack.pop();
			return;
		}
		stack.push(currentPath);
	}, [currentPath]);

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
		<div style={s.shell}>
			<main
				style={{
					...s.content,
					paddingBottom: showNav ? 0 : insets.bottom,
				}}
			>
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/manage" element={<ManagePage />} />
					<Route path="/yearly" element={<YearlyPage />} />
					<Route path="/month/:ym" element={<MonthDetailPage />} />
					<Route path="/charge/new" element={<ChargeFormPage />} />
					<Route path="/charge/:id" element={<ChargeFormPage />} />
					<Route path="/settings" element={<SettingsPage />} />
					<Route path="*" element={<NotFoundPage />} />
				</Routes>
			</main>

			{showNav ? <BottomNav /> : null}
			<FlowDebugPanel />
		</div>
	);
}

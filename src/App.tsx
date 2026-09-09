import { closeView, graniteEvent } from "@apps-in-toss/web-framework";
import { useEffect, useRef } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { BottomNav, navSpace } from "@/components/BottomNav";
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

/**
 * 하단 탭을 띄우는 화면.
 * 상세(/month/:ym)도 포함한다 — 연간에서 들어간 뒤 뒤로가기를 여러 번 누르지 않고
 * 탭으로 바로 돌아갈 수 있어야 한다.
 */
const TAB_PATHS = ["/", "/manage", "/yearly"];

function showsTabs(pathname: string): boolean {
	return TAB_PATHS.includes(pathname) || pathname.startsWith("/month/");
}

const s = {
	shell: {
		// 탭바가 콘텐츠 위에 떠 있으므로(플로팅) 기준 컨테이너가 된다.
		position: "relative" as const,
		display: "flex",
		flexDirection: "column" as const,
		height: "100dvh",
		overflow: "hidden" as const,
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
	const showNav = showsTabs(currentPath);

	// 같은 화면 안에서 월만 바꾸는 이동은 스택을 쌓지 않는다(뒤로가기 한 번이면 나가야 한다).
	const stackReplace = Boolean(
		(location.state as { stackReplace?: boolean } | null)?.stackReplace,
	);

	useEffect(() => {
		pushFlowDebugEvent("navigate", currentPath);
		const stack = pathStackRef.current;
		const top = stack[stack.length - 1];

		if (top === currentPath) {
			return;
		}
		if (stackReplace) {
			stack[stack.length - 1] = currentPath;
			return;
		}
		// 뒤로 간 경우(이전 항목으로 돌아옴)에는 쌓지 않고 걷어낸다.
		if (stack[stack.length - 2] === currentPath) {
			stack.pop();
			return;
		}
		stack.push(currentPath);
	}, [currentPath, stackReplace]);

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
					// 플로팅 탭바에 마지막 줄이 가리지 않도록 그만큼 비운다.
					paddingBottom: showNav ? navSpace(insets.bottom) : insets.bottom,
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

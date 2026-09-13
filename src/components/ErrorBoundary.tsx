import { Component, type ErrorInfo, type ReactNode } from "react";
import { logError } from "@/lib/ad-log";

interface Props {
	children: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("ErrorBoundary:", error, errorInfo);
		// 진단 로그로도 넘긴다. 전역 훅(window.onerror·unhandledrejection)은 렌더 중
		// 예외를 못 본다 — React가 여기서 잡아 삼키기 때문이다. 광고가 안 뜨는 원인이
		// 광고 코드가 아니라 그 위에서 터진 예외인 경우가 흔한데, 이 경로가 비어 있으면
		// 리포트에는 아무 흔적도 안 남는다.
		logError(
			error,
			{ componentStack: (errorInfo.componentStack ?? "").slice(0, 300) },
			"boundary",
		);
	}

	handleRetry = () => {
		window.location.hash = "";
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError && this.state.error) {
			return (
				<div
					style={{
						minHeight: "100vh",
						backgroundColor: "#3182F6",
						padding: 24,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						boxSizing: "border-box",
					}}
				>
					<p
						style={{
							margin: 0,
							marginBottom: 16,
							color: "#fff",
							textAlign: "center",
						}}
					>
						일시적인 오류가 발생했어요.
					</p>
					<button
						type="button"
						onClick={this.handleRetry}
						style={{
							padding: "8px 16px",
							borderRadius: 8,
							border: "none",
							backgroundColor: "#fff",
							color: "#333",
							cursor: "pointer",
							fontWeight: 600,
						}}
					>
						홈으로
					</button>
				</div>
			);
		}
		return this.props.children;
	}
}

import { Component, type ErrorInfo, type ReactNode } from "react";

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

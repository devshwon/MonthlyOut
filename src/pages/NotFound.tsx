import { Text } from "@toss/tds-mobile";
import { spacing } from "@/design/tokens";

const s = {
	container: {
		minHeight: "100vh",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		padding: spacing.xl,
		backgroundColor: "#fff",
	} as React.CSSProperties,
};

export default function NotFoundPage() {
	return (
		<div style={s.container}>
			<Text style={{ color: "#6B7684" }}>404: 페이지를 찾을 수 없어요.</Text>
		</div>
	);
}

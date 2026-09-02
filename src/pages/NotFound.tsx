import { Button, Paragraph } from "@toss/tds-mobile";
import { useNavigate } from "react-router-dom";
import { colors, spacing } from "@/design/tokens";

export default function NotFoundPage() {
	const navigate = useNavigate();

	return (
		<div
			style={{
				minHeight: "100dvh",
				backgroundColor: colors.background,
				padding: `${spacing.xxxl}px ${spacing.md}px`,
			}}
		>
			<Paragraph typography="t4" fontWeight="bold" color={colors.textPrimary}>
				<Paragraph.Text>없는 화면이에요</Paragraph.Text>
			</Paragraph>
			<div style={{ marginTop: spacing.lg }}>
				<Button
					size="large"
					color="primary"
					variant="fill"
					display="block"
					onClick={() => navigate("/", { replace: true })}
				>
					홈으로
				</Button>
			</div>
		</div>
	);
}

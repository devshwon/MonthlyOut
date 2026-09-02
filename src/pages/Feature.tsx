import { generateHapticFeedback } from "@apps-in-toss/web-framework";
import { Button, Paragraph } from "@toss/tds-mobile";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { radius, spacing } from "@/design/tokens";

const s = {
	container: {
		minHeight: "100vh",
		backgroundColor: "#F9FAFB",
		padding: `${spacing.md} ${spacing.sm}`,
	} as React.CSSProperties,
	section: {
		padding: `${spacing.md} 0`,
		borderTop: "1px solid #E5E8EB",
		borderBottom: "1px solid #E5E8EB",
	} as React.CSSProperties,
	title: { marginBottom: spacing.xs } as React.CSSProperties,
	input: {
		width: "100%",
		border: "1px solid #E5E8EB",
		borderRadius: radius.md,
		padding: spacing.md,
		boxSizing: "border-box" as const,
		marginTop: spacing.sm,
		marginBottom: spacing.md,
	} as React.CSSProperties,
	helper: { color: "#6B7684" } as React.CSSProperties,
	buttonGap: { marginTop: spacing.xs } as React.CSSProperties,
	resultCard: {
		border: "1px solid #E5E8EB",
		borderRadius: radius.md,
		backgroundColor: "#F9FAFB",
		padding: spacing.md,
		marginTop: spacing.lg,
	} as React.CSSProperties,
};

export default function FeaturePage() {
	const navigate = useNavigate();
	const [inputText, setInputText] = useState("");
	const [savedValue, setSavedValue] = useState("");

	const handleSave = async () => {
		const normalized = inputText.trim();
		if (!normalized) {
			return;
		}

		setSavedValue(normalized);
		await generateHapticFeedback({ type: "success" }).catch(() => undefined);
	};

	return (
		<div style={s.container}>
			<div style={s.section}>
				<Paragraph
					typography="t4"
					fontWeight="bold"
					color="#191F28"
					style={s.title}
				>
					<Paragraph.Text>기능 예시</Paragraph.Text>
				</Paragraph>

				<Paragraph typography="t7" style={s.helper}>
					<Paragraph.Text>
						폼 입력 후 저장 액션과 성공 피드백(햅틱) 흐름을 보여주는 샘플입니다.
					</Paragraph.Text>
				</Paragraph>

				<input
					type="text"
					value={inputText}
					placeholder="예: 사용자 이름"
					onChange={(event) => setInputText(event.target.value)}
					style={s.input}
				/>

				<Button
					size="large"
					color="primary"
					variant="fill"
					display="block"
					onClick={handleSave}
				>
					저장 예시 실행
				</Button>

				<div style={s.buttonGap}>
					<Button
						size="large"
						color="dark"
						variant="weak"
						display="block"
						onClick={() => navigate(-1)}
					>
						이전 화면
					</Button>
				</div>

				{savedValue ? (
					<div style={s.resultCard}>
						<Paragraph typography="t6" fontWeight="bold" color="#191F28">
							<Paragraph.Text>저장된 값</Paragraph.Text>
						</Paragraph>
						<Paragraph
							typography="t7"
							color="#4E5968"
							style={{ marginTop: spacing.xs }}
						>
							<Paragraph.Text>{savedValue}</Paragraph.Text>
						</Paragraph>
					</div>
				) : null}
			</div>
		</div>
	);
}

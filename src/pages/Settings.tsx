import { Button, Paragraph, Switch } from "@toss/tds-mobile";
import { useEffect, useState } from "react";
import { spacing } from "@/design/tokens";
import {
	getDefaultSettings,
	loadTemplateSettings,
	saveTemplateSettings,
} from "@/services/templateStorage";
import type { TemplateSettings } from "@/types";

const s = {
	container: {
		minHeight: "100vh",
		backgroundColor: "#F9FAFB",
		padding: `${spacing.md} ${spacing.sm}`,
	} as React.CSSProperties,
	section: {
		padding: `${spacing.sm} 0`,
		borderTop: "1px solid #E5E8EB",
		borderBottom: "1px solid #E5E8EB",
	} as React.CSSProperties,
	title: { marginBottom: spacing.md } as React.CSSProperties,
	row: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		padding: spacing.md,
		borderBottom: "1px solid #E5E8EB",
	} as React.CSSProperties,
	rowLabel: { marginRight: spacing.sm } as React.CSSProperties,
	rowDescription: {
		marginTop: spacing.xxs,
		color: "#8B95A1",
	} as React.CSSProperties,
	resetWrap: { marginTop: spacing.lg } as React.CSSProperties,
};

export default function SettingsPage() {
	const [settings, setSettings] = useState<TemplateSettings>(() =>
		loadTemplateSettings(),
	);

	useEffect(() => {
		saveTemplateSettings(settings);
	}, [settings]);

	const updateSetting = (partial: Partial<TemplateSettings>) => {
		setSettings((prev) => ({ ...prev, ...partial }));
	};

	const resetToDefault = () => {
		setSettings(getDefaultSettings());
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
					<Paragraph.Text>설정 예시</Paragraph.Text>
				</Paragraph>

				<div style={s.row}>
					<div style={s.rowLabel}>
						<Paragraph typography="t6" color="#191F28">
							<Paragraph.Text>푸시 알림 사용</Paragraph.Text>
						</Paragraph>
						<Paragraph typography="t7" style={s.rowDescription}>
							<Paragraph.Text>서비스 업데이트 안내 수신</Paragraph.Text>
						</Paragraph>
					</div>
					<Switch
						checked={settings.pushEnabled}
						onChange={(_, checked) => updateSetting({ pushEnabled: checked })}
					/>
				</div>

				<div style={s.row}>
					<div style={s.rowLabel}>
						<Paragraph typography="t6" color="#191F28">
							<Paragraph.Text>마케팅 수신 동의</Paragraph.Text>
						</Paragraph>
						<Paragraph typography="t7" style={s.rowDescription}>
							<Paragraph.Text>이벤트/혜택 알림 수신</Paragraph.Text>
						</Paragraph>
					</div>
					<Switch
						checked={settings.marketingConsent}
						onChange={(_, checked) =>
							updateSetting({ marketingConsent: checked })
						}
					/>
				</div>

				<div style={s.resetWrap}>
					<Button
						size="large"
						color="dark"
						variant="weak"
						display="block"
						onClick={resetToDefault}
					>
						초기값으로 복원
					</Button>
				</div>
			</div>
		</div>
	);
}

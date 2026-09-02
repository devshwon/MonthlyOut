import { Button, Paragraph } from "@toss/tds-mobile";
import { useNavigate } from "react-router-dom";
import { spacing } from "@/design/tokens";
import type { TemplateMenuItem } from "@/types";

const s = {
	container: {
		minHeight: "100vh",
		backgroundColor: "#F9FAFB",
		padding: `${spacing.md} ${spacing.sm}`,
	} as React.CSSProperties,
	hero: {
		padding: `${spacing.md} 0`,
		marginBottom: spacing.sm,
	} as React.CSSProperties,
	title: { marginBottom: spacing.xxs } as React.CSSProperties,
	subtitle: { color: "#6B7684" } as React.CSSProperties,
	section: {
		padding: `${spacing.sm} 0`,
		borderTop: "1px solid #E5E8EB",
		borderBottom: "1px solid #E5E8EB",
	} as React.CSSProperties,
	sectionTitle: { marginBottom: spacing.sm } as React.CSSProperties,
	menuButtonWrap: { marginBottom: spacing.sm } as React.CSSProperties,
	footerHint: {
		marginTop: spacing.lg,
		color: "#8B95A1",
	} as React.CSSProperties,
};

const APP_TEMPLATE_NAME = "샘플 미니앱";

const menuItems: TemplateMenuItem[] = [
	{
		id: "feature",
		title: "기능 예시",
		description: "폼 입력 + 토스트 + 진동 등 기본 인터랙션",
		path: "/feature",
	},
	{
		id: "ads-rewards",
		title: "광고 + 리워드 샘플",
		description: "전면형/리워드 광고, 토스 포인트 지급, 배너, 알림 동의",
		path: "/ads-rewards",
	},
	{
		id: "settings",
		title: "설정 예시",
		description: "로컬 저장소 기반 설정 관리",
		path: "/settings",
	},
];

export default function HomePage() {
	const navigate = useNavigate();

	return (
		<div style={s.container}>
			<div style={s.hero}>
				<Paragraph
					typography="t4"
					fontWeight="bold"
					color="#191F28"
					style={s.title}
				>
					<Paragraph.Text>{APP_TEMPLATE_NAME}</Paragraph.Text>
				</Paragraph>
				<Paragraph typography="t7" style={s.subtitle}>
					<Paragraph.Text>
						TDS 기준 간격/타이포/버튼 규칙으로 구성한 기본 화면입니다.
					</Paragraph.Text>
				</Paragraph>
			</div>

			<div style={s.section}>
				<Paragraph
					typography="t7"
					fontWeight="bold"
					color="#6B7684"
					style={s.sectionTitle}
				>
					<Paragraph.Text>샘플 페이지</Paragraph.Text>
				</Paragraph>

				{menuItems.map((item) => (
					<div key={item.id} style={s.menuButtonWrap}>
						<Button
							size="large"
							color="dark"
							variant="weak"
							display="block"
							onClick={() => navigate(item.path)}
						>
							{item.title}
						</Button>
						<Paragraph
							typography="t7"
							color="#6B7684"
							style={{ marginTop: spacing.xxs, marginLeft: spacing.xs }}
						>
							<Paragraph.Text>{item.description}</Paragraph.Text>
						</Paragraph>
					</div>
				))}

				<div style={{ marginTop: spacing.sm }}>
					<Button
						size="large"
						color="primary"
						variant="fill"
						display="block"
						onClick={() => navigate("/feature")}
					>
						기능 예시 바로 시작
					</Button>
				</div>
			</div>

			<Paragraph typography="t7" style={s.footerHint}>
				<Paragraph.Text>
					TODO: 서비스명/메뉴명/설명 문구를 실제 도메인 기준으로 교체하세요.
				</Paragraph.Text>
			</Paragraph>
		</div>
	);
}

import { Paragraph } from "@toss/tds-mobile";
import { useLocation, useNavigate } from "react-router-dom";
import { IconHome, IconManage, IconYearly } from "@/components/icons";
import { colors, radius, shadow, spacing } from "@/design/tokens";
import { useSafeAreaInsets } from "@/hooks/useSafeAreaInsets";

const TABS = [
	{ path: "/", label: "홈", Icon: IconHome },
	{ path: "/manage", label: "관리", Icon: IconManage },
	{ path: "/yearly", label: "연간", Icon: IconYearly },
] as const;

/** 플로팅 탭바 높이 */
export const NAV_HEIGHT = 60;
/** 화면 하단(세이프에어리어 위)과 탭바 사이 간격 */
export const NAV_GAP = 12;

/** 탭바에 가리지 않으려면 콘텐츠 하단에 이만큼 비워야 한다. */
export function navSpace(insetBottom: number): number {
	return NAV_HEIGHT + NAV_GAP + insetBottom;
}

const s = {
	layer: {
		position: "absolute" as const,
		left: 0,
		right: 0,
		display: "flex",
		justifyContent: "center",
		pointerEvents: "none" as const,
	} satisfies React.CSSProperties,
	bar: {
		display: "flex",
		alignItems: "center",
		height: NAV_HEIGHT,
		padding: `0 ${spacing.xs}px`,
		borderRadius: radius.full,
		backgroundColor: colors.surface,
		boxShadow: shadow.floating,
		pointerEvents: "auto" as const,
	} satisfies React.CSSProperties,
	tab: {
		display: "flex",
		flexDirection: "column" as const,
		alignItems: "center",
		justifyContent: "center",
		gap: 2,
		width: 72,
		height: "100%",
		border: "none",
		borderRadius: radius.full,
		background: "none",
		cursor: "pointer",
	} satisfies React.CSSProperties,
};

/**
 * 하단 탭바.
 *
 * ⚠️ 앱인토스 검수 규격: 탭바를 쓸 거면 **토스가 제공하는 플로팅 형태**여야 한다
 * (화면 폭을 꽉 채워 바닥에 붙이면 토스 메인 하단탭과 헷갈려 반려된다).
 * 탭은 2~5개. 근거: 개발자센터 UI/UX 가이드, `prompts/99-last-checklist.md` 2-10.
 *
 * App 최상위에서 한 번만 마운트하고, 하단 여백은 `env()` 대신 SDK 인셋을 쓴다
 * (docs/ios-android-bottom-spacing.md).
 */
export function BottomNav() {
	const navigate = useNavigate();
	const location = useLocation();
	const insets = useSafeAreaInsets();
	const current = location.pathname || "/";

	return (
		<div style={{ ...s.layer, bottom: NAV_GAP + insets.bottom }}>
			<nav style={s.bar}>
				{TABS.map(({ path, label, Icon }) => {
					const active = current === path;
					const color = active ? colors.primary : colors.textTertiary;

					return (
						<button
							key={path}
							type="button"
							style={s.tab}
							aria-current={active ? "page" : undefined}
							onClick={() => navigate(path)}
						>
							<Icon size={22} color={color} strokeWidth={active ? 2.2 : 1.8} />
							<Paragraph
								typography="t7"
								fontWeight={active ? "bold" : "regular"}
								color={color}
							>
								<Paragraph.Text>{label}</Paragraph.Text>
							</Paragraph>
						</button>
					);
				})}
			</nav>
		</div>
	);
}

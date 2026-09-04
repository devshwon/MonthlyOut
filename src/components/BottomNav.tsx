import { Paragraph } from "@toss/tds-mobile";
import { useLocation, useNavigate } from "react-router-dom";
import { IconHome, IconManage, IconYearly } from "@/components/icons";
import { colors, spacing } from "@/design/tokens";
import { useSafeAreaInsets } from "@/hooks/useSafeAreaInsets";

const TABS = [
	{ path: "/", label: "홈", Icon: IconHome },
	{ path: "/manage", label: "관리", Icon: IconManage },
	{ path: "/yearly", label: "연간", Icon: IconYearly },
] as const;

const s = {
	nav: {
		display: "flex",
		flexShrink: 0,
		borderTop: `1px solid ${colors.border}`,
		backgroundColor: colors.surface,
	} satisfies React.CSSProperties,
	tab: {
		display: "flex",
		flex: 1,
		flexDirection: "column" as const,
		alignItems: "center",
		gap: spacing.xxs,
		padding: `${spacing.xs}px 0 ${spacing.xxs}px`,
		border: "none",
		background: "none",
		cursor: "pointer",
	} satisfies React.CSSProperties,
};

/**
 * 하단 탭. App 최상위에서 **한 번만** 마운트해 라우트가 바뀌어도 다시 그리지 않는다.
 * 하단 여백은 `env()` 대신 SDK 인셋을 쓴다 — 근거: docs/ios-android-bottom-spacing.md
 */
export function BottomNav() {
	const navigate = useNavigate();
	const location = useLocation();
	const insets = useSafeAreaInsets();
	const current = location.pathname || "/";

	return (
		<nav style={{ ...s.nav, paddingBottom: spacing.xxs + insets.bottom }}>
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
						<Icon size={24} color={color} strokeWidth={active ? 2.2 : 1.8} />
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
	);
}

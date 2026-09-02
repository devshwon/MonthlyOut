// 화면 위에 떠 있는 디버그 창. 우하단 🐞 버튼을 누르면 기록된 이벤트가 보인다.
// isFlowDebugEnabled()가 true일 때만 렌더된다(프로덕션 기본 OFF).
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import {
	clearFlowDebugEvents,
	getFlowDebugEvents,
	isFlowDebugEnabled,
	setFlowDebugEnabled,
	subscribeFlowDebug,
} from "@/utils/flowDebug";

const s = {
	fab: {
		position: "fixed",
		right: 12,
		bottom: 12,
		zIndex: 99999,
		border: "none",
		borderRadius: 9999,
		padding: "8px 12px",
		background: "#191F28",
		color: "#fff",
		fontSize: 13,
		fontWeight: 700,
		boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
		cursor: "pointer",
	} as CSSProperties,
	panel: {
		position: "fixed",
		right: 12,
		bottom: 56,
		zIndex: 99999,
		width: 320,
		maxHeight: 360,
		display: "flex",
		flexDirection: "column",
		background: "#FFFFFF",
		border: "1px solid #E5E8EB",
		borderRadius: 16,
		boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
		overflow: "hidden",
	} as CSSProperties,
	head: {
		display: "flex",
		alignItems: "center",
		gap: 8,
		padding: "10px 12px",
		borderBottom: "1px solid #F2F4F6",
	} as CSSProperties,
	title: {
		flex: 1,
		fontSize: 13,
		fontWeight: 700,
		color: "#191F28",
	} as CSSProperties,
	headBtn: {
		border: "none",
		background: "#F2F4F6",
		borderRadius: 8,
		padding: "4px 8px",
		fontSize: 12,
		color: "#4E5968",
		cursor: "pointer",
	} as CSSProperties,
	list: { flex: 1, overflowY: "auto", padding: "4px 0" } as CSSProperties,
	empty: {
		padding: 16,
		fontSize: 12,
		color: "#8B95A1",
		lineHeight: 1.5,
	} as CSSProperties,
	row: {
		display: "flex",
		gap: 8,
		padding: "6px 12px",
		fontSize: 12,
		borderBottom: "1px solid #F8F9FB",
	} as CSSProperties,
	time: {
		color: "#8B95A1",
		flexShrink: 0,
		fontVariantNumeric: "tabular-nums",
	} as CSSProperties,
	name: { color: "#3182F6", fontWeight: 700, flexShrink: 0 } as CSSProperties,
	data: { color: "#4E5968", wordBreak: "break-all" } as CSSProperties,
	off: {
		border: "none",
		borderTop: "1px solid #F2F4F6",
		background: "#fff",
		padding: 10,
		fontSize: 12,
		color: "#8B95A1",
		cursor: "pointer",
	} as CSSProperties,
};

export function FlowDebugPanel() {
	const [enabled] = useState(() => isFlowDebugEnabled());
	const [open, setOpen] = useState(false);
	const [, force] = useState(0);

	useEffect(() => {
		if (!enabled) return;
		return subscribeFlowDebug(() => force((n) => n + 1));
	}, [enabled]);

	if (!enabled) return null;

	const events = getFlowDebugEvents();

	return (
		<>
			<button type="button" style={s.fab} onClick={() => setOpen((o) => !o)}>
				🐞 {events.length}
			</button>
			{open ? (
				<div style={s.panel}>
					<div style={s.head}>
						<span style={s.title}>디버그 로그 {events.length}</span>
						<button
							type="button"
							style={s.headBtn}
							onClick={clearFlowDebugEvents}
						>
							지우기
						</button>
						<button
							type="button"
							style={s.headBtn}
							onClick={() => setOpen(false)}
						>
							닫기
						</button>
					</div>
					<div style={s.list}>
						{events.length === 0 ? (
							<div style={s.empty}>
								기록된 이벤트가 없어요. 코드에서 pushFlowDebugEvent('이름',
								'데이터')로 남겨보세요.
							</div>
						) : (
							[...events].reverse().map((e) => (
								<div key={e.id} style={s.row}>
									<span style={s.time}>{e.at.slice(11, 19)}</span>
									<span style={s.name}>{e.name}</span>
									{e.data ? <span style={s.data}>{e.data}</span> : null}
								</div>
							))
						)}
					</div>
					<button
						type="button"
						style={s.off}
						onClick={() => {
							setFlowDebugEnabled(false);
							setOpen(false);
						}}
					>
						이 기기에서 디버그 끄기
					</button>
				</div>
			) : null}
		</>
	);
}

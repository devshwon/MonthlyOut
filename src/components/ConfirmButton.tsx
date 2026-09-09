import { HandDrawnCheck } from "@/components/HandDrawnCheck";
import { colors, radius } from "@/design/tokens";

/**
 * "이 건은 실제로 빠졌다"는 표시.
 * 홈·상세 어디서 눌러도 같은 저장소(confirmStore)를 보므로 상태가 함께 움직인다.
 */
export function ConfirmButton({
	done,
	onToggle,
}: {
	done: boolean;
	onToggle: () => void;
}) {
	return (
		<button
			type="button"
			aria-label={done ? "완료 취소" : "완료로 표시"}
			aria-pressed={done}
			style={{
				display: "flex",
				flexShrink: 0,
				alignItems: "center",
				justifyContent: "center",
				width: 30,
				height: 30,
				borderRadius: radius.full,
				// 체크가 그려지면 동그라미는 지운다 — 펜 자국만 남은 것처럼 보이게.
				border: done ? "none" : `1.5px solid ${colors.border}`,
				background: "none",
				cursor: "pointer",
			}}
			onClick={onToggle}
		>
			{done ? <HandDrawnCheck size={24} /> : null}
		</button>
	);
}

import { SafeAreaInsets } from "@apps-in-toss/web-framework";
import { useEffect, useState } from "react";

export interface Insets {
	top: number;
	bottom: number;
	left: number;
	right: number;
}

const ZERO: Insets = { top: 0, bottom: 0, left: 0, right: 0 };

function read(): Insets {
	try {
		return SafeAreaInsets.get();
	} catch {
		return ZERO; // 미지원(데스크톱 dev 등)
	}
}

/**
 * 플랫폼별 안전영역 인셋(iOS 홈인디케이터 / Android 네비게이션·제스처 바).
 * CSS `env(safe-area-inset-bottom)`은 Android WebView에서 부정확해 하단 요소가
 * 떠 보이거나 제스처 바에 겹친다 — 반드시 이 훅(SDK 값)을 쓴다.
 * 근거: docs/ios-android-bottom-spacing.md
 */
export function useSafeAreaInsets(): Insets {
	const [insets, setInsets] = useState<Insets>(read);
	useEffect(() => {
		try {
			const cleanup = SafeAreaInsets.subscribe({
				onEvent: (d) => setInsets(d),
			});
			return typeof cleanup === "function" ? cleanup : undefined;
		} catch {
			return undefined;
		}
	}, []);
	return insets;
}

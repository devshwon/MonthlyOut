// 화면 디버그 패널에 흐를 이벤트를 모으는 경량 로깅 버스.
// 어디서든 pushFlowDebugEvent('이름', '데이터')로 기록하면 FlowDebugPanel에 실시간 표시된다.

const FLAG_KEY = "tossbase_debug";
const MAX_EVENTS = 80;
const IS_DEV =
	typeof import.meta !== "undefined" && import.meta.env?.DEV === true;

export interface FlowDebugEvent {
	id: number;
	at: string;
	name: string;
	data?: string;
}

let seq = 1;
let events: FlowDebugEvent[] = [];
const listeners = new Set<() => void>();

function emit(): void {
	for (const listener of listeners) listener();
}

// 기본: 개발/브라우저 미리보기에서 ON, 프로덕션에서는 OFF.
// 실기기에서 켜려면 localStorage 'tossbase_debug' = '1', 끄려면 '0'.
export function isFlowDebugEnabled(): boolean {
	if (typeof window === "undefined" || !window.localStorage) return false;
	const raw = window.localStorage.getItem(FLAG_KEY);
	if (raw === "1") return true;
	if (raw === "0") return false;
	return IS_DEV;
}

export function setFlowDebugEnabled(on: boolean): void {
	if (typeof window === "undefined" || !window.localStorage) return;
	window.localStorage.setItem(FLAG_KEY, on ? "1" : "0");
	emit();
}

export function pushFlowDebugEvent(name: string, data?: string): void {
	if (!isFlowDebugEnabled()) return;
	const next: FlowDebugEvent = {
		id: seq++,
		at: new Date().toISOString(),
		name,
		data,
	};
	events = [...events, next].slice(-MAX_EVENTS);
	emit();
}

export function getFlowDebugEvents(): FlowDebugEvent[] {
	return events;
}

export function clearFlowDebugEvents(): void {
	events = [];
	emit();
}

export function subscribeFlowDebug(listener: () => void): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

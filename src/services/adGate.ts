/**
 * 전면광고를 언제 띄워도 되는지 판단한다.
 *
 * 이 앱은 세션이 짧고(30초쯤 들어와 총액만 보고 나간다) 재방문이 드물다.
 * 그런 앱에서 전면광고를 조건 없이 띄우면 "확인하러 들어왔는데 광고부터 본다"가 되어
 * 검수 7-2("사용자가 예상하기 어려운 순간에 노출 금지")에 걸리기 전에 사용자가 먼저 떠난다.
 *
 * 그래서 자리와 빈도를 코드로 묶어둔다 — **항목을 새로 적고 나온 직후, 하루 한 번**.
 * 저장은 앱을 통틀어 몇 번 안 하는 행동이라 이 조건이면 대부분의 세션에는 광고가 없다.
 */
import { readStorage, writeStorage } from "./storage";

const KEY = "monthlyout.ads.v1";

/**
 * 전면광고를 띄우기 전에 이미 적어둬야 하는 최소 항목 수.
 *
 * 이 앱의 가치는 **총액 숫자**인데 항목이 두어 개면 그 숫자가 틀리다. 그래서 처음
 * 몰아서 적는 시간이 앱이 쓸모를 증명하는 유일한 구간이고, 거기서 광고로 끊으면
 * 총액을 한 번도 못 본 사람을 잃는다. 이 숫자를 넘긴 사람은 총액을 봤고 계속 쓰기로
 * 한 사람이라, 하루 한 편은 감당할 수 있다고 본다.
 */
export const AD_MIN_CHARGES = 3;

interface AdGateState {
	/** 전면광고를 마지막으로 띄운 날 (YYYY-MM-DD) */
	lastInterstitialDate?: string;
}

function today(now = new Date()): string {
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, "0");
	const d = String(now.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

function read(): AdGateState {
	const raw = readStorage(KEY);
	if (!raw) return {};
	try {
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === "object" ? (parsed as AdGateState) : {};
	} catch {
		return {};
	}
}

/** 오늘 아직 전면광고를 띄우지 않았는가. */
export function canShowInterstitial(now = new Date()): boolean {
	return read().lastInterstitialDate !== today(now);
}

/**
 * 이 세션에서 전면광고가 실제로 떴는가. **저장하지 않는다** — 탭을 닫으면 사라진다.
 *
 * "광고를 본 뒤에도 항목을 계속 적는가"를 재려고 둔다. 하루 한 번이라 두 번째
 * 저장에는 광고가 안 뜨는데, 사용자는 그걸 모르니 "또 나오겠지"로 손을 멈출 수 있다.
 * 그 추측을 숫자로 바꾸는 게 이 플래그다 — ChargeForm이 저장마다
 * `save_before_ad` / `save_after_ad`로 가른다.
 */
let shownInSession = false;

/** 이 세션에서 전면광고가 떴는지. */
export function interstitialShownInSession(): boolean {
	return shownInSession;
}

/**
 * 띄웠다고 적어둔다. **광고가 실제로 떴을 때만** 부른다 —
 * 로드 실패까지 세면 하루치 기회를 실패가 먹어버린다.
 */
export function markInterstitialShown(now = new Date()): void {
	shownInSession = true;
	writeStorage(
		KEY,
		JSON.stringify({ ...read(), lastInterstitialDate: today(now) }),
	);
}

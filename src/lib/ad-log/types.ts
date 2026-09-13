/**
 * ad-log 공용 타입.
 *
 * 페이로드의 키가 전부 1~2글자인 이유: 세션 종료 시 sendBeacon 한 번으로 올려야 하는데
 * beacon은 대략 64KB 제한이 있다. 키를 줄이면 같은 용량에 3~4배 더 담긴다.
 * (gzip을 쓰지 않는 이유는 README '왜 gzip을 안 쓰나' 참고)
 */

export type AdType = "banner" | "rewarded" | "interstitial";

/**
 * 광고 슬롯 1개의 최종 판정.
 *
 * `ok`만 카운터로 집계되고, 나머지는 전부 상세 1행이 남는다.
 */
export type AdOutcome =
	/** onAdViewable 도달 — 수익 발생. 카운터만 올리고 상세는 안 남긴다. */
	| "ok"
	/** 광고 인벤토리 없음. 내 버그는 아니지만 비율은 봐야 한다. */
	| "nofill"
	/** isSupported() false — 토스 앱 버전이 낮음 */
	| "unsupported"
	/** TossAds.initialize 실패 */
	| "init_fail"
	/** attachBanner/load 호출 자체가 예외를 던짐 */
	| "attach_throw"
	/** onAdFailedToRender */
	| "render_fail"
	/** attach 후 어떤 콜백도 안 옴 (SDK 무응답) */
	| "timeout"
	/** rendered는 왔는데 viewable이 안 옴 + 원인 특정 실패 */
	| "not_viewable"
	/** rendered 후 다른 DOM 요소가 광고를 덮고 있음 — blocker에 범인이 남는다 */
	| "obstructed"
	/** 컨테이너 크기가 0에 수렴 (레이아웃 붕괴/display:none/opacity 0) */
	| "zero_size"
	/** 컨테이너가 뷰포트 밖 (세이프에어리어·스크롤·키보드) */
	| "offscreen";

/** 세션 내내 동일한 값 — 페이로드당 1번만 실어 보낸다. */
export interface AdLogContext {
	/** 앱 버전 (init 옵션) */
	av?: string;
	/** userAgent 원문 (200자 컷) — 사후 분석용. os/osv 파싱이 틀려도 여기서 복구 가능 */
	ua?: string;
	/** 'ios' | 'android' | 'other' */
	os?: string;
	/** OS 버전 */
	osv?: string;
	/** 뷰포트 폭/높이 (세션 시작 시점) */
	vw?: number;
	vh?: number;
	dpr?: number;
	/** navigator.language */
	lang?: string;
	/** effectiveType ('4g' 등) — 미지원 환경에선 없음 */
	net?: string;
}

/** 문제가 난 광고 슬롯 1건. 성공은 여기 안 들어온다. */
export interface AdIssue {
	/** 세션 시작(t0) 기준 상대 ms */
	t: number;
	/** placement — adGroupId가 아니라 '위치 이름' ('home_bottom_banner') */
	p: string;
	a: AdType;
	/** adGroupId 뒤 12자만 (전체는 불필요하고 길다) */
	g?: string;
	o: AdOutcome;
	/** 에러 메시지/코드 (200자 컷) */
	r?: string;
	/** 가린 요소 셀렉터 ('DIV#sheet.overlay') */
	b?: string;
	/** attach → rendered 소요 ms */
	tr?: number;
	/** 판정 시점 컨테이너 실측 크기 */
	w?: number;
	h?: number;
	/** 뷰포트와의 가시 면적 비 (0~1) */
	rt?: number;
	/** 화면/라우트 이름 */
	s?: string;
	/** 세션 내 동일 문제 반복 횟수 (배너가 50번 리마운트돼도 1행 + n=50) */
	n?: number;
}

/** 일반 예외 1건 (ErrorBoundary / window.onerror / 수동 report). */
export interface AppErrorEntry {
	t: number;
	/** 'error' | 'rejection' | 'manual' | 'boundary' */
	k: string;
	/** 메시지 (300자 컷) */
	m: string;
	/** 스택 상위 프레임 (500자 컷) */
	st?: string;
	s?: string;
	/** 임의 부가 정보 */
	x?: Record<string, string | number | boolean>;
	n?: number;
}

/** 세션 1개 = 페이로드 1개. 세션 종료 시 통째로 전송된다. */
export interface AdLogPayload {
	v: 1;
	/** 앱 식별자 ('blink') */
	app: string;
	/** 세션 id */
	sid: string;
	/** 세션 시작 epoch ms — issue/error의 t는 여기 기준 상대값 */
	t0: number;
	/** 봉인(전송 준비) 시각 epoch ms */
	t1: number;
	ctx: AdLogContext;
	/**
	 * 결과 카운터. 키는 `placement|adType|outcome`.
	 * 성공을 상세로 남기지 않으면서 분모를 잃지 않기 위한 장치.
	 */
	c: Record<string, number>;
	/** 문제 상세 */
	i: AdIssue[];
	/** 예외 */
	e: AppErrorEntry[];
	/** 상한 초과로 버린 항목 수 (있으면 표본이 잘렸다는 뜻) */
	d?: number;
}

/** POST 본문. 이전 세션에서 못 보낸 페이로드가 같이 실려 올 수 있다. */
export interface AdLogBody {
	v: 1;
	batch: AdLogPayload[];
}

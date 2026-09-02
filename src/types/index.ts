/** 고정과금 항목의 분류. 기획서 5장 "항목 등록/수정" 기준. */
export type ChargeCategory =
	| "subscription"
	| "installment"
	| "insurance"
	| "loan"
	| "etc";

/** 출금 층(기획서 4-2): 실제로 돈이 빠지는 수단. */
export type PaymentMethodKind = "card" | "account";

export interface PaymentMethod {
	kind: PaymentMethodKind;
	/** 예: "신한카드", "국민은행 통장" */
	name: string;
}

/** "YYYY-MM" 형식의 연월. */
export type YearMonth = string;

/**
 * 유기한 항목(할부·대출)의 납입 기간.
 * 무기한(구독·보험)이면 charge.term은 null이다.
 */
export interface ChargeTerm {
	/** 총 회차 (예: 12개월 할부면 12) */
	totalCount: number;
	/** 1회차가 빠지는 달 */
	startMonth: YearMonth;
}

/**
 * 항목 층(기획서 4-2)에서 사용자가 등록하는 단위.
 *
 * ⚠️ 금액은 **현금 기준 월 납입액**만 담는다(기획서 4-1).
 * 50만원 12개월 할부라면 amount는 500000이 아니라 41666이다.
 * 구매 총액은 term(회차 × amount)에서 참고 정보로만 역산한다.
 */
export interface FixedCharge {
	id: string;
	name: string;
	/** 매달 빠지는 금액(원) */
	amount: number;
	/** 결제일 1~31. 31은 "말일"로 취급한다. */
	billingDay: number;
	category: ChargeCategory;
	method: PaymentMethod | null;
	term: ChargeTerm | null;
	memo?: string;
	createdAt: number;
	updatedAt: number;
}

/** 저장 전 항목 입력값 (id·타임스탬프는 저장소가 채운다). */
export type ChargeDraft = Omit<FixedCharge, "id" | "createdAt" | "updatedAt">;

/** 출금 층 묶음: 같은 수단 · 같은 날짜에 한 번에 빠지는 돈. */
export interface WithdrawalGroup {
	key: string;
	method: PaymentMethod | null;
	billingDay: number;
	amount: number;
	charges: FixedCharge[];
}

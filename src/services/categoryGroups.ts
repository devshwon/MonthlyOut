import type { ChargeCategory } from "@/types";

/**
 * 등록 폼의 2단계 분류.
 *
 * ⚠️ **매달 자동으로 빠지는 것만 넣는다.** 병원·약처럼 갈 때마다 금액이 달라지는 건
 * 변동지출이라 이 앱이 담지 않는다(기획서 2장 "하지 않는 것").
 *
 * 1단계(대분류)는 "크게 어디에 속하나"만 고르고,
 * 2단계(세부)는 **선택**이다 — 안 고르고 넘어가도 저장된다(기획서: 입력 횟수 최소화).
 * 세부를 고르면 통계에 쓰이는 `category`가 정해지고, 이름이 비어 있으면 자동으로 채워준다.
 */
/**
 * 흔히 쓰는 서비스 이름. 타이핑을 줄이려고 둔다.
 * 로고·심볼은 쓰지 않는다 — 인터넷에서 가져온 이미지는 라이선스를 소명할 수 없고,
 * 앱인토스는 저작권 신고가 들어오면 먼저 미노출 조치한다.
 */
export type PresetDef = string;

export interface SubCategoryDef {
	id: string;
	label: string;
	/** 이 세부 항목이 실제로 잡히는 카테고리(색·통계 기준) */
	category: ChargeCategory;
	/** 자주 쓰는 이름들. 없으면 이름은 직접 적는다. */
	presets?: PresetDef[];
}

export interface CategoryGroupDef {
	id: string;
	label: string;
	/** 대분류 아이콘·색, 그리고 세부를 안 골랐을 때의 기본 카테고리 */
	category: ChargeCategory;
	items: SubCategoryDef[];
}

export const CATEGORY_GROUPS: CategoryGroupDef[] = [
	{
		id: "subscription",
		label: "구독",
		category: "subscription",
		items: [
			{
				id: "ott",
				label: "OTT·영상",
				category: "subscription",
				presets: [
					"넷플릭스",
					"티빙",
					"쿠팡플레이",
					"디즈니+",
					"웨이브",
					"왓챠",
					"라프텔",
					"유튜브 프리미엄",
				],
			},
			{
				id: "music",
				label: "음악",
				category: "subscription",
				presets: [
					"멜론",
					"유튜브 뮤직",
					"스포티파이",
					"지니",
					"플로",
					"바이브",
				],
			},
			{
				id: "cloud",
				label: "클라우드·저장",
				category: "subscription",
				presets: ["iCloud", "구글 One", "네이버 마이박스", "드롭박스"],
			},
			{
				id: "membership",
				label: "멤버십",
				category: "subscription",
				presets: ["쿠팡 와우", "네이버플러스", "배민클럽", "신세계 유니버스"],
			},
			{
				id: "game",
				label: "게임",
				category: "subscription",
				presets: ["PS 플러스", "Xbox 게임패스", "닌텐도 온라인"],
			},
			{
				id: "ai",
				label: "AI",
				category: "subscription",
				presets: [
					"ChatGPT",
					"Claude",
					"Gemini",
					"Perplexity",
					"코파일럿",
					"미드저니",
				],
			},
			{
				id: "app",
				label: "앱·소프트웨어",
				category: "subscription",
				presets: ["Microsoft 365", "어도비", "노션", "캔바"],
			},
		],
	},
	{
		id: "telecom",
		label: "통신",
		category: "telecom",
		items: [
			{
				id: "mobile",
				label: "휴대폰",
				category: "telecom",
				presets: ["SKT", "KT", "LG U+", "알뜰폰"],
			},
			{
				id: "internet",
				label: "인터넷",
				category: "telecom",
				presets: ["SK브로드밴드", "KT 인터넷", "LG U+ 인터넷"],
			},
			{ id: "tv", label: "TV", category: "telecom" },
		],
	},
	{
		id: "housing",
		label: "주거",
		category: "housing",
		items: [
			{ id: "rent", label: "월세", category: "housing" },
			{ id: "maintenance", label: "관리비", category: "housing" },
			{ id: "utility", label: "전기·가스·수도", category: "housing" },
			{
				id: "rental",
				label: "정수기·가전 렌탈",
				category: "housing",
				presets: ["코웨이", "SK매직", "청호나이스", "LG 케어솔루션"],
			},
		],
	},
	{
		id: "insurance",
		label: "보험",
		category: "insurance",
		items: [
			{
				id: "indemnity",
				label: "실손",
				category: "insurance",
				presets: [
					"삼성화재",
					"현대해상",
					"DB손해보험",
					"KB손해보험",
					"메리츠화재",
				],
			},
			{ id: "life", label: "종신", category: "insurance" },
			{ id: "critical", label: "암·질병", category: "insurance" },
			{ id: "carInsurance", label: "자동차", category: "insurance" },
			{ id: "driver", label: "운전자", category: "insurance" },
			{ id: "child", label: "태아·어린이", category: "insurance" },
			// 펫보험은 보험에서 골라도 통계는 반려동물로 잡는다 — 반려동물에 드는
			// 총액(사료·병원·보험)이 한 덩어리로 보이는 쪽이 읽기 쉽다.
			{ id: "petInsurance", label: "펫보험", category: "pet" },
			{ id: "fire", label: "화재", category: "insurance" },
			{ id: "etcInsurance", label: "그 밖의 보험", category: "insurance" },
		],
	},
	{
		id: "loan",
		label: "대출",
		category: "loan",
		items: [
			{
				id: "homeLoan",
				label: "주택·전세",
				category: "loan",
				presets: [
					"국민은행",
					"신한은행",
					"우리은행",
					"하나은행",
					"농협은행",
					"카카오뱅크",
					"토스뱅크",
				],
			},
			{ id: "creditLoan", label: "신용", category: "loan" },
			{ id: "studentLoan", label: "학자금", category: "loan" },
			{ id: "carLoan", label: "자동차", category: "loan" },
		],
	},
	{
		id: "installment",
		label: "할부",
		category: "installment",
		items: [
			{ id: "carInstallment", label: "자동차", category: "installment" },
			{ id: "device", label: "휴대폰·전자기기", category: "installment" },
			{ id: "appliance", label: "가전·가구", category: "installment" },
			{ id: "etcInstallment", label: "그 밖의 할부", category: "installment" },
		],
	},
	{
		id: "delivery",
		label: "정기배송",
		category: "delivery",
		items: [
			{
				id: "daily",
				label: "생필품",
				category: "delivery",
				presets: ["쿠팡 정기배송", "마켓컬리", "오아시스"],
			},
			{ id: "food", label: "식품·밀키트", category: "delivery" },
			{ id: "supplement", label: "건강식품", category: "delivery" },
			// 사료는 정기배송으로 들어와도 통계는 반려동물로 잡는 게 읽기 쉽다.
			{ id: "petFood", label: "반려동물 사료", category: "pet" },
		],
	},
	{
		id: "living",
		label: "생활",
		category: "health",
		items: [
			{ id: "gym", label: "헬스장·PT", category: "health" },
			{ id: "academy", label: "학원·강의", category: "education" },
			{ id: "transitPass", label: "정기권·주차", category: "transport" },
			{ id: "carLease", label: "리스·렌트", category: "transport" },
		],
	},
	{
		id: "saving",
		label: "저축",
		category: "saving",
		items: [
			{ id: "deposit", label: "적금·청약", category: "saving" },
			{ id: "pension", label: "연금", category: "saving" },
			{ id: "invest", label: "투자 자동이체", category: "saving" },
		],
	},
	{
		id: "etc",
		label: "기타",
		category: "etc",
		items: [
			{ id: "donation", label: "정기 후원·기부", category: "etc" },
			{ id: "membershipFee", label: "회비·조합비", category: "etc" },
			{ id: "other", label: "그 밖에", category: "etc" },
		],
	},
];

const SUB_BY_ID = new Map<string, SubCategoryDef>(
	CATEGORY_GROUPS.flatMap((group) =>
		group.items.map((item) => [item.id, item] as const),
	),
);

export function findSubCategory(
	id: string | undefined,
): SubCategoryDef | undefined {
	return id ? SUB_BY_ID.get(id) : undefined;
}

/** 저장된 항목을 다시 열 때 어떤 대분류에서 골랐는지 되짚는다. */
export function findGroup(
	category: ChargeCategory,
	subCategoryId?: string,
): CategoryGroupDef {
	const sub = findSubCategory(subCategoryId);
	if (sub) {
		const owner = CATEGORY_GROUPS.find((group) =>
			group.items.some((item) => item.id === sub.id),
		);
		if (owner) {
			return owner;
		}
	}

	return (
		CATEGORY_GROUPS.find((group) => group.category === category) ??
		CATEGORY_GROUPS.find((group) =>
			group.items.some((item) => item.category === category),
		) ??
		CATEGORY_GROUPS[CATEGORY_GROUPS.length - 1]
	);
}

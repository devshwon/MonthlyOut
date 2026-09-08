import type { ChargeCategory } from "@/types";

/**
 * 등록 폼의 2단계 분류.
 *
 * 1단계(대분류)는 "크게 어디에 속하나"만 고르고,
 * 2단계(세부)는 **선택**이다 — 안 고르고 넘어가도 저장된다(기획서: 입력 횟수 최소화).
 * 세부를 고르면 통계에 쓰이는 `category`가 정해지고, 이름이 비어 있으면 자동으로 채워준다.
 */
export interface SubCategoryDef {
	id: string;
	label: string;
	/** 이 세부 항목이 실제로 잡히는 카테고리(색·통계 기준) */
	category: ChargeCategory;
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
			{ id: "ott", label: "OTT·영상", category: "subscription" },
			{ id: "music", label: "음악", category: "subscription" },
			{ id: "cloud", label: "클라우드·저장", category: "subscription" },
			{ id: "membership", label: "멤버십", category: "subscription" },
			{ id: "game", label: "게임", category: "subscription" },
			{ id: "app", label: "앱·소프트웨어", category: "subscription" },
		],
	},
	{
		id: "telecom",
		label: "통신",
		category: "telecom",
		items: [
			{ id: "mobile", label: "휴대폰", category: "telecom" },
			{ id: "internet", label: "인터넷", category: "telecom" },
			{ id: "tv", label: "TV", category: "telecom" },
			{ id: "data", label: "알뜰폰·데이터", category: "telecom" },
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
			{ id: "rental", label: "렌탈(정수기 등)", category: "housing" },
		],
	},
	{
		id: "insurance",
		label: "보험",
		category: "insurance",
		items: [
			{ id: "indemnity", label: "실손", category: "insurance" },
			{ id: "life", label: "종신·저축성", category: "insurance" },
			{ id: "carInsurance", label: "자동차", category: "insurance" },
			{ id: "etcInsurance", label: "화재·기타", category: "insurance" },
		],
	},
	{
		id: "loan",
		label: "대출",
		category: "loan",
		items: [
			{ id: "homeLoan", label: "주택·전세", category: "loan" },
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
			{ id: "daily", label: "생필품", category: "delivery" },
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
			{ id: "hospital", label: "병원·약", category: "health" },
			{ id: "academy", label: "학원·강의", category: "education" },
			{ id: "transitPass", label: "정기권·주차", category: "transport" },
			{ id: "carLease", label: "리스·렌트", category: "transport" },
			{ id: "petCare", label: "펫보험·병원", category: "pet" },
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
			{ id: "donation", label: "후원·기부", category: "etc" },
			{ id: "tax", label: "세금·공과금", category: "etc" },
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

# 토스 느낌 (Toss Look) 디자인 가이드

Apps in Toss 미니앱이 토스 앱과 조화롭게 보이도록 **반드시 따라야 할** 디자인 규칙입니다.  
UI/스타일 작업 시 이 문서와 `src/design/tokens.ts`를 기준으로 구현합니다.

---

## 0. 원칙 요약

| 원칙 | 설명 |
|------|------|
| **토큰만 사용** | 간격·모서리·타이포 계층은 `tokens.ts`에 정의된 값만 사용. 임의 숫자(7, 10, 13px 등) 금지. |
| **TDS 우선** | **모든 입력·버튼·팝업 등** UI 요소는 TDS 컴포넌트로 구성. TDS로 불가능한 경우에만 제한적으로 커스텀. |
| **계층 명확** | 타이틀 > 서브 > 바디 > 캡션 순서 유지. |
| **제목 → 내용 → 액션** | 섹션 구조를 이 순서로 통일. |

- **TDS 요소 사용 의무**: 입력 필드, 버튼, 팝업·모달, 라벨, 체크박스, 라디오 등 화면을 구성하는 모든 UI 요소는 TDS(Toss Design System)에서 제공하는 컴포넌트를 사용해 구현한다. TDS에 해당 컴포넌트가 없는 경우에만 제한적으로 커스텀 구현을 허용한다.

---

## 1. Spacing (간격)

- **8px 기반 스케일**만 사용. 동일 화면 내에서 일관되게 적용.
- **코드**: `import { spacing, spacingPx } from 'src/design/tokens'` (또는 alias `@/design/tokens`) 후 `spacing.xxx` 또는 `spacingPx('md')` 사용.

### 토큰 (tokens.ts와 동일)

| 키 | 값 | 용도 예시 |
|----|-----|----------|
| `xxs` | 4px | 아이콘-텍스트 간격 |
| `xs` | 8px | 요소 내부 여백 |
| `sm` | 12px | 작은 블록 간격 |
| `md` | 16px | 기본 패딩/마진 |
| `lg` | 20px | 섹션 내 블록 |
| `xl` | 24px | 섹션 간격 |
| `xxl` | 32px | 큰 섹션 간격 |
| `xxxl` | 40px | 페이지 상하 여백 |
| `xxxxl` | 48px | 대형 여백 |

```tsx
// ✅ 권장
padding: spacing.md,        // 16
marginBottom: spacingPx('xl'),  // "24px"

// ❌ 금지
padding: 10, margin: 13, gap: 7
```

---

## 2. Typography (타이포그래피)

- **계층**: 타이틀 > 서브 > 바디 > 캡션. TDS Typography 토큰(t4~t7) 사용.
- **금지**: 폰트 크기/라인하이트 직접 하드코딩 (접근성·테마 일관성).

| 계층 | 용도 | TDS 토큰 |
|------|------|----------|
| 타이틀 | 페이지/섹션 제목 | t4, t5 |
| 서브 | 부제목, 강조 | t5, t6 |
| 바디 | 본문 | t6, t7 |
| 캡션 | 보조 설명, 라벨 | t7 |

- **코드**: TDS `Text` 등 컴포넌트에 `variant`/`token`으로 t4~t7 지정. `tokens.type`은 참고용.

---

## 3. Radius (모서리)

- 카드·버튼·입력 필드 등에 **토큰 값만** 적용.
- **코드**: `import { radius, radiusPx } from 'src/design/tokens'` (또는 alias `@/design/tokens`)

| 키 | 값 | 용도 |
|----|-----|------|
| `xs` | 4px | 뱃지, 태그 |
| `sm` | 8px | 작은 버튼, 입력 |
| `md` | 12px | 카드 작은 사이즈 |
| `lg` | 16px | 카드 기본 |
| `xl` | 20px | 카드, 모달 |
| `xxl` | 24px | 큰 카드 |
| `full` | 9999px | pill 버튼, 칩 |

```tsx
// ✅ 권장
borderRadius: radius.md,   // 12
borderRadius: radiusPx('full'),  // "9999px"

// ❌ 금지
borderRadius: 10, borderRadius: '6px'
```

---

## 4. 섹션 구조

- **순서**: "제목 → 내용 → 액션". 사용자가 읽고 행동하는 흐름 유지.

```
[섹션 제목]     ← type.title / subtitle
[설명·내용]     ← type.body / caption
[CTA 버튼]     ← 주 액션 1개 명확
```

---

## 5. CTA (Call-to-Action)

- **주요 CTA 1개**가 시각적으로 명확.
- 보조 액션(취소, 뒤로)은 시각적으로 약하게.
- 버튼 문구: **짧고 확신 있게** (군더더기 제거).

---

## 6. 문구 (Copy)

- 불필요한 수식어 제거.
- "~해 주세요", "~할 수 있습니다"는 필요 시에만.
- 핵심 메시지를 앞에 배치.

---

## 7. 구현 시 체크리스트

UI/스타일 작업 후 아래를 확인한다.

- [ ] 여백·패딩에 **tokens.spacing** 외 값 사용하지 않음
- [ ] 모서리에 **tokens.radius** 외 값 사용하지 않음
- [ ] 텍스트 계층은 TDS Typography(t4~t7) 사용, 폰트 크기 직접 지정 없음
- [ ] 섹션은 "제목 → 내용 → 액션" 순서
- [ ] 화면당 주요 CTA 1개가 명확함
- [ ] 입력·버튼·팝업 등 모든 UI 요소는 TDS 컴포넌트로 구성했고, 커스텀은 불가피한 경우만 사용

---

## 8. 참고 경로

| 항목 | 경로 |
|------|------|
| 토큰 정의 | `src/design/tokens.ts` |
| 이 가이드 | `desigin/toss-look.md` |
| 프로젝트 헌장 | `prompts/00-charter.md` |
| Cursor 규칙 | `.cursor/rules.md` |

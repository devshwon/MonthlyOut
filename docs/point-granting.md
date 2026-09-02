# 포인트 지급 패턴 — 참조 가이드

> 토스 미니앱에서 **토스포인트를 지급**할 때 매번 같은 버그가 재발해서, 실제로 동작하는 두 앱(`../checkly`, `../haru-now`)을 분석해 정리한 문서다.
> **새 앱에서 포인트 지급을 구현할 때는 구현 전에 이 문서를 먼저 읽는다.**
>
> 분석 기준일: 2026-06. 출처 코드는 사이드 프로젝트라 경로(`path:line`)는 그 시점 기준이며 바뀔 수 있다 — 패턴과 함정만 가져오고, 정확한 줄번호는 원본에서 다시 확인한다.

---

## 0. 가장 먼저 이해할 것 — 돈은 누가 지급하나

**두 패턴 모두 실제 포인트 적립은 클라이언트 SDK의 `grantPromotionReward()`가 한다.** 토스 프로모션 서버가 잔액·중복지급·일일한도의 **유일한 진실 공급원(source of truth)**이다.

- 즉 "Cloudflare 패턴"이라고 해서 서버가 돈을 지급하는 게 **아니다.** checkly조차도 실제 지급은 클라 SDK가 하고, 서버는 **회계(원장/한도 집계)**만 한다.
- 따라서 과지급을 막는 **진짜 방어선은 토스 프로모션 설정**(1회 지급 한도, 1일 한도, 총예산)이다. 우리 서버/클라 코드의 한도는 보조 장치일 뿐이다.

이 한 가지를 오해하면 "서버가 막아주겠지" 하고 구멍을 만든다. **막는 건 토스 프로모션이다.**

---

## 1. 두 패턴 — 언제 무엇을 쓰나

| | **Pattern A — 서버 검증형 (checkly)** | **Pattern B — 클라이언트 직접형 (haru-now)** |
|---|---|---|
| 백엔드 | Cloudflare Worker + D1 + Cron | 없음 (포인트 한정). worker는 날씨 프록시용으로 무관 |
| 클라 보유 상태 | 불투명 세션 토큰만 | **아무 것도 없음** (잔액·원장 0) |
| 지급 트리거 | 광고 시청 → 마일스톤(3/6/10회) | 매일 1회 온보딩 팝업 버튼 |
| 서버 역할 | 신원확인 + 원장 + 일일한도 집계 + 멱등성 | — |
| 진짜 한도 방어 | 토스 프로모션 + 서버 원장(보조) | **토스 프로모션 단독** |
| 복잡도 | 높음 (mTLS, D1, 세션 HMAC) | **매우 낮음** |
| 재설치 시 포인트 | 안전(토스 보유) | 안전(토스 보유) |

### 선택 기준
- **기본값은 Pattern B(클라이언트 직접형).** 보상이 토스 프로모션 하나에 깔끔히 매핑되고, 프로모션에 1인/1일 한도를 걸 수 있으면 서버가 필요 없다. 가장 적은 코드 = 가장 적은 버그.
- **Pattern A(서버형)는 다음이 필요할 때만:**
  - 지급 자격을 **서버만 아는 사실**로 검증해야 함(예: 검증된 구매, 부정행위 신호)
  - 앱 소유의 **원장/집계**가 필요(분석, 일일 캡을 프로모션 밖에서도 관리)
  - 푸시 리마인더 등 **서버 cron** 작업을 곁들임
- ⚠️ haru-now의 교훈: 잔액을 클라에 들고 있을 필요가 없으면 **들지 마라.** 변조·유실의 근원이다. haru-now는 잔액을 0개 저장해서 재설치/스토리지 클리어에도 포인트가 사라지지 않는다.

---

## 2. 공통 — `grantPromotionReward()` SDK 계약 (반드시 정확히 처리)

두 패턴 모두 이 호출이 핵심이다. **반환값 4가지 형태를 전부 처리하지 않으면 "아무 일도 안 일어나는" 침묵 버그가 난다.**

```ts
import { grantPromotionReward } from '@apps-in-toss/web-framework';

const result = await grantPromotionReward({
  params: { promotionCode: PROMOTION_CODE, amount: POINT_AMOUNT },
});

// 반환 union: { key } | { errorCode, message } | { code, ... } | 'ERROR' | undefined
```

| 반환 | 의미 | 처리 |
|---|---|---|
| `undefined` | **앱 버전이 낮아 미지원** (전송 실패 아님!) | "지원하지 않는 앱 버전" 안내. dev/web에서도 no-op으로 여기 빠짐 |
| `'ERROR'` | 알 수 없는 오류 | 일반 오류 메시지 |
| `{ key }` | **성공** — `key`는 지급 영수증 | 성공 처리. 클라가 이 key를 위조할 수 없음 |
| `{ errorCode, message }` 또는 `{ code }` | 비즈니스 오류 | 아래 코드표로 매핑. **`errorCode`와 `code` 둘 다** 확인할 것(형태 불일치) |

### 에러 코드표 (출처: `node_modules/@apps-in-toss/web-framework/dist/index.d.ts`의 `GrantPromotionReward*` 타입 — 3.x부터 한 파일에 모여 있음)

| 코드 | 의미 | 비고 |
|---|---|---|
| `4100` | 프로모션 없음 | promotionCode 오타/오배포 |
| `4104` | 프로모션 중지됨 | |
| `4105` | 프로모션 종료됨 | |
| `4108` | 미승인 | 문구검수 등 |
| `4109` | 미실행 상태 | |
| `4110` | 지급 불가 | |
| `4112` | 프로모션 예산 부족 | 총예산 소진 |
| **`4113`** | **이미 지급됨** | **서버측 중복지급 방지 — 정상 흐름으로 취급** |
| **`4114`** | **1회/1일 지급 한도 초과** | **`amount`가 프로모션 1회 한도 초과 시에도 발생** |

> **핵심:** `4113`(이미 받음)·`4114`(한도 초과)는 **예외 상황이 아니라 정상적인 멱등성 응답**이다. 이걸 "성공/이미 지급됨"으로 처리하면 중복 호출이 안전해진다. crash로 던지지 말 것.

### 견고한 처리 템플릿 (haru-now `points.ts` 기준)

```ts
const ERROR_MESSAGES: Record<string, string> = {
  '4100': '프로모션을 찾을 수 없어요.',
  '4112': '예산이 모두 소진됐어요.',
  '4113': '이미 받은 적립이에요.',
  '4114': '오늘 받을 수 있는 금액을 초과했어요.',
  // ...
};

export async function claimPoint(): Promise<ClaimResult> {
  const result = await grantPromotionReward({ params: { promotionCode, amount } });
  if (!result) return { ok: false, reason: '지원하지 않는 앱 버전이에요.' }; // undefined
  if (result === 'ERROR') return { ok: false, reason: '알 수 없는 오류가 발생했어요.' };
  if ('key' in result) return { ok: true, key: result.key };               // 성공
  const code =
    ('errorCode' in result && result.errorCode) ||
    ('code' in result && result.code) || '';
  return { ok: false, reason: ERROR_MESSAGES[code] ?? `지급 실패 (${code || '알수없음'})` };
}
```

### 공통 함정
- **네이티브 전용.** 브라우저 dev/샌드박스에서는 지급되지 않는다("아무 일도 안 일어남"이 정상). 실제 지급은 토스 앱 안에서만 검증.
- **`amount`는 요청일 뿐.** 토스 프로모션에 설정한 1회 지급 한도를 넘으면 `4114`. 클라 `amount` 상수와 프로모션 설정을 **항상 일치**시킬 것.
- **`amount`/한도 로직을 여러 곳에 복붙하지 말 것.** 상수 하나(`POINT_AMOUNT`)로 단일화.
- **중복 탭 방지(in-flight guard):** 버튼에 `phase !== 'idle'` 가드 + `disabled`. 한 번의 팝업이 두 번 지급 호출하지 않게.

---

## 3. Pattern A — 서버 검증형 (checkly: Cloudflare Worker + D1)

### 아키텍처
- **Worker** `server/` — 독립 npm 프로젝트, `wrangler.toml`로 배포. 엔트리 `server/src/index.ts`(HTTP 라우터 + cron `scheduled`).
- **저장소: D1(SQLite) 단독.** KV/DO 없음.
- **mTLS는 Worker→토스 파트너 API 방향만.** (`wrangler mtls-certificate upload` 후 `certificate_id`로 참조, 코드/레포에 cert·key 절대 커밋 금지)
- 클라→Worker는 평범한 `fetch` + `Authorization: Bearer <세션토큰>`.

### 신원확인 (이 부분이 Pattern A의 존재 이유)
- 신원은 **토스 로그인 `userKey`**(앱별 영속 id)에 고정. 서버가 mTLS로 `generate-token` → `login-me` 호출해 받는다.
- **클라는 절대 `userKey`를 보내지 않는다.** 불투명 세션 토큰만 보유 → 클라가 신원 위조 불가.

### 세션 토큰 (JWT 라이브러리 없이 Web Crypto HMAC)
- 형식: `userKeyB64.expiry.HMAC-SHA256(secret, "userKeyB64.expiry")` (base64url).
- 검증은 HMAC 재계산 후 **상수시간 비교(`timingSafeEqual`)** + 만료 확인. TTL 1시간(accessToken 수명과 일치).
- ⚠️ 한계: 재생(replay)/회전/폐기 메커니즘 없음. 탈취된 토큰은 최대 1시간 유효. `localStorage` 보관.

### 2단계 지급 흐름 (prepare → claim)
보상 마일스톤은 누적 3/6/10회 = `idx` 0/1/2, 하루 최대 3회.

```
[로그인] appLogin() → POST /auth/login → 서버가 userKey 교환 → 세션토큰 발급 → localStorage 캐시
                                                              (401이면 1회 재로그인 후 재시도)

[Phase 1 — 광고 후 서버가 금액 예약]
  광고 시청(dismissed) → POST /reward/prepare {idx}
    서버: idx 검증 → 기존행 있으면 (granted→409 / reserved→같은 금액 재노출=멱등)
         → 남은 일일한도 계산 → 서버가 금액 결정(가중 RNG) → status='reserved' 행 INSERT
         → { idx, amount, promotionCode } 반환
  클라: "N원 받기" 버튼 노출(서버가 정한 금액)

[Phase 2 — 클라 SDK가 실제 지급, 서버는 granted 표시]
  "N원 받기" 탭 → grantPromotionReward({promotionCode, amount})  ← 실제 적립은 여기!
    → POST /reward/claim {idx, key(SDK영수증)}
    서버: 예약 필수(없으면 409) → markGranted로 status='granted' + key 저장 (이미 granted면 no-op=멱등)
         → 갱신된 일일 합계 반환
```

### 멱등성·중복지급 방지 (D1) — Pattern A의 핵심 안전장치
- **원장 테이블 PK `(user_key, date, idx)`.** prepare의 예약은 `INSERT`이고, **PK 충돌을 잡아서 `already_claimed`로 처리**한다 → 이게 원자적 dedup 1차 방어선.
- `/reward/prepare` 멱등: 재호출 시 예약된 같은 금액을 재노출.
- `/reward/claim` 멱등: 이미 granted면 no-op. 더블클레임 무해.
- 동시성: 동시 prepare 시 INSERT에서 진 쪽은 기존 행을 재읽어 같은 금액 반환.
- **날짜 경계(KST):** `+9h` 오프셋 헬퍼 **하나로 통일**해 PK·한도에 사용. TZ 실수 = dedup/한도 붕괴.
- **cron/알림도 같은 패턴:** `notify_log` PK `(user_key, date, todo_id)` + `INSERT OR IGNORE`로 리마인더 발송 멱등.

### 서버 권위적 금액
- 보상 금액은 **서버가** 가중 테이블에서 뽑는다. 클라는 표시만. **클라가 보낸 금액을 신뢰하지 않는다.**
- 단, `/reward/claim`은 클라 `amount`를 받지 않고 **예약된 금액**을 집계한다.

### Pattern A에서 신뢰 모델이 무른 지점 (반드시 인지)
실제 적립이 클라 SDK 호출이므로:
1. `promotionCode`가 prepare 응답으로 **클라에 노출**된다. 변조된 클라가 `grantPromotionReward`를 직접 호출 가능.
2. 서버 한도(예: 30원/일)는 **D1 원장**을 막는 것이지 실제 토스포인트를 막는 게 아니다. 원장과 실제가 갈라질 수 있다.
3. 서버는 **자격 검증을 하지 않는다**(마일스톤 도달 여부는 클라 localStorage). → 실제 backstop은 토스 프로모션의 1회/총예산 한도.
4. 이를 받아들이는 근거: 1일 캡으로 **노출(피해 상한)이 작게 묶이기** 때문(~수십원/인/일).

---

## 4. Pattern B — 클라이언트 직접형 (haru-now)

### 핵심 — 클라에 포인트 상태가 0개
- **잔액·원장을 아무 데도 저장하지 않는다.** 토스 프로모션 서버가 잔액·멱등·일일캡의 유일한 진실.
- 클라가 영속하는 건 **팝업 노출 게이트용 날짜 문자열 하나뿐**(`haru:onboarding:lastDate`). 이건 **지급 여부가 아니라 "오늘 팝업 떴나"만** 결정.
- (`worker/`는 날씨 프록시. 포인트와 무관.)

### 지급 흐름
```
매일 첫 실행 → 온보딩 팝업 자동 노출(저장된 날짜 != 오늘 KST)
  버튼 탭 → in-flight 가드(phase!=='idle'이면 무시)
         → grantPromotionReward({promotionCode, amount})  ← 실제 적립
         → 성공: 코인 애니메이션 후 1.3s 뒤 닫힘 / 실패: 사유 표시 후 idle 복귀(재시도 가능)
  팝업 닫힘(close) → 오늘 날짜 저장(같은 날 재노출 방지)
```

### 정직한 동작 분리 (중요한 미묘함)
- **게이트와 지급은 분리돼 있다.** 날짜는 `close()`에서 저장되는데, 이는 **클레임 성공 여부와 무관하게** 모든 닫힘(오버레이 dismiss 포함)에서 실행된다 → 안 받고 닫아도 그날 팝업은 안 뜸.
- 그래도 안전한 이유: 잔액을 안 들고 있으니, 날짜를 지워 팝업이 다시 떠도 두 번째 지급은 **서버가 `4113/4114`로 거부**한다. 클라는 이를 오류로 표시하고 idle로 복귀.
- 따라서 **로컬 게이트를 "지급됐다는 증거"로 쓰면 안 된다.** 표시 전용이다.

### 클라이언트 직접형의 리스크와 haru-now의 방어
| 리스크(일반론) | haru-now의 방어 |
|---|---|
| 변조: 잔액 위조 | 클라에 잔액 없음 → 위조할 게 없음 |
| 재생/재탭 중복지급 | 서버 dedupe(`4113`) + 일일캡(`4114`) + 클라 in-flight 가드 |
| 재설치/스토리지 클리어로 포인트 유실 | 포인트가 기기에 없음 → 유실 불가. 화장용 날짜 플래그만 리셋 |
| 지급 금액 신뢰 | `amount`는 요청, 초과 시 `4114`. 프로모션 한도 이상 불가 |
| 성공 위조 | 성공은 서버 `key` 영수증. 클라가 발급 불가 |

---

## 5. 통합 체크리스트 (구현 시 그대로 따라가기)

### DO
- [ ] **과지급 방어의 진짜 축은 토스 프로모션 설정**(1회 한도·1일 한도·총예산)으로 건다. 우리 코드 한도는 보조.
- [ ] `grantPromotionReward` 반환 **4형태 전부** 처리 (`undefined`/`'ERROR'`/`{key}`/에러객체). `undefined`=구버전 앱.
- [ ] 에러객체는 **`errorCode`와 `code` 둘 다** 확인. `4113`/`4114`는 **정상 멱등 응답**으로 취급.
- [ ] 모든 코드(`4100/4104/4105/4108/4109/4110/4112/4113/4114`)에 사용자 메시지 매핑 + 미지정 코드 fallback.
- [ ] **in-flight 가드**: 한 번의 UI에서 두 번 지급 호출 금지(`phase` 가드 + `disabled`).
- [ ] `amount`는 상수 하나로 단일화하고 프로모션 설정과 일치.
- [ ] (Pattern A) 신원은 서버가 mTLS로 받은 **`userKey`에 고정**, 클라엔 불투명 세션 토큰만.
- [ ] (Pattern A) 원장 PK `(user_key, kst_date, idx)` + **INSERT PK충돌=dedup**. 알림은 `INSERT OR IGNORE`.
- [ ] (Pattern A) **금액은 서버가 결정**, 클라 전송 금액 불신. 날짜 경계는 KST 헬퍼 하나로 통일.
- [ ] (Pattern A) prepare/claim **둘 다 멱등**(재노출 / no-op 재표시).
- [ ] mTLS cert·key, 배포 API 키는 레포에 커밋 금지(`.dev.vars`, `*.key`, `*.pem`, cert 디렉터리 gitignore).

### DON'T
- [ ] ❌ "서버가 과지급을 막아준다"고 가정 — 서버 한도는 원장만 막는다. 실제는 프로모션이 막는다.
- [ ] ❌ 클라에 **잔액/원장 저장 후 진실로 취급** — 변조·유실됨. 안 들어도 되면 들지 마라(haru-now처럼).
- [ ] ❌ 로컬 "오늘 떴음" 플래그를 **지급 증거로 사용** — 표시 전용, 닫기만 해도 기록됨.
- [ ] ❌ 브라우저 dev/샌드박스에서 지급 검증 시도 — 네이티브 전용. 토스 앱에서 확인.
- [ ] ❌ `undefined` 반환 무시 — 침묵 실패처럼 보이지만 **구버전 앱** 신호다.
- [ ] ❌ `4113/4114`를 crash로 던지기 — 정상 멱등 흐름이다.
- [ ] ❌ 테스트 플래그(`ALWAYS_SHOW=true`, `TEST_`-prefixed promotionCode) 배포.
- [ ] ❌ (Pattern A) `Access-Control-Allow-Origin: "*"` 배포 — WebView origin으로 좁힐 것.
- [ ] ❌ (Pattern A) 토스 파트너 API 응답 필드명을 가정 — `{...}|{success}|{result}|{data}` 방어적 unwrap 필요.

---

## 6. 출처

- **Pattern A:** `../checkly` — `server/src/{index,session,toss,db,reward}.ts`, `server/migrations/0001_init.sql`(원장 PK), `src/services/{api,reward}.ts`, `src/pages/Home.tsx`. 설계기록 `docs/plan.md`(단, plan은 서버 S2S 지급으로 적혀 있으나 **실제 코드는 클라 SDK 지급** — 코드를 따른다).
- **Pattern B:** `../haru-now` — `src/features/onboarding/{points.ts,OnboardingPopup.tsx,useDailyOnboarding.ts}`. (`worker/`는 날씨 프록시, 포인트 무관)
- **SDK 계약:** `node_modules/@apps-in-toss/web-framework/dist/index.d.ts` (`grantPromotionReward`·`appLogin`·관련 타입 전부 여기)

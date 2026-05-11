# 주식 자동매매 에이전트 구현 계획 보완 (Sequence Update)

## 0) 세션 시작 필수 체크 결과
- Claude activity check 실행 완료 (`bash $HOME/.codex/scripts/check-claude-activity.sh`, 2026-05-11 17:52:42 KST)
- Auto-handoff sentinel 확인: `action=none` (clear 불필요)
- Context guard 확인: `below_threshold=false` (remaining 30%)
- Hyphen trigger guard 확인: `action=none` (`no_play_trigger`)

## 1) 국내-first vs US-first 비교 및 최종 결정

### 옵션 A: 국내-first (KIS 선행)
- 장점: 국내 실사용 요구를 초기부터 직접 반영 가능
- 단점: 인증/상품구분/시장규칙(국내·해외) 복잡도가 초기 코어 설계에 섞여 인터페이스 안정화가 느려짐
- 리스크: 초기 재작업 가능성 증가 (코어 계약 변경 빈도↑)

### 옵션 B: US-first (Alpaca 선행)
- 장점: Paper 환경으로 실행 리스크가 낮고 주문-체결 피드백 루프가 빠름
- 장점: 브로커 독립 코어 계약을 빠르게 검증 가능
- 단점: 국내 실사용 시나리오 반영이 2단계로 이동

### 최종 결정
- **공통 코어 선행 → Alpaca paper 1차 검증 → KIS(국내/해외) 2차 확장 → live 후보 결정**
- 결정 근거:
  - 브로커 종속성 분리를 먼저 고정하여 재작업 비용 최소화
  - Paper 기반으로 주문 lifecycle/에러 수렴을 저위험 검증
  - 국내 실사용성은 KIS adapter 단계에서 흡수 가능
  - 토스증권/미래에셋은 MVP 후보에서 제외하여 초기 범위 통제

## 2) 수정된 구현 순서 및 Acceptance Gates

## Phase 0 — Broker-Independent Core 설계
- 목표: 브로커 비종속 계약(타입/에러/시크릿/리스크) 확정
- 산출물:
  - Broker adapter contract
  - Order/Position/Account/Risk 도메인 타입
  - 공통 에러 taxonomy 및 매핑 규약
  - Keychain-only 시크릿 접근 계약
- Gate `G0` (통과 조건):
  - Alpaca/KIS 모두 매핑 가능한 필드셋 검증 완료
  - `core/types`, `core/error`, `core/secrets` 경계가 문서와 타입으로 일치
  - 리스크 정책이 고정 TP/SL이 아닌 volatility/drawdown budget 기반으로 반영

## Phase 1 — Alpaca Paper Adapter 검증
- 목표: 첫 실행 adapter로 코어-브로커 결합 검증
- 산출물:
  - Alpaca paper adapter
  - 주문 생성/취소/상태동기/체결조회 시나리오
- Gate `G1`:
  - 주문 lifecycle 정상 (create/cancel/fill sync)
  - 계좌/포지션/체결 조회 일관성 확보
  - 실패 케이스가 `core/error`로 수렴
  - live endpoint 미사용 보장 (paper only)

## Phase 2 — KIS Adapter (국내/해외) 확장
- 목표: 국내 실사용 경로 확보 및 시장 차이 흡수
- 산출물:
  - KIS 국내/해외주식 adapter
  - 시장별 규칙 정규화 레이어
- Gate `G2`:
  - 종목코드 체계/호가단위/거래시간 차이를 공통 인터페이스로 흡수
  - 인증/토큰/서명/자격증명 저장이 Keychain-only 준수
  - Alpaca에서 사용한 상위 유스케이스 재사용 테스트 통과

## Phase 3 — Live 후보 결정
- 목표: 운영 전환 브로커/시장 조합 의사결정
- 산출물:
  - 후보 비교 문서(규제/안정성/운영성/관측성/복구성)
- Gate `G3`:
  - Paper/모의 결과 비교 리포트 완료
  - 운영 리스크 정책(시장중단/거부/재시도/멱등성) 승인 기준 충족
  - **사용자 명시 승인 전 live 전환 금지**

## 3) AIZen 파일 구조 계획 (제약 준수)

- 언어/런타임: **TypeScript**
- 필수 경로 사용:
  - `core/types/` — 브로커 계약, 도메인 타입, capability 타입
  - `core/error/` — 공통 에러 코드, 분류, 브로커 에러 매핑 헬퍼
  - `core/secrets/` — Keychain-only credential provider 및 키 스키마
  - `skills/zen-trading-core/` — 코어 설계/검증 가이드
  - `skills/zen-trading-alpaca/` — Alpaca paper 작업 가이드
  - `skills/zen-trading-kis/` — KIS 국내/해외 작업 가이드
- 금지 경로/파일:
  - `src/trading` 생성 금지
  - `configs/trading` 생성 금지
  - `.env.example` 생성 금지
- 시크릿 정책:
  - 환경파일 기반 주입 금지
  - Keychain 이외 저장소 사용 금지

## 4) Broker Adapter 인터페이스 및 Alpaca/KIS 차이 흡수 설계

### 4.1 공통 상위 계약 (Core Contract)
- `authenticate(): Promise<AuthSession>`
- `getAccountSnapshot(): Promise<AccountSnapshot>`
- `getQuote(input): Promise<Quote>`
- `placeOrder(intent): Promise<PlacedOrder>`
- `cancelOrder(orderId): Promise<CancelResult>`
- `getOrder(orderId): Promise<OrderState>`
- `listPositions(): Promise<Position[]>`
- `listFills(query): Promise<Fill[]>`
- `mapBrokerError(raw): CoreError`

### 4.2 Capability 기반 분기
- `supportsFractional`
- `supportsExtendedHours`
- `supportsShorting`
- `supportedOrderTypes`
- `marketScope` (`US`, `KR`, `KR+US`)

상위 유스케이스는 capability를 조회해 경로를 선택하고, adapter별 예외 분기를 최소화한다.

### 4.3 Normalization 레이어
- 심볼 체계 정규화: US ticker vs KIS 종목코드
- 세션/타임존 정규화: 장중/장전/장후 상태 통일
- 가격/수량 단위 정규화: 소수점, 호가단위, 최소수량
- 주문 상태 전이 정규화: broker 상태코드 → core 상태코드
- 비용 정규화: 수수료/세금/체결단위 차이를 공통 필드로 통합

### 4.4 리스크 정책 연동 원칙
- 고정 TP/SL 미사용
- `volatility budget` + `drawdown budget` 기반 한도 적용
- 리스크 계산은 코어 정책 계층이 담당
- adapter는 “실행 가능성/제약/capability 보고”만 담당

## 5) 검증, 롤백, 승인 게이트

## 검증 계획
- 타입 레벨 검증:
  - Alpaca/KIS 매핑 커버리지 체크
  - 공통 인터페이스 호환성 체크
- 시나리오 검증:
  - 주문 lifecycle, 취소, 부분체결, 거부, 재시도
  - 계좌/포지션/체결 조회 정합성
- 보안 검증:
  - Keychain-only 위반 여부
  - 민감정보 로그 노출 금지 확인

## 롤백 전략
- 단계별 롤백 단위:
  - `G0` 실패: 코어 계약 변경안 폐기 후 타입 계약 재정의
  - `G1` 실패: Alpaca adapter만 롤백, 코어 계약 유지
  - `G2` 실패: KIS 정규화 레이어만 롤백, Alpaca 검증 라인은 유지
- 원칙:
  - adapter별 변경을 분리해 교차 오염 방지
  - 코어 계약 변경은 gate 재승인 없이는 진행 금지

## 사용자 승인 게이트 (구현 시작 전 필수)
- 승인 A: `G0~G3` 단계/게이트 구조 확정
- 승인 B: 공통 인터페이스 + 변동성/낙폭 예산 리스크 정책 확정
- 승인 C: 실행 순서(코어 → Alpaca paper → KIS → live 후보) 최종 확정
- 승인 D: live 전환은 별도 명시 승인

## 6) 현재 상태 (구현 보류)
- 현재 산출물은 **플랜 보완 문서**이며 구현은 시작하지 않음
- 사용자의 별도 “구현 시작 승인” 전까지:
  - 코드 작성/수정
  - 실계좌 연동
  - live 주문 실행
  모두 보류한다.
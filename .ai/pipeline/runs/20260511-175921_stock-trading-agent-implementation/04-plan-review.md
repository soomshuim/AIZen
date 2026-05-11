# Peer Agent Review

| Field | Value |
|---|---|
| Target | claude |
| Mode | plan |
| Project | AIZen |
| Repo | /Users/zenkim_office/Project/AIZen |
| Git repo | yes |
| Branch | main |
| Created | 2026-05-11 18:27:17 KST |
| Exit code | 0 |
| Timeout seconds | 2700 |
| Attempts | 3 |

## Request

Play run: /Users/zenkim_office/Project/AIZen/.ai/pipeline/runs/20260511-175921_stock-trading-agent-implementation
Review the implementation plan artifact for this play harness run.
Source artifact: /Users/zenkim_office/Project/AIZen/.ai/pipeline/runs/20260511-175921_stock-trading-agent-implementation/03-plan.md

## Artifact Content

# 03-plan — Stock Trading Agent Implementation

## 0) Session Preconditions (Checked)
- Claude activity check executed at `2026-05-11 18:01:44 KST` via `bash $HOME/.codex/scripts/check-claude-activity.sh` (workspace dirty 상태 확인됨, 구현 진행 가능).
- Clear sentinel check: `action: none` (`codex-auto-handoff.sh --pending-clear --json`).
- Hyphen trigger guard check: `action: none`, `reason: no_play_trigger`.
- 본 문서는 기존 top-level play run 내부 산출물 작성 전용이며, nested runner 실행 없이 구현 계획만 정의한다.

## 1) Implementation Goals
- 브로커 독립 코어를 먼저 고정하고, Alpaca paper로 1차 검증한 뒤 KIS는 계약/스텁까지 확장한다.
- live 주문/endpoint 연결은 금지하고, live 후보 결정도 별도 사용자 승인 전까지 금지한다.
- 리스크 정책은 고정 TP/SL이 아니라 변동성/낙폭 예산 기반으로 구현한다.
- AIZen 제약(TypeScript, Keychain-only secrets, 금지 경로/파일, 민감정보 비노출)을 전 단계에서 강제한다.

## 2) File Plan (Repo-aligned, No Forbidden Paths)
- `core/types.ts`
  - 기존 공용 타입 유지 + trading domain 최소 타입 확장(호환성 유지).
  - `SkillContext`, `SkillInput`, `SkillResult` import 경로/시그니처 불변.
  - 이번 run에서는 단일 파일을 유지한다. `core/types/` 디렉터리 전환은 하지 않는다.
- `core/error/index.ts`
  - 브로커 에러 정규화 코드/매핑 유틸 추가(기존 `SkillError`, `withRetry`, `DeadLetter` 확장 방식).
- `core/secrets/*` (기존 Keychain wrapper 인접)
  - broker credential 조회 인터페이스 추가(파일/ENV 저장 금지, Keychain-only).
  - `SECRETS`에 `ALPACA_API_KEY_ID`, `ALPACA_API_SECRET_KEY`, `KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_ACCOUNT_ID`를 키 이름만 추가한다.
  - `core/secrets/check.ts`는 필수 secret을 늘리지 않는다. Trading secret은 `zen-trading-*` 실행 시 선택적으로 검사한다.
- `skills/zen-trading-core/`
  - `SKILL.md`, `handler.ts`, 필요 시 `.d.ts`
  - 브로커 독립 orchestration, risk policy 적용, order intent lifecycle 관리.
  - runtime state는 gitignored 경로인 `.aizen-cache/trading/` 아래에 저장한다.
    - `.aizen-cache/trading/paper-state.json`: 최신 account/positions/orders snapshot.
    - `.aizen-cache/trading/events.jsonl`: order intent, risk decision, broker response 감사 이벤트.
    - `.aizen-cache/trading/checkpoints/*.json`: EOD run 단위 checkpoint.
  - 저장 state에는 secret, 계좌 원문 식별자, access token을 넣지 않는다.
- `skills/zen-trading-broker-alpaca/`
  - `SKILL.md`, `handler.ts`
  - paper endpoint 전용 adapter 구현(create/cancel/status sync), live endpoint 차단 가드 포함.
- `skills/zen-trading-broker-kis/`
  - `SKILL.md`, `handler.ts`
  - 국내/해외 market contract/stub만 구현, 실제 인증/주문 호출은 명시적 `NotImplemented` 처리.
- `skills/**/tests/*.test.ts` (현재 `package.json`의 `skill:test` glob 준수)
  - core contract/risk/error 단위 테스트
  - alpaca paper adapter 계약 테스트/시나리오 테스트
  - kis stub 계약 테스트
  - live endpoint 금지 가드 테스트
- `docs/trading/`
  - `runbook-paper.md` (paper 실행 절차/운영 체크)
  - `risk-policy.md` (변동성/낙폭 예산 정책)
  - `broker-expansion-kis.md` (2차 확장 계약 및 live 전환 전제)
  - `checklist.md` (gate/보안/릴리즈 체크리스트)

## 3) Sequencing (Mandatory Order)
1. Core Foundation (G0)
2. Alpaca Paper Validation (G1)
3. KIS Contract/Stub Expansion (G2)
4. Live Decision Deferred (G3, 문서화만; 구현/연결 금지)

## 4) Detailed Execution Steps
1. `core/types.ts` 확장 방침 확정
2. trading domain 타입 추가(Instrument, OrderIntent, OrderState, PositionSnapshot, RiskBudget, BrokerCapability 등)
3. `core/error/index.ts`에 broker-agnostic error taxonomy/mapper 추가
4. Keychain-only credential provider 계약 추가(알파카/KIS 공통 형태)
5. `zen-trading-core`에서 broker contract interface 정의 및 orchestration 구현
6. broker dispatch는 compile-time registry 방식으로 구현한다.
   - `createBrokerAdapter({ broker: "alpaca-paper" | "kis-stub" })` 형태.
   - 기본값은 `"alpaca-paper"`이고 live adapter id는 이번 run에 존재하지 않는다.
   - registry는 adapter capability를 반환하며, core는 direct import가 아니라 registry factory만 호출한다.
7. 변동성/낙폭 예산 기반 risk policy 모듈 구현(주문 허용/축소/차단 결정)
   - deterministic default:
     - annualized target volatility: `10%`
     - volatility lookback: `20` EOD bars
     - gross exposure max: `80%`
     - cash buffer min: `20%`
     - ETF max weight: `20%`
     - large-cap stock max weight: `5%`
     - daily drawdown halt: `-0.75%`
     - weekly drawdown halt: `-2.5%`
     - peak-to-trough halt: `-8%`
     - hard stop reference: `entry - max(2.5 * ATR20, 8%)`
     - trailing activation: `+2R`
     - trailing exit reference: `20-day high - 1.5 * ATR20`
     - max holding review: `40` trading days
8. `.aizen-cache/trading` state store 구현.
   - atomic JSON write for snapshots.
   - append-only JSONL audit events.
   - state read/write tests using a temp directory.
9. `zen-trading-broker-alpaca` adapter 구현(paper base URL 고정, live URL reject)
   - HTTP client는 신규 SDK 의존성 없이 Node 22 내장 `fetch`를 사용한다.
   - SDK 도입은 paper lifecycle 검증 후 별도 변경으로 평가한다.
10. Alpaca lifecycle 테스트(create/cancel/fill/status/오류 매핑) 작성
11. `zen-trading-broker-kis` 계약/스텁 작성(국내/해외 분기 모델 포함, 네트워크 호출 없음)
12. KIS 스텁 계약 테스트 작성(입출력 정규화 및 unsupported 동작 검증)
13. docs/runbook/checklist 작성 및 gate 조건 매핑
14. 전체 테스트 실행, 결과를 해당 run 산출물에 기록

## 5) Verification Plan
- 정적 검증
  - TypeScript typecheck 통과
  - lint/format 규칙 통과(기존 스크립트 기준)
- 테스트 검증
  - core risk/error/contract 단위 테스트 통과
  - Alpaca paper adapter 계약 테스트 통과
  - KIS stub 계약 테스트 통과
  - `.aizen-cache/trading` state persistence temp-dir 테스트 통과
  - broker registry dispatch 테스트 통과(`alpaca-paper`, `kis-stub`, unknown broker reject)
  - live endpoint 차단 테스트 통과
  - 테스트 파일은 `skills/**/tests/*.test.ts` 아래에 둬서 기존 `pnpm -s skill:test`가 실제로 수집하게 한다.
- 보안/정책 검증
  - `src/trading`, `configs/trading`, `.env.example` 미생성 확인
  - 민감정보(토큰/계좌/secret) 파일/로그/응답 미노출 확인
  - Keychain-only 경로 외 자격증명 접근 금지 확인

## 6) Rollback Plan
- 단계별 소규모 커밋(코어/알파카/KIS 문서/테스트 분리)로 회귀 지점 확보.
- G1 실패 시: Alpaca adapter 변경만 롤백 가능하도록 core contract와 분리 유지.
- G2 실패 시: KIS 스텁/계약 변경만 롤백, G0/G1 안정 상태 보존.
- 정책 위반(민감정보 노출, live 호출 경로 발견) 시 즉시 해당 커밋 폐기 후 재구현.

## 7) Acceptance Gates
- G0 Core Gate
  - broker-independent contract, domain types, error mapping, keychain 경계, state persistence, registry dispatch, risk budget 정책 구현/테스트 완료.
- G1 Alpaca Paper Gate
  - paper lifecycle 시나리오 통과, live endpoint 차단 검증 완료.
- G2 KIS Stub/Contract Gate
  - 국내/해외 확장 가능한 계약 + 스텁 + 테스트 완료, 실연결 없음.
- G3 Live Decision Gate
  - live 후보 비교/선정/전환 구현 없음, 별도 사용자 승인 대기 상태 문서화.
- Quality Gate
  - 테스트 결과 기록 완료, 제약 위반 0건, 문서(runbook/checklist) 완비.

## 8) Out of Scope (This Run)
- 실계좌 인증/주문
- live endpoint 호출
- 브로커 최종 선정 및 프로덕션 전환
- Telegram 실행 경로 통합 (운영 알림 채널 후속 작업으로만 유지)

## Context

### Git Status

```
?? .ai/codex-hyphen-trigger-guard.json
?? .ai/peer-review/runs/20260511-170920-claude-review-62414.md
?? .ai/peer-review/runs/20260511-171220-claude-plan-65226.md
?? .ai/peer-review/runs/20260511-173805-claude-plan-24408.md
?? .ai/peer-review/runs/20260511-175010-claude-review-47101.md
?? .ai/peer-review/runs/20260511-175342-claude-plan-66826.md
?? .ai/peer-review/runs/20260511-180022-claude-review-72592.md
?? .ai/peer-review/runs/20260511-180229-claude-plan-75073.md
?? .ai/peer-review/runs/20260511-181055-claude-plan-77418.md
?? .ai/pipeline/runs/20260511-170810_stock-trading-automation-agent/
?? .ai/pipeline/runs/20260511-174922_stock-trading-plan-sequence-update/
?? .ai/pipeline/runs/20260511-175921_stock-trading-agent-implementation/
```

### Diff Stat

```
(no unstaged diff stat)
```

## Peer Result

**Peer Review Complete.**

**Verdict: PASS** (high confidence)

No blocking findings. 2 medium, 4 low, 2 info-level observations — all addressable during implementation without plan revision.

Key recommendations for the implementing agent:
1. Enumerate specific Alpaca test scenarios before coding step 10
2. Explicitly locate risk policy defaults (recommend dedicated module constants)
3. Validate the `skill:test` glob early — it's never been exercised
4. Define HTTP test fixtures for offline broker adapter testing
5. Clarify broker adapters as imported libraries, not independently invoked skills

Full review written to the plan file.

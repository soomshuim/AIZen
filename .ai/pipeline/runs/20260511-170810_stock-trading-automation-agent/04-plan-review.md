# Peer Review Runtime Gate

Result: NEEDS_USER_DECISION

Peer review dispatcher exited with code 0. The copied peer output is preserved below for diagnosis.

---

# Peer Agent Review

| Field | Value |
|---|---|
| Target | claude |
| Mode | plan |
| Project | AIZen |
| Repo | /Users/zenkim_office/Project/AIZen |
| Git repo | yes |
| Branch | main |
| Created | 2026-05-11 17:42:09 KST |
| Exit code | 0 |
| Timeout seconds | 2700 |
| Attempts | 1 |

## Request

Play run: /Users/zenkim_office/Project/AIZen/.ai/pipeline/runs/20260511-170810_stock-trading-automation-agent
Review the implementation plan artifact for this play harness run.
Source artifact: /Users/zenkim_office/Project/AIZen/.ai/pipeline/runs/20260511-170810_stock-trading-automation-agent/03-plan.md

## Artifact Content

# 03 Plan — Stock Trading Automation Agent (Fresh Stage)

## 0) 확정된 사용자 결정
- 시장: `US`
- 대상: `ETF + 대형주`
- 실행 주기: `EOD`
- 브로커/API: `Alpaca Trading API` 우선. API-first 구조, paper trading, REST/WebSocket/SSE, Node SDK, bracket/OCO 주문 지원이 MVP와 가장 잘 맞는다.
- 실행 모드: `완전자동`. 단, live 전환은 1회 승인 게이트를 통과해야 하며, 이후 개별 주문은 자동 실행한다.
- 리스크 정책: 고정 숫자형 익절/손절보다 변동성·낙폭 예산 기반 제어를 기본으로 둔다.
- 알림 채널: `Telegram`
- 비밀값: 채팅/파일/.env에 저장하지 않고 기존 AIZen `core/secrets/keychain.ts`의 macOS Keychain 방식만 사용한다.

## 1) 목표/성공기준
- 목표: 제공된 리서치(공개 아티팩트 + `deep-research-report.md`) 기반으로 **안전 우선형 주식 자동매매 에이전트**를 구축하고, `백테스트 → 페이퍼트레이딩 → 소액 실거래` 게이트를 통과한다.
- 1차 성공기준(MVP):
  - 비용/슬리피지 반영 후 백테스트 기준 충족(아래 Gate G3).
  - 페이퍼트레이딩 연속 안정 운용(2~4주) 무중단.
  - 주문/리스크/감사로그/킬스위치 운영 검증 완료.

## 2) 입력 자료/결손 보완
- 확인된 입력:
  - `/Users/zenkim_office/Downloads/deep-research-report.md`
- 결손 입력:
  - `https://claude.ai/public/artifacts/d1889d10-d683-42d1-a9ae-68ed1c3d48a3` 본문 미확인.
- 조치:
  - P0 단계에서 공개 아티팩트 본문 확보(복붙/내보내기) 또는 사용자 요약 수집.
  - 확보 전까지는 deep-research-report 기반 MVP 설계로 진행, 상충 사항은 `ASSUMPTION` 태그로 명시.

## 3) 구현 범위 (MVP → 확장)
- MVP(필수):
  - US ETF+대형주 EOD universe, 데이터 수집/정합성 검증, 신호 생성, 포지션 사이징, Alpaca paper 주문 실행, 리스크 게이트, Telegram 알림, 감사로그.
- 확장(2단계):
  - 뉴스/공시/재무 멀티소스 결합, 모델 고도화(ML), 멀티에이전트 협업.

## 4) 파일 설계 (AIZen 구조 매핑)
- 언어/런타임 결정:
  - `TypeScript`로 구현한다. 현재 AIZen은 Node/TypeScript, strict `tsconfig`, `tsx`, `skills/zen-<name>/handler.ts`, `core/error`, `core/secrets`, `core/types.ts` 패턴을 이미 갖고 있다.
  - Python quant 생태계는 2단계 연구/모델링에서 별도 실험으로만 허용하고, MVP 주문/리스크/운영 경로에는 넣지 않는다.
- 단일 SKILL 우선:
  - `skills/zen-trading-agent/SKILL.md`
  - `skills/zen-trading-agent/handler.ts`
  - `skills/zen-trading-agent/types.ts`
  - `skills/zen-trading-agent/config.ts`
  - `skills/zen-trading-agent/data.ts`
  - `skills/zen-trading-agent/signal.ts`
  - `skills/zen-trading-agent/portfolio.ts`
  - `skills/zen-trading-agent/risk.ts`
  - `skills/zen-trading-agent/alpaca.ts`
  - `skills/zen-trading-agent/audit.ts`
  - `skills/zen-trading-agent/telegram.ts`
  - `skills/zen-trading-agent/tests/*.test.ts`
- 기존 core 연동:
  - `core/secrets/keychain.ts`: `ALPACA_API_KEY_ID`, `ALPACA_API_SECRET_KEY`, `TELEGRAM_BOT_TOKEN` presence/read.
  - `core/error/index.ts`: Alpaca API 호출, 데이터 수집, Telegram 알림에 `withRetry` 적용.
  - `core/types.ts`: SKILL 실행 결과와 채널 타입 재사용.
- 설정/정책:
  - `skills/zen-trading-agent/risk-policy.json`: 비밀값 없는 paper/live 정책값.
  - `docs/trading/RISK_POLICY.md`
  - `docs/trading/OPERATIONS_RUNBOOK.md`
  - `docs/trading/PAPER_TO_LIVE_CHECKLIST.md`
- 금지:
  - `src/trading/`, `configs/trading/`, `.env.example`는 만들지 않는다. 현재 AIZen 구조와 Keychain-only 정책에 맞지 않는다.
- 검증/테스트:
  - `skills/zen-trading-agent/tests/data.test.ts`
  - `skills/zen-trading-agent/tests/no-lookahead.test.ts`
  - `skills/zen-trading-agent/tests/risk.test.ts`
  - `skills/zen-trading-agent/tests/order-idempotency.test.ts`

## 5) 단계별 실행 시퀀스
1. P0 요구사항 고정
- US, ETF+대형주, EOD, Alpaca paper, 완전자동, Telegram, 리스크 한도 확정.
- 공개 아티팩트 본문 확보/요약 반영.

2. P1 아키텍처/스키마 확정
- 주문 상태머신(NEW/PARTIAL/FILLED/CANCELED/REJECTED), 포지션/현금/노출 모델 정의.
- 리스크 정책 문서화(`RISK_POLICY.md`).
- Alpaca adapter 인터페이스는 paper/live endpoint 전환만으로 동작하게 분리하고, 모든 주문에 `client_order_id` 멱등성 키를 붙인다.

3. P2 데이터 레이어 구현
- Alpaca Market Data 또는 보조 EOD 소스에서 US Stocks/ETFs 일봉 시세 수집 + 결측/중복/휴장일 검증.
- 시점 정렬 및 look-ahead 방지 검증.

4. P3 전략/백테스트 구현
- 저회전 롱온리 베이스라인 전략 구현.
- 비용(수수료/세금/슬리피지) 보수적으로 반영.
- 워크포워드/기간 분할 검증.
- 기본 universe는 고유동 ETF와 S&P 100급 대형주로 시작하고, 평균 보유기간은 20~40거래일을 목표로 한다.

5. P4 실행/리스크/감사 구현
- Alpaca 브로커 어댑터 + 주문 멱등성 키 + 재시도/실패처리.
- 손실한도/노출한도/킬스위치/승인게이트 적용.
- 모든 의사결정/주문 이벤트 감사로그 적재.
- 익절/손절은 Alpaca bracket/OCO 주문을 사용할 수 있게 설계하되, 정책값 산출은 변동성·낙폭 예산 기반으로 한다.

6. P5 모니터링/알림/운영
- 장애/거부/지연 알림 채널 연동.
- 페이퍼트레이딩 런북 점검 후 실거래 전환 체크리스트 운영.

## 6) 검증 계획
- 단위 테스트:
  - 데이터 정합성, look-ahead 차단, 리스크 게이트, 주문 멱등성.
- 시뮬레이션 테스트:
  - 장중 API 실패, 부분체결, 주문거부, 지연 데이터 주입.
- 성능/안전 검증:
  - 백테스트 KPI + 비용 민감도(슬리피지 1x/2x/3x) 내구성.
  - G3 기준: walk-forward OOS Sharpe `>= 0.8`, MDD `<= 8%`, 월 turnover `<= 80%`, SPY buy-and-hold 및 equal-weight baseline 대비 비용 차감 후 우위.
  - paper 기준: 20거래일 이상 운영, 주문 중복 0건, stale signal 주문 0건, 리스크 halt 정상 동작 100%.
- 운영 검증:
  - 페이퍼트레이딩 기간 무중단, 경보 누락 0건 목표.

## 7) 롤백 전략
- 배포 단위:
  - `paper`/`live` 프로파일 분리, live는 feature flag로 활성화.
- 즉시 롤백 트리거:
  - 일손실 `-0.75%`, 주손실 `-2.5%`, 포트폴리오 peak-to-trough `-8%`, 연속 주문 실패 3회, 데이터 지연 1거래일 초과 시 자동 `trade_halt=true`.
- 복구 절차:
  - 신규 주문 차단 → 미체결 주문 취소 → 포지션 동결/축소 규칙 적용 → 원인 분석 후 재개 승인.
- 변경 롤백:
  - 전략 버전 태깅 + 이전 안정 버전으로 즉시 복귀 가능하도록 구성.

## 8) Acceptance Gates
- G1 요구사항 게이트: 시장/자산/주기/브로커/리스크 한도 확정 문서 승인.
- G2 계정 게이트: Alpaca paper 계정, `ALPACA_API_KEY_ID`, `ALPACA_API_SECRET_KEY`, `TELEGRAM_BOT_TOKEN`이 Keychain에 저장되어 있고 secret value가 로그/파일에 노출되지 않음.
- G3 기술 게이트: 비용 반영 후 walk-forward OOS Sharpe `>= 0.8`, MDD `<= 8%`, 월 turnover `<= 80%`, SPY/equal-weight baseline 대비 우위.
- G4 운영 게이트: 킬스위치/승인플로우/감사로그/알림/런북 점검 통과.
- G5 배포 게이트: paper 20거래일 이상 통과 후 소액 live 1회 승인, 이후 완전자동. 미충족 시 자동 롤백.

## 9) 리스크 정책 초안
- 포트폴리오:
  - gross exposure 최대 `80%`, cash buffer 최소 `20%`.
  - ETF 1종목 최대 `20%`, 개별 대형주 1종목 최대 `5%`.
  - 동시 보유 목표 `10~25`개, 단 high-conviction basket이 10개 미만이면 현금 비중을 늘린다.
- 포지션 진입:
  - EOD close 데이터 기준 신호 생성 후 다음 정규장 주문.
  - 주문금액은 `min(정책상 비중, volatility target)`로 계산한다.
- 손절:
  - 고정 손절 단독 금지.
  - 기본 hard stop은 `entry - max(2.5 * ATR20, 8%)`보다 불리해지면 청산 후보로 둔다.
  - ETF는 `2.0 * ATR20`, 대형주는 `2.5 * ATR20`을 기본값으로 쓰고 백테스트에서 조정한다.
- 익절:
  - 고정 익절 단독 금지.
  - 수익이 `+2R` 이상이면 trailing stop을 활성화하고, 20거래일 고점 대비 `1.5 * ATR20` 이탈 시 축소/청산한다.
  - 신호 half-life 기준 40거래일을 넘기면 재평가하고, 신호가 사라지면 청산한다.
- 포트폴리오 halt:
  - 일손실 `-0.75%`: 신규 매수 중단.
  - 주손실 `-2.5%`: 신규 매수 중단 + 리스크 절반 축소.
  - peak-to-trough `-8%`: 모든 신규 주문 중단, Telegram 경보, 미체결 주문 취소.
- 완전자동 운영:
  - paper에서는 완전자동.
  - live에서는 최초 전환 승인 후 완전자동. 단, halt 해제는 수동 승인 필요.

## 10) 산출물 완료 정의 (DoD)
- 코드: 데이터→신호→주문→리스크→로그 파이프라인 end-to-end 실행.
- 테스트: 핵심 테스트 통과 + 페이퍼트레이딩 안정 운용 리포트 생성.
- 문서: 정책/런북/체크리스트 최신화.
- 운영: live 전환 전 G1~G5 전부 `PASS` 상태.

## Context

### Git Status

```
?? .ai/codex-hyphen-trigger-guard.json
?? .ai/peer-review/runs/20260511-170920-claude-review-62414.md
?? .ai/peer-review/runs/20260511-171220-claude-plan-65226.md
?? .ai/pipeline/runs/20260511-170810_stock-trading-automation-agent/
```

### Diff Stat

```
(no unstaged diff stat)
```

## Peer Result

### Peer Review Verdict: **PASS** (medium confidence)

The revised 03-plan.md successfully resolves all 6 critical/high findings from the prior FAIL review:
- `skills/zen-trading-agent/` structure (not `src/trading/`)
- TypeScript with rationale (not Python)
- Keychain-only secrets (no `.env.example`)
- Core module integration explicit
- Concrete G3 thresholds (Sharpe >= 0.8, MDD <= 8%, turnover <= 80%)

**3 new high-severity findings** (improvement suggestions, not blockers):
- **N1**: Data persistence strategy undefined — should be P1 deliverable
- **N2**: Backtesting engine scope unacknowledged — substantial sub-project
- **N3**: State management between EOD runs undefined — fundamental architecture gap

**4 medium findings**: SECRETS const extension, signal methodology direction, schedule trigger mechanism, NPM dependency plan.

**Recommendation**: Proceed to implementation. Incorporate N1-N3 as explicit P1 architectural decisions. Update `run.json` plan_review_verdict from `NEEDS_USER_DECISION` to `PASS`.

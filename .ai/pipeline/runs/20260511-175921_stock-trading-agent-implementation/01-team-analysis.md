# Team Analysis — Stock Trading Agent Implementation

## Problem
사용자가 구현 시작을 승인했으며, AIZen 제약을 지키면서 브로커 독립 코어부터 단계적으로 실제 구현을 진행해야 한다.
핵심은 초기부터 특정 브로커에 잠기지 않도록 공통 계약/리스크/에러 경계를 고정하고, live 연결 없이 paper 기반 검증으로 품질과 안전을 확보하는 것이다.

## Current State
- 승인 상태: `-play 구현 시작`으로 구현 착수 승인됨.
- 기준 문서: `20260511-174922_stock-trading-plan-sequence-update/03-plan.md` 확정.
- 확정 순서:
  1. Broker-independent core 설계/구현
  2. Alpaca paper adapter 1차 검증
  3. KIS 국내/해외 adapter는 계약/스텁/확장 계획까지만 반영 (live 금지)
  4. live 후보 결정은 별도 사용자 승인 전 금지
- 제약:
  - TypeScript 기반
  - 기존 패턴(`skills/zen-<name>/handler.ts`, `core/secrets`, `core/error`, `core/types`) 재사용
  - `src/trading`, `configs/trading`, `.env.example` 생성 금지
  - 비밀값/계좌값/토큰 비노출 (파일/로그/응답)

## Options
1. **US-first 검증형 (권장)**
공통 코어 → Alpaca paper로 lifecycle 검증 → KIS 계약/스텁 확장.
장점: 빠른 검증 루프, 낮은 운영 리스크, 코어 안정화 우선.
2. **KIS 선행형**
국내/해외 KIS를 먼저 구현하고 Alpaca를 후행.
단점: 인증/시장 규칙 복잡도로 코어 계약이 흔들릴 가능성 높음.
3. **병렬 다중 브로커 구현형**
Alpaca/KIS를 동시에 구현.
단점: 범위 급팽창, 실패 원인 분리 어려움, 게이트 통제 약화.

## Recommendation
옵션 1 채택.
공통 코어를 먼저 고정하고 Alpaca paper로 실행 검증을 통과한 뒤, KIS는 2차 확장(계약/스텁/테스트 더블 중심)으로 진행한다.
리스크 정책은 고정 TP/SL 대신 변동성/낙폭 예산 기반으로 코어 정책 계층에서 일원화한다.
Telegram은 주문 실행 경로가 아니라 후속 운영 알림 채널로만 반영한다.

## Scope
- 포함:
  - 공통 broker contract, domain types, error mapping 규약
  - volatility/drawdown budget risk policy
  - Alpaca paper adapter skeleton + implementation (live endpoint 미사용)
  - KIS adapter contract + stub (국내/해외 확장 포인트 명시)
  - 테스트(단위/계약/시나리오), docs/runbook/checklist
- 제외:
  - 실계좌 연동
  - live 주문/endpoint 호출
  - live 브로커 최종 선정/전환

## Risks
- 코어 계약 과소설계로 KIS 확장 시 재작업 발생
- Alpaca 중심 모델이 KIS 시장 규칙(호가/세션/코드체계) 흡수를 누락할 위험
- Keychain-only 비밀관리 우회 코드 유입 위험
- 테스트가 adapter 구현 속도를 따라가지 못해 회귀 탐지 지연
- Telegram 경로가 실행 경로와 혼재되어 운영 책임 경계가 흐려질 위험

## Gates
- **G0 (Core Gate)**
공통 계약/타입/에러/시크릿 경계 확정, volatility/drawdown risk policy 반영, 브로커 독립성 검증.
- **G1 (Alpaca Paper Gate)**
주문 lifecycle(create/cancel/fill sync) + 실패 매핑 정상, paper-only 보장.
- **G2 (KIS Stub/Contract Gate)**
국내/해외 차이를 흡수하는 계약/정규화 설계 및 스텁 검증, live/secret 미연결 보장.
- **G3 (Live Decision Gate)**
별도 사용자 승인 전까지 live 후보 결정/전환 금지; 승인 시점에만 비교/선정 문서 진행.
- **Quality Gate (공통)**
테스트 실행 결과 기록, 민감정보 무노출 점검, 금지 경로/파일 미생성 점검.
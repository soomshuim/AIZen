---
name: zen-trading-core
displayName: "Trading Core Contract"
description: "Broker-independent trading domain contracts and volatility/drawdown risk budget checks."
version: "0.1.0"
author: "@zen"
triggers:
  - chat: "trading core"
secrets: []
permissions:
  - filesystem: .aizen-cache/trading
status: draft
---

# Trading Core Contract

## 무엇을
브로커와 무관한 주문, 계좌, 포지션, 체결, quote 타입을 기준으로 adapter를 검증한다.

## 순서
1. `core/types.ts`의 `BrokerAdapter` 계약을 기준으로 상위 유스케이스를 작성한다.
2. 리스크는 고정 익절/손절이 아니라 volatility budget, drawdown budget, gross exposure budget으로 판단한다.
3. broker registry는 `alpaca-paper`, `kis-stub`만 노출하며 live adapter는 만들지 않는다.
4. paper snapshot, audit event, checkpoint는 `.aizen-cache/trading/`에만 저장한다.
5. live 후보 결정은 paper/sandbox 증거와 별도 사용자 승인 이후에만 진행한다.

## 금지
- `src/trading`, `configs/trading`, `.env.example` 생성 금지
- 계좌값, API secret, 토큰을 파일/로그/응답에 기록 금지
- adapter 내부에서 live endpoint를 기본값으로 사용 금지

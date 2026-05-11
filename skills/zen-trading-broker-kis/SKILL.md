---
name: zen-trading-broker-kis
displayName: "KIS Broker Adapter Contract"
description: "KIS domestic/overseas adapter contract and live-blocked stub for phase G2."
version: "0.1.0"
author: "@zen"
triggers:
  - chat: "kis broker"
secrets:
  - KIS_APP_KEY
  - KIS_APP_SECRET
  - KIS_ACCOUNT_ID
permissions:
  - network: disabled-until-approved
status: draft
---

# KIS Broker Adapter Contract

## 무엇을
KIS 국내/해외주식 확장을 위한 contract와 시장 정규화 stub을 둔다.

## 현재 상태
- G2에서는 계약과 live 차단 stub만 제공한다.
- 실계좌/API secret 기반 live 연결은 금지한다.
- 국내/해외 symbol, 호가단위, 거래시간, 주문 상태 차이는 core 타입으로 정규화한다.

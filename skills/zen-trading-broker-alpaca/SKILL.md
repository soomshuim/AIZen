---
name: zen-trading-broker-alpaca
displayName: "Alpaca Paper Broker Adapter"
description: "Alpaca paper-only adapter for validating the broker-independent trading contract."
version: "0.1.0"
author: "@zen"
triggers:
  - chat: "alpaca paper"
secrets:
  - ALPACA_PAPER_API_KEY
  - ALPACA_PAPER_API_SECRET
permissions:
  - network: alpaca-paper
status: draft
---

# Alpaca Paper Broker Adapter

## 무엇을
Alpaca paper endpoint로만 `BrokerAdapter` 계약을 검증한다.

## 운영 규칙
- 기본 base URL은 `https://paper-api.alpaca.markets`만 사용한다.
- live endpoint는 별도 사용자 승인 전 금지한다.
- secret은 Keychain의 `ALPACA_PAPER_API_KEY`, `ALPACA_PAPER_API_SECRET`에서만 읽는다.
- 주문 lifecycle 검증은 paper 계정에서만 수행한다.

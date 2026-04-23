---
name: zen-lunar-birthday
displayName: "음력 기념일 알림 + 선물 추천"
description: "가족·지인의 음력 생일/기념일을 양력으로 변환해 D-14/7/3/1 단계 알림 + Claude 기반 선물 추천."
version: "0.1.0"
author: "@zen"
triggers:
  - cron: "0 9 * * *"
secrets:
  - TELEGRAM_BOT_TOKEN
permissions:
  - channel: telegram
  - filesystem: read-write
status: paused
---

# 음력 기념일 알림 + 선물 추천

## 무엇을
가족·지인의 음력 생일·기념일을 양력으로 자동 변환해 D-14 / D-7 / D-3 / D-1 단계로 Telegram 알림. D-알림 시 Claude 기반 선물 추천 첨부 (W3 강화).

## 언제
- **Cron**: 매일 오전 9시 — 오늘 알릴 사람 있는지 체크
- **Chat (W2)**: "음력", "생일", "기념일" 키워드 (수동 조회)

## 어떻게
1. `~/Project/AIZen/data/profiles/family.json` 읽기 (이름, 음력 생일, 취향, 알레르기, 예산)
2. `lunar-javascript`로 오늘 기준 D-N 계산
3. D-14 / 7 / 3 / 1 일치하는 사람 → Telegram 알림
4. 사용자가 "추천" 답하면 → 선물 추천 RAG (W3)

## 의존성
- npm: `lunar-javascript@^1.7.0`
- AIZen core: `secrets/keychain`, `error/index`, `types`

## 데이터 형식 (data/profiles/family.json)

```json
{
  "people": [
    {
      "id": "father",
      "name": "아빠",
      "relationship": "father",
      "lunar_birthday": "8/15",
      "preferences": ["등산", "건강식"],
      "allergies": [],
      "budget": [50000, 150000]
    }
  ]
}
```

## 첫 케이스 검증 (W1 Day 2)
- 입력: 사용자 부모님 1명 프로필
- 동작: 오늘 기준 D-N 계산 → 콘솔 로그 (Telegram 봇 활성화 전)
- 검증: 음력→양력 변환 정확성 + D-N 계산 정확성

## v1.1+ 확장
- 선물 추천 RAG (쿠팡/네이버 검색)
- D-알림 톤 차별화 (D-14 정보형 vs D-1 강조형)
- 거절/snooze UX
- 24절기, 기일, 결혼기념일 등 다른 음력 기반 날짜

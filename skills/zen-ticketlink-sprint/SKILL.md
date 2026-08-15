---
name: zen-ticketlink-sprint
displayName: "TicketLink Sprint (LG 트윈스 세미-오토 예매)"
description: "티켓링크 일반예매를 세미-오토로 돕는다 — 정시 진입·좌석 자동탐색까지. 캡차와 결제 확정은 사람이 직접."
version: "0.1.0"
author: "@zen"
triggers:
  - chat: "ticketlink sprint"
secrets: []
permissions:
  - filesystem: .aizen-cache/ticketlink
status: draft
---

# TicketLink Sprint

## 무엇을
LG 트윈스 홈경기 **티켓링크 일반예매**(경기 D-7 오전 11시)를 세미-오토로 돕는다.
사전 로그인된 브라우저로 정시에 예매에 진입하고, 캡차 앞에서 멈춰 사람에게
넘긴 뒤, 통과하면 선호 구역 빈 좌석을 자동 탐색·선택하고 결제 페이지까지
진행한다. **결제 확정은 사람이 누른다.**

## 경계 (넘지 않는 선)
- **캡차 자동 해결 안 함** — 캡차는 자동화 차단 장치다. 도구는 캡차를 감지해
  멈추고 사람에게 알릴 뿐, 인식·우회하지 않는다.
- **완전 무인 결제 안 함** — 마지막 결제 확정은 항상 사람.
- 약관·계정 리스크는 사용자(젠) 감수. 단 위 두 경계는 리스크 감수와 무관하게 고정.

## 현실 (기대치)
- 티켓링크는 **가상 대기열**(NetFUNNEL 계열)을 쓴다. 정시 자동 진입이 벌어주는
  것은 "대기줄 진입 타이밍 + 통과 후 좌석 자동선택"이고, 대기 순번 자체는
  줄여주지 못한다. "무조건 예매 성공"이 아니라 "수동보다 빠르고 좌석선택이 자동".

## 순서 (phase)
0. **정찰(선행·필수)** — 로그인된 프로필로 실제 예매 흐름을 열어 DOM 구조·좌석도
   방식(HTML vs canvas)·대기열·캡차 위치를 실측한다. 이 실측으로 selector를 만든다.
   (짐작으로 selector 작성 금지 — 실측 우선.)
1. **본예매 도구** — 서버시간 카운트다운 → 정시 진입 → 캡차 일시정지+알림 →
   좌석 자동탐색·선택 → 결제 페이지 정지.
2. **리허설** — 실제 구매 없이 진입까지 dry-run.
3. **(선택) 취소표 알림** — 매진 후 취소표 폴링 → 텔레그램 알림.

## 파일
- `prepare-login.ts` — ✅ 로그인 프로필 준비(전용 크롬 창). 실행 후 사람이 로그인.
- `config.example.json` — 경기 URL·오픈 일시·선호 구역·프로필 경로 템플릿.
- `handler.ts` — (예정) 정찰·본예매 로직.
- 프로필/설정 데이터는 `.aizen-cache/ticketlink/`(gitignore) — 로그인 세션 비커밋.

## 실행
```bash
# 1) 로그인 프로필 준비 (한 번, 사람이 로그인)
pnpm --silent tsx skills/zen-ticketlink-sprint/prepare-login.ts
```

## 기술 메모
- Playwright `launchPersistentContext`로 시스템 Chrome을 몬다(브라우저 미번들
  = `playwright-core` + `CHROME_PATH`). 로그인 준비와 자동화가 **같은 프로필
  폴더**를 써서 세션 형식 불일치를 피한다.
- 서버시간 동기화는 본예매 단계에서 신뢰 시각(KST)으로 카운트다운(로컬 시계 금지).

## 금지
- 캡차 인식·외부 캡차 대행 서비스 연동 금지.
- 로그인 자격증명·쿠키·세션 값을 로그/응답/커밋에 노출 금지(`.aizen-cache`만).
- 정찰 없이 selector 하드코딩 금지.

---
name: aizen
description: AIZen 메인 진입점. 상태 보고 + SKILL 목록 + 라우팅.
---

# /aizen

AIZen 메인 슬래시 커맨드. 인자 없으면 상태 보고.

## 인자별 동작

| 인자 | 동작 |
|------|------|
| (없음) | 상태 보고 (활성 SKILL, 마지막 실행, 에러 인벤토리) |
| `status` | 상세 헬스 체크 (OpenClaw daemon, channel 연결, 시크릿) |
| `skills` | SKILL 목록 + 활성/비활성 + 마지막 실행 시각 |
| `new <설명>` | 새 SKILL 자동 생성 → `/aizen-new`로 위임 |
| `setup` | 1회 셋업 가이드 (Pair Mode) |

## 실행 순서

1. `~/Project/AIZen/.ai/SESSION.md` 읽고 현재 단계 파악
2. `openclaw status` 실행해 daemon 상태
3. `openclaw skills list` 실행해 활성 SKILL 확인
4. 시크릿 인벤토리 확인 (`security` CLI로 표준 키 존재 여부)
5. 결과 한국어로 요약 보고

## 출력 형식

```
🤖 AIZen 상태
- 단계: W1 Day 1 (플랫폼 셋업)
- OpenClaw daemon: running ✅ (port 18789)
- 활성 채널: telegram ✅
- 활성 SKILL: 1개 (zen-lunar-birthday)
- 시크릿 인벤토리: 2/4 ✅ (TELEGRAM_BOT_TOKEN ⏳)
- 최근 실행: 오늘 09:00 zen-lunar-birthday → 0 매칭
- Dead letter: 0건

다음 명령:
- /aizen new <설명> — 새 SKILL 만들기
- /aizen skills — SKILL 자세히 보기
```

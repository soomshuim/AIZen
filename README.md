# AIZen 🤖

> Personal Automation OS — built for @zen, extensible for everyday life.

새 자동화가 필요할 때마다 5분~1시간에 새 SKILL 추가. AIZen이 코드 작성, 사용자는 검토·승인.

## Status

**Day 1 — 2026-04-23** · Initial setup phase. 아직 사용 불가.

설계 문서: `~/.claude/plans/aizen-elegant-stearns.md` (v5.1)

## Vision

기존 Personal AI(Saner.ai · myclaw · Notion AI)는 미리 정의된 기능 안에서만 동작합니다. 새 도메인이 필요하면 벤더 로드맵을 기다려야 합니다.

AIZen은 다릅니다:

- **확장성**: 사용자가 "이런 자동화 필요해" → AIZen이 SKILL 스캐폴드 자동 생성 → 검토 → 활성화
- **한국 도메인 네이티브**: 음력 기념일 / 청약 모니터링 / 카톡 톤 (시드 SKILL)
- **셀프 호스팅**: 데이터 주권. 시크릿은 macOS Keychain.
- **본인 워크플로 100% 맞춤**: 디자이너 + Plumlabs 운영자 + 다수 프로젝트 매니저

## Architecture

```
┌────────────────────────────────────────┐
│ Layer 4: UI                             │
│ Telegram Bot + Claude Code slash cmds   │
├────────────────────────────────────────┤
│ Layer 3: Self-bootstrapping ⭐          │
│ /aizen-new → SKILL scaffolding          │
├────────────────────────────────────────┤
│ Layer 2: SKILL Registry                 │
│ skills/zen-*/SKILL.md                   │
├────────────────────────────────────────┤
│ Layer 1: Core (OpenClaw + extensions)   │
│ Memory · Scheduler · Channels · Secrets │
└────────────────────────────────────────┘
```

베이스는 [OpenClaw](https://github.com/openclaw/openclaw) (MIT, TypeScript). 우리는 그 위에 한국 도메인 SKILL과 self-bootstrapping 레이어를 얹습니다.

## Seed SKILLs (W1-W3)

| SKILL | 설명 | 우선순위 |
|-------|------|---------|
| `zen-chungyak-monitor` | 경기권 무순위 청약 모니터링 + 신청 가이드 | 1 (RICE 0.60) |
| `zen-lunar-birthday` | 가족 음력 기념일 알림 + 선물 추천 | 2 (RICE 0.45) |
| ~~`zen-kakao-draft`~~ | 카톡 메시지 초안 (자동 발송 X) | v1.1 연기 |

## Quick Start (when ready)

```bash
# Coming soon — W1 마일스톤 완료 후 작성됨
```

W1 완료 시 다음이 가능해집니다:
- `/aizen-setup` (Claude Code 슬래시 커맨드) — 1회 셋업
- Telegram 봇과 대화로 자동화 추가/관리

## Tech Stack

- **Runtime**: Node 22+ (테스트: v25.6.1)
- **Package**: pnpm
- **Base**: OpenClaw (Gateway + 24+ 채널 통합)
- **AI**: Claude Opus 4.7 (planning) / Sonnet 4.6 (routing)
- **Memory**: OpenClaw memory + Anthropic Memory Tool (보조)
- **Storage**: SQLite + sqlite-vec (로컬)
- **Scheduler**: macOS launchd
- **Secrets**: macOS Keychain

## Roadmap

- **Phase 1** (2026-04 ~ 2026-05) — Personal Automation MVP
- **Phase 2** (2026-06 ~ 2026-09) — Designer / PM Workflow (Figma·CDS·Linear·Notion)
- **Phase 3** (2026-10 ~) — Public 또는 Plumlabs SaaS 검토

## License

Personal project. 일부 SKILL은 v1.1+에서 ClawHub 공개 검토.

# AIZen Session Memory

> 세션 단기 기억 (compact 후 이어갈 내용)
> Last updated: 2026-04-23 17:33

---

## 프로젝트 개요

**한 줄**: zen@plumlabs.im을 위한 확장 가능한 Personal Automation OS.
**현재 단계**: W1 — 플랫폼 셋업 (Day 1 완료)
**Plan**: `~/.claude/plans/aizen-elegant-stearns.md` (v5.1, 2026-04-23 승인)

---

## Day 1 — 2026-04-23 (완료)

### 완료된 작업

| 작업 | 결과 |
|------|------|
| **Plan v5.1 작성** | Personal Automation Platform 컨셉, 4 layer 아키텍처, Pair Mode 가이드 (14절) |
| **Team Review (4 roles)** | Product / Engineering / Design / Strategy 검수 → v5로 진화 |
| **Phase 0 Prerequisites** | Node v25.6.1 / Git 2.50.1 / gh 2.87.3 / Homebrew 5.0.16 / pnpm 10.33.1 ✅ |
| **OpenClaw 활성도 검증** | 362,593 stars / 74,078 forks / MIT / TypeScript / 오늘 push ✅ → Buy 결정 |
| **AIZen 레포 clone** | `gh repo clone soomshuim/AIZen ~/Project/AIZen` |
| **표준 디렉토리 구조** | `.ai/` `.claude/{commands,skills,rules}/` `core/{secrets,error,monitoring,backup,self-bootstrapping}/` `docs/` `skills/` |
| **표준 문서 작성** | CLAUDE.md, README.md, .ai/SESSION.md, .gitignore |
| **OpenClaw 설치** | `npm install -g openclaw@latest` → 2026.4.21 ✅ |
| **TypeScript 환경** | package.json + tsconfig.json + pnpm install (lunar-javascript, tsx, typescript) |
| **시크릿 wrapper** | `core/secrets/keychain.ts` + README — Anthropic API key 이미 Keychain에 있음 ✅ |
| **에러 표준** | `core/error/index.ts` — withRetry + Dead Letter Queue |
| **공유 타입** | `core/types.ts` — SkillContext / SkillResult / Channel / User |
| **슬래시 커맨드 2개** | `.claude/commands/aizen.md`, `.claude/commands/aizen-new.md` |
| **SKILL 표준 템플릿** | `docs/skill-template.md` |
| **첫 SKILL 골격** | `skills/zen-lunar-birthday/{SKILL.md, handler.ts}` — dry-run 통과 ✅ |
| **샘플 데이터** | `docs/sample-family.json` (사용자 참고용) |
| **CHANGELOG / HANDOFF 작성** | CHANGELOG.md, .ai/HANDOFF.md |

총 17 + 3 = 20 파일 생성. 첫 commit 완료.

---

## Day 2 — 다음 단계 (사용자 액션 + 후속)

### 사용자 액션 필요 (3가지)

| # | 액션 | 소요 |
|---|------|------|
| 1 | Telegram 봇 토큰 발급 (@BotFather) → `security add-generic-password ... -s "TELEGRAM_BOT_TOKEN"` | 5분 |
| 2 | 부모님 음력 생일 입력 → `data/profiles/family.json` (샘플은 `docs/sample-family.json`) | 2분 |
| 3 | `openclaw onboard --install-daemon` 실행 (인터랙티브) | 10-15분 |

### 사용자 액션 후 즉시 진행 (Claude)

1. zen-lunar-birthday 실 매칭 검증 (생일 받으면)
2. Telegram 봇 hello-world (토큰 받으면)
3. OpenClaw에 zen-lunar-birthday SKILL 등록 (`openclaw skills activate`)
4. cron 등록 (매일 오전 9시)

### W1 잔여 (사용자 액션 후 W1 마무리)

- **Self-bootstrapping 레이어** (`/aizen-new` 워크플로) — Layer 3 핵심
- **모니터링** (`core/monitoring/`) — 데몬 watchdog + 일일 morning check
- **백업** (`core/backup/`) — `~/.openclaw/workspace/` 일일 백업
- **첫 raw push** (`git push -u origin main`)

### W2 시작

- **zen-chungyak-monitor** SKILL 작성 (RICE 1순위)
  - 데이터: 공공데이터포털 API (먼저) / Playwright 스크래핑 (fallback)
  - PUBLIC_DATA_API_KEY 발급 필요 (data.go.kr)

---

## 핵심 의사결정 (지금까지)

| 결정 | 선택 | 근거 |
|------|------|------|
| OpenClaw 통합 방식 | **글로벌 CLI 설치 + 독립 레포** (subtree X) | OpenClaw README 확인 — Gateway는 control plane, AIZen은 SKILL/설정만 |
| 시크릿 저장 | **macOS Keychain** | 사용자 환경에 맞고, ANTHROPIC_API_KEY 이미 저장됨 |
| 1차 채널 | **Telegram** (단일) | Less is More (Design 합의) |
| UC 우선순위 | **청약(W2) > 음력(W2-3) >> 카톡(v1.1 연기)** | RICE 적용 (Product 합의) |
| 호스팅 | **사용자 macOS launchd** (1차) | Mac mini 분리는 v1.1+ |
| AIZen Cornered Resource | **사용자 자신의 다양한 도메인 페인** | Strategy 합의, "한국 도메인 깊이"만으로 차별화 부족 |
| 음력 라이브러리 | `lunar-javascript@^1.7.0` | 검증된 OSS, dry-run 통과 |
| 에러 처리 | `withRetry` 표준 (3회 + exponential backoff + DLQ) | 모든 SKILL 공통 |

---

## 환경 정보

- **OS**: macOS (zenkim_office)
- **Node**: v25.6.1
- **pnpm**: 10.33.1
- **gh CLI**: 2.87.3
- **OpenClaw**: 2026.4.21 (`/opt/homebrew/bin/openclaw`)
- **Anthropic API Key**: macOS Keychain ✅
- **Telegram Bot Token**: 미설정 ⏳
- **OpenClaw onboard**: 미실행 ⏳

---

## 참고 링크

- OpenClaw 문서: https://docs.openclaw.ai
- OpenClaw Getting Started: https://docs.openclaw.ai/start/getting-started
- ClawHub (스킬 마켓플레이스): https://clawhub.ai
- BotFather (Telegram): https://t.me/BotFather
- 공공데이터포털 (W2 청약 API): https://www.data.go.kr

---

## Plan 진화 기록

- v1: 일반 안 1/2/3 (Personal Memory / Multi-Project / Designer Workflow)
- v2: Korean Life Concierge (음력/청약/카톡)
- v3: 3 UC 병렬 + myclaw 스타일 폼팩터
- v4: OpenClaw + Cowork 통합
- **v5**: Personal Automation Platform (확장성 중심, Self-bootstrapping)
- **v5.1**: + Setup Walkthrough (Pair Mode 가이드)

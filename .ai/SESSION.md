# AIZen Session Memory

> 세션 단기 기억 (compact 후 이어갈 내용)
> Last updated: 2026-05-05 01:51

---

chore [CLD/Opus5] 2026-08-26 길드 맥스튜디오 로컬 LLM 생성 속도(TPS) 실측 — 사무실 맥북→Tailscale 직접 라우팅, 스트리밍·출력 256토큰·모델당 2회. 결과: qwen/qwen3.6-35b-a3b 81 tok/s(TTFT 웜 0.16~0.45s) / qwen3.8-27b-uncensored 29 tok/s(hkg.sh:21 기본값) / gemma-4-31b-it 19 tok/s. 콜드 스타트 TTFT는 3~5초. 발견 2건: ⓐ MoE(35B a3b, 3B active)가 dense 27B·31B보다 2.8~4배 빠름 — 파라미터 수로 속도 추정 불가 ⓑ qwen 계열은 출력 예산 대부분이 reasoning 토큰(256 중 251~255)이라 짧은 max_tokens면 사용자에게 보일 답이 안 나옴. 글로벌 메모리 reference_guild-mac-studio-llm-tps 신규 등재 + MEMORY.md 포인터 추가. hkg 기본 모델 변경은 uncensored 선택이 의도일 수 있어 제안만 하고 미변경(젠 결정 대기). AIZen 코드 변경 없음, 벤치 스크립트는 스크래치패드 전용(레포 미추가).

chore [CLD/Opus5] 2026-08-25 HKG 모집 글 확정 — 젠 결정 3건 반영: ① 접수 마감 8/28(금) 밤 자정 유지(8/28 오후 싱크 시점 접수 중 상태·설문2와 P0 확정 9/1 이후로 밀림을 알고 선택) ② 선정 기준 "2주 안에 만들 수 있는가"(피저빌리티)는 홍보 글에 노출하지 않음 — 지원자가 구현 기간에 맞춰 아이디어를 좁히지 않게 하고 젠의 내부 선정 기준으로만 사용 ③ 태그 형식 혼동은 중요하지 않음으로 종결. 세 건 모두 글 수정 없이 현행 유지, 글로벌 메모리에 재제안 금지로 등재. 게시용 최종본 = docs/hkg-bounty/v1-recruit-post.txt(0c9e527). 설문 2(선정자 피처 리퀘스트→우선순위→P0 확정) 문항 설계는 젠 지시로 접수 결과 확인 후 착수 — 지금 시작하지 않음.

chore [CLD/Opus5] 2026-08-25 HKG 길드원 에이전트 V1 킥오프 회의록(19쪽 PDF, 2026-08-24 회의) 수령·해독 → 글로벌 메모리 project_marketfitlab-agent-bounty에 V1 확정사항 반영. 바운티 역할 재정의: 젠 = 설문+P0 오너십(인프라 셋업은 도 담당으로 이관). V1 스코프 3종(슬랙 인터페이스 헤르메스 / 타겟 길드원 설문→P0 구현 / 내 맥 계정만), 9/8(화) 런칭 목표, 8/28(금) 슬랙 비동기 싱크, 바운티 300타코. 젠 액션 아이템 ①(어그로 홍보 글) 착수 — 젠 제공 이미지(로봇이 떠먹여주는 컷) 기반 슬랙 모집 글 초안 작성 후 젠 리라이트 반영, 최종본 docs/hkg-bounty/v1-recruit-post.txt 저장. 설계 판단: 도구 이름(슬랙·지메일·드라이브·노션) 나열 제거(anchoring으로 설문 응답이 그 4개에 묶임), 신청 트랙 구분 태그 [사업부 이름]/[개인] + 주어 분리 질문 2줄(팀 단위 후보 미확보 방지), 공개 채널 강제·대화 공개 고지 문단 포함(회의록 6.4 신뢰 리스크). AIZen 코드 변경 없음.

chore [CLD/Fable] 2026-08-24 바운티 셋업 최종 종료(젠 선언) — Tailscale GUI 정식 전환(userspace 우회 전부 폐기, 안내문 원형 주소·명령 그대로 작동), Cherry Studio 설치·길드 LLM 연결(LM Studio provider, qwen3.6-35b-a3b). 실측 교훈: 앱 내장 CherryIN 클라우드가 켜져 있으면 대화가 길드 서버 대신 클라우드로 나감 → 토글 off 권장. 스튜디오 sshd 포트 포워딩 금지 실측(바운티 가이드 반영 사항).

chore [CLD/Fable] 2026-08-24 바운티 온보딩 완료 — Tailscale userspace 모드 연결(sudo 불가 우회, 재부팅 시 수동 재기동), hkg@Mac Studio(100.79.218.35) SSH 검증(안내문 원형 명령 작동, ~/.ssh/config 프록시 + 별칭 hkg-studio), 로컬 LLM API(:1234/v1) 모델 4종 응답 확인. 본작업 갈림길 태스크(실행 플랜 vs 문서 리뷰)는 젠 지시로 삭제 — 협업 진행하며 논의, 재상정 금지. AIZen 코드 변경 없음.

chore [CLD/Fable] 마켓핏랩 길드 바운티 온보딩 — 맥스튜디오('맥미니'는 오기, 2026-08-24 정정) 1인 1에이전트 인프라 바운티 참여 확정(글로벌 메모리 project_marketfitlab-agent-bounty 등재, AIZen 자산 openclaw-setup·secrets·launchd·승인게이트 재활용 예정). Tailscale mfitlab.com tailnet 가입 완료(soomshuim@gmail.com, 관리자 승인 대기 상태). SSH 공개키는 신규 발급 없이 맥북프로 기존 키(~/.ssh/id_ed25519.pub, GitHub soomshuim 등록 키) 재사용 — .ssh 생성일 실측으로 이 맥 출생 확인, 판매한 구 맥미니는 초기화 후 양도 확인. .pub 파일로 관리자 전달 완료. AIZen 코드 변경 없음.

feature [CLD/Fable] zen-ticketlink-sprint 플랜 확정 + 스캐폴드 — 티켓링크 LG 세미-오토 예매(오픈런 자동진입+좌석 자동선택+취소표 알림, 캡차·결제는 사람). grill 8문 확정(범위·좌석 좌표맵·launchd 스케줄·취소표·알림 텔레그램 젠+와이프·와이프 계정·현장). Explore(재사용)+Plan(설계)+Team Feature Review 3역할(Eng·AIOps·QA) 만장일치 REVISE→6 High 반영(무음미스 방어·run.ts 생존주기+LaunchAgent·결제가드 시스템스코프·인접2석 위상·실패주입 게이트·런타임 trace). 좌석도 kind 투기추상화 3역할 원칙관찰 수렴→v1 확정 1종만. 스캐폴드: prepare-login.ts(영속 프로필 로그인·쿠키 지속성 검증)·config.example.json·SKILL.md + playwright-core dep. 플랜=.ai/plans/PLAN_ticketlink-sprint.md, 회의록=meetings/2026-08-16. 착수 전 정찰(Phase0) 대기: 와이프 로그인 프로필+게임 URL

## 프로젝트 개요

**한 줄**: zen@plumlabs.im을 위한 확장 가능한 Personal Automation OS.
**현재 단계**: W1 — 플랫폼 셋업 (Day 2 로컬 런타임 부트스트랩 완료, 사용자 시크릿/실데이터 대기)
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

## Day 2 — 2026-05-04 (로컬 런타임 부트스트랩 완료)

### 완료된 작업

| 작업 | 결과 |
|------|------|
| **AIZen 로드 커맨드 검증** | `-zen`으로 AIZen 컨텍스트 로드 완료 |
| **OpenClaw setup plan** | `-play` 실행 → `.ai/pipeline/runs/20260504-211848_openclaw-setup-plan/` 생성, review PASS |
| **Director 실행** | `-director`로 Phase 1-2 local gateway setup 실행/검증 |
| **AIZen repo 재개** | `/Users/zen/Project/AIZen` clone/pull 완료, `main...origin/main` 동기화 |
| **도구 설치** | `pnpm@10.33.1`, OpenClaw `2026.5.3-1` 설치 |
| **의존성 설치** | `pnpm install --frozen-lockfile` 완료 |
| **OpenClaw local gateway** | `~/.openclaw/openclaw.json` local/loopback/token 설정, LaunchAgent running, gateway health OK |
| **Security audit** | critical 0, warn 1 (`gateway.trusted_proxies_missing` — loopback-only에서는 blocker 아님) |
| **TypeScript 보강** | `lunar-javascript` declaration 추가 후 `pnpm -s typecheck` PASS |
| **운영 문서 보강** | `docs/openclaw-setup.md` 생성으로 CLAUDE.md dead reference 해소 |
| **시크릿 점검** | `core/secrets/check.ts` 추가. 필수 Keychain secret 누락 시 exit 1 |

### 중요한 운영 결정

- OpenClaw gateway는 **local / loopback / token auth / Tailscale off**를 기본 운영 정책으로 둔다.
- provider API key와 Telegram token은 AIZen repo가 아니라 macOS Keychain에만 저장한다.
- 현재 장비는 `Zen의 Mac mini` / `Zenui-Macmini.local`이며, 실운영 후보 장비에서 gateway 검증까지 완료했다.
- 최종 운영 장비를 다시 바꾸면 `docs/openclaw-setup.md` 순서대로 해당 장비에서 재실행하고, 현재 장비 gateway는 `openclaw gateway stop` 또는 `openclaw gateway uninstall`로 정리한다.

### 라이브 상태 메모

- OpenClaw CLI: `2026.5.3-1`
- Gateway: `http://127.0.0.1:18789/`, LaunchAgent running, health OK
- Security audit: critical 0, warn 1 (`gateway.trusted_proxies_missing`)
- macOS Keychain: `ANTHROPIC_API_KEY`, `TELEGRAM_BOT_TOKEN` missing; `OPENAI_API_KEY`, `GITHUB_TOKEN`, `PUBLIC_DATA_API_KEY` optional missing
- Telegram channel: not configured

### 산출물

- Plan run: `.ai/pipeline/runs/20260504-211848_openclaw-setup-plan/`
- Peer review: `.ai/peer-review/runs/20260504-212047-claude-review-70577.md`
- Stage 1 peer review: `.ai/peer-review/runs/20260505-013028-claude-review-12834.md` — PASS
- Director review: `reviews/2026-05-04_openclaw-setup-director.md`
- Runtime setup doc: `docs/openclaw-setup.md`
- Secrets check: `core/secrets/check.ts`
- Type declaration: `skills/zen-lunar-birthday/lunar-javascript.d.ts`

### 커밋

- `8b7276f chore: bootstrap local aizen runtime` — pushed to `origin/main`

---

## Day 3 — 2026-05-05 (세션 종료 기록)

### 완료된 작업

| 작업 | 결과 |
|------|------|
| **1단계 record 전 검증** | `pnpm -s typecheck`, `pnpm -s lunar:test`, `openclaw gateway health`, `openclaw security audit`, `git diff --check` PASS |
| **1단계 Claude review** | `.ai/peer-review/runs/20260505-013028-claude-review-12834.md` PASS |
| **1단계 커밋/푸시** | `8b7276f chore: bootstrap local aizen runtime` pushed |
| **2단계 시크릿 점검** | `pnpm -s secrets:check` expected FAIL: `ANTHROPIC_API_KEY`, `TELEGRAM_BOT_TOKEN` missing |

### 다음 세션 재개 조건

- 사용자가 `ANTHROPIC_API_KEY`, `TELEGRAM_BOT_TOKEN`을 Keychain에 저장한 뒤 `-zen`으로 재개.
- 재개 후 즉시 `pnpm -s secrets:check`를 PASS시키고 Claude review를 실행.
- 이후 Telegram hello-world → Claude review → `data/profiles/family.json` 준비 → Claude review → zen-lunar-birthday E2E → Claude review 순서로 진행.

---

## 다음 단계 (사용자 액션)

### 사용자 액션 필요

| # | 액션 | 소요 |
|---|------|------|
| 1 | `ANTHROPIC_API_KEY`를 macOS Keychain에 저장 | 5분 |
| 2 | Telegram 봇 토큰 발급 (@BotFather) → `TELEGRAM_BOT_TOKEN` Keychain 저장 | 5분 |
| 3 | 필요 시 `OPENAI_API_KEY`, `GITHUB_TOKEN`, `PUBLIC_DATA_API_KEY` 저장 | 5분 |
| 4 | 부모님 음력 생일 입력 → `data/profiles/family.json` (샘플은 `docs/sample-family.json`) | 2분 |

### 사용자 액션 후 즉시 진행

1. `pnpm -s secrets:check` 재실행
2. Telegram bot channel 연결 + hello-world
3. zen-lunar-birthday 실 매칭 검증 (생일 받으면)
4. OpenClaw skills CLI 최신 명령 확인 후 AIZen SKILL 등록 방식 확정
5. cron/launchd 등록 (매일 오전 9시)

### W1 잔여 (사용자 액션 후 W1 마무리)

- **Self-bootstrapping 레이어** (`/aizen-new` 워크플로) — Layer 3 핵심
- **모니터링** (`core/monitoring/`) — OpenClaw daemon watchdog + 일일 morning check
- **백업** (`core/backup/`) — `~/.openclaw/workspace/` 일일 백업

### W2 시작

- **zen-chungyak-monitor** SKILL 작성 (RICE 1순위)
  - 데이터: 공공데이터포털 API (먼저) / Playwright 스크래핑 (fallback)
  - PUBLIC_DATA_API_KEY 발급 필요 (data.go.kr)

---

## 핵심 의사결정 (지금까지)

| 결정 | 선택 | 근거 |
|------|------|------|
| OpenClaw 통합 방식 | **optional runtime adapter** (필수 경로 아님) | 현재 AIZen core/skills, Keychain 점검, Telegram hello-world, trading paper 테스트는 OpenClaw 없이 독립 실행 가능. OpenClaw gateway는 나중에 로컬 자동화 런타임/skill activation 계층으로만 재검토 |
| 시크릿 저장 | **macOS Keychain** | 최종 운영 장비(Mac mini)에 저장. 현재 MacBook Keychain에는 Anthropic/OpenAI/Telegram 키가 없음 |
| 1차 채널 | **Telegram** (단일) | Less is More (Design 합의) |
| UC 우선순위 | **청약(W2) > 음력(W2-3) >> 카톡(v1.1 연기)** | RICE 적용 (Product 합의) |
| 호스팅 | **Mac mini macOS launchd** (1차) | MacBook setup은 임시 검증, 실운영은 Mac mini |
| AIZen Cornered Resource | **사용자 자신의 다양한 도메인 페인** | Strategy 합의, "한국 도메인 깊이"만으로 차별화 부족 |
| 음력 라이브러리 | `lunar-javascript@^1.7.0` | 검증된 OSS, dry-run 통과 |
| 에러 처리 | `withRetry` 표준 (3회 + exponential backoff + DLQ) | 모든 SKILL 공통 |

---

## 환경 정보

- **OS**: macOS (`Zen의 Mac mini` / `Zenui-Macmini.local`)
- **Node**: v25.2.1
- **pnpm**: 10.33.1
- **gh CLI**: 2.87.3
- **OpenClaw**: 2026.4.21 observed on 2026-05-11
- **Anthropic API Key**: Keychain missing ⏳
- **OpenAI API Key**: optional, Keychain missing ⏳
- **Telegram Bot Token**: 미설정 ⏳
- **OpenClaw onboard**: local gateway exists, but `openclaw gateway health` currently needs pairing/scope approval; not blocking AIZen core work

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

### 2026-05-11 18:42:59 +0900 Auto Context Handoff

- Trigger: Codex context below `20%` (`16%` remaining)
- Project: `/Users/zenkim_office/Project/AIZen`
- Resume trigger: `cd ~/Project/AIZen && read .ai/HANDOFF.md`
- Snapshot: `/Users/zenkim_office/Project/AIZen/.ai/auto-handoff/20260511-184259_codex-context-low`
- Clear sentinel: `/Users/zenkim_office/.codex/auto-handoff/clear-required.json`
- Record mode: `commit_push`
- Next session: run resume trigger, read latest `.ai/HANDOFF.md`, then inspect `resume.md` if needed.

### 2026-05-11 19:35 KST — Stock Trading Paper Foundation

- Trigger: continued the approved `-play 구현 시작` run for the stock-trading agent.
- Completed:
  - Implemented broker-independent trading domain contracts in `core/types.ts`.
  - Added broker-oriented `CoreError` taxonomy and live-trading approval guard in `core/error/index.ts`.
  - Added Keychain-only broker secret names for Alpaca paper and KIS in `core/secrets/*`.
  - Added `skills/zen-trading-core/` with broker registry dispatch, deterministic volatility/drawdown risk defaults, sanitized `.aizen-cache/trading` state persistence, and audit-event allow-listing.
  - Added `skills/zen-trading-broker-alpaca/` as a paper-only adapter with pinned paper/data origins.
  - Added `skills/zen-trading-broker-kis/` as a KR/US contract stub with live/network calls blocked.
  - Added `docs/trading/` runbook, risk policy, KIS expansion plan, and checklist.
- Play run: `.ai/pipeline/runs/20260511-175921_stock-trading-agent-implementation`
- Peer reviews:
  - Worker-04 initially returned NO-GO on state persistence leakage risk.
  - Controller repaired state/audit persistence and removed `raw`/`accountId` exposure surfaces.
  - Final Claude peer gate PASS: `.ai/peer-review/runs/20260511-193011-claude-review-23486.md`
- Verification:
  - `pnpm -s typecheck`: PASS
  - `pnpm -s skill:test`: PASS (12 tests)
  - `git diff --check`: PASS
  - Forbidden paths absent: `.env.example`, `src/trading`, `configs/trading`
- Live gate: live trading, live endpoint use, and live broker candidate decision remain blocked until separate explicit user approval.

### 2026-05-11 21:09 KST — Session Record: OpenClaw Optional Runtime Decision

- Trigger: user asked whether OpenClaw is actually required before entering API keys.
- Decision: treat OpenClaw as optional runtime infrastructure, not a blocker for the next AIZen steps.
- Evidence:
  - `pnpm -s typecheck`: PASS.
  - `pnpm -s skill:test`: PASS (12 tests).
  - `pnpm -s secrets:check`: expected FAIL until Keychain secrets are stored.
  - `openclaw gateway health`: blocked by pairing/scope approval.
- Next:
  1. Store `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, and `TELEGRAM_BOT_TOKEN` in macOS Keychain without exposing values in chat.
  2. Re-run `pnpm -s secrets:check`.
  3. Continue Telegram hello-world and existing SKILL validation without requiring OpenClaw.
  4. Revisit OpenClaw later only as a runtime/activation adapter.

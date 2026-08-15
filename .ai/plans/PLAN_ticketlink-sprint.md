# PLAN: zen-ticketlink-sprint (LG 트윈스 세미-오토 예매)

- **날짜**: 2026-08-16
- **상태**: Draft (Team 리뷰 반영 rev2)
- **프로젝트**: AIZen (`~/Project/AIZen`)
- **최종 위치**: 승인 시 `AIZen/.ai/plans/PLAN_ticketlink-sprint.md`로 이동(plan-mode 규약)
- **Blind-spot pass**: Explore(재사용 패턴)+Plan(설계 검증) 2에이전트 + Team Feature Review 3역할(Eng Lead·AI Ops·QA) — 도메인 unknowns 표면화(NetFUNNEL 대기열·canvas 좌석도·launchd 잠자기 미발화·좌표 드리프트·결제 다단계·무음 미스).

## Context (왜)

와이프가 티켓링크 LG 트윈스 홈경기 **일반예매**(경기 D-7 오전 11:00)를 빠르게 잡도록 돕는다. 오픈 순간 수동으로 브라우저 열고·페이지 찾고·구역 훑는 시간을 없애, 사람은 **캡차와 결제 확정만** 하게 한다. AIZen의 스킬로 만들어 launchd(맥 예약 실행기)로 예매일에 자동 기동한다.

**경계(고정·타협 없음)**: ① 캡차 자동해결 금지 — 사람이 푼다 ② 무인 결제 금지 — 결제 확정은 사람 ③ 자동이 좌석을 못 집거나 하네스가 못 뜨거나 상태를 모르면 **조용히 실패하지 않고 반드시 알림**(무음 미스 금지 — 이 불변식이 구조·게이트로 강제되어야 한다. Team 리뷰 최대 지적).

**현실(기대치)**: 티켓링크는 가상 대기열(NetFUNNEL)을 쓴다. 자동 진입이 벌어주는 것은 "대기줄 최속 진입 + 통과 즉시 좌석 잡기"이고, 대기 순번 자체는 못 줄인다. "무조건 성공"이 아니라 "수동보다 빠르고 좌석선택 자동".

## 확정 설계 (grill 결과)

- **범위 v1**: ① 오픈런 자동진입 ② 좌석 자동선택 ③ 취소표 알림(3종).
- **좌석**: 구장별 좌표 맵으로 선호 구역 클릭 → 구역 안 빈자리 자동 감지·클릭 → **못 집으면 멈춤+알림**. 좌표 기준은 Phase 0 정찰에서 **고정 창 크기**로 실측 캡처. 구장 추가로 확장.
- **스케줄러**: launchd(**LaunchAgent — Aqua GUI 세션**, 보이는 크롬이 떠야 하므로 Daemon 불가)가 오픈 `leadMinutes`(기본 3분) 전 기동 + `caffeinate` + **서버시간(티켓링크 Date 헤더) 초단위 카운트다운** + 로그인 브라우저 자동 기동.
- **취소표 봇**: 오픈런 실패 시에만 arm + 스마트 간격(1~3분, 경기 당일·시작 4시간 전 빈도↑).
- **알림**: 캡차 → 소리+맥 알림 / 취소표·좌석실패·하네스 이상 → 텔레그램(젠+와이프)+맥 알림.
- **계정·현장**: 와이프 티켓링크 계정·결제수단으로 프로필 로그인. 오픈 시각에 **와이프가 맥 앞**에서 캡차→결제 확정.

## 핵심 인터페이스

**VenueMap**(`venues/schema.ts`) — 좌표는 뷰포트가 아니라 **좌석도 컨테이너 bbox 기준 상대좌표(0~1)**. **v1은 정찰이 확정한 잠실 단일 kind만 구현**(canvas RGB 샘플링·imagemap 감지는 정찰이 kind 확정 전 미구현 — Team 3역할 만장일치 원칙 관찰). **인접 판정을 위한 좌석 위상(topology) 포함**(QA-H2):
```ts
interface VenueMap {
  venueId; displayName; capturedAt;
  viewport: { width; height; deviceScaleFactor };   // 캡처 기하 SSOT
  seatmap: { kind: "dom"; containerSelector;          // v1=정찰 확정 kind만. 타입 union은 provisional
    dom: { seatSelector; availablePredicate;
           neighborBasis: "rowcol" | "bbox" } };       // 인접 판정 근거 (QA-H2)
  sections: Array<{ id; label; region: {x;y;w;h} | {polygon} }>;
}
```
런타임 해석은 순수: `abs = bbox.origin + norm * bbox.size` (canvas 픽셀 샘플 구현 시 DSF 곱 필수 — Eng 원칙 관찰 DSF 트랩). 런타임 bbox가 캡처 기하와 tolerance 넘게 어긋나면 **STOP+알림(재캡처)** — 맹목 클릭 금지.

**State machine**(`lib/state.ts`) — 결제 가드를 구조로 표현. **정지점 = 좌석 확보 직후**(QA-H1: 다단계 체크아웃을 자동 전진하지 않는다):
```
IDLE→COUNTDOWN→ENTERING→IN_QUEUE→(CAPTCHA_PAUSED⇄)→SELECTING_SEAT
   → SEAT_SECURED[자동 종단 — 좌석 확보 즉시 STOP, 예매자정보·쿠폰·결제수단·약관·결제는 전부 사람]
   → (인계 대기: 프로세스·브라우저 생존, 사람이 창 닫을 때까지 블록 — Eng-H1)
SELECTING_SEAT→SEAT_FAILED→STOP+알림 ; 미인식 상태→UNKNOWN→하드 STOP+알림(fail-closed, QA-H1)
sprint 실패→WATCH_ARMED→WATCHING→CANCEL_FOUND(알림)→사람 인계
```
- **결제 가드 = allowlist(시스템 스코프)**: `SEAT_SECURED` 이후 어떤 browser 모듈(`run.ts`·`seat-runtime.ts`·`queue.ts`·`payment.ts`)도 클릭/submit 프리미티브를 **실행하지 않는다**. `payment.ts`는 결제 버튼 selector를 아예 미보유(구성상 fail-closed).
- **run.ts 생존주기(Eng-H1)**: 터미널 상태(SEAT_SECURED/CAPTCHA_PAUSED/CANCEL_FOUND)는 **논리적 인계 지점이지 프로세스 종료 지점이 아니다**. `prepare-login.ts`처럼 `context.on("close")` 대기로 사람이 창 닫을 때까지 블록(persistent context가 죽으면 대기열 통과 라이브 세션 소실).

## 무음 미스 방어 (Team 최대 지적 — AI Ops-H1 + Eng-H2)

플랜 헤드라인 안전 약속을 구조로 강제한다:
1. **독립 하트비트(dead-man's switch)**: 본 run과 **별개** LaunchAgent가 T-30분에 "오늘 11:00 예매봇 준비됨 · 맥 깨어있음" 텔레그램 발송. 본 run이 아예 안 떠도 이건 뜬다 → "봇이 안 떴다"를 사람이 감지.
2. **guaranteed-notify 경계 + pre-flight**: `run.ts` 최상단을 try/guaranteed-notify로 감싸고, COUNTDOWN 진입 **전** 양 채널(텔레그램·맥) pre-flight test-send — 하나라도 불가면 즉시 크게 실패(무음 no-op 금지).
3. **local durable sink**: 양 채널 동시 다운 대비 — 브라우저를 붉은 에러 페이지로 남김 + sentinel 파일 + 소리 반복.
4. **stale lock 회수 + 거부 시 알림(Eng-H2)**: `run.lock`에 PID+timestamp. 죽은 PID·TTL 초과 lock은 회수(정상 경로 복구). 재진입 거부는 **반드시 알림 동반**.
5. **frontmatter secrets 등재**: `SKILL.md`에 `secrets: [TELEGRAM_BOT_TOKEN]` — skill-template 누락키 자동감지가 토큰 부재를 잡게(현재 `secrets: []` stale).

## 런타임 관측성 (AI Ops-H2 — 일회성·비재현이라 필수)

`.aizen-cache/ticketlink/runs/<ts>/`에 남긴다: 구조화 상태전이 로그(IDLE→…→SEAT_SECURED/FAILED) · 사용한 서버시간 오프셋 · 대기열 대기시간 · 시도 구역 · 실패 사유 · **STOP 시점 스크린샷**(왜 못 집었나의 유일 증거). plist에 `StandardOutPath`/`StandardErrorPath` 리다이렉트. launchd **예약≠실제 발화** 감지 기록.

## 단계 (정찰 의존성 명시)

**Phase 0 — 정찰(선행·로그인+실제 게임 URL 필요)**: 로그인 프로필로 실제 흐름을 고정 창 크기로 열어 ① 좌석도 kind ② NetFUNNEL 대기열 selector/전역객체 ③ 캡차 위치 ④ **좌석 확보~돈 유출까지 체크아웃 전 단계 열거**(QA-H1 정지점 확정 근거) ⑤ 잠실 구역 좌표+좌석 위상을 **실측**. selector 짐작 금지.

**Phase 1 — 순수 코어(정찰과 병렬 가능·브라우저 없음)**: `lib/*`(config·time-source·countdown·seatmap resolver+인접판정·schedule·watch-interval·state) + `notify/*`(telegram fetch 주입·macos execFile 주입, **단일 발송 SSOT**) + `venues/schema.ts`(provisional) + `scripts/*`(resolve-chat-ids·install/uninstall-schedule·heartbeat) + `browser/session.ts`(고정 기하) + `prepare-login.ts` 기하 수정. **전부 주입 테스트 + 실패주입 테스트(아래 Gate).**

**Phase 2 — 브라우저 어댑터(정찰 결과 배선)**: `browser/queue.ts`·`captcha.ts`·`seat-runtime.ts`·`payment.ts`(정찰 확정 kind 1종) + `venues/jamsil.json`(실좌표+위상) + `run.ts` 글루(생존주기·guaranteed-notify).

**Phase 3 — 리허설**: 실제 구매 없이 좌석 확보 직후 STOP까지 dry-run(결제 미실행 가드 발화 검증).

**Phase 4 — 취소표 arm**: 오픈런 실패 상태 전이 + 스마트 폴링 + 텔레그램 다중 수신.

## 신설물 → 소비처 (Wiring)

| 신설물 | 소비처 (누가 언제) | 배선 지점 | 집행 코드 |
|---|---|---|---|
| `run.ts`(standalone·생존주기·guaranteed-notify) | launchd(LaunchAgent) | 오픈 `leadMinutes` 전 | plist ProgramArguments |
| `handler.ts`(chat: arm/status/watch/register-ids) | OpenClaw 런타임 | 사용자 채팅 | `triggers.chat` |
| `config.json` | `lib/config.ts` → run/handler/install | 매 실행·설치 | validator |
| `venues/jamsil.json`(좌표+위상) | `lib/seatmap.ts`+`browser/seat-runtime.ts` | 좌석·인접 판정 | schema validator |
| 생성 plist(본 run + 하트비트) | launchd → `run.ts`/heartbeat | 오픈 전·T-30분 | `install-schedule.ts` |
| `recipients.json` | `notify/telegram.ts`(단일 SSOT) | 발송 | `resolve-chat-ids.ts` |
| `TELEGRAM_BOT_TOKEN`(Keychain) | `notify/telegram.ts` via `readSecret` | 발송 | `core/secrets/keychain.ts:17` |
| `run.lock`(PID+ts) | `run.ts` 재진입·stale 회수 | 실행 시작/종료 | lockfile+알림 |
| `runs/<ts>/` trace+스크린샷 | 사람(사후 진단) | STOP·종료 시 | run.ts 로거 |
| CoreError 신규 코드 | run/lib 가드 | 실패 경로 | `core/error/index.ts` enum 확장 |

## 재사용 (발명 금지 — 정찰 확인)

- `readSecret(SECRETS.TELEGRAM_BOT_TOKEN)` (`core/secrets/keychain.ts:17`, 토큰 키·check.ts:5 이미 등록)
- 핸들러 규약: `export default async function handler(ctx): Promise<SkillResult<T>>`, 파라미터 `ctx.input.data?.x`, 로깅 `ctx.logger`, 에러 `CoreError`
- 주입 패턴: `createXxx({ fetchImpl, execFileImpl, clock })` — 테스트·dry-run 겸용 (`skills/zen-trading-broker-alpaca/handler.ts:31-52` 미러)
- 테스트: `node:test` + 주입, `pnpm skill:test`. `playwright-core` 이미 deps(`package.json:24`).

## 리스크 → 완화

- **R1 launchd는 잠든 맥을 못 깨움(무음 미스)**: 1차=사람이 깨워둠 + `pmset schedule wake`. **핵심 보강=§무음 미스 방어 1(독립 하트비트)** — 못 떴음을 독립 신호로 통보.
- **R2 canvas 좌석도**: 정찰이 kind 분류. canvas면 정직한 폴백="구역 클릭 후 STOP+사람 좌석" → 젠 재확인(D7). **v1은 정찰 확정 kind만 구현**.
- **R3 좌표 드리프트**: 컨테이너 bbox 상대좌표 + 뷰포트/DSF 고정 + 편차 초과 하드 STOP.
- **R4 NetFUNNEL**: `queue.ts`가 오버레이/iframe·전역객체 감지 → 통과 대기·재진입 처리.
- **R5 인접 2석**: VenueMap 위상으로 인접 판정, 인접쌍 없으면 STOP+알림(흩어진 단석 금지).
- **R6 로그인 기하 ≠ 자동화 기하**: `browser/session.ts`가 창 기하 SSOT, prepare-login·정찰·run 공유(`--start-maximized`+`viewport:null` 제거).
- **R7 봇 탐지**: 영속 세션 재사용·단일 탭·폴링 랜덤 지터·병렬 금지.
- **R8 서버시간**: 티켓링크 `Date` 헤더로 오프셋 1회 계산 → 단조시계 카운트다운.
- **R9 중복/stale lock**: PID+ts lock, 죽은 lock 회수, 거부 시 알림.

## Gate (완료 기준)

- [ ] Phase 1 순수 코어 + 테스트 통과 (`pnpm skill:test`, `pnpm typecheck`)
- [ ] **실패주입 테스트(결정적·라이브 무관 — QA-H3)**: (a) bbox 드리프트 tolerance 초과 → STOP·클릭 0회 (b) 구역 내 빈자리 0 → SEAT_FAILED·클릭 0회 (c) 인접쌍 0 fixture → SEAT_FAILED·클릭 0회 (d) 미인식 상태 → 하드 STOP
- [ ] Phase 0 정찰 산출: 잠실 좌표맵+위상 + kind + 대기열/캡차/체크아웃 단계 열거 문서화
- [ ] Phase 2 어댑터가 정찰 산출 소비 (jamsil.json·selector 배선)
- [ ] Phase 3 리허설: dry-run이 **좌석 확보 직후 STOP**까지 도달 + 결제 미실행 가드 발화 실측
- [ ] **결제 가드 시스템 스코프 검증(QA-H1)**: 전 browser 모듈에서 `SEAT_SECURED` 이후 도달 가능한 클릭/submit 프리미티브 0건(grep)
- [ ] **무음 미스 방어 실측(AI Ops-H1)**: 양 채널 pre-flight 발화 + 독립 하트비트 발송 + stale lock 회수+거부 알림
- [ ] **관측성 실측(AI Ops-H2)**: runs/<ts>/ 상태전이 로그 + STOP 스크린샷 생성 + plist 리다이렉트 + launchd 발화 기록
- [ ] 캡차 감지 시 소리+맥 알림 실발화 / 텔레그램 젠+와이프 2인 수신 실측
- [ ] launchd(LaunchAgent) 등록/발화/해제 실측 + caffeinate 창 확인
- [ ] 배선 검증: Wiring 표 신설물 전건 호출/참조 grep+실측 — 소비처 0건이면 FAIL

## 검증 (end-to-end 방법)

1. `pnpm typecheck` + `pnpm skill:test`(순수 로직·주입·**실패주입** 테스트).
2. `prepare-login.ts` → 와이프 계정 로그인 → 쿠키 지속성 확인(메커니즘은 검증됨, 티켓링크 e2e는 unverified).
3. 정찰: 로그인 프로필로 실제 예매 페이지 열어 좌석도/대기열/캡차/체크아웃 단계·좌표·위상 실측.
4. 리허설: 좌석 확보 직후 STOP까지 dry-run(결제 미실행 로그·스크린샷 확인).
5. launchd: 테스트 시각으로 `install-schedule.ts` 등록 → 발화·브라우저 자동기동·카운트다운·하트비트 확인 → `uninstall-schedule.ts`.
6. 알림: 캡차 시뮬 소리+맥 알림, 취소표·하네스이상 시뮬에서 텔레그램 2인 수신.

## Team Review (2026-08-16) — 반영 요약

3역할 만장일치 REVISE. 재사용·안전 경계 골격·`run.ts` standalone 결정은 3역할 확인(건전). 반영한 High 6:
- Eng-H1 run.ts 생존주기+LaunchAgent GUI → §State machine·§확정설계 반영
- Eng-H2 / AI Ops-H1 무음 미스(stale lock·하네스 미시작·notify 실패·부트 크래시) → §무음 미스 방어 신설
- QA-H1 결제 가드 시스템 스코프+정지점 확정+미인식 fail-closed → §State machine·Gate 반영
- QA-H2 인접 2석 데이터 모델+테스트 → VenueMap 위상·실패주입 Gate
- QA-H3 안전 STOP 결정적 테스트 → 실패주입 Gate 신설
- AI Ops-H2 런타임 trace → §관측성 신설
- 원칙 관찰(3역할 수렴): 좌석도 kind 3종은 정찰 전 투기적 추상화 → v1은 확정 kind 1종만, union은 provisional / notify SSOT 단일화 / frontmatter secrets 등재 반영

## 미결(정찰 후 재확인)

- **D7**: 좌석도가 canvas면 좌석 전부 자동 불안정 → "구역 클릭+사람 좌석선택" 폴백 수용 여부 젠 재확인.
- **D4**: `pmset` sudo 인증(1회 인터랙티브) vs "사람이 깨워두기" 단독 보증.

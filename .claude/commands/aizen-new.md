---
name: aizen-new
description: 새 SKILL을 자연어 설명으로 생성 (Self-bootstrapping). AIZen이 SKILL.md + handler.ts + tests를 자동 작성하고 사용자 검토 후 활성화.
---

# /aizen-new <자연어 설명>

Self-bootstrapping 워크플로우. 사용자 페인 → 작동하는 SKILL.

## 표준 참조
- SKILL 형식: `~/Project/AIZen/docs/skill-template.md`
- 시크릿: `~/Project/AIZen/core/secrets/README.md`
- 에러 처리: `~/Project/AIZen/core/error/index.ts`

## 진행 단계

### Step 1: 의도 파악
사용자 설명에서 추출:
- **이름** (제안): `zen-<domain>-<action>` 패턴
- **trigger**: chat (키워드) / cron (스케줄) / webhook
- **secrets**: 필요한 외부 API 키
- **출력 채널**: Telegram (기본) / 다른 채널

### Step 2: 미리보기 생성
1. `docs/skill-template.md` 표준 따름
2. SKILL.md 작성 (frontmatter + 한국어 설명)
3. handler.ts 작성 (Claude Opus 4.7로 코드 생성)
4. tests/sample.json (1개 케이스)
5. `secrets.example.env`에 필요 키 명시

### Step 3: 시크릿 체크
`hasSecret()`로 확인:
- 모두 있음 → Step 4로
- 누락 → 발급 가이드 한국어 push (외부 링크 + 명령어)

### Step 4: 사용자 미리보기

```
🤖 새 SKILL 미리보기

이름: zen-<...>
설명: <한국어 설명>

생성 파일:
- skills/zen-<...>/SKILL.md
- skills/zen-<...>/handler.ts
- skills/zen-<...>/tests/sample.json

trigger: <cron 또는 chat 키워드>
필요 시크릿: <목록>

dry-run 결과:
<sample input → output>

활성화할까요? [y / 수정 / 취소]
```

### Step 5: 활성화
사용자 OK → 
1. 파일 commit (별도 브랜치 또는 main)
2. `openclaw skills activate <name>` 실행
3. cron 등록 (스케줄 trigger인 경우)
4. 첫 실행 dry-run으로 검증
5. 사용자에게 활성화 완료 알림 (Telegram)

## 실패 처리
- LLM 코드 품질 부족 → 사용자 검토 단계에서 수정 요청 받음
- 시크릿 발급 어려움 → 단계별 가이드 + 외부 링크
- API 응답 안 함 → withRetry 표준 적용 (`core/error`)
- 활성화 실패 → SKILL.md를 `status: paused`로 두고 사용자에게 진단 정보

## 명명 규칙
- 네임스페이스: `zen-` (사용자 본인 SKILL)
- 케밥-케이스 (소문자, 하이픈)
- 동작 중심 동사: monitor, notify, draft, summarize, recommend, track
- 도메인 명시: chungyak, lunar, kakao, linear, figma 등
- 좋은 예: `zen-chungyak-monitor`, `zen-monday-pr-priorities`

# AIZen SKILL Template

> 모든 `skills/zen-<name>/` 디렉토리는 이 템플릿을 따른다.
> Self-bootstrapping(`/aizen-new`)이 자동 생성하는 형식.

## 디렉토리 구조 (표준)

```
skills/zen-<name>/
├── SKILL.md              # 메타 (이름, 설명, triggers, schedule)
├── handler.ts            # 메인 로직 (input → output)
├── schedule.json         # cron 또는 trigger 정의 (선택)
├── secrets.example.env   # 필요한 시크릿 키 목록
├── tests/
│   └── sample.json       # 사용자 검증용 샘플 입력
└── docs/
    └── usage.md          # 사용자 가이드 (LLM이 작성)
```

## SKILL.md 형식 (frontmatter)

```yaml
---
name: zen-<name>
displayName: "한국어 표시 이름"
description: "1-2문장 요약 (사용자가 SKILL 검색 시 매칭)"
version: "0.1.0"
author: "@zen"
triggers:
  - chat: ["키워드1", "키워드2"]
  - cron: "0 9 * * *"                  # 매일 오전 9시
  - webhook: "/zen-<name>/trigger"     # 외부 트리거
secrets:
  - TELEGRAM_BOT_TOKEN
  - <SKILL-specific keys>
permissions:
  - channel: telegram
  - filesystem: read
status: active                          # active | paused | dead
---

# <SKILL 한국어 이름>

## 무엇을
한 줄 요약.

## 언제
- Triggered by: ...
- Cron: ...

## 어떻게
1. 입력 받기
2. 처리
3. 출력
```

## handler.ts 표준 인터페이스

```typescript
import { readSecret } from "../../core/secrets/keychain.ts";
import { withRetry, dlq } from "../../core/error/index.ts";
import type { SkillContext, SkillResult } from "../../core/types.ts";

export default async function handler(
  ctx: SkillContext,
): Promise<SkillResult> {
  return withRetry(
    async () => {
      const token = await readSecret("TELEGRAM_BOT_TOKEN");
      const result = await doSomething(ctx.input);
      await ctx.channel.send({ to: ctx.user, message: result });
      return { ok: true, data: result };
    },
    { maxAttempts: 3, dlq: dlq("zen-<name>") },
  );
}
```

## tests/sample.json

```json
{
  "input": {
    "message": "샘플 입력 메시지",
    "user": { "id": "test-user", "channel": "telegram" }
  },
  "expectedOutput": {
    "ok": true,
    "data": { "<key>": "<expected value>" }
  }
}
```

dry-run:
```bash
pnpm tsx skills/zen-<name>/handler.ts --test
```

## secrets.example.env

```
# Required secrets (must exist in macOS Keychain)
TELEGRAM_BOT_TOKEN=
# Optional secrets
PUBLIC_DATA_API_KEY=
```

AIZen이 활성화 시 누락 키를 자동 감지하고 발급 가이드를 push.

## 활성화 / 비활성화 (OpenClaw)

```bash
# 등록 (cron + channel triggers)
openclaw skills activate zen-<name>

# 비활성화 (파일은 유지, triggers만 제거)
openclaw skills deactivate zen-<name>

# 상태
openclaw skills list
```

## Self-bootstrapping (`/aizen-new`)

사용자가 자연어로 새 SKILL 요청:

```
/aizen-new 매주 월요일 아침 GitHub PR 우선순위 5개 정리
```

→ AIZen이 자동:
1. 이름 제안 (`zen-monday-pr-priorities`)
2. 필요 시크릿 식별 (`GITHUB_TOKEN`)
3. SKILL.md / handler.ts / tests/sample.json 생성 (Claude Opus 4.7)
4. 사용자 미리보기 → 검토/수정 → 활성화
5. 첫 dry-run으로 검증

## SKILL 명명 규칙

- 네임스페이스: `zen-` (사용자 본인 SKILL)
- 케밥-케이스 (소문자, 하이픈)
- 동작 중심: `monitor`, `notify`, `draft`, `summarize`, `recommend`, `track`
- 도메인 명시: `chungyak`, `lunar`, `kakao`, `linear`, `figma` 등
- 좋은 예: `zen-chungyak-monitor`, `zen-lunar-birthday`, `zen-monday-pr-priorities`
- 나쁜 예: `zen-stuff`, `zen-helper`, `zen-thing`

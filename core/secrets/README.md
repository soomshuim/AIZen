# Secrets — macOS Keychain Wrapper

모든 시크릿은 macOS Keychain에 저장. 환경변수/`.env` 파일 사용 X.

## TypeScript API

```typescript
import { readSecret, writeSecret, hasSecret, SECRETS } from "./keychain.ts";

const apiKey = await readSecret(SECRETS.ANTHROPIC_API_KEY);

await writeSecret(SECRETS.TELEGRAM_BOT_TOKEN, "1234567890:ABC...");

if (!(await hasSecret(SECRETS.GITHUB_TOKEN))) {
  // Prompt user via channel
}
```

## CLI 사용

```bash
# Read
security find-generic-password -a "$USER" -s "ANTHROPIC_API_KEY" -w

# Write (or update with -U)
security add-generic-password -a "$USER" -s "TELEGRAM_BOT_TOKEN" -w "1234567890:ABC..." -U

# Delete
security delete-generic-password -a "$USER" -s "TELEGRAM_BOT_TOKEN"

# List all (filter by service prefix)
security dump-keychain | grep -E '"svce".*"ANTHROPIC|TELEGRAM|GITHUB|PUBLIC_DATA"'
```

## Standard Keys

| Key | 용도 | 발급 |
|-----|------|------|
| `ANTHROPIC_API_KEY` | Claude API | console.anthropic.com |
| `OPENAI_API_KEY` | OpenAI API 또는 OpenClaw provider fallback | platform.openai.com |
| `TELEGRAM_BOT_TOKEN` | Telegram 봇 (1차 채널) | t.me/BotFather (W1) |
| `GITHUB_TOKEN` | GitHub API (PR/Issue SKILL) | github.com/settings/tokens (필요 시) |
| `PUBLIC_DATA_API_KEY` | 공공데이터포털 (청약) | data.go.kr (W2) |

## SKILL이 새 시크릿 필요 시

1. SKILL의 `secrets.example.env`에 키 이름 명시
2. AIZen 활성화 시 누락 자동 감지 → 사용자에게 발급 가이드 push
3. 사용자가 발급 → AIZen이 `writeSecret()` 호출 또는 사용자 직접 `security add-generic-password`
4. 이후 SKILL handler에서 `readSecret(KEY)` 호출

## 보안 모델

- macOS Keychain = 시스템 차원 AES-256 암호화
- 본 머신 사용자만 read 가능 (다른 user/sandbox 불가)
- git commit 금지 (.gitignore 자동 보호)
- 백업: FileVault 활성화 (전체 디스크 암호화) + Time Machine

## 문제 진단

| 증상 | 원인 | 해결 |
|------|------|------|
| `KeychainError: not found` | 키가 없거나 service name 오타 | `security find-generic-password -a "$USER" -s "<KEY>" -w` 직접 시도 |
| `User interaction is not allowed` | Keychain 잠금 또는 GUI 권한 거부 | `security unlock-keychain` 또는 시스템 환경설정 → 개인정보 → 키체인 |
| 자동화 실행 시 매번 권한 묻기 | launchd 데몬 권한 미설정 | `security set-generic-password-partition-list -S "apple-tool:,apple:,unsigned:" -a "$USER" -s "<KEY>"` |

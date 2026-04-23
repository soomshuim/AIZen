# AIZen — Claude Code Instructions

> 이 파일은 Claude Code 세션 시작 시 자동 로드됩니다.
> Last updated: 2026-04-23 | v0.1.0

## Project

**한 줄**: zen@plumlabs.im을 위한 **확장 가능한 Personal Automation OS**.
새 페인이 생기면 새 SKILL을 5분~1시간 안에 추가, 평생 함께 진화.

**철학**: Self-bootstrapping — 사용자가 "이런 자동화 필요해"라고 말하면 AIZen이 SKILL 자동 생성.

## Quick Reference

| 용도 | 파일 |
|------|------|
| 프로젝트 설계 (헌법) | `~/.claude/plans/aizen-elegant-stearns.md` (v5.1) |
| 현재 상태 | `.ai/SESSION.md` |
| 반복 작업 패턴 | `.ai/RECIPES.md` |
| SKILL 표준 템플릿 | `docs/skill-template.md` |
| OpenClaw 설치 / 운영 | `docs/openclaw-setup.md` |
| 시크릿 관리 | `core/secrets/README.md` |
| 에러 처리 표준 | `core/error/README.md` |

## 핵심 아키텍처

```
Layer 4 (UI)        : Telegram 봇 + Claude Code 슬래시 커맨드
Layer 3 (Bootstrap) : /aizen-new → SKILL 스캐폴드 자동 생성 ⭐
Layer 2 (SKILL)     : skills/zen-<name>/ (확장 단위)
Layer 1 (Core)      : OpenClaw + 시크릿/모니터링/에러처리/백업
```

- **베이스**: OpenClaw OSS (글로벌 CLI, `~/.openclaw/workspace/`)
- **AIZen 확장**: 이 레포의 `core/` + `skills/` + `.claude/`
- **SKILL 표준**: `skills/zen-<name>/{SKILL.md, handler.ts, schedule.json, secrets.example.env, tests/, docs/}`
- **시크릿**: macOS Keychain (`security` CLI 래퍼)
- **스케줄러**: macOS launchd (1차)
- **채널**: Telegram (MVP 단일), iMessage/etc는 v1.1+

## Workflow

### 단순 작업 (플랜 모드 X)
- 오타 수정, 단일 파일 수정, 명확한 버그 수정

### 복잡한 작업 (플랜 모드 O)
- 새 SKILL 추가, 아키텍처 변경, 다중 파일 수정

### 새 SKILL 추가 (Self-bootstrapping) ⭐
- 사용자: `/aizen-new <자연어 설명>`
- AIZen: SKILL 스캐폴드 + 코드 + 테스트 자동 생성
- 사용자 미리보기 확인 + dry-run → 활성화
- 표준: `docs/skill-template.md`

### 기존 SKILL 수정
- `skills/zen-<name>/handler.ts` 직접 수정
- `tests/sample.json`로 검증 후 활성화

## 시크릿 관리

모든 시크릿은 macOS Keychain에 저장. 환경변수 X.

```bash
# Read (handler.ts에서)
security find-generic-password -a "$USER" -s "<KEY_NAME>" -w

# Write (새 시크릿 등록)
security add-generic-password -a "$USER" -s "<KEY_NAME>" -w "<value>"
```

**저장된 키 인벤토리**:
- ✅ `ANTHROPIC_API_KEY`
- ⏳ `TELEGRAM_BOT_TOKEN` (BotFather에서 발급 필요)

## 글로벌 룰 적용 (사용자 표준)

- ✅ Evidence-First (증거 없는 결론 금지)
- ❌ "Simplest fix" 금지 (root cause)
- ❌ 순환 행동 금지 (Anti-Spiral)
- ✅ /record 커맨드로 세션 종료
- ✅ Auto memory 활용
- ✅ 한국어 우선 (코드 주석/식별자만 영어)

## 디자이너 친화 (Pair Mode)

이 프로젝트의 사용자는 시니어 PD. 코드 작성보다 **대화로 진행** 우선:
1. 무엇을 할지 한국어로 한 줄 설명
2. 명령어 미리 보여줌
3. 사용자 "OK" 후 실행
4. 결과 확인 + "다음 OK?" 질문

## 다음 마일스톤 (W1, ~2026-04-30)

`.ai/SESSION.md` 참조.

## License

Personal project. Public OSS 가능성 v1.1+ 검토.

# Changelog

All notable changes to AIZen will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- **Initial AIZen platform setup** — Personal Automation OS for @zen, built on OpenClaw.
  - Standard project structure: `.ai/` `.claude/` `core/` `skills/` `docs/`
  - User-pattern docs: CLAUDE.md, README.md, .ai/SESSION.md, .gitignore
  - TypeScript environment: package.json, tsconfig.json, pnpm dependencies
  - Core infrastructure:
    - `core/secrets/keychain.ts` — macOS Keychain wrapper (readSecret / writeSecret / hasSecret)
    - `core/error/index.ts` — withRetry + Dead Letter Queue standard
    - `core/types.ts` — SkillContext / SkillResult / Channel / User shared types
  - Slash commands: `.claude/commands/aizen.md`, `.claude/commands/aizen-new.md`
  - SKILL standard template: `docs/skill-template.md`
  - First seed SKILL: `skills/zen-lunar-birthday/` (handler.ts dry-run verified)
  - Sample family profile: `docs/sample-family.json`
- **OpenClaw 2026.4.21** installed globally (`/opt/homebrew/bin/openclaw`)
  - Verified repo activity: 362,593 stars / 74,078 forks / MIT / TypeScript / pushed today
  - Decision: glob CLI install + AIZen as independent SKILL/config repo (no fork/subtree)

### Verified

- `pnpm tsx skills/zen-lunar-birthday/handler.ts --test` — lunar-javascript import + TypeScript execution OK
- `security find-generic-password ANTHROPIC_API_KEY` — already in macOS Keychain ✅
- `openclaw status` — CLI works, daemon onboard pending

### Pending (next session)

- User action: Telegram bot token via @BotFather → Keychain save
- User action: family birthday data → `data/profiles/family.json`
- User action: `openclaw onboard --install-daemon` (interactive)
- Telegram bot hello-world
- zen-lunar-birthday end-to-end with real data
- Self-bootstrapping layer (`/aizen-new` workflow implementation)
- Second seed SKILL: zen-chungyak-monitor (W2)

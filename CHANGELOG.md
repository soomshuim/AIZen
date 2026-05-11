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
- **Local runtime refresh** — resumed AIZen at `/Users/zen/Project/AIZen`.
  - Installed `pnpm@10.33.1` and OpenClaw `2026.5.3-1`.
  - Installed dependencies with `pnpm install --frozen-lockfile`.
  - Added `docs/openclaw-setup.md` for loopback/token gateway setup.
  - Added `skills/zen-lunar-birthday/lunar-javascript.d.ts` for TypeScript compatibility.
  - Added `core/secrets/check.ts` and `OPENAI_API_KEY` to the Keychain secret registry.
- **Stock trading paper foundation** — added broker-independent trading contracts, risk controls, and paper/stub broker skills.
  - Extended `core/types.ts`, `core/error/index.ts`, and `core/secrets/*` for trading adapters, risk policy, Keychain-only broker secret names, and live-trading approval errors.
  - Added `skills/zen-trading-core/` with broker registry dispatch, deterministic volatility/drawdown budget defaults, sanitized `.aizen-cache/trading` state persistence, and audit-event allow-listing.
  - Added `skills/zen-trading-broker-alpaca/` as a paper-only adapter with pinned Alpaca paper/data origins and offline tests for account, quote, order, positions, and fills mapping.
  - Added `skills/zen-trading-broker-kis/` as a domestic/overseas contract stub with all live/network operations blocked.
  - Added `docs/trading/` runbook, risk policy, KIS expansion notes, and release checklist.

### Verified

- `pnpm tsx skills/zen-lunar-birthday/handler.ts --test` — lunar-javascript import + TypeScript execution OK
- `pnpm -s typecheck` — PASS
- `pnpm -s skill:test` — PASS (12 trading/lunar-compatible skill tests)
- `pnpm -s lunar:test` — PASS (0 family profiles until private data is added)
- `openclaw gateway health` — local gateway reachable at `127.0.0.1:18789`
- `openclaw security audit` — 0 critical, 1 warning (`gateway.trusted_proxies_missing`; non-blocking while loopback-only)
- `pnpm -s secrets:check` — expected non-zero until required Keychain secrets are stored
- Stock trading implementation peer gate — Claude review PASS (`.ai/peer-review/runs/20260511-193011-claude-review-23486.md`)

### Pending (next session)

- User action: store `ANTHROPIC_API_KEY` and `TELEGRAM_BOT_TOKEN` in macOS Keychain
- User action: optional `OPENAI_API_KEY`, `GITHUB_TOKEN`, `PUBLIC_DATA_API_KEY` as needed
- User action: family birthday data → `data/profiles/family.json`
- Telegram bot hello-world
- zen-lunar-birthday end-to-end with real data
- Self-bootstrapping layer (`/aizen-new` workflow implementation)
- Second seed SKILL: zen-chungyak-monitor (W2)

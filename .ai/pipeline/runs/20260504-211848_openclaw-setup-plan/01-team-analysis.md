# Team Analysis

## Request

User wants to proceed with OpenClaw setup step by step, but asked to plan first via `-play`.

## Current State

- Project: `/Users/zenkim_office/Project/AIZen`
- AIZen status: W1 platform setup, Day 1 completed.
- Git before this run: clean. This `-play` run created `.ai/pipeline/runs/20260504-211848_openclaw-setup-plan/`.
- OpenClaw CLI: installed at `/opt/homebrew/bin/openclaw`, version `2026.4.21`.
- OpenClaw config path: `~/.openclaw/openclaw.json`.
- OpenClaw gateway: target `ws://127.0.0.1:18789`, currently unreachable.
- LaunchAgents: gateway service not installed, node service not installed.
- Doctor findings:
  - `gateway.mode` is unset.
  - gateway auth token is missing.
  - session store dir is missing under `~/.openclaw/agents/main/sessions`.
  - gateway is not running.
- AIZen Keychain check in this Codex session:
  - `ANTHROPIC_API_KEY`: missing.
  - `TELEGRAM_BOT_TOKEN`: missing.
- TypeScript typecheck is currently blocked by missing declarations for `lunar-javascript`; this is not a blocker for OpenClaw setup, but should be fixed before claiming AIZen code is fully green.

## Decision Frame

The setup should optimize for:

- Local-first operation on this Mac.
- No secret values in shell history, run artifacts, logs, or assistant replies.
- Gateway secured even on loopback, because the dashboard/control UI can become risky if proxied later.
- Small, verifiable phases instead of one large interactive setup.
- AIZen Pair Mode: explain each command and scope before executing.

## Options

### Option A: Full interactive onboard in one pass

Run `openclaw onboard --install-daemon` and answer all provider/channel/daemon prompts in one session.

Pros:
- Fastest route if all inputs are ready.
- Uses OpenClaw's intended onboarding flow.

Cons:
- Harder to isolate failures.
- May mix model provider, gateway, daemon, and Telegram setup in one opaque step.
- Higher risk of accidentally pasting secrets into the wrong place.

### Option B: Phased setup, gateway first

Configure local gateway mode/auth/workspace first, install daemon, verify health, then add model provider and Telegram.

Pros:
- Easier to debug.
- Security baseline is explicit.
- Lets us stop after each checkpoint.
- Better fit for Pair Mode.

Cons:
- Slightly slower.
- Some OpenClaw flows may still open interactive prompts.

### Option C: Non-interactive setup with CLI flags

Pass provider keys and channel tokens as CLI flags.

Pros:
- Reproducible.
- Easy to record exact commands.

Cons:
- Not acceptable for secrets because command lines can leak via shell history, process lists, logs, or run artifacts.

## Recommendation

Use Option B. Set up OpenClaw in phases:

1. Preflight and local config repair.
2. Secure local gateway plus LaunchAgent.
3. Model provider setup, starting with Anthropic API key unless the user chooses OpenAI first.
4. Telegram channel setup after gateway health passes.
5. AIZen integration checks.
6. Record only after the user confirms the setup works.

## Scope

Included in this plan:

- OpenClaw local gateway configuration.
- LaunchAgent installation.
- Provider credential flow.
- Telegram bot token flow.
- Verification commands.
- AIZen-specific next checks.

Excluded until explicit approval:

- Adding or modifying AIZen source files.
- Activating cron jobs.
- Creating a new AIZen SKILL.
- Exposing OpenClaw over LAN/Tailscale/Funnel.
- Committing changes.

## Risks

- API usage will bill to the connected OpenAI/Anthropic API account, independent of ChatGPT/Claude app subscription limits.
- Passing secrets as CLI args is unsafe; use interactive prompts, Keychain, or token-file/process-substitution patterns.
- Gateway auth must be configured before leaving the service running.
- Telegram token is a separate secret from LLM API keys.
- The AIZen docs currently say `ANTHROPIC_API_KEY` is stored, but this session's Keychain check did not find it. Treat the live check as current truth.

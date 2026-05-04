# Plan

## Objective

Set up OpenClaw on this Mac for AIZen in small, verified phases. Stop before implementation until user approves.

## Important Ordering Note

`.ai/HANDOFF.md` lists Telegram token before OpenClaw onboard. For execution, this plan intentionally reverses that dependency: OpenClaw gateway and auth should be configured and healthy before attaching Telegram. Telegram token issuance can happen in parallel, but channel registration should wait until gateway health passes.

## Guardrails

- Do not paste API keys or Telegram tokens into chat.
- Do not pass user-provided secrets as CLI flags.
- Keep gateway bound to loopback for MVP.
- Configure gateway auth before leaving the daemon running.
- Do not expose LAN, Tailscale, or Funnel without a separate explicit approval.
- Do not commit setup artifacts until the user confirms the working state.

## Phase 0: Preflight

Purpose: preserve current evidence before changing OpenClaw state.

Commands:

```bash
cd "$HOME/Project/AIZen"
git status --short
openclaw --version
openclaw config file
openclaw doctor
openclaw status
security find-generic-password -a "$USER" -s "ANTHROPIC_API_KEY" -w >/dev/null 2>&1 && echo "ANTHROPIC_API_KEY ok" || echo "ANTHROPIC_API_KEY missing"
security find-generic-password -a "$USER" -s "TELEGRAM_BOT_TOKEN" -w >/dev/null 2>&1 && echo "TELEGRAM_BOT_TOKEN ok" || echo "TELEGRAM_BOT_TOKEN missing"
```

Acceptance:

- OpenClaw CLI is still available.
- Current gateway/config/secrets state is known.

Rollback:

- None; this phase is read-only.

## Phase 1: Initialize Local Config And Secure Gateway

Purpose: fix the current `gateway.mode unset` and `gateway auth missing` state.

Commands:

```bash
openclaw setup --mode local --workspace "$HOME/.openclaw/workspace"
openclaw config set gateway.mode local
openclaw config set gateway.bind loopback
openclaw config set gateway.port 18789 --strict-json
openclaw config set gateway.auth.mode token
OPENCLAW_TMP_GATEWAY_TOKEN="$(openssl rand -base64 48)"
openclaw config set gateway.auth.token "$OPENCLAW_TMP_GATEWAY_TOKEN"
unset OPENCLAW_TMP_GATEWAY_TOKEN
openclaw config validate
```

Acceptance:

- `~/.openclaw/openclaw.json` exists.
- `openclaw config validate` passes.
- `openclaw doctor` no longer reports `gateway.mode is unset` or missing gateway auth.

Rollback:

```bash
openclaw reset
```

Only run reset after confirming there is no valuable OpenClaw state to preserve.

## Phase 2: Install And Verify Gateway Daemon

Purpose: install the local macOS LaunchAgent and confirm the gateway is reachable.

Commands:

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway status
openclaw health || openclaw gateway probe
openclaw security audit
```

Acceptance:

- Gateway service is installed.
- Gateway is reachable on `ws://127.0.0.1:18789`.
- Security audit has no critical auth finding.

Rollback:

```bash
openclaw gateway stop
openclaw gateway uninstall
```

## Phase 3: Configure Model Provider

Purpose: connect the LLM provider that OpenClaw will call. Default recommendation is Anthropic first for AIZen; add OpenAI later only if needed.

Recommended command:

```bash
openclaw configure --section model
```

Interactive choices:

- Choose Anthropic API key first unless the user explicitly chooses OpenAI.
- Enter the API key only into the terminal prompt, not into chat.
- Prefer SecretRef if OpenClaw can validate an env/file/exec provider cleanly in the prompt.
- If SecretRef is awkward in this version, use OpenClaw's interactive credential storage for initial setup, then add a follow-up hardening task to bridge macOS Keychain through an OpenClaw exec secret provider.

Acceptance:

```bash
openclaw models status
openclaw models list
openclaw infer model providers
openclaw status
```

Use a minimal test call only after confirming the user is comfortable with API billing.

Rollback:

- Remove or rotate the provider key in the provider console if it was entered incorrectly.
- Use `openclaw configure --section model` again to replace the model profile.

## Phase 4: Configure Telegram Channel

Purpose: attach the MVP user channel after gateway is healthy.

Prerequisite:

- User creates a bot with BotFather.
- User stores `TELEGRAM_BOT_TOKEN` in macOS Keychain or provides it directly to OpenClaw's interactive prompt. Do not paste it into chat.

Preferred command if token is in Keychain:

```bash
bash -lc 'openclaw channels add --channel telegram --token-file <(security find-generic-password -a "$USER" -s "TELEGRAM_BOT_TOKEN" -w)'
openclaw channels list
openclaw channels status --probe
```

Acceptance:

- Telegram channel appears in `openclaw channels list`.
- `openclaw channels status --probe` reports healthy or gives a clear next action.
- After the user sends `/start` to the bot, resolve the user's chat target and send one explicit hello-world test.

Rollback:

```bash
openclaw channels remove --channel telegram
```

If the token leaked or was entered into the wrong place, revoke it in BotFather and create a new token.

## Phase 5: AIZen Integration Check

Purpose: verify AIZen can build on top of the configured OpenClaw runtime.

Commands:

```bash
cd "$HOME/Project/AIZen"
pnpm -s lunar:test
pnpm -s typecheck
openclaw skills list
openclaw skills check
```

Expected:

- `pnpm -s lunar:test` should pass.
- `pnpm -s typecheck` is currently expected to fail until the missing `lunar-javascript` type declaration is fixed.
- `openclaw skills check` should identify which built-in skills are available/missing requirements.

Follow-up file work after setup approval:

- Create `docs/openclaw-setup.md`, because `CLAUDE.md` references it but the file is missing.
- Fix the `lunar-javascript` TypeScript declaration gap.
- Update `.ai/SESSION.md` and `.ai/HANDOFF.md` with the real OpenClaw/secret/channel state.

Rollback:

- No runtime rollback unless changes are made.
- If type declaration/docs changes are implemented later, revert only those scoped files if needed.

## Phase 6: Record

Purpose: preserve the setup once the user confirms it works.

Commands:

```bash
git status --short
```

Then use `-record` only after user approval.

Acceptance:

- SESSION/HANDOFF reflect the true setup state.
- Any doc/code changes are committed once.

Rollback:

- If the user does not want a commit, leave the artifacts uncommitted and report the exact dirty files.

## Stop Point For This Turn

Do not start Phase 1 until the user explicitly approves the plan.

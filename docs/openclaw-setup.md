# OpenClaw Setup

> AIZen runtime setup for the local OpenClaw gateway.

## Current Policy

- Runtime host: the machine currently running AIZen.
- Gateway mode: local.
- Bind: loopback only (`127.0.0.1`).
- Auth: token.
- Tailscale exposure: off by default.
- Secrets: macOS Keychain for AIZen app secrets. Do not commit provider keys or Telegram tokens.

## Install

```bash
npm install -g pnpm@10.33.1 openclaw@latest
pnpm install --frozen-lockfile
openclaw --version
```

## Local Gateway

Use a fresh random token for the gateway.

```bash
OPENCLAW_GATEWAY_TOKEN="$(openssl rand -hex 32)"

openclaw onboard \
  --non-interactive \
  --accept-risk \
  --mode local \
  --flow quickstart \
  --gateway-bind loopback \
  --gateway-auth token \
  --gateway-token "$OPENCLAW_GATEWAY_TOKEN" \
  --gateway-port 18789 \
  --tailscale off \
  --install-daemon \
  --auth-choice skip
```

Check status:

```bash
openclaw status
openclaw gateway status
openclaw gateway health
openclaw security audit
```

## Secrets

Store AIZen secrets in Keychain:

```bash
security add-generic-password -a "$USER" -s "ANTHROPIC_API_KEY" -w "<key>" -U
security add-generic-password -a "$USER" -s "OPENAI_API_KEY" -w "<key>" -U
security add-generic-password -a "$USER" -s "TELEGRAM_BOT_TOKEN" -w "<token>" -U
```

Check:

```bash
pnpm -s secrets:check
```

## AIZen Smoke Tests

```bash
pnpm -s lunar:test
pnpm -s typecheck
```

`lunar:test` can pass with zero profiles. To test real notifications, create:

```text
data/profiles/family.json
```

Use `docs/sample-family.json` as the private local template.

## Stop Or Uninstall

```bash
openclaw gateway stop
openclaw gateway uninstall
```

Use uninstall when moving runtime ownership to another machine.

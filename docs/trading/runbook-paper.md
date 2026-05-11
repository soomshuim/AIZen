# Alpaca Paper Runbook

## Scope
This runbook validates the broker-independent trading core through Alpaca paper only.

## Preconditions
- Store `ALPACA_PAPER_API_KEY` and `ALPACA_PAPER_API_SECRET` in macOS Keychain.
- Do not store API keys, account values, or tokens in files.
- Do not switch the adapter base URL away from `https://paper-api.alpaca.markets`.

## Paper Validation Steps
1. Run `pnpm typecheck`.
2. Run `pnpm skill:test`.
3. Load `skills/zen-trading-broker-alpaca/handler.ts` and create the paper adapter.
4. Validate account snapshot, quote lookup, place order, get order, cancel order, positions, and fills in paper.
5. Persist only sanitized metadata to `.aizen-cache/trading/`: statuses, timestamps, symbols, and non-sensitive audit events.
6. Do not persist account values, account identifiers, quantities, market values, order identifiers, or raw broker payloads.

## Stop Conditions
- Any live endpoint appears in config or logs.
- Any secret or account identifier is printed.
- Risk check returns rejected.
- Broker error cannot be mapped into `CoreError`.

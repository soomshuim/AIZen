# KIS Broker Expansion

## Phase
KIS is a G2 expansion path after the broker-independent core and Alpaca paper validation.

## Contract Goals
- Support domestic Korean equities and overseas equities through the common `BrokerAdapter`.
- Normalize symbol formats, currency, order types, trading sessions, tick sizes, and order statuses.
- Keep credentials Keychain-only with `KIS_APP_KEY`, `KIS_APP_SECRET`, and `KIS_ACCOUNT_ID`.

## Current Stub
- `skills/zen-trading-broker-kis/handler.ts` exposes the `kis-stub` adapter id, capabilities, and symbol normalization.
- Network operations intentionally throw `CoreError`.
- `environment: "live"` is blocked by construction.

## Not Yet Allowed
- Live endpoint connection
- Real account order placement
- File-based credential loading
- Live broker recommendation without explicit user approval

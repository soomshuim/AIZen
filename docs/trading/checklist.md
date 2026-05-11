# Trading Implementation Checklist

## G0 Core
- [x] Broker-independent `BrokerAdapter` contract exists.
- [x] Account, quote, order, position, fill, and risk domain types exist.
- [x] Common `CoreError` taxonomy exists.
- [x] Keychain-only secret key names exist.
- [x] Volatility/drawdown budget risk evaluator exists.
- [x] Approved deterministic paper risk defaults are encoded and tested.
- [x] Broker registry dispatch exists for `alpaca-paper` and `kis-stub`.
- [x] `.aizen-cache/trading` state persistence writes sanitized paper metadata, events, and checkpoints without secrets, account values, account identifiers, or raw broker payloads.
- [x] Audit events use metadata allow-listing rather than raw broker payload persistence.

## G1 Alpaca Paper
- [x] Alpaca adapter defaults to paper endpoint.
- [x] Live endpoint override is rejected.
- [x] Account, quote, order, cancel, positions, and fills methods map to core types.
- [x] Tests cover paper endpoint, account snapshot mapping, quote mapping, order lifecycle, positions, fills, and live/data endpoint rejection.

## G2 KIS Expansion
- [x] KIS adapter contract/stub exists.
- [x] KR and US symbol normalization exists.
- [x] Live construction is rejected.
- [x] Network operations remain disabled until explicit approval.

## Before Any Live Candidate
- [ ] User explicitly approves live candidate evaluation.
- [ ] Paper/sandbox evidence is reviewed.
- [ ] Operational alert path, including Telegram, is configured without secret leakage.
- [ ] Recovery, retry, idempotency, and manual kill switch are documented.

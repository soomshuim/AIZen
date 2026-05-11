**Result**

G0/G1/G2 구현을 할당 범위 안에서 완료했습니다. 공통 `BrokerAdapter` 계약/도메인 타입, trading `CoreError`, Keychain secret keys, volatility/drawdown 기반 risk evaluator, Alpaca paper-only adapter, KIS live-blocked contract stub, 테스트와 docs/runbook/checklist를 추가했습니다. `src/trading`, `configs/trading`, `.env.example`는 생성하지 않았고 live 기본 endpoint도 쓰지 않았습니다.

**Changed Files**

- `core/types.ts`, `core/error/index.ts`
- `core/secrets/keychain.ts`, `core/secrets/check.ts`
- `skills/zen-trading-core/`
- `skills/zen-trading-broker-alpaca/`
- `skills/zen-trading-broker-kis/`
- `docs/trading/`
- worker 산출물: `changed-files.txt`, `output.md`

**Verification**

- `pnpm typecheck` 통과
- `pnpm exec node --import tsx --test ...` 통과: 8 tests, 8 pass
- `pnpm skill:test`는 sandbox에서 `tsx` CLI IPC pipe 생성이 `listen EPERM`으로 실패했습니다.
- `git diff --check` 통과
- `.env.example` 미생성 확인, `src/trading`/`configs/trading` 미생성 확인

**Risks**

- Alpaca는 paper adapter mapping/unit 검증까지이며, 실제 paper 계정 검증은 Keychain credential과 별도 paper run이 필요합니다.
- KIS는 의도적으로 contract/stub 상태입니다. 네트워크 호출은 명시 승인 전까지 차단됩니다.
- risk default 값은 paper 검증용 draft라 live 후보 논의 전 재검토가 필요합니다.
**Result**
worker-03 통합/수리 완료했습니다. KIS adapter id를 `kis-stub` 계약과 맞췄고, broker error mapper를 core-error 형태로 수렴시켰습니다. Alpaca는 paper endpoint와 data API origin을 모두 고정해 live endpoint 우회를 막았고, 리스크 정책은 volatility + current/daily/weekly/peak-to-trough drawdown budget을 반영하도록 보강했습니다.

**Changed files**
`core/types.ts`, `core/error/index.ts`, `core/secrets/*`, `skills/zen-trading-*`, `docs/trading/*`, worker-03 `changed-files.txt` / `output.md`.

**Verification**
- `pnpm typecheck` 통과
- `node --import tsx --test ...` trading tests 통과: 11 pass
- `git diff --check` 통과
- 금지 경로 확인: `.env.example`, `src/trading`, `configs/trading` 없음
- `pnpm skill:test`는 sandbox에서 `tsx` IPC pipe `listen EPERM`으로 실패. 동일 테스트 파일은 `node --import tsx --test`로 통과 확인

**Risks**
Alpaca는 unit-level paper adapter 검증까지만 완료됐고, 실제 paper 계정 검증은 Keychain credential 설정 후 별도 실행이 필요합니다. KIS는 의도적으로 contract/stub 상태이며, live 후보 평가는 별도 사용자 승인 전까지 계속 차단됩니다.
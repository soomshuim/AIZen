# Trading Risk Policy

## Principle
AIZen trading uses budget-based risk controls. It does not use fixed take-profit or stop-loss values as the core policy.

## Budgets
- Volatility budget: blocks entries when annualized volatility is above the configured budget.
- Drawdown budget: blocks entries when current drawdown exceeds the allowed drawdown.
- Drawdown halts: blocks entries when daily, weekly, or peak-to-trough drawdown thresholds are reached.
- Per-position risk budget: caps order notional as a percentage of equity.
- Gross exposure budget: caps projected gross exposure as a percentage of equity.
- Max order notional: absolute cap for a single order.

## Default Draft Policy
- Annualized target volatility: 10%
- Volatility lookback: 20 EOD bars
- Volatility budget: 10%
- Max drawdown: 8%
- Per-position risk: 1%
- Gross exposure: 80%
- Minimum cash buffer: 20%
- ETF max weight: 20%
- Large-cap stock max weight: 5%
- Max order notional: 5000 USD
- Daily drawdown halt: -0.75%
- Weekly drawdown halt: -2.5%
- Peak-to-trough halt: -8%
- Hard stop reference: entry - max(2.5 * ATR20, 8%)
- Trailing activation: +2R
- Trailing exit reference: 20-day high - 1.5 * ATR20
- Max holding review: 40 trading days

These defaults are conservative draft values for paper validation and require review before any live candidate decision.

`RiskCheckInput` accepts optional daily, weekly, and peak-to-trough drawdown fields. If peak-to-trough drawdown is not supplied, the evaluator derives it from `currentDrawdownPercent` so the hard halt still applies during paper checks.

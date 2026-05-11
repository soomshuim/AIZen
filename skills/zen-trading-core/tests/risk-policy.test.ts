import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_RISK_POLICY,
  createBrokerAdapter,
  createTradingStateStore,
  evaluateRiskBudget,
  listBrokerCapabilities,
} from "../handler.ts";
import type { RiskCheckInput, TradingPaperState } from "../../../core/types.ts";

test("uses the approved deterministic paper risk defaults", () => {
  assert.equal(DEFAULT_RISK_POLICY.annualizedTargetVolatilityPercent, 10);
  assert.equal(DEFAULT_RISK_POLICY.volatilityLookbackDays, 20);
  assert.equal(DEFAULT_RISK_POLICY.maxGrossExposurePercent, 80);
  assert.equal(DEFAULT_RISK_POLICY.minCashBufferPercent, 20);
  assert.equal(DEFAULT_RISK_POLICY.maxEtfWeightPercent, 20);
  assert.equal(DEFAULT_RISK_POLICY.maxLargeCapStockWeightPercent, 5);
  assert.equal(DEFAULT_RISK_POLICY.dailyDrawdownHaltPercent, -0.75);
  assert.equal(DEFAULT_RISK_POLICY.weeklyDrawdownHaltPercent, -2.5);
  assert.equal(DEFAULT_RISK_POLICY.peakToTroughHaltPercent, -8);
  assert.equal(DEFAULT_RISK_POLICY.atrStopMultiple, 2.5);
  assert.equal(DEFAULT_RISK_POLICY.trailingActivationRMultiple, 2);
  assert.equal(DEFAULT_RISK_POLICY.trailingAtrMultiple, 1.5);
  assert.equal(DEFAULT_RISK_POLICY.maxHoldingReviewDays, 40);
});

test("approves an order inside volatility and drawdown budgets", () => {
  const input = baseRiskInput({
    quantity: 1,
    currentDrawdownPercent: 2,
    annualizedVolatilityPercent: 10,
    currentGrossExposure: 1000,
  });

  const result = evaluateRiskBudget(input);

  assert.equal(result.approved, true);
  assert.deepEqual(result.reasons, []);
});

test("rejects an order that exceeds volatility and drawdown budgets", () => {
  const input = baseRiskInput({
    quantity: 80,
    currentDrawdownPercent: 9,
    dailyDrawdownPercent: -0.8,
    weeklyDrawdownPercent: -2.6,
    peakToTroughDrawdownPercent: -8.1,
    annualizedVolatilityPercent: 24,
    currentGrossExposure: 9000,
  });

  const result = evaluateRiskBudget(input);

  assert.equal(result.approved, false);
  assert.match(result.reasons.join(" | "), /volatility/);
  assert.match(result.reasons.join(" | "), /drawdown/);
  assert.match(result.reasons.join(" | "), /daily drawdown halt/);
  assert.match(result.reasons.join(" | "), /weekly drawdown halt/);
  assert.match(result.reasons.join(" | "), /peak-to-trough drawdown halt/);
});

test("dispatches broker adapters through the core registry", () => {
  assert.equal(createBrokerAdapter().id, "alpaca-paper");
  assert.equal(createBrokerAdapter({ broker: "kis-stub" }).id, "kis-stub");
  assert.deepEqual(
    listBrokerCapabilities().map((capability) => capability.broker),
    ["alpaca", "kis"],
  );
  assert.throws(
    () => createBrokerAdapter({ broker: "alpaca-paper", environment: "live" }),
    /Live trading adapter construction requires separate explicit approval/,
  );
  assert.throws(
    () => createBrokerAdapter({ broker: "alpaca-paper", environment: "sandbox" }),
    /environment is not supported/,
  );
});

test("persists paper state atomically and allow-lists audit event metadata", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "aizen-trading-"));
  try {
    const store = createTradingStateStore(workspace);
    const state = {
      updatedAt: "2026-05-11T00:00:00.000Z",
      positions: [
        {
          symbol: { symbol: "AAPL", market: "US" as const, currency: "USD" },
          quantity: 10,
          marketValue: 1000,
        },
      ],
      orders: [
        {
          status: "accepted" as const,
          submittedAt: "2026-05-11T00:00:00.000Z",
          brokerOrderId: "broker-order-1",
          clientOrderId: "client-order-1",
          raw: { accountId: "account-1" },
        },
      ],
      account: {
        broker: "alpaca",
        environment: "paper" as const,
        currency: "USD",
        updatedAt: "2026-05-11T00:00:00.000Z",
        equity: 10000,
        cash: 8000,
      },
    } as unknown as TradingPaperState;
    const sanitizedState = {
      updatedAt: "2026-05-11T00:00:00.000Z",
      positions: [{ symbol: { symbol: "AAPL", market: "US", currency: "USD" } }],
      orders: [{ status: "accepted", submittedAt: "2026-05-11T00:00:00.000Z" }],
      account: {
        broker: "alpaca",
        environment: "paper",
        currency: "USD",
        updatedAt: "2026-05-11T00:00:00.000Z",
      },
    };

    await store.writePaperState(state);
    await store.writeCheckpoint("eod-20260511", state);
    await store.appendAuditEvent({
      id: "event-1",
      type: "broker_response",
      timestamp: "2026-05-11T00:00:00.000Z",
      broker: "alpaca-paper",
      payload: {
        symbol: { symbol: "AAPL", market: "US", currency: "USD" },
        status: "accepted",
        operation: "placeOrder",
        apiKey: "should-not-persist",
        id: "broker-order-1",
        order_id: "broker-order-1",
        client_order_id: "client-order-1",
        qty: "10",
        filled_qty: "1",
        equity: "10000",
        cash: "8000",
        buying_power: "12000",
        market_value: "2000",
        raw: { account_id: "account-1", accessToken: "should-not-persist" },
      },
    });

    assert.deepEqual(await store.readPaperState(), sanitizedState);
    const stateJson = await readFile(join(store.baseDir, "paper-state.json"), "utf8");
    assert.doesNotMatch(
      stateJson,
      /equity|cash|buyingPower|quantity|marketValue|brokerOrderId|clientOrderId|raw|account-1/,
    );
    const eventLog = await readFile(join(store.baseDir, "events.jsonl"), "utf8");
    assert.match(eventLog, /"operation":"placeOrder"/);
    assert.match(eventLog, /"status":"accepted"/);
    assert.doesNotMatch(
      eventLog,
      /should-not-persist|apiKey|accessToken|broker-order-1|client-order-1|account-1|order_id|client_order_id|qty|filled_qty|equity|cash|buying_power|market_value|raw/,
    );
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

function baseRiskInput(overrides: {
  quantity: number;
  currentDrawdownPercent: number;
  dailyDrawdownPercent?: number;
  weeklyDrawdownPercent?: number;
  peakToTroughDrawdownPercent?: number;
  annualizedVolatilityPercent: number;
  currentGrossExposure: number;
}): RiskCheckInput {
  return {
    account: {
      broker: "test",
      environment: "paper",
      currency: "USD",
      equity: 10000,
      cash: 8000,
      buyingPower: 8000,
      updatedAt: "2026-05-11T00:00:00.000Z",
    },
    intent: {
      clientOrderId: "risk-test-1",
      symbol: { symbol: "AAPL", market: "US", currency: "USD" },
      side: "buy",
      type: "market",
      timeInForce: "day",
      quantity: overrides.quantity,
    },
    quote: {
      symbol: { symbol: "AAPL", market: "US", currency: "USD" },
      bid: 99,
      ask: 100,
      timestamp: "2026-05-11T00:00:00.000Z",
    },
    policy: DEFAULT_RISK_POLICY,
    currentDrawdownPercent: overrides.currentDrawdownPercent,
    dailyDrawdownPercent: overrides.dailyDrawdownPercent,
    weeklyDrawdownPercent: overrides.weeklyDrawdownPercent,
    peakToTroughDrawdownPercent: overrides.peakToTroughDrawdownPercent,
    annualizedVolatilityPercent: overrides.annualizedVolatilityPercent,
    currentGrossExposure: overrides.currentGrossExposure,
  };
}

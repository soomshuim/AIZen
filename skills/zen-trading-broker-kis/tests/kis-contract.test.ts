import test from "node:test";
import assert from "node:assert/strict";

import { CoreError } from "../../../core/error/index.ts";
import { createKisAdapter, normalizeKisSymbol } from "../handler.ts";

test("normalizes domestic and overseas KIS symbols", () => {
  assert.deepEqual(normalizeKisSymbol({ symbol: "5930", market: "KR" }), {
    symbol: "5930",
    market: "KR",
    brokerSymbol: "005930",
    currency: "KRW",
  });

  assert.deepEqual(normalizeKisSymbol({ symbol: "aapl", market: "US" }), {
    symbol: "aapl",
    market: "US",
    brokerSymbol: "AAPL",
    currency: "USD",
  });
});

test("rejects live KIS adapter construction", () => {
  assert.throws(() => createKisAdapter({ environment: "live" }), CoreError);
});

test("keeps KIS network operations disabled in G2", async () => {
  const adapter = createKisAdapter({ environment: "sandbox" });

  await assert.rejects(
    () => adapter.getAccountSnapshot(),
    /intentionally disabled/,
  );
  assert.equal(adapter.capabilities.liveRequiresExplicitApproval, true);
});

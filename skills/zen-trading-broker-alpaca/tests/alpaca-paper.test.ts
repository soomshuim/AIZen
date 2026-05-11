import test from "node:test";
import assert from "node:assert/strict";

import { CoreError } from "../../../core/error/index.ts";
import { createAlpacaPaperAdapter } from "../handler.ts";

test("uses Alpaca paper endpoint and maps account snapshot", async () => {
  const calls: string[] = [];
  const adapter = createAlpacaPaperAdapter({
    credentials: { apiKey: "test-key", apiSecret: "test-secret" },
    fetchImpl: async (url) => {
      calls.push(String(url));
      return jsonResponse({
        id: "paper-account",
        equity: "10000.25",
        cash: "9000.25",
        buying_power: "18000.5",
        daytrading_buying_power: "18000.5",
      });
    },
  });

  const account = await adapter.getAccountSnapshot();

  assert.equal(account.environment, "paper");
  assert.equal(account.equity, 10000.25);
  assert.equal(calls[0], "https://paper-api.alpaca.markets/v2/account");
});

test("rejects live endpoint configuration", () => {
  assert.throws(
    () =>
      createAlpacaPaperAdapter({
        baseUrl: "https://api.alpaca.markets",
        credentials: { apiKey: "test-key", apiSecret: "test-secret" },
      }),
    CoreError,
  );
  assert.throws(
    () =>
      createAlpacaPaperAdapter({
        baseUrl: "https://example.com/paper-api.alpaca.markets",
        credentials: { apiKey: "test-key", apiSecret: "test-secret" },
      }),
    CoreError,
  );
  assert.throws(
    () =>
      createAlpacaPaperAdapter({
        dataBaseUrl: "https://api.alpaca.markets",
        credentials: { apiKey: "test-key", apiSecret: "test-secret" },
      }),
    CoreError,
  );
  assert.throws(
    () =>
      createAlpacaPaperAdapter({
        dataBaseUrl: "https://example.com/data.alpaca.markets",
        credentials: { apiKey: "test-key", apiSecret: "test-secret" },
      }),
    CoreError,
  );
});

test("maps order create, get, and cancel lifecycle", async () => {
  const calls: Array<{ url: string; method: string }> = [];
  const adapter = createAlpacaPaperAdapter({
    credentials: { apiKey: "test-key", apiSecret: "test-secret" },
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), method: init?.method ?? "GET" });
      if (init?.method === "POST") {
        return jsonResponse({
          id: "order-1",
          client_order_id: "client-1",
          status: "accepted",
          submitted_at: "2026-05-11T00:00:00Z",
        });
      }
      if (init?.method === "DELETE") return emptyResponse();
      return jsonResponse({
        id: "order-1",
        client_order_id: "client-1",
        status: "filled",
        submitted_at: "2026-05-11T00:00:00Z",
        filled_qty: "1",
        filled_avg_price: "100.50",
        updated_at: "2026-05-11T00:01:00Z",
      });
    },
  });

  const placed = await adapter.placeOrder({
    clientOrderId: "client-1",
    symbol: { symbol: "AAPL", market: "US" },
    side: "buy",
    type: "market",
    timeInForce: "day",
    quantity: 1,
  });
  const state = await adapter.getOrder("order-1");
  const cancel = await adapter.cancelOrder("order-1");

  assert.equal(placed.status, "accepted");
  assert.equal(state.status, "filled");
  assert.equal(cancel.cancelled, true);
  assert.deepEqual(
    calls.map((call) => call.method),
    ["POST", "GET", "DELETE"],
  );
});

test("maps quote, positions, and fills to core types", async () => {
  const adapter = createAlpacaPaperAdapter({
    credentials: { apiKey: "test-key", apiSecret: "test-secret" },
    fetchImpl: async (url) => {
      const path = String(url);
      if (path.includes("/quotes/latest")) {
        return jsonResponse({
          quote: {
            bp: 100.1,
            ap: 100.2,
            t: "2026-05-11T00:00:00Z",
          },
        });
      }
      if (path.includes("/v2/positions")) {
        return jsonResponse([
          {
            symbol: "AAPL",
            qty: "2",
            market_value: "200.4",
            avg_entry_price: "99.5",
            unrealized_pl: "1.4",
            unrealized_plpc: "0.007",
          },
        ]);
      }
      return jsonResponse([
        {
          order_id: "order-1",
          symbol: "AAPL",
          qty: "1",
          price: "100.2",
          transaction_time: "2026-05-11T00:01:00Z",
        },
      ]);
    },
  });

  const quote = await adapter.getQuote({ symbol: "AAPL", market: "US" });
  const positions = await adapter.listPositions();
  const fills = await adapter.listFills({ symbol: { symbol: "AAPL", market: "US" } });

  assert.equal(quote.ask, 100.2);
  assert.equal(positions[0]?.marketValue, 200.4);
  assert.ok(Math.abs((positions[0]?.unrealizedPnlPercent ?? 0) - 0.7) < 1e-9);
  assert.equal(fills[0]?.price, 100.2);
});

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function emptyResponse(): Response {
  return new Response(null, { status: 204 });
}

import { CoreError, ensurePaperOrSandbox, mapHttpStatusToCoreError } from "../../core/error/index.ts";
import { readSecret, SECRETS } from "../../core/secrets/keychain.ts";
import type {
  AccountSnapshot,
  AuthSession,
  BrokerAdapter,
  BrokerCapabilities,
  BrokerEnvironment,
  CancelResult,
  Fill,
  FillQuery,
  OrderIntent,
  OrderState,
  OrderStatus,
  PlacedOrder,
  Position,
  Quote,
  SkillContext,
  SkillResult,
  TradingSymbol,
} from "../../core/types.ts";

const PAPER_BASE_URL = "https://paper-api.alpaca.markets";
const DATA_BASE_URL = "https://data.alpaca.markets";

interface AlpacaCredentials {
  apiKey: string;
  apiSecret: string;
}

interface AlpacaAdapterOptions {
  credentials?: AlpacaCredentials;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  dataBaseUrl?: string;
  environment?: BrokerEnvironment;
}

export default async function handler(
  ctx: SkillContext,
): Promise<SkillResult<BrokerCapabilities>> {
  const adapter = createAlpacaPaperAdapter();
  ctx.logger.info("Alpaca paper adapter loaded", {
    broker: adapter.id,
    environment: adapter.capabilities.environment,
  });
  return { ok: true, data: adapter.capabilities };
}

export function createAlpacaPaperAdapter(
  options: AlpacaAdapterOptions = {},
): BrokerAdapter {
  return new AlpacaPaperAdapter(options);
}

class AlpacaPaperAdapter implements BrokerAdapter {
  readonly id = "alpaca-paper";
  readonly capabilities: BrokerCapabilities = {
    broker: "alpaca",
    environment: "paper",
    marketScope: ["US"],
    supportsFractional: true,
    supportsExtendedHours: true,
    supportsShorting: true,
    supportedOrderTypes: ["market", "limit", "stop", "stop_limit"],
    supportsPaperTrading: true,
    liveRequiresExplicitApproval: true,
  };

  private readonly fetchImpl: typeof fetch;
  private readonly baseUrl: string;
  private readonly dataBaseUrl: string;
  private readonly credentials?: AlpacaCredentials;

  constructor(options: AlpacaAdapterOptions) {
    const environment = options.environment ?? "paper";
    ensurePaperOrSandbox(environment, "Alpaca");
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.baseUrl = options.baseUrl ?? PAPER_BASE_URL;
    this.dataBaseUrl = options.dataBaseUrl ?? DATA_BASE_URL;
    this.credentials = options.credentials;
    if (urlOrigin(this.baseUrl) !== PAPER_BASE_URL) {
      throw new CoreError("LIVE_TRADING_APPROVAL_REQUIRED", "Alpaca adapter is paper-only in G1.", {
        baseUrl: this.baseUrl,
      });
    }
    if (urlOrigin(this.dataBaseUrl) !== DATA_BASE_URL) {
      throw new CoreError("LIVE_TRADING_APPROVAL_REQUIRED", "Alpaca data adapter is fixed to the paper validation data API in G1.", {
        dataBaseUrl: this.dataBaseUrl,
      });
    }
  }

  async authenticate(): Promise<AuthSession> {
    await this.request<Record<string, unknown>>("/v2/account");
    return {
      broker: "alpaca",
      environment: "paper",
      authenticated: true,
    };
  }

  async getAccountSnapshot(): Promise<AccountSnapshot> {
    const account = await this.request<Record<string, unknown>>("/v2/account");
    return {
      broker: "alpaca",
      environment: "paper",
      currency: "USD",
      equity: numberField(account, "equity"),
      cash: numberField(account, "cash"),
      buyingPower: numberField(account, "buying_power"),
      dayTradeBuyingPower: numberField(account, "daytrading_buying_power"),
      updatedAt: new Date().toISOString(),
    };
  }

  async getQuote(input: TradingSymbol): Promise<Quote> {
    const symbol = normalizeSymbol(input);
    const quote = await this.request<Record<string, unknown>>(
      `/v2/stocks/${encodeURIComponent(symbol)}/quotes/latest`,
      { data: true },
    );
    const nested = objectField(quote, "quote");
    return {
      symbol: { ...input, brokerSymbol: symbol, market: "US", currency: "USD" },
      bid: numberField(nested, "bp"),
      ask: numberField(nested, "ap"),
      timestamp: stringField(nested, "t") ?? new Date().toISOString(),
    };
  }

  async placeOrder(intent: OrderIntent): Promise<PlacedOrder> {
    const body = {
      symbol: normalizeSymbol(intent.symbol),
      side: intent.side,
      type: intent.type,
      time_in_force: intent.timeInForce,
      qty: String(intent.quantity),
      client_order_id: intent.clientOrderId,
      limit_price: intent.limitPrice,
      stop_price: intent.stopPrice,
      extended_hours: intent.extendedHours,
    };
    const order = await this.request<Record<string, unknown>>("/v2/orders", {
      method: "POST",
      body,
    });
    return {
      brokerOrderId: requiredString(order, "id"),
      clientOrderId: requiredString(order, "client_order_id"),
      status: mapAlpacaOrderStatus(stringField(order, "status")),
      submittedAt: stringField(order, "submitted_at") ?? new Date().toISOString(),
    };
  }

  async cancelOrder(orderId: string): Promise<CancelResult> {
    await this.request(`/v2/orders/${encodeURIComponent(orderId)}`, {
      method: "DELETE",
    });
    return { brokerOrderId: orderId, cancelled: true, status: "cancelled" };
  }

  async getOrder(orderId: string): Promise<OrderState> {
    const order = await this.request<Record<string, unknown>>(
      `/v2/orders/${encodeURIComponent(orderId)}`,
    );
    return {
      brokerOrderId: requiredString(order, "id"),
      clientOrderId: requiredString(order, "client_order_id"),
      status: mapAlpacaOrderStatus(stringField(order, "status")),
      submittedAt: stringField(order, "submitted_at") ?? new Date().toISOString(),
      filledQuantity: numberField(order, "filled_qty"),
      averageFillPrice: optionalNumberField(order, "filled_avg_price"),
      updatedAt: stringField(order, "updated_at") ?? new Date().toISOString(),
    };
  }

  async listPositions(): Promise<Position[]> {
    const rows = await this.request<Array<Record<string, unknown>>>("/v2/positions");
    return rows.map((row) => ({
      symbol: {
        symbol: requiredString(row, "symbol"),
        brokerSymbol: requiredString(row, "symbol"),
        market: "US",
        currency: "USD",
      },
      quantity: numberField(row, "qty"),
      marketValue: numberField(row, "market_value"),
      averageEntryPrice: numberField(row, "avg_entry_price"),
      unrealizedPnl: numberField(row, "unrealized_pl"),
      unrealizedPnlPercent: numberField(row, "unrealized_plpc") * 100,
    }));
  }

  async listFills(query: FillQuery = {}): Promise<Fill[]> {
    const params = new URLSearchParams();
    if (query.since) params.set("after", query.since);
    if (query.until) params.set("until", query.until);
    if (query.symbol) params.set("symbols", normalizeSymbol(query.symbol));
    const suffix = params.toString() ? `?${params}` : "";
    const rows = await this.request<Array<Record<string, unknown>>>(
      `/v2/account/activities/FILL${suffix}`,
    );
    return rows.map((row) => ({
      brokerOrderId: requiredString(row, "order_id"),
      symbol: {
        symbol: requiredString(row, "symbol"),
        brokerSymbol: requiredString(row, "symbol"),
        market: "US",
        currency: "USD",
      },
      quantity: numberField(row, "qty"),
      price: numberField(row, "price"),
      filledAt: stringField(row, "transaction_time") ?? new Date().toISOString(),
      currency: "USD",
    }));
  }

  mapBrokerError(raw: unknown): CoreError {
    if (raw instanceof CoreError) return raw;
    return new CoreError("UNKNOWN", "Alpaca broker error", undefined, raw);
  }

  private async request<T>(
    path: string,
    options: {
      method?: string;
      body?: Record<string, unknown>;
      data?: boolean;
    } = {},
  ): Promise<T> {
    const credentials = await this.getCredentials();
    const root = options.data ? this.dataBaseUrl : this.baseUrl;
    const response = await this.fetchImpl(`${root}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "APCA-API-KEY-ID": credentials.apiKey,
        "APCA-API-SECRET-KEY": credentials.apiSecret,
        "content-type": "application/json",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      throw mapHttpStatusToCoreError(response.status, "Alpaca request failed", {
        broker: "alpaca",
        status: response.status,
      });
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  private async getCredentials(): Promise<AlpacaCredentials> {
    if (this.credentials) return this.credentials;
    return {
      apiKey: await readSecret(SECRETS.ALPACA_PAPER_API_KEY),
      apiSecret: await readSecret(SECRETS.ALPACA_PAPER_API_SECRET),
    };
  }
}

function normalizeSymbol(symbol: TradingSymbol): string {
  if (symbol.market !== "US") {
    throw new CoreError("BROKER_NOT_SUPPORTED", "Alpaca G1 adapter supports US symbols only.", {
      symbol: symbol.symbol,
      market: symbol.market,
    });
  }
  return symbol.brokerSymbol ?? symbol.symbol;
}

function urlOrigin(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    throw new CoreError("VALIDATION_FAILED", "Invalid Alpaca base URL.", { baseUrl: value });
  }
}

function mapAlpacaOrderStatus(status?: string): OrderStatus {
  switch (status) {
    case "new":
      return "new";
    case "accepted":
    case "pending_new":
      return "accepted";
    case "partially_filled":
      return "partially_filled";
    case "filled":
      return "filled";
    case "canceled":
    case "cancelled":
      return "cancelled";
    case "rejected":
      return "rejected";
    case "expired":
      return "expired";
    default:
      return "unknown";
  }
}

function objectField(record: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = record[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function requiredString(record: Record<string, unknown>, key: string): string {
  const value = stringField(record, key);
  if (!value) {
    throw new CoreError("VALIDATION_FAILED", `Missing Alpaca field: ${key}`);
  }
  return value;
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function numberField(record: Record<string, unknown>, key: string): number {
  const value = optionalNumberField(record, key);
  return value ?? 0;
}

function optionalNumberField(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

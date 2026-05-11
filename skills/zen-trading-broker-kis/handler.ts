import { CoreError, ensurePaperOrSandbox } from "../../core/error/index.ts";
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
  PlacedOrder,
  Position,
  Quote,
  SkillContext,
  SkillResult,
  TradingMarket,
  TradingSymbol,
} from "../../core/types.ts";

interface KisAdapterOptions {
  environment?: BrokerEnvironment;
}

export default async function handler(
  ctx: SkillContext,
): Promise<SkillResult<BrokerCapabilities>> {
  const adapter = createKisAdapter();
  ctx.logger.info("KIS adapter contract loaded", {
    broker: adapter.id,
    environment: adapter.capabilities.environment,
  });
  return { ok: true, data: adapter.capabilities };
}

export function createKisAdapter(options: KisAdapterOptions = {}): BrokerAdapter {
  return new KisContractAdapter(options.environment ?? "sandbox");
}

export function normalizeKisSymbol(input: TradingSymbol): TradingSymbol {
  if (input.market === "KR") {
    return {
      ...input,
      brokerSymbol: input.brokerSymbol ?? input.symbol.padStart(6, "0"),
      currency: input.currency ?? "KRW",
    };
  }
  if (input.market === "US") {
    return {
      ...input,
      brokerSymbol: input.brokerSymbol ?? input.symbol.toUpperCase(),
      currency: input.currency ?? "USD",
    };
  }
  throw new CoreError("BROKER_NOT_SUPPORTED", "KIS supports KR and US market scopes.", {
    symbol: input.symbol,
    market: input.market,
  });
}

export function inferKisMarket(symbol: TradingSymbol): TradingMarket {
  return symbol.market === "KR" ? "KR" : "US";
}

class KisContractAdapter implements BrokerAdapter {
  readonly id = "kis-stub";
  readonly capabilities: BrokerCapabilities;

  constructor(environment: BrokerEnvironment) {
    ensurePaperOrSandbox(environment, "KIS");
    this.capabilities = {
      broker: "kis",
      environment,
      marketScope: ["KR", "US"],
      supportsFractional: false,
      supportsExtendedHours: false,
      supportsShorting: false,
      supportedOrderTypes: ["market", "limit"],
      supportsPaperTrading: environment === "sandbox",
      liveRequiresExplicitApproval: true,
    };
  }

  async authenticate(): Promise<AuthSession> {
    return this.notConnected("authenticate");
  }

  async getAccountSnapshot(): Promise<AccountSnapshot> {
    return this.notConnected("getAccountSnapshot");
  }

  async getQuote(input: TradingSymbol): Promise<Quote> {
    normalizeKisSymbol(input);
    return this.notConnected("getQuote");
  }

  async placeOrder(intent: OrderIntent): Promise<PlacedOrder> {
    normalizeKisSymbol(intent.symbol);
    return this.notConnected("placeOrder");
  }

  async cancelOrder(orderId: string): Promise<CancelResult> {
    return this.notConnected("cancelOrder", { orderId });
  }

  async getOrder(orderId: string): Promise<OrderState> {
    return this.notConnected("getOrder", { orderId });
  }

  async listPositions(): Promise<Position[]> {
    return this.notConnected("listPositions");
  }

  async listFills(query?: FillQuery): Promise<Fill[]> {
    return this.notConnected("listFills", { query });
  }

  mapBrokerError(raw: unknown): CoreError {
    if (raw instanceof CoreError) return raw;
    return new CoreError("BROKER_NOT_SUPPORTED", "KIS adapter is contract-only in G2.", undefined, raw);
  }

  private notConnected(operation: string, details: Record<string, unknown> = {}): Promise<never> {
    return Promise.reject(new CoreError(
      "BROKER_NOT_SUPPORTED",
      "KIS live/sandbox network connection is intentionally disabled until explicit approval.",
      {
        broker: "kis",
        operation,
        ...details,
      },
    ));
  }
}

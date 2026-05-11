export interface SkillContext {
  input: SkillInput;
  user: User;
  channel: Channel;
  logger: Logger;
  workspace: string;
}

export interface SkillInput {
  message?: string;
  data?: Record<string, unknown>;
  trigger: "chat" | "cron" | "webhook" | "test";
  timestamp: string;
}

export interface User {
  id: string;
  channel: ChannelName;
  name?: string;
}

export type ChannelName =
  | "telegram"
  | "imessage"
  | "slack"
  | "discord"
  | "test";

export interface Channel {
  send(opts: { to: User; message: string; thread?: string }): Promise<void>;
  reply(text: string): Promise<void>;
}

export interface Logger {
  info(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, err?: unknown): void;
}

export interface SkillResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  meta?: {
    durationMs?: number;
    attempts?: number;
  };
}

export type TradingMarket = "US" | "KR" | "KR_US";

export type BrokerEnvironment = "paper" | "sandbox" | "live";

export type OrderSide = "buy" | "sell";

export type OrderType = "market" | "limit" | "stop" | "stop_limit";

export type TimeInForce = "day" | "gtc" | "ioc" | "fok";

export type OrderStatus =
  | "new"
  | "accepted"
  | "partially_filled"
  | "filled"
  | "cancelled"
  | "rejected"
  | "expired"
  | "unknown";

export interface BrokerCapabilities {
  broker: string;
  environment: BrokerEnvironment;
  marketScope: TradingMarket[];
  supportsFractional: boolean;
  supportsExtendedHours: boolean;
  supportsShorting: boolean;
  supportedOrderTypes: OrderType[];
  supportsPaperTrading: boolean;
  liveRequiresExplicitApproval: boolean;
}

export interface AuthSession {
  broker: string;
  environment: BrokerEnvironment;
  authenticated: boolean;
  expiresAt?: string;
}

export interface AccountSnapshot {
  broker: string;
  environment: BrokerEnvironment;
  currency: string;
  equity: number;
  cash: number;
  buyingPower: number;
  dayTradeBuyingPower?: number;
  updatedAt: string;
}

export interface TradingSymbol {
  symbol: string;
  market: TradingMarket;
  brokerSymbol?: string;
  currency?: string;
}

export interface Quote {
  symbol: TradingSymbol;
  bid: number;
  ask: number;
  last?: number;
  timestamp: string;
}

export interface OrderIntent {
  clientOrderId: string;
  symbol: TradingSymbol;
  side: OrderSide;
  type: OrderType;
  timeInForce: TimeInForce;
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
  extendedHours?: boolean;
}

export interface PlacedOrder {
  brokerOrderId: string;
  clientOrderId: string;
  status: OrderStatus;
  submittedAt: string;
}

export interface CancelResult {
  brokerOrderId: string;
  cancelled: boolean;
  status: OrderStatus;
}

export interface OrderState extends PlacedOrder {
  filledQuantity: number;
  averageFillPrice?: number;
  updatedAt: string;
}

export interface Position {
  symbol: TradingSymbol;
  quantity: number;
  marketValue: number;
  averageEntryPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
}

export interface Fill {
  brokerOrderId: string;
  symbol: TradingSymbol;
  quantity: number;
  price: number;
  filledAt: string;
  fee?: number;
  currency?: string;
}

export interface FillQuery {
  since?: string;
  until?: string;
  symbol?: TradingSymbol;
}

export type BrokerAdapterId = "alpaca-paper" | "kis-stub";

export interface BrokerAdapterConfig {
  broker?: BrokerAdapterId;
  environment?: BrokerEnvironment;
}

export interface RiskBudgetPolicy {
  annualizedTargetVolatilityPercent: number;
  volatilityBudgetPercent: number;
  volatilityLookbackDays: number;
  maxDrawdownPercent: number;
  dailyDrawdownHaltPercent: number;
  weeklyDrawdownHaltPercent: number;
  peakToTroughHaltPercent: number;
  perPositionRiskPercent: number;
  maxGrossExposurePercent: number;
  minCashBufferPercent: number;
  maxEtfWeightPercent: number;
  maxLargeCapStockWeightPercent: number;
  maxOrderNotional: number;
  atrStopMultiple: number;
  hardStopMinimumPercent: number;
  trailingActivationRMultiple: number;
  trailingAtrMultiple: number;
  maxHoldingReviewDays: number;
  currency: string;
}

export interface RiskCheckInput {
  account: AccountSnapshot;
  intent: OrderIntent;
  quote: Quote;
  policy: RiskBudgetPolicy;
  currentDrawdownPercent: number;
  dailyDrawdownPercent?: number;
  weeklyDrawdownPercent?: number;
  peakToTroughDrawdownPercent?: number;
  annualizedVolatilityPercent: number;
  currentGrossExposure: number;
}

export interface RiskCheckResult {
  approved: boolean;
  reasons: string[];
  orderNotional: number;
  projectedGrossExposurePercent: number;
  volatilityBudgetUsedPercent: number;
  drawdownBudgetRemainingPercent: number;
  cashBufferRemainingPercent: number;
}

export interface TradingPaperAccountState {
  broker: string;
  environment: BrokerEnvironment;
  currency: string;
  updatedAt: string;
}

export interface TradingPaperPositionState {
  symbol: TradingSymbol;
}

export interface TradingPaperOrderState {
  status: OrderStatus;
  submittedAt?: string;
  updatedAt?: string;
}

export interface TradingPaperState {
  updatedAt: string;
  account?: TradingPaperAccountState;
  positions: TradingPaperPositionState[];
  orders: TradingPaperOrderState[];
}

export interface TradingAuditEvent {
  id: string;
  type:
    | "order_intent"
    | "risk_decision"
    | "broker_request"
    | "broker_response"
    | "checkpoint";
  timestamp: string;
  broker?: BrokerAdapterId;
  payload?: Record<string, unknown>;
}

export interface BrokerAdapter {
  readonly id: BrokerAdapterId;
  readonly capabilities: BrokerCapabilities;
  authenticate(): Promise<AuthSession>;
  getAccountSnapshot(): Promise<AccountSnapshot>;
  getQuote(input: TradingSymbol): Promise<Quote>;
  placeOrder(intent: OrderIntent): Promise<PlacedOrder>;
  cancelOrder(orderId: string): Promise<CancelResult>;
  getOrder(orderId: string): Promise<OrderState>;
  listPositions(): Promise<Position[]>;
  listFills(query?: FillQuery): Promise<Fill[]>;
  mapBrokerError(raw: unknown): CoreErrorLike;
}

export interface CoreErrorLike extends Error {
  readonly code: string;
}

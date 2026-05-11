import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { CoreError } from "../../core/error/index.ts";
import type {
  BrokerAdapter,
  BrokerAdapterConfig,
  BrokerAdapterId,
  BrokerCapabilities,
  BrokerEnvironment,
  RiskBudgetPolicy,
  RiskCheckInput,
  RiskCheckResult,
  SkillContext,
  SkillResult,
  TradingAuditEvent,
  TradingPaperState,
} from "../../core/types.ts";
import { createAlpacaPaperAdapter } from "../zen-trading-broker-alpaca/handler.ts";
import { createKisAdapter } from "../zen-trading-broker-kis/handler.ts";

export const DEFAULT_RISK_POLICY: RiskBudgetPolicy = {
  annualizedTargetVolatilityPercent: 10,
  volatilityBudgetPercent: 10,
  volatilityLookbackDays: 20,
  maxDrawdownPercent: 8,
  dailyDrawdownHaltPercent: -0.75,
  weeklyDrawdownHaltPercent: -2.5,
  peakToTroughHaltPercent: -8,
  perPositionRiskPercent: 1,
  maxGrossExposurePercent: 80,
  minCashBufferPercent: 20,
  maxEtfWeightPercent: 20,
  maxLargeCapStockWeightPercent: 5,
  maxOrderNotional: 5000,
  atrStopMultiple: 2.5,
  hardStopMinimumPercent: 8,
  trailingActivationRMultiple: 2,
  trailingAtrMultiple: 1.5,
  maxHoldingReviewDays: 40,
  currency: "USD",
};

export default async function handler(
  ctx: SkillContext,
): Promise<SkillResult<RiskCheckResult | RiskBudgetPolicy | BrokerCapabilities>> {
  const brokerId = parseBrokerId(ctx.input.data?.brokerId);
  if (brokerId) {
    const adapter = createBrokerAdapter({ broker: brokerId });
    return { ok: true, data: adapter.capabilities };
  }

  const payload = ctx.input.data?.riskCheck;
  if (!payload) {
    return { ok: true, data: DEFAULT_RISK_POLICY };
  }

  const result = evaluateRiskBudget(payload as RiskCheckInput);
  if (!result.approved) {
    return {
      ok: false,
      error: new CoreError(
        "RISK_BUDGET_EXCEEDED",
        "Trading intent exceeds the configured risk budget.",
        { reasons: result.reasons },
      ).message,
      data: result,
    };
  }

  return { ok: true, data: result };
}

export function createBrokerAdapter(config: BrokerAdapterConfig = {}): BrokerAdapter {
  const broker = config.broker ?? "alpaca-paper";
  switch (broker) {
    case "alpaca-paper":
      return createAlpacaPaperAdapter({
        environment: assertEnvironment(config.environment, "paper", broker),
      });
    case "kis-stub":
      return createKisAdapter({
        environment: assertEnvironment(config.environment, "sandbox", broker),
      });
    default:
      return assertNeverBroker(broker);
  }
}

export function listBrokerCapabilities(): BrokerCapabilities[] {
  return [
    createBrokerAdapter({ broker: "alpaca-paper" }).capabilities,
    createBrokerAdapter({ broker: "kis-stub" }).capabilities,
  ];
}

export function evaluateRiskBudget(input: RiskCheckInput): RiskCheckResult {
  const mark = input.intent.side === "buy" ? input.quote.ask : input.quote.bid;
  const orderNotional = roundMoney(mark * input.intent.quantity);
  const equity = Math.max(input.account.equity, 0);
  const reasons: string[] = [];

  const projectedGrossExposure = input.currentGrossExposure + orderNotional;
  const projectedGrossExposurePercent =
    equity > 0 ? (projectedGrossExposure / equity) * 100 : Number.POSITIVE_INFINITY;
  const cashBufferRemainingPercent =
    equity > 0 ? ((input.account.cash - orderNotional) / equity) * 100 : Number.NEGATIVE_INFINITY;
  const volatilityBudgetUsedPercent =
    input.annualizedVolatilityPercent /
    Math.max(input.policy.volatilityBudgetPercent, 0.0001);
  const drawdownBudgetRemainingPercent =
    input.policy.maxDrawdownPercent - input.currentDrawdownPercent;
  const perPositionBudget = equity * (input.policy.perPositionRiskPercent / 100);
  const dailyDrawdownPercent = input.dailyDrawdownPercent ?? 0;
  const weeklyDrawdownPercent = input.weeklyDrawdownPercent ?? 0;
  const peakToTroughDrawdownPercent =
    input.peakToTroughDrawdownPercent ?? -Math.abs(input.currentDrawdownPercent);

  if (equity <= 0) reasons.push("account equity must be positive");
  if (orderNotional > input.policy.maxOrderNotional) {
    reasons.push("order notional exceeds max order notional");
  }
  if (orderNotional > perPositionBudget) {
    reasons.push("order notional exceeds per-position risk budget");
  }
  if (projectedGrossExposurePercent > input.policy.maxGrossExposurePercent) {
    reasons.push("projected gross exposure exceeds budget");
  }
  if (cashBufferRemainingPercent < input.policy.minCashBufferPercent) {
    reasons.push("cash buffer would fall below budget");
  }
  if (input.annualizedVolatilityPercent > input.policy.volatilityBudgetPercent) {
    reasons.push("annualized volatility exceeds volatility budget");
  }
  if (drawdownBudgetRemainingPercent < 0) {
    reasons.push("current drawdown exceeds drawdown budget");
  }
  if (dailyDrawdownPercent <= input.policy.dailyDrawdownHaltPercent) {
    reasons.push("daily drawdown halt threshold reached");
  }
  if (weeklyDrawdownPercent <= input.policy.weeklyDrawdownHaltPercent) {
    reasons.push("weekly drawdown halt threshold reached");
  }
  if (peakToTroughDrawdownPercent <= input.policy.peakToTroughHaltPercent) {
    reasons.push("peak-to-trough drawdown halt threshold reached");
  }

  return {
    approved: reasons.length === 0,
    reasons,
    orderNotional,
    projectedGrossExposurePercent,
    volatilityBudgetUsedPercent,
    drawdownBudgetRemainingPercent,
    cashBufferRemainingPercent,
  };
}

export interface TradingStateStore {
  readonly baseDir: string;
  readPaperState(): Promise<TradingPaperState | null>;
  writePaperState(state: TradingPaperState): Promise<void>;
  appendAuditEvent(event: TradingAuditEvent): Promise<void>;
  writeCheckpoint(name: string, state: TradingPaperState): Promise<void>;
}

export function createTradingStateStore(
  workspace: string,
  baseDir = join(workspace, ".aizen-cache", "trading"),
): TradingStateStore {
  const stateFile = join(baseDir, "paper-state.json");
  const eventsFile = join(baseDir, "events.jsonl");
  const checkpointsDir = join(baseDir, "checkpoints");

  return {
    baseDir,
    async readPaperState(): Promise<TradingPaperState | null> {
      try {
        return JSON.parse(await readFile(stateFile, "utf8")) as TradingPaperState;
      } catch (error) {
        if (isMissingFile(error)) return null;
        throw error;
      }
    },
    async writePaperState(state: TradingPaperState): Promise<void> {
      await atomicWriteJson(stateFile, sanitizePaperState(state));
    },
    async appendAuditEvent(event: TradingAuditEvent): Promise<void> {
      await mkdir(dirname(eventsFile), { recursive: true });
      const safeEvent = sanitizeAuditEvent(event);
      await writeFile(eventsFile, `${JSON.stringify(safeEvent)}\n`, { flag: "a" });
    },
    async writeCheckpoint(name: string, state: TradingPaperState): Promise<void> {
      assertSafeCheckpointName(name);
      await atomicWriteJson(join(checkpointsDir, `${name}.json`), sanitizePaperState(state));
    },
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseBrokerId(value: unknown): BrokerAdapterId | undefined {
  if (value === undefined || value === null) return undefined;
  if (value === "alpaca-paper" || value === "kis-stub") return value;
  throw new CoreError("BROKER_NOT_SUPPORTED", "Unknown trading broker adapter.", {
    broker: value,
  });
}

function assertEnvironment(
  environment: BrokerEnvironment | undefined,
  defaultEnvironment: BrokerEnvironment,
  broker: BrokerAdapterId,
): BrokerEnvironment {
  if (!environment) return defaultEnvironment;
  if (environment === "live") {
    throw new CoreError(
      "LIVE_TRADING_APPROVAL_REQUIRED",
      "Live trading adapter construction requires separate explicit approval.",
      { broker, environment },
    );
  }
  if (environment !== defaultEnvironment) {
    throw new CoreError("BROKER_NOT_SUPPORTED", "Broker adapter environment is not supported.", {
      broker,
      environment,
      supportedEnvironment: defaultEnvironment,
    });
  }
  return environment;
}

function assertNeverBroker(broker: never): never {
  throw new CoreError("BROKER_NOT_SUPPORTED", "Unknown trading broker adapter.", { broker });
}

async function atomicWriteJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tempPath, filePath);
}

function sanitizePaperState(state: TradingPaperState): TradingPaperState {
  return {
    updatedAt: state.updatedAt,
    account: state.account
      ? {
          broker: state.account.broker,
          environment: state.account.environment,
          currency: state.account.currency,
          updatedAt: state.account.updatedAt,
        }
      : undefined,
    positions: state.positions.map((position) => ({
      symbol: sanitizeSymbol(position.symbol),
    })),
    orders: state.orders.map((order) => ({
      status: order.status,
      submittedAt: order.submittedAt,
      updatedAt: order.updatedAt,
    })),
  };
}

function sanitizeAuditEvent(event: TradingAuditEvent): TradingAuditEvent {
  const payload = sanitizeAuditPayload(event.payload);
  return {
    id: event.id,
    type: event.type,
    timestamp: event.timestamp,
    broker: event.broker,
    ...(payload ? { payload } : {}),
  };
}

function sanitizeAuditPayload(value: unknown): Record<string, unknown> | undefined {
  if (!isRecord(value)) return undefined;
  const out: Record<string, unknown> = {};

  for (const [key, nested] of Object.entries(value)) {
    switch (key) {
      case "symbol":
        if (typeof nested === "string") out.symbol = nested;
        else if (isRecord(nested)) out.symbol = sanitizeSymbolLike(nested);
        break;
      case "market":
      case "broker":
      case "environment":
      case "operation":
      case "status":
      case "errorCode":
      case "errorMessage":
      case "timestamp":
        if (typeof nested === "string") out[key] = nested;
        break;
      case "approved":
        if (typeof nested === "boolean") out.approved = nested;
        break;
      case "reasons":
        if (Array.isArray(nested)) {
          out.reasons = nested.filter((item): item is string => typeof item === "string");
        }
        break;
    }
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

function sanitizeSymbol(symbol: TradingPaperState["positions"][number]["symbol"]) {
  return {
    symbol: symbol.symbol,
    market: symbol.market,
    brokerSymbol: symbol.brokerSymbol,
    currency: symbol.currency,
  };
}

function sanitizeSymbolLike(value: Record<string, unknown>) {
  return {
    symbol: typeof value.symbol === "string" ? value.symbol : undefined,
    market: typeof value.market === "string" ? value.market : undefined,
    brokerSymbol: typeof value.brokerSymbol === "string" ? value.brokerSymbol : undefined,
    currency: typeof value.currency === "string" ? value.currency : undefined,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMissingFile(error: unknown): boolean {
  return isRecord(error) && error.code === "ENOENT";
}

function assertSafeCheckpointName(name: string): void {
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    throw new CoreError("VALIDATION_FAILED", "Checkpoint name contains unsafe characters.", {
      name,
    });
  }
}

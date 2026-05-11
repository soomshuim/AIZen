import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const DLQ_BASE = path.join(os.homedir(), ".openclaw/workspace/dead-letter");

export interface RetryOptions {
  maxAttempts?: number;
  backoffMs?: number;
  dlq?: DeadLetter;
}

export class SkillError extends Error {
  constructor(
    message: string,
    public readonly skillName: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "SkillError";
  }
}

export type CoreErrorCode =
  | "BROKER_AUTH_FAILED"
  | "BROKER_RATE_LIMITED"
  | "BROKER_ORDER_REJECTED"
  | "BROKER_NOT_SUPPORTED"
  | "BROKER_UNAVAILABLE"
  | "RISK_BUDGET_EXCEEDED"
  | "SECRET_MISSING"
  | "LIVE_TRADING_APPROVAL_REQUIRED"
  | "VALIDATION_FAILED"
  | "UNKNOWN";

export class CoreError extends Error {
  constructor(
    public readonly code: CoreErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "CoreError";
  }
}

export function mapHttpStatusToCoreError(
  status: number,
  message: string,
  details?: Record<string, unknown>,
): CoreError {
  if (status === 401 || status === 403) {
    return new CoreError("BROKER_AUTH_FAILED", message, details);
  }
  if (status === 429) {
    return new CoreError("BROKER_RATE_LIMITED", message, details);
  }
  if (status >= 500) {
    return new CoreError("BROKER_UNAVAILABLE", message, details);
  }
  if (status >= 400) {
    return new CoreError("BROKER_ORDER_REJECTED", message, details);
  }
  return new CoreError("UNKNOWN", message, details);
}

export function ensurePaperOrSandbox(
  environment: string,
  brokerName: string,
): void {
  if (environment === "live") {
    throw new CoreError(
      "LIVE_TRADING_APPROVAL_REQUIRED",
      `${brokerName} live trading requires separate explicit user approval.`,
      { brokerName, environment },
    );
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const backoffMs = opts.backoffMs ?? 1000;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        const delay = backoffMs * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  if (opts.dlq) {
    await opts.dlq.write({
      attempts: maxAttempts,
      error: stringifyError(lastError),
      timestamp: new Date().toISOString(),
    });
  }
  throw lastError;
}

export interface DeadLetter {
  write(record: Record<string, unknown>): Promise<void>;
}

export function dlq(skillName: string): DeadLetter {
  const dir = path.join(DLQ_BASE, skillName);
  return {
    async write(record) {
      await fs.mkdir(dir, { recursive: true });
      const file = path.join(dir, `${Date.now()}.json`);
      await fs.writeFile(file, JSON.stringify(record, null, 2));
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function stringifyError(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}\n${err.stack ?? ""}`;
  return String(err);
}

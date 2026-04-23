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

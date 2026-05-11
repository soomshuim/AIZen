import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";

const execFileAsync = promisify(execFile);
const USER = os.userInfo().username;

export class KeychainError extends Error {
  constructor(
    message: string,
    public readonly key: string,
  ) {
    super(message);
    this.name = "KeychainError";
  }
}

export async function readSecret(key: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("security", [
      "find-generic-password",
      "-a",
      USER,
      "-s",
      key,
      "-w",
    ]);
    return stdout.trim();
  } catch {
    throw new KeychainError(
      `Secret "${key}" not found in Keychain. Run: security add-generic-password -a "$USER" -s "${key}" -w "<value>"`,
      key,
    );
  }
}

export async function writeSecret(key: string, value: string): Promise<void> {
  await execFileAsync("security", [
    "add-generic-password",
    "-a",
    USER,
    "-s",
    key,
    "-w",
    value,
    "-U",
  ]);
}

export async function hasSecret(key: string): Promise<boolean> {
  try {
    await execFileAsync("security", [
      "find-generic-password",
      "-a",
      USER,
      "-s",
      key,
    ]);
    return true;
  } catch {
    return false;
  }
}

export const SECRETS = {
  ANTHROPIC_API_KEY: "ANTHROPIC_API_KEY",
  OPENAI_API_KEY: "OPENAI_API_KEY",
  TELEGRAM_BOT_TOKEN: "TELEGRAM_BOT_TOKEN",
  GITHUB_TOKEN: "GITHUB_TOKEN",
  PUBLIC_DATA_API_KEY: "PUBLIC_DATA_API_KEY",
  ALPACA_PAPER_API_KEY: "ALPACA_PAPER_API_KEY",
  ALPACA_PAPER_API_SECRET: "ALPACA_PAPER_API_SECRET",
  KIS_APP_KEY: "KIS_APP_KEY",
  KIS_APP_SECRET: "KIS_APP_SECRET",
  KIS_ACCOUNT_ID: "KIS_ACCOUNT_ID",
} as const;

export type SecretKey = keyof typeof SECRETS;

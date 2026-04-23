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

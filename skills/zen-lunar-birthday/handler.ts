import { Lunar } from "lunar-javascript";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";

import { withRetry, dlq } from "../../core/error/index.ts";
import type { SkillContext, SkillResult } from "../../core/types.ts";

const PROFILES_PATH = path.join(
  os.homedir(),
  "Project/AIZen/data/profiles/family.json",
);

const ALERT_DAYS = [14, 7, 3, 1];

interface Person {
  id: string;
  name: string;
  relationship: string;
  lunar_birthday: string;
  preferences?: string[];
  allergies?: string[];
  budget?: [number, number];
}

interface ProfilesFile {
  people: Person[];
}

interface BirthdayMatch {
  person: Person;
  daysUntil: number;
  lunarDate: { month: number; day: number };
  solarDate: string;
}

export default async function handler(
  ctx: SkillContext,
): Promise<SkillResult<BirthdayMatch[]>> {
  return withRetry(
    async () => {
      const profiles = await loadProfiles();
      const today = todayInKR();
      const matches = profiles.people
        .map((p) => evaluatePerson(p, today))
        .filter((m): m is BirthdayMatch => m !== null);

      ctx.logger.info(`Birthday check: ${matches.length} matches today`, {
        date: today.toISOString().slice(0, 10),
      });

      for (const match of matches) {
        await notify(ctx, match);
      }

      return { ok: true, data: matches };
    },
    { maxAttempts: 3, dlq: dlq("zen-lunar-birthday") },
  );
}

async function loadProfiles(): Promise<ProfilesFile> {
  try {
    const raw = await fs.readFile(PROFILES_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { people: [] };
  }
}

function todayInKR(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function evaluatePerson(p: Person, today: Date): BirthdayMatch | null {
  const [lm, ld] = p.lunar_birthday.split("/").map(Number);
  if (!lm || !ld) return null;

  const year = today.getFullYear();
  for (const tryYear of [year, year + 1]) {
    const lunar = Lunar.fromYmd(tryYear, lm, ld);
    const solar = lunar.getSolar();
    const solarDate = new Date(
      solar.getYear(),
      solar.getMonth() - 1,
      solar.getDay(),
    );
    const diff = Math.round(
      (solarDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diff < 0) continue;
    if (ALERT_DAYS.includes(diff)) {
      return {
        person: p,
        daysUntil: diff,
        lunarDate: { month: lm, day: ld },
        solarDate: solar.toYmd(),
      };
    }
    return null;
  }
  return null;
}

async function notify(ctx: SkillContext, match: BirthdayMatch): Promise<void> {
  const { person, daysUntil, solarDate } = match;
  const message =
    `🎂 ${person.name}(${person.relationship}) 음력 생일 D-${daysUntil}일 (양력 ${solarDate})\n` +
    `취향: ${person.preferences?.join(", ") ?? "—"}\n` +
    `예산: ${
      person.budget
        ? `${person.budget[0].toLocaleString()}~${person.budget[1].toLocaleString()}원`
        : "—"
    }\n` +
    `\n선물 추천 받으시려면 "추천" 답해주세요.`;

  if (ctx.input.trigger === "test") {
    console.log("[TEST] Would send:", message);
  } else {
    await ctx.channel.send({ to: ctx.user, message });
  }
}

if (process.argv.includes("--test")) {
  const today = todayInKR();
  console.log(
    `[ZEN-LUNAR-BIRTHDAY] Test run @ ${today.toISOString().slice(0, 10)}`,
  );

  const profiles = await loadProfiles();
  console.log(
    `Loaded ${profiles.people.length} profile(s) from ${PROFILES_PATH}`,
  );

  if (profiles.people.length === 0) {
    console.log(`
No profiles yet. Create ${PROFILES_PATH} with shape:
{
  "people": [
    {
      "id": "father",
      "name": "아빠",
      "relationship": "father",
      "lunar_birthday": "8/15",
      "preferences": ["등산", "건강식"],
      "allergies": [],
      "budget": [50000, 150000]
    }
  ]
}`);
    process.exit(0);
  }

  for (const p of profiles.people) {
    const match = evaluatePerson(p, today);
    if (match) {
      console.log(
        `✅ MATCH: ${p.name} D-${match.daysUntil} (양력 ${match.solarDate})`,
      );
    } else {
      const [lm, ld] = p.lunar_birthday.split("/").map(Number);
      const lunar = Lunar.fromYmd(today.getFullYear(), lm, ld);
      const solar = lunar.getSolar();
      const solarDate = new Date(
        solar.getYear(),
        solar.getMonth() - 1,
        solar.getDay(),
      );
      const diff = Math.round(
        (solarDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      console.log(
        `  ${p.name}: 음력 ${p.lunar_birthday} → 양력 ${solar.toYmd()} (${
          diff > 0 ? `D-${diff}` : `${-diff}일 지남`
        })`,
      );
    }
  }
}

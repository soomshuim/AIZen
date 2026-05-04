import { hasSecret, SECRETS } from "./keychain.ts";

const REQUIRED_KEYS = [
  SECRETS.ANTHROPIC_API_KEY,
  SECRETS.TELEGRAM_BOT_TOKEN,
] as const;

const OPTIONAL_KEYS = [
  SECRETS.OPENAI_API_KEY,
  SECRETS.GITHUB_TOKEN,
  SECRETS.PUBLIC_DATA_API_KEY,
] as const;

async function main(): Promise<void> {
  const required = await checkKeys(REQUIRED_KEYS);
  const optional = await checkKeys(OPTIONAL_KEYS);

  console.log("AIZen Keychain secrets");
  printGroup("Required", required);
  printGroup("Optional", optional);

  const missingRequired = required.filter((item) => !item.present);
  if (missingRequired.length > 0) {
    console.log(
      `\nMissing required: ${missingRequired.map((item) => item.key).join(", ")}`,
    );
    process.exitCode = 1;
  }
}

async function checkKeys(keys: readonly string[]) {
  return Promise.all(
    keys.map(async (key) => ({
      key,
      present: await hasSecret(key),
    })),
  );
}

function printGroup(
  label: string,
  items: Array<{ key: string; present: boolean }>,
): void {
  console.log(`\n${label}`);
  for (const item of items) {
    console.log(`- ${item.key}: ${item.present ? "present" : "missing"}`);
  }
}

await main();

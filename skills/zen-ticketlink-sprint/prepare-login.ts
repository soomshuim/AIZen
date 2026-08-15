// prepare-login — 티켓링크 로그인 프로필 준비 (세미-오토 예매의 선행 단계)
//
// WHAT: 전용 크롬 프로필(persistent profile)로 실제 Chrome 창을 띄운다. 젠이 그
//   창에서 티켓링크에 한 번 로그인해 두면, 쿠키·세션이 프로필 폴더에 저장되어
//   이후 정찰·본예매 도구가 같은 로그인 상태를 그대로 재사용한다.
// WHY: 티켓링크 스포츠는 로그인 없이는 예매 상세로 진입 자체가 안 된다(젠 확인).
//   그래서 "로그인된 브라우저 상태"가 모든 자동화의 전제다.
// BOUNDARY: 이 스크립트는 브라우저를 열어줄 뿐, 예매/클릭/결제를 자동으로 하지
//   않는다. 로그인은 사람이 직접 한다.
//
// 실행: pnpm --silent tsx skills/zen-ticketlink-sprint/prepare-login.ts
//   (env override) CHROME_PATH=... TICKETLINK_PROFILE_DIR=...

import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const CHROME_PATH =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// 프로필은 .aizen-cache/ 아래 — .gitignore 대상이라 로그인 세션이 커밋되지 않는다.
const PROFILE_DIR = resolve(
  process.env.TICKETLINK_PROFILE_DIR ??
    resolve(process.cwd(), ".aizen-cache/ticketlink/profile"),
);

const LOGIN_URL = "https://www.ticketlink.co.kr/member/login";

async function main() {
  mkdirSync(PROFILE_DIR, { recursive: true });

  console.log("┌─ 티켓링크 로그인 프로필 준비");
  console.log(`│  프로필 폴더: ${PROFILE_DIR}`);
  console.log(`│  Chrome:      ${CHROME_PATH}`);
  console.log("│");
  console.log("│  1) 열린 크롬 창에서 티켓링크에 로그인하세요.");
  console.log("│  2) '로그인 상태 유지'가 있으면 체크하세요.");
  console.log("│  3) 로그인이 끝나면 그냥 창을 닫으면 됩니다 (세션이 저장됩니다).");
  console.log("└─ 창을 닫을 때까지 대기합니다…");

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    executablePath: CHROME_PATH,
    headless: false,
    viewport: null, // 실제 창 크기를 그대로 사용
    args: ["--start-maximized"],
  });

  // 창을 닫으면 컨텍스트가 종료되고 프로세스도 끝난다.
  context.on("close", () => {
    console.log("✅ 창이 닫혔습니다. 로그인 세션이 프로필에 저장되었습니다.");
    process.exit(0);
  });

  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" }).catch(() => {
    console.log("⚠️ 로그인 페이지 자동 이동 실패 — 주소창에 직접 ticketlink.co.kr 입력 후 로그인하세요.");
  });
}

main().catch((err) => {
  console.error("prepare-login 실패:", err?.message ?? err);
  process.exit(1);
});

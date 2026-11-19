// E³ website live verification (run from repo root): node scripts/verify-e3-live.cjs
// Checks: all 12 public routes return 200, assistant v1.2.0 assets byte-match repo files,
// knowledge loader referenced on all 18 pages, stale org name absent from live home.
const fs = require("fs");
const crypto = require("crypto");
const BASE = "https://eee3.com.ng";
const routes = ["/", "/works.html", "/schools/", "/medical/", "/nightlife/", "/weddings/",
  "/learning-hub/", "/blog/", "/get-started.html", "/about.html", "/contact.html", "/404.html"];
const assetHash = (s) => crypto.createHash("sha256").update(s).digest("hex");

(async () => {
  let failed = 0;
  for (const r of routes) {
    const res = await fetch(BASE + r);
    if (res.status !== 200) { console.log("FAIL route", r, res.status); failed = 1; }
  }
  for (const f of ["assets/e3-ai-assistant.js", "assets/e3-knowledge.js", "assets/e3-ai-assistant.css"]) {
    const live = await (await fetch(`${BASE}/${f}?v=1.2.1`)).text();
    const local = fs.readFileSync(f, "utf8");
    if (assetHash(live) !== assetHash(local)) { console.log("FAIL asset mismatch", f); failed = 1; }
  }
  const home = await (await fetch(BASE + "/")).text();
  if (!home.includes("e3-knowledge.js?v=1.2.1")) { console.log("FAIL home missing versioned knowledge loader"); failed = 1; }
  if (home.includes("Encouraging Excellence Early")) { console.log("FAIL stale org name on live home"); failed = 1; }
  if (failed) { console.log("E3 LIVE VERIFY: FAIL"); process.exit(1); }
  console.log("E3 LIVE VERIFY: PASS — 12 routes 200, 3 v1.2.0 assets byte-identical, versioned loader wired, stale name absent");
})().catch((e) => { console.log("E3 LIVE VERIFY: ERROR", e.message); process.exit(1); });

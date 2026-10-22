/* Live-verify nightlife round 2: SVG art, live search + connected map copy,
 * pricing removed, Abuja Events link connected. Uses https module +
 * process.exitCode (no fetch, no process.exit). Run via certify.js. */
const https = require("https");

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (d) => (body += d));
      res.on("end", () => resolve({ status: res.statusCode, body }));
    }).on("error", reject);
  });
}

const SITE = "https://e3-website-hemabryt.vercel.app";
const APP = "https://abuja-events.vercel.app/";

const checks = [
  {
    url: SITE + "/nightlife/",
    name: "nightlife index",
    expect: [
      ["hero lead mentions search + map", "search what is on, book your place safely"],
      ["primary CTA to app", 'href="https://abuja-events.vercel.app/"'],
      ["CTA label", "Open Abuja Events"],
      ["quick chip: live search", "Live search"],
      ["quick chip: connected map", "Every event page pins the venue"],
      ["quick chips have svg icons", 'class="quick-ico"'],
      ["offer features have svg icons", 'class="feature-ico"'],
      ["why h2 sells the app", "where the night is found, understood and booked"],
      ["why intro: what + how", "It puts the city\u2019s events in one catalog: search it by title, venue, tags or organiser"],
      ["why: guaranteed ticket", "book a ticket the platform guarantees"],
      ["builder section", 'id="builder"'],
      ["builder h2", "How E³ builds this—and much more."],
      ["builder: problem-first card", "Start from the problem"],
      ["builder: much-more card + works link", '<a href="../works.html">Works page</a>'],
      ["nav builder link", '<a href="#builder">The builder</a>'],
      ["feature: search & discovery", "Search &amp; discovery"],
      ["feature 03 map", "a connected map that pins the venue"],
      ["platform row discover", "Live search across titles, venues, tags and organisers"],
      ["platform row front door", "pin the venue on a connected map"],
      ["stage chip", ">Live search<"],
      ["CTA card retitled (no pricing)", "What’s included &amp; answers"],
      ["LIVE PLATFORM badge", "LIVE PLATFORM"],
      ["honest preview caption", "An illustrative preview, not a screenshot"],
    ],
    reject: [
      ["old pricing CTA gone", "What’s included &amp; pricing"],
      ["stale chip gone", "Built to stay alive"],
["misspelling gone", "Abuba Events"],
      ["Near Me claim removed (not live in prod)", "Near Me"],
      ["school/pharmacy callback removed", "marketed like a school"],
      ["old why kicker removed", "The real environment"],
    ],
  },
  {
    url: SITE + "/nightlife/about.html",
    name: "nightlife about",
    expect: [
      ["retitled without pricing", "What’s included &amp; answers"],
      ["hero h1", "Abuja’s night. One place to find it."],
      ["hero app link", '<a class="btn btn-ghost" href="https://abuja-events.vercel.app/" target="_blank" rel="noopener noreferrer">Open Abuja Events'],
      ["svg hero art", 'viewBox="0 0 320 330"'],
      ["svg map art", 'viewBox="0 0 340 330"'],
      ["nf-art panels", 'class="reveal nf-art"'],
      ["feature icons", 'class="feature-ico"'],
      ["horizontal flow", 'class="nf-flow-h"'],
      ["search copy", "with date and area filters"],
      ["map copy", "a connected map on every event page pins the venue"],
      ["benefits: venues card mentions map pin", "a search result, a map pin and a booking engine"],
      ["final CTA to app", '<a class="btn btn-dark" href="https://abuja-events.vercel.app/" target="_blank" rel="noopener noreferrer">Open Abuja Events'],
      ["correct brand name", "Abuja Events"],
    ],
    reject: [
      ["pricing section removed", 'id="pricing"'],
      ["jump-to-pricing CTA removed", "Jump to pricing"],
      ["pricing FAQ removed", "How much does the partnership cost?"],
      ["Near Me claim removed (not live in prod)", "Near Me"],
      ["misspelling gone", "Abuba"],
    ],
  },
  {
    url: SITE + "/",
    name: "hub index",
    expect: [
      ["door card copy (search)", "Live event discovery, search and safe ticketing for venues, events and nightlife brands"],
      ["door card LIVE PLATFORM", '<span class="live-tag live-purple">LIVE PLATFORM</span>'],
    ],
    reject: [
      ["old card copy gone", "find what is on and book the place."],
    ],
  },
  {
    url: SITE + "/assets/style.css",
    name: "shared css",
    expect: [
      ["nf-art styles", ".nf-art"],
      ["nf-caption styles", ".nf-caption"],
      ["feature-ico styles", ".feature-ico"],
      ["nf-flow-h styles", ".nf-flow-h"],
    ],
  },
  {
    url: APP,
    name: "Abuja Events app link",
    expect: [
      ["app hero", "Discover & Book Events in Abuja"],
    ],
  },
];

(async () => {
  let failed = 0, passed = 0;
  for (const c of checks) {
    let res;
    try {
      res = await get(c.url);
    } catch (e) {
      failed++;
      console.log(`FAIL  ${c.name}: request error — ${e.message}`);
      continue;
    }
    if (res.status !== 200) {
      failed++;
      console.log(`FAIL  ${c.name}: HTTP ${res.status}`);
      continue;
    }
    for (const [label, needle] of c.expect) {
      if (res.body.includes(needle)) { passed++; console.log(`PASS  ${c.name} · ${label}`); }
      else { failed++; console.log(`FAIL  ${c.name} · ${label} — missing: ${needle}`); }
    }
    for (const [label, needle] of c.reject || []) {
      if (!res.body.includes(needle)) { passed++; console.log(`PASS  ${c.name} · ${label}`); }
      else { failed++; console.log(`FAIL  ${c.name} · ${label} — stale content still present: ${needle}`); }
    }
  }
  console.log(`\n${passed} passed, ${failed} failed.`);
  process.exitCode = failed === 0 ? 0 : 1;
})();

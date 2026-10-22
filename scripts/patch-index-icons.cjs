/* One-off: add SVG design icons to the nightlife index (quick chips + offer features). */
const fs = require("fs");

const file = "nightlife/index.html";
let s = fs.readFileSync(file, "utf8");

const icons = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m16.5 16.5 4 4"/></svg>',
  filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16l-6 8v5l-4 2v-7z"/></svg>',
  ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2 2 2 0 0 1 0 6 2 2 0 0 0-2 2H5a2 2 0 0 0-2-2 2 2 0 0 1 0-6z"/><path d="M13 7v2m0 4v2m0 4v2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/><path d="m12 13 1.2 2.4 2.6.4-1.9 1.9.5 2.6-2.4-1.2-2.4 1.2.5-2.6-1.9-1.9 2.6-.4z"/></svg>',
  door: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v15"/><path d="M3 21h18"/><path d="M14 12v1"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5L11 7"/><path d="M13.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5L13 17"/></svg>',
};

function once(oldStr, newStr, label) {
  const n = s.split(oldStr).length - 1;
  if (n !== 1) {
    console.error(`${label}: expected 1 occurrence, found ${n}`);
    process.exitCode = 1;
    return;
  }
  s = s.replace(oldStr, newStr);
  console.log(`${label} ok`);
}

/* quick chips: icon above each label */
once('<div class="quick reveal"><b>Live search</b>',
  `<div class="quick reveal"><span class="quick-ico">${icons.search}</span><b>Live search</b>`, "chip: live search");
once('<div class="quick reveal"><b>Safe ticketing</b>',
  `<div class="quick reveal"><span class="quick-ico">${icons.ticket}</span><b>Safe ticketing</b>`, "chip: safe ticketing");
once('<div class="quick reveal"><b>Connected map</b>',
  `<div class="quick reveal"><span class="quick-ico">${icons.pin}</span><b>Connected map</b>`, "chip: connected map");
once('<div class="quick reveal"><b>Organiser’s front door</b>',
  `<div class="quick reveal"><span class="quick-ico">${icons.calendar}</span><b>Organiser’s front door</b>`, "chip: front door");

/* offer feature cards: icon above each h3 */
once('<span class="feature-number">01</span><h3>Search &amp; discovery</h3>',
  `<span class="feature-number">01</span><span class="feature-ico">${icons.filter}</span><h3>Search &amp; discovery</h3>`, "feature 01");
once('<span class="feature-number">02</span><h3>Safe ticketing</h3>',
  `<span class="feature-number">02</span><span class="feature-ico">${icons.ticket}</span><h3>Safe ticketing</h3>`, "feature 02");
once('<span class="feature-number">03</span><h3>The organiser’s front door</h3>',
  `<span class="feature-number">03</span><span class="feature-ico">${icons.door}</span><h3>The organiser’s front door</h3>`, "feature 03");
once('<span class="feature-number">04</span><h3>Connection that lasts</h3>',
  `<span class="feature-number">04</span><span class="feature-ico">${icons.link}</span><h3>Connection that lasts</h3>`, "feature 04");

fs.writeFileSync(file, s);
console.log(file + " written");

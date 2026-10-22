/* One-off: narrow the Near Me claims out of the nightlife copy
 * (web discovery is built but not deployed to production yet). */
const fs = require("fs");

function patch(file, pairs) {
  let s = fs.readFileSync(file, "utf8");
  for (const [old, newStr] of pairs) {
    const n = s.split(old).length - 1;
    if (n !== 1) {
      console.error(`expected 1 occurrence, found ${n}: ${old.slice(0, 70)}`);
      process.exitCode = 1;
      return;
    }
    s = s.replace(old, newStr);
  }
  fs.writeFileSync(file, s);
  console.log(`${file}: ${pairs.length} replacements ok`);
}

patch("nightlife/index.html", [
  [
    "search what is on—or find it near you—book your place safely, and get there with the map on every event page.",
    "search what is on, book your place safely, and get there with the map on every event page.",
  ],
  [
    "search the night, find it near you, book your place safely",
    "search the night, book your place safely",
  ],
  [
    "search what is on—or find it near you—book your place safely, and give every event a front door with the map already pinned.",
    "search what is on, book your place safely, and give every event a front door with the map already pinned.",
  ],
  [
    "<b>Live search &amp; Near Me</b><span>Search by title, venue, tags or organiser—or find the events happening around you.</span>",
    "<b>Live search</b><span>Search by title, venue, tags or organiser, with date and area filters.</span>",
  ],
  [
    "Live search across the catalog plus Near Me—see the live events in Abuja, when they start and where they happen.",
    "Live search across the catalog, with date and area filters—see the live events in Abuja: when they start and where they happen.",
  ],
  [
    "Live search across titles, venues, tags and organisers—and Near Me finds events around you.",
    "Live search across titles, venues, tags and organisers, with date and area filters.",
  ],
]);

patch("nightlife/about.html", [
  [
    "Live search across titles, venues, tags and organisers, with date and area filters—Near Me finds the events happening around you.",
    "Live search across titles, venues, tags and organisers, with date and area filters.",
  ],
]);

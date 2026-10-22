/* Round 3: kill the school/pharmacy callback in #why, sell the app instead,
 * and add the "How E3 builds this—and much more" section. */
const fs = require("fs");

const file = "nightlife/index.html";
let s = fs.readFileSync(file, "utf8");

function once(anchor, replacement, label) {
  const i = s.indexOf(anchor);
  if (i === -1) {
    console.error(`not found: ${label}`);
    process.exitCode = 1;
    return false;
  }
  s = s.slice(0, i) + replacement + s.slice(i + anchor.length);
  console.log(`${label} ok`);
  return true;
}

/* 1) The #why section: replace from its opening tag through its closing </section> */
{
  const start = s.indexOf('<section class="section" id="why">');
  const end = s.indexOf("</section>", start) + "</section>".length;
  if (start === -1 || end === -1 || end < start) {
    console.error("why section bounds not found");
    process.exitCode = 1;
  } else {
    const checkSvg = '<span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg></span>';
    const why =
      '<section class="section" id="why"><div class="container"><div class="section-intro reveal"><div>' +
      '<span class="section-kicker">Why it matters</span>' +
      "<h2>Abuja Events—where the night is found, understood and booked.</h2></div>" +
      "<p>Abuja Events is E³\u2019s live event discovery and ticketing platform for Abuja. It puts the city\u2019s events in one catalog: search it by title, venue, tags or organiser, filter by date or area, open the event page with the details, the mood and a connected map, then book a ticket the platform guarantees. No asking around, no oversold night, no guessing how to get there.</p></div>" +
      '<div class="audience-grid">' +
      `<article class="audience-card reveal">${checkSvg}<h3>Guests</h3><p>Find what is on in one place, book a guaranteed ticket in a few taps and get there with the map already pinned.</p></article>` +
      `<article class="audience-card reveal">${checkSvg}<h3>Venues</h3><p>Your events become searchable, bookable events with personality—instead of social posts nobody can book from.</p></article>` +
      `<article class="audience-card reveal">${checkSvg}<h3>Event organisers</h3><p>List the event, set the ticket plans and pin the venue. The platform powers the sales buttons and guarantees the tickets.</p></article>` +
      `<article class="audience-card reveal">${checkSvg}<h3>Communities</h3><p>The catalog keeps the scene current: this week\u2019s events replace last week\u2019s, and discovery stays alive.</p></article>` +
      "</div></div></section>";
    s = s.slice(0, start) + why + s.slice(end);
    console.log("why section replaced ok");
  }
}

/* 2) Insert the #builder section right before the #start CTA section */
once(
  '<section class="cta-section" id="start">',
  (function () {
    const card = (num, h, p) =>
      `<article class="feature-card reveal"><span class="feature-number">${num}</span><h3>${h}</h3><p>${p}</p></article>`;
    return (
      '<section class="section alt-section" id="builder"><div class="container">' +
      '<div class="section-intro reveal"><div><span class="section-kicker">The builder behind the app</span>' +
      "<h2>How E³ builds this—and much more.</h2></div>" +
      "<p>Abuja Events did not appear from nowhere. It is built the way E³ builds everything: start from the problem, agree on what comes first, ship a working core, then keep it alive as the scene grows.</p></div>" +
      '<div class="feature-grid">' +
      card(
        "01",
        "Start from the problem",
        "Not a brochure of features. The build starts with how your organisation actually runs—what needs solving and what matters first—then the scope, cost and responsibilities are agreed."
      ) +
      card(
        "02",
        "Ship the working core",
        "The useful core goes live first; the next layer is added as you grow. Support, maintenance and improvement are part of the build, not an afterthought."
      ) +
      card(
        "03",
        "And much more",
        "The same approach is behind E³\u2019s other live builds—the school results portal, the AI-nurse health platform, wedding invitations and business sites. See every build on the <a href=\"../works.html\">Works page</a>."
      ) +
      "</div></div></section>" +
      '<section class="cta-section" id="start">'
    );
  })(),
  "builder section inserted"
);

/* 3) Vertical nav: add a link to the new section, after Process */
once(
  '<a href="#process">Process</a>',
  '<a href="#process">Process</a><a href="#builder">The builder</a>',
  "nav link added"
);

fs.writeFileSync(file, s);
console.log(file + " written");

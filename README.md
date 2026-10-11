# E³ Restructured — Production Static Build

## Routes
- `/` — E³ hub
- `/schools/` — school vertical + live school platform link
- `/medical/` — medical vertical + live medical platform link
- `/nightlife/` — nightlife vertical
- `/weddings/` — weddings & event vertical
- `/about.html` — E³ story and principles
- `/contact.html` — project brief → WhatsApp
- `/blog/` — E³ Insights
- `/404.html` — fallback page

## Production notes
- Static HTML/CSS/JS; no build step required.
- No stock-image dependency; the site uses CSS/SVG interface graphics so the visual system stays consistent and fast.
- WhatsApp CTAs route to E³ at `+234 704 277 6167`.
- School platform: `https://e3-school-portals.ai.studio/`
- Medical platform: `https://ai-pharmacy-nurse-service.ai.studio/`
- Nightlife has no public external platform URL in the supplied project, so the page does not invent one.
- Forms intentionally continue to WhatsApp rather than pretending a backend exists.
- Includes a branded 1200×630 social preview image at `assets/og-card.png`.

## Motion layer (assets/motion.css + assets/motion.js)
Loaded after the base stylesheet and script. Both are optional: the site is fully
readable and correct without them, and the motion is progressive enhancement.

**What animates**
- **The E³ orbital symbol** — the four rings turn on their own tilted axes, and the
  FOUND / TRUST / WORK / CONNECT labels travel along their orbits in depth. An energy
  pulse runs from the E³ core to each node in turn and lights it on arrival, so the
  "connect" idea is demonstrated rather than asserted. Each label keeps its own accent.
- **Ambient field** — a procedural particle/constellation canvas plus a fine grain
  overlay. Generated in code, so it stays crisp at any resolution and adds no image weight.
- **Page motion** — the signal strip is a true infinite marquee; section reveals are
  staggered and directional; cards get a cursor-tracked spotlight and lift; the four
  service pages animate their own mockups (school screen, medical pulse, nightlife neon,
  wedding invitation).

**Engineering guarantees**
- The orbital geometry is measured at runtime and clamped, so labels never overlap the
  core card or leave the frame, at any width from 320px up.
- `prefers-reduced-motion: reduce` turns all of it off (verified: ambient canvas is not
  even created, and every revealed element is visible).
- A `<script>` in `<head>` marks the document as scripted, which is what allows the
  entrance animations to start hidden. If the motion engine never loads, a 2.5s timer
  adds `.no-motion` and reveals everything — so no state can leave content invisible.
- Reveal state is self-healing. Alongside the IntersectionObserver there is a debounced
  safety sweep that reveals anything the reader has reached or already scrolled past, so
  fast scrolling, anchor jumps, hash changes, restored scroll positions, orientation
  changes and late webfont reflow can never leave a section stranded at opacity 0.
- Footer and sub-navigation links keep a comfortable touch height (>=30px) at every
  breakpoint, not just on phones.
- The document outline is clean: one `<h1>` per page and no skipped heading levels.
  Mockup captions inside the device illustrations are `<div class="mock-title">` rather
  than headings, so they add no false structure for screen readers.
- No horizontal overflow at any width from 320px to 1920px.

## Verified
Every page at 360 / 390 / 768 / 1280 / 1440 / 1920px (78 page-loads, each scrolled
end to end): no console errors, no broken links or images, no horizontal overflow,
no stranded sections, all four orbit labels inside the frame, and a single `<h1>`
with no heading gaps. WhatsApp wiring, the mobile menu, anchor navigation, the blog
accordion and the contact form were each exercised in a real browser, and the
reduced-motion and JavaScript-disabled paths were checked page by page.

## Deployment
Upload the contents of this folder to the web root. The relative paths are designed for plain static hosting.

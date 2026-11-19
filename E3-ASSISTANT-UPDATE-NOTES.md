# E³ website assistant — update notes

Release: 1.2.1  
Date: 19 November 2026

## What changed in 1.2.1 — mobile "Start a conversation" bar removed

The E³ guide assistant now carries the whole on-page conversation, so the mobile floating "Start a conversation" WhatsApp bar is redundant. It was removed on operator instruction; WhatsApp contact still remains in the footer on every page.

- Removed the `<div class="mobile-whatsapp">` bar from all 16 pages that carried it (2 of the 18 pages never had it).
- Stripped all `.mobile-whatsapp` rules from `assets/style.css` (base `display:none` + the ≤720px fixed-bar block) and `assets/motion.css` (z-index + press feedback).
- Removed the now-dead `body.e3-ai-chat-open` class handling from `assets/e3-ai-assistant.js` and its CSS rule (its only consumer was hiding that bar while the chat was open).
- Mobile (≤720px) assistant launcher reflowed from `bottom:calc(76px + …)` (floating above the bar) to `bottom:calc(22px + env(safe-area-inset-bottom))`, matching the desktop corner position now that the bar is gone.
- Cache-bust bumped `?v=1.2.0` → `?v=1.2.1` on the versioned assistant assets (all 18 pages, verify and live-verify scripts, README). `scripts/verify-e3-live.cjs` re-hashes live assets against the repo files after each deploy.

## Validation performed (1.2.1)

- `node --check assets/e3-ai-assistant.js`
- `node scripts/verify-e3-assistant.cjs` (18 pages, pricing, routing, knowledge sync, relative versioned paths)
- `grep -r mobile-whatsapp` — zero references left in HTML, CSS or JS
- `node scripts/verify-e3-live.cjs` after deployment (12 routes 200, 3 assistant assets byte-identical live vs repo)

## What changed in 1.2.0 — always-visible launcher fix

The 1.1.0 assistant was wired with root-absolute URLs (`/assets/...`, `/data/...`). That broke the widget in two real situations, and on those the assistant appeared completely absent ("hidden") from the page:

1. **Pages opened directly from disk** (double-clicking `index.html`, e.g. `C:/Users/.../Desktop/e3-website-main/index.html`). `"/assets/e3-ai-assistant.js"` resolved to `C:/assets/...`, which does not exist, so neither the stylesheet nor the script ever loaded and nothing appeared in the corner.
2. **The chat panel could not load its knowledge on `file://` pages** because browsers block `fetch()` of local files, so even a correctly wired widget could not open the conversation.

Fixes in this release:

- All 18 pages now reference every internal asset and page with **depth-relative paths** (`assets/…`, `../assets/…`, `../../assets/…`), including the footer/nav links that used `/get-started.html`, `/blog/`, `/#build` and similar. The whole site — not only the assistant — now works identically on the live domain, on sub-path deployments, and when opened directly from disk.
- Added `assets/e3-knowledge.js` (generated from `data/e3-knowledge.json` by `scripts/build-knowledge-js.cjs`) and loaded it as a plain `<script>` tag on every page, before the assistant script. The assistant now reads `window.E3KnowledgeData` first and only falls back to an HTTP fetch of the JSON. The full chat, page awareness and pricing answers therefore work on `file://` too.
- The assistant script now derives the site root from its own URL, so its internal links (questionnaire, Works, Contact) and the JSON fetch resolve correctly in every context instead of assuming the domain root.
- Assistant asset URLs are cache-busted (`?v=1.2.0`) so browsers fetch the new files after deployment instead of showing a stale cached widget.
- Launcher positioning: desktop stays fixed at the bottom right (22px). The mobile breakpoint moved from 600px to 720px to match the mobile WhatsApp bar in `style.css`, and the launcher now floats **above** that bar (with the safe-area inset respected) instead of colliding with it.
- Replaced the ineffective `.e3-ai-widget.is-open~.mobile-whatsapp` rule (the widget is appended last in `<body>`, so the sibling selector never matched) with a `body.e3-ai-chat-open` class toggled by the assistant on open/close.
- `assets/site.webmanifest`: corrected the organisation name to "Encourage Excellence Early" (it still said "Encouraging") and made `start_url`/`scope` relative.
- Extended `scripts/verify-e3-assistant.cjs`: it now also asserts that `assets/e3-knowledge.js` exactly matches the JSON (stale-copy guard) and that every page loads the assistant with relative, versioned paths and contains no root-absolute internal URLs.

## Validation performed (1.2.0)

- `node --check assets/e3-ai-assistant.js`
- `node scripts/verify-e3-assistant.cjs` — includes the new page/path/knowledge-sync checks (18 pages).
- Real-browser checks with a clean profile, on both `http://localhost` and `file://`:
  - Desktop 1440×900: launcher floats at the bottom right (22px from both edges), chat opens, pricing answer and action links correct; action links resolve to the right site root on `file://`.
  - Mobile 390×844: launcher floats above the "Start a conversation" WhatsApp bar with an 11px gap, no overlap.
  - `file://` homepage and `file://medical/`: knowledge loads via the script tag (37 entries), page-aware context and answers work ("Does the AI nurse diagnose?" answered correctly).

## What changed in 1.1.0

- Corrected the organisation name to **Encourage Excellence Early** throughout the supplied site.
- Set the assistant's only approved public starting prices:
  - Static websites: **from ₦150,000**.
  - Dynamic websites: **from ₦250,000**.
- Made it explicit that both website starting prices increase with features, functionality, complexity and agreed scope.
- Set all other E³ services, platforms and programmes to a requirements-led pricing discussion. Removed the old ₦100,000 Schools starting subscription from the supplied Schools details page so the visitor sees one consistent policy.
- Expanded the public knowledge library from 20 to 37 question-and-answer entries and refined the summaries for all 10 page profiles.
- Added answers for visibility/content support, tailored platforms, school add-ons and grading, student opportunity limitations, the Medical AI nurse and its safety boundaries, pharmacy orders, doctor chat, Abuja Events ticketing, weddings and Learning Hub practical projects.
- Narrowed synonym matching so unrelated ideas (for example AI and automation) are not treated as interchangeable.
- Added current-chat topic context for short follow-up questions and contextual website price questions.
- Added the assistant's discovery approach: understand the visitor's problem before asking them to choose a technology.
- Added `scripts/verify-e3-assistant.cjs` for repeatable logic checks.

## Validation performed

- `node --check assets/e3-ai-assistant.js`
- `node scripts/verify-e3-assistant.cjs`
- Parsed all 18 HTML pages.
- Validated the knowledge JSON, unique answer-entry IDs, official name, contact details and approved pricing.
- Confirmed the obsolete “Encouraging Excellence Early” name and old Schools ₦100,000 starting-price copy are absent from the supplied public site files.

## Important capability note

This is still the existing local, curated, page-aware assistant—not a live generative AI agent. It does not send visitor messages to an AI provider. This update improves its approved knowledge, matching, price handling and short follow-up context. A true generative model integration is a separate next step and should use a protected server-side endpoint; never place a private AI API key in the public website JavaScript.

## Deployment

Upload the contents of `e3-website-main/` to the website web root, replacing the corresponding files. Keep the current backup before deployment. After uploading, test the assistant on the homepage, Schools, Medical, Nightlife, Weddings and Learning Hub pages, including WhatsApp and questionnaire links.

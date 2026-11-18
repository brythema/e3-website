#!/usr/bin/env node
'use strict';
/*
 * Generates assets/e3-knowledge.js from data/e3-knowledge.json.
 *
 * data/e3-knowledge.json stays the single source of truth for the assistant's
 * knowledge library. This script turns it into a plain script file that sets
 * window.E3KnowledgeData, because a <script> tag keeps working even when the
 * pages are opened directly from disk (file://), where fetch() of a local JSON
 * file is blocked by the browser. The assistant reads window.E3KnowledgeData
 * first and only falls back to fetching the JSON over HTTP.
 *
 * Run this after every edit to data/e3-knowledge.json, and upload BOTH files:
 *   node scripts/build-knowledge-js.cjs
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const jsonPath = path.join(root, 'data', 'e3-knowledge.json');
const outPath = path.join(root, 'assets', 'e3-knowledge.js');

const library = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
if (!Array.isArray(library.entries) || !Array.isArray(library.pages)) {
  console.error('data/e3-knowledge.json does not look like a valid knowledge library (missing entries/pages).');
  process.exit(1);
}

const banner = `/* GENERATED FILE — do not edit by hand.
 * Source of truth: data/e3-knowledge.json
 * Regenerate with: node scripts/build-knowledge-js.cjs
 * Loaded as a plain script so the E³ assistant also works when the site is
 * opened directly from disk (file://), where fetch() of local files is blocked. */
window.E3KnowledgeData = `;
fs.writeFileSync(outPath, banner + JSON.stringify(library) + ';\n');
console.log(`Wrote assets/e3-knowledge.js (${library.entries.length} entries, ${library.pages.length} page profiles).`);

'use strict';

// Runs the actual assistant matching/resolution functions in Node without a browser.
// The production file is loaded in-memory with its automatic DOM startup replaced
// by a small test API export; the shipped browser source is not modified.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const jsPath = path.join(root, 'assets', 'e3-ai-assistant.js');
const knowledgePath = path.join(root, 'data', 'e3-knowledge.json');
const library = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
let source = fs.readFileSync(jsPath, 'utf8');

const startup = "  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });\n  else init();\n})();";
assert.ok(source.includes(startup), 'Could not find the assistant startup block to replace for testing.');
source = source.replace(startup, "  window.__e3AssistantTestApi = { findBestEntry, resolveAnswer };\n})();");

const sandbox = { window: { E3Knowledge: {} }, console };
vm.runInNewContext(source, sandbox, { filename: 'e3-ai-assistant.js' });
const api = sandbox.window.__e3AssistantTestApi;

const page = id => {
  const profile = library.pages.find(item => item.id === id);
  assert.ok(profile, `Missing page profile: ${id}`);
  return { id, label: profile.label, summary: profile.summary, title: profile.label, description: '', headings: [], pageText: '' };
};
const home = page('home');
const schools = page('schools');
const medical = page('medical');
const entry = id => library.entries.find(item => item.id === id);
const checkMatch = (question, currentPage, expectedId) => {
  const actual = api.findBestEntry(library, question, currentPage);
  assert.equal(actual && actual.id, expectedId, `${question} should match ${expectedId}`);
};
const checkAnswer = (question, currentPage, previousEntry, expectedText) => {
  const actual = api.resolveAnswer(library, currentPage, question, previousEntry).text;
  assert.ok(actual.toLowerCase().includes(expectedText.toLowerCase()), `${question} should include: ${expectedText}\nActual: ${actual}`);
};

assert.equal(library.meta.officialName, 'Encourage Excellence Early');
assert.equal(library.meta.pricingPolicy.website.static.startingPriceNgn, 150000);
assert.equal(library.meta.pricingPolicy.website.dynamic.startingPriceNgn, 250000);

checkAnswer('How much is a static website?', home, null, '₦150,000');
checkAnswer('How much is a dynamic website?', home, null, '₦250,000');
checkAnswer('How much does a website cost?', home, null, '₦150,000');
checkAnswer('How much does a website cost?', home, null, '₦250,000');
checkAnswer('How much is the school programme?', schools, null, 'discussed based on');
checkAnswer('and the price', home, entry('website'), '₦150,000');
checkAnswer('and the price', home, entry('visibility-content'), 'discussed based on');

checkMatch('How does the AI nurse work?', medical, 'medical-ai-nurse');
checkMatch('Does the AI nurse diagnose?', medical, 'medical-safety');
checkMatch('Does the system calculate results automatically?', schools, 'school-grading');
checkMatch('Can you help with social media content?', home, 'visibility-content');
checkMatch('I am not sure what I need', home, 'discovery-guidance');

const followUp = api.resolveAnswer(library, home, 'tell me more', entry('visibility-content')).text;
assert.ok(followUp.includes('Visibility, social media and content support'), 'Follow-up should retain the previous topic.');

const schoolDetails = fs.readFileSync(path.join(root, 'schools', 'about.html'), 'utf8');
assert.ok(!schoolDetails.includes('₦100,000'), 'School pricing page should not retain the old fixed starting price.');
assert.ok(schoolDetails.includes('School partnership pricing is discussed'), 'School pricing page should state the scope-based pricing approach.');

// The script-tag knowledge loader must exist and match the JSON exactly,
// otherwise pages opened directly from disk (file://) would show stale answers.
const knowledgeJsPath = path.join(root, 'assets', 'e3-knowledge.js');
assert.ok(fs.existsSync(knowledgeJsPath), 'assets/e3-knowledge.js is missing — run: node scripts/build-knowledge-js.cjs');
const knowledgeJs = fs.readFileSync(knowledgeJsPath, 'utf8');
const embedded = JSON.parse(knowledgeJs.replace(/^[\s\S]*?window\.E3KnowledgeData\s*=\s*/, '').replace(/;\s*$/, ''));
assert.deepStrictEqual(embedded, library, 'assets/e3-knowledge.js is stale — run: node scripts/build-knowledge-js.cjs');

// Every page must load the assistant with depth-relative paths (works on http,
// sub-path deployments and file://), and no root-absolute internal URLs may remain.
function walkHtml(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(item => {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) return walkHtml(full);
    return item.name.endsWith('.html') ? [full] : [];
  });
}
let pageChecked = 0;
for (const htmlPath of walkHtml(root)) {
  const rel = path.relative(root, htmlPath).split(path.sep).join('/');
  const depth = rel.split('/').length - 1;
  const prefix = '../'.repeat(depth);
  const html = fs.readFileSync(htmlPath, 'utf8');
  const version = 'e3-ai-assistant.css?v=1.2.0';
  assert.ok(html.includes(`href="${prefix}assets/${version}"`), `${rel}: assistant stylesheet not included with relative path`);
  assert.ok(html.includes(`src="${prefix}assets/e3-knowledge.js?v=1.2.0"`), `${rel}: knowledge loader script not included`);
  assert.ok(html.includes(`src="${prefix}assets/e3-ai-assistant.js?v=1.2.0"`), `${rel}: assistant script not included with relative path`);
  const absolute = (html.match(/(?:href|src)="\/(?!\/)[^"]*"/g) || []).filter(attr => !attr.includes('eee3.com.ng'));
  assert.equal(absolute.length, 0, `${rel}: root-absolute internal references remain: ${absolute.join(' ')}`);
  pageChecked += 1;
}

console.log(`E³ assistant verification passed: pricing, service routing, medical boundaries, school answers, discovery and follow-up context, knowledge loader sync, relative paths on ${pageChecked} pages.`);

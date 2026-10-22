// Verifies the switched medical pages are LIVE on the Vercel production URL.
const BASE = 'https://e3-website-hemabryt.vercel.app';

async function get(path) {
  const res = await fetch(BASE + path, { redirect: 'follow' });
  const body = await res.text();
  return { status: res.status, body };
}

(async () => {
  const checks = [];
  const check = (name, ok, detail) => {
    checks.push({ name, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}${detail ? ' :: ' + detail : ''}`);
  };

  const idx = await get('/medical/');
  check('GET /medical/ returns 200', idx.status === 200, 'status ' + idx.status);
  check('hero h1 live (closer connection hospital/pharmacy/patient)', idx.body.includes('A closer connection between the hospital, the pharmacy and the patient.'));
  check('hero device showcase present (HEALTH DIGITAL LAYER)', idx.body.includes('HEALTH DIGITAL LAYER'));
  check('history-first copy live ("Your record, reviewed first.")', idx.body.includes('Your record, reviewed first.'));
  check('phone mockup present (Today\u2019s doses / Amoxicillin)', idx.body.includes('Today\u2019s doses') && idx.body.includes('Amoxicillin'));
  check('second showcase present (PATIENT VIEW)', idx.body.includes('PATIENT VIEW'));
  check('portfolio section live (Not just a pharmacy app)', idx.body.includes('Not just a pharmacy app. A more useful health layer.'));
  check('old generic copy gone', !idx.body.includes('Health information should be easier to reach'));
  check('AI nurse platform link present', idx.body.includes('ai-pharmacy-nurse-service.ai.studio'));
  check('medical safety line present', idx.body.includes('not a screenshot, a prescription or medical advice'));

  const about = await get('/medical/about.html');
  check('GET /medical/about.html returns 200', about.status === 200, 'status ' + about.status);
  check('about retitled to pricing & answers', about.body.includes('pricing &amp; answers'));
  check('about hero live (One health community)', about.body.includes('One health community. More connected care.'));
  check('AI-nurse FAQ present', about.body.includes('Does the AI nurse replace doctors and nurses?'));
  check('about FAQ present (Before we begin)', about.body.includes('Before we begin.'));
  check('no invented price (no \u20A6 figure)', !/\u20A6\s?\d/.test(about.body));

  const home = await get('/');
  check('regression: GET / returns 200', home.status === 200, 'status ' + home.status);
  const schools = await get('/schools/');
  check('regression: GET /schools/ returns 200', schools.status === 200, 'status ' + schools.status);

  const failed = checks.filter(c => !c.ok);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
  if (failed.length > 0) process.exit(1);
})().catch(err => { console.error('ERROR', err.message); process.exit(1); });

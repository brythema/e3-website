// Verifies the switched schools pages are LIVE on the Vercel production URL.
// Checks: new copy present, old copy gone, device showcases intact, about page retitled.
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

  const idx = await get('/schools/');
  check('GET /schools/ returns 200', idx.status === 200, 'status ' + idx.status);
  check('hero device showcase present (SCHOOL DIGITAL LAYER 01)', idx.body.includes('SCHOOL DIGITAL LAYER'));
  check('switched hero copy live ("Progress, not surprises.")', idx.body.includes('Progress, not surprises.'));
  check('old hero copy gone ("Ready when you need it.")', !idx.body.includes('Ready when you need it.'));
  check('phone mockup content present (Term results / Mathematics)', idx.body.includes('Term results') && idx.body.includes('Mathematics'));
  check('second device showcase present (ACADEMIC OVERVIEW 02)', idx.body.includes('ACADEMIC OVERVIEW'));
  check('process section present (From first conversation)', idx.body.includes('From first conversation'));

  const about = await get('/schools/about.html');
  check('GET /schools/about.html returns 200', about.status === 200, 'status ' + about.status);
  check('about retitled to pricing & answers', about.body.includes('pricing &amp; answers'));
  check('about pricing section present (Start with what your school needs)', about.body.includes('Start with what your school needs'));
  check('about FAQ present (Before we begin)', about.body.includes('Before we begin'));

  const home = await get('/');
  check('regression: GET / returns 200', home.status === 200, 'status ' + home.status);

  const failed = checks.filter(c => !c.ok);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
  if (failed.length > 0) process.exit(1);
})().catch(err => { console.error('ERROR', err.message); process.exit(1); });

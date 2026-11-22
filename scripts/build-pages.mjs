// Builds one real HTML file per public page so GitHub Pages answers 200 (not 404)
// and every page carries its own title, description and sharing preview.
//   node scripts/build-pages.mjs
// Run after any change to index.html (for example an asset version bump) and
// whenever exams, tests or subjects are added. It also writes sitemap.xml and robots.txt.
// GitHub Pages serves /t/emt-u3 from t/emt-u3.html without a redirect.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://test.vkvsir.com';
const SB = 'https://thrpqwnjwewhdhimmgpu.supabase.co/rest/v1/rpc/';
const KEY = 'sb_publishable_EgH3u5RbDFJPMH7svguFaQ_zuGZ2zVJ'; // public key, same as app.js
const BRAND = 'VKV Sir Test Lab';

async function rpc(fn) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(SB + fn, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: '{}' });
    if (r.ok) return r.json();
    await new Promise((z) => setTimeout(z, 1500));
  }
  throw new Error('rpc failed: ' + fn);
}
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s\S*$/, '') + '…' : s; };
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

const base = readFileSync(join(ROOT, 'index.html'), 'utf8');
function page(path, title, desc) {
  const full = title === BRAND ? BRAND : `${title} · ${BRAND}`;
  const url = SITE + path;
  let h = base
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(full)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(full)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(desc)}">`);
  h = h.replace(/<link rel="canonical"[^>]*>\s*/, '').replace('</title>', `</title>\n<link rel="canonical" href="${url}">`);
  if (/og:url/.test(h)) h = h.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  else h = h.replace('<meta property="og:title"', `<meta property="og:url" content="${url}">\n<meta property="og:title"`);
  const file = join(ROOT, path.slice(1) + '.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, h);
  return path;
}

const [exams, tests, cat] = await Promise.all([rpc('exam_list'), rpc('list_tests'), rpc('catalog')]);
for (const d of ['e', 't', 'p']) if (existsSync(join(ROOT, d))) rmSync(join(ROOT, d), { recursive: true });

const total = cat.reduce((a, s) => a + (s.count || 0), 0);
const urls = ['/'];
const fixed = [
  ['/exams', 'Exams and syllabus', `Browse ${exams.length} exams and university syllabi by branch: GATE, ESE, PSU, SSC, RTO/MVI and B.Tech subjects, with topic-wise practice.`],
  ['/practice', 'Practice', `Practise ${fmt(total)} questions subject by subject, grouped by branch: answers and explanations after every question.`],
  ['/test', 'Take a test', 'Timed tests and mock papers for GATE, SSC, placements and university exams, with scores, explanations and a leaderboard.'],
  ['/career', 'Job Prep', 'A company-wise plan for your target job: key subjects, software to learn, likely interview questions and one-tap practice.'],
  ['/resume', 'Resume builder', 'Build an ATS-friendly resume with keywords from real job posts. Free PDF and Word downloads.'],
  ['/drill', 'Aptitude speed drill', 'Unlimited aptitude practice with fresh numbers every time: percentages, ratios, time and work, interest and more.'],
  ['/why', 'Why VKV Sir Test Lab', 'How the Test Lab builds fair papers, explains every answer and tracks your weak topics.'],
  ['/disclaimer', 'Disclaimer and terms', 'Terms of use and how answers are reviewed on VKV Sir Test Lab.'],
  ['/login', 'Sign in', 'Sign in with Google or an email code to save your tests, scores and resumes.'],
];
for (const [p, t, d] of fixed) urls.push(page(p, t, d));

for (const e of exams) {
  const d = clip(`${e.title}: ${e.description || ''} ${fmt(e.questions)} practice questions mapped to the syllabus, section by section.`, 160);
  urls.push(page('/e/' + e.id, e.title, d));
}
for (const t of tests) {
  const d = clip(`${t.title}. ${t.description || ''} Timed test with instant results and explanations. Free.`, 160);
  urls.push(page('/t/' + t.slug, t.title, d));
}
for (const s of cat) {
  if ((s.count || 0) < 18) continue;
  urls.push(page('/p/' + s.id.toLowerCase(), s.name, clip(`Practise ${s.name} unit by unit: ${fmt(s.count)} questions with answers and explanations, plus timed tests.`, 160)));
}

const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(ROOT, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((u) => `<url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') + '\n</urlset>\n');
writeFileSync(join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /exam/\nDisallow: /result/\nDisallow: /practice/\nDisallow: /g/\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`pages: ${urls.length - 1}, questions in catalog: ${fmt(total)}`);

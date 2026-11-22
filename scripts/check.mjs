// Pre-publish checks. Run before every push:   node scripts/check.mjs
// Add --live after a push to also check the published site:   node scripts/check.mjs --live
// Exits with code 1 if anything fails, so it can be used in a git pre-push hook.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SB = 'https://thrpqwnjwewhdhimmgpu.supabase.co/rest/v1/rpc/';
const KEY = 'sb_publishable_EgH3u5RbDFJPMH7svguFaQ_zuGZ2zVJ';
const SITE = 'https://test.vkvsir.com';
let fails = 0, warns = 0;
const ok = (m) => console.log('  ok    ' + m);
const bad = (m) => { fails++; console.log('  FAIL  ' + m); };
const warn = (m) => { warns++; console.log('  warn  ' + m); };
const read = (f) => readFileSync(join(ROOT, f), 'utf8');

console.log('Code');
for (const f of ['app.js', 'resume.js', 'sw.js']) {
  try { new Function(read(f)); ok(f + ' parses'); } catch (e) { bad(f + ': ' + e.message); }
}
try { JSON.parse(read('manifest.webmanifest')); ok('manifest is valid JSON'); } catch (e) { bad('manifest: ' + e.message); }
if (existsSync(join(ROOT, '_stub.js')) && read('index.html').includes('_stub.js')) bad('index.html loads the local test kit (_stub.js)');

console.log('Pages');
const idx = read('index.html');
if (read('404.html') === idx) ok('404.html matches index.html'); else bad('404.html differs from index.html: run  cp index.html 404.html');
const vers = (h) => (h.match(/(app\.(?:js|css))\?v=(\d+)/g) || []).sort().join(' ');
const want = vers(idx);
const gen = [];
for (const d of ['', 'e', 't', 'p']) {
  const dir = join(ROOT, d); if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) if (f.endsWith('.html') && !['index.html', '404.html', '_t.html'].includes(f) && (d || !f.startsWith('google'))) gen.push(join(d, f));
}
const stale = gen.filter((f) => vers(read(f)) !== want);
if (!gen.length) warn('no generated pages found: run  node scripts/build-pages.mjs');
else if (stale.length) bad(stale.length + ' generated pages use old asset versions (e.g. ' + stale[0] + '): run  node scripts/build-pages.mjs');
else ok(gen.length + ' generated pages use ' + want);
for (const m of want.split(' ')) { const f = m.split('?')[0]; if (!existsSync(join(ROOT, f))) bad('missing ' + f); }

console.log('Database (as a visitor; limit is 3 s)');
async function rpc(fn, body) {
  const t0 = Date.now();
  const r = await fetch(SB + fn, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  const ms = Date.now() - t0, txt = await r.text();
  return { ok: r.ok, ms, txt };
}
const calls = [['catalog'], ['exam_list'], ['list_tests'], ['leaderboard_page', { p_days: 30, p_subject: null }], ['daily_board', { p_day: null }],
  ['college_board', { p_days: 30 }], ['exam_index', { p_exam: 'gate-cs' }], ['test_info', { p_slug: 'mock-qa' }], ['jp_options']];
for (const [fn, body] of calls) {
  try {
    const r = await rpc(fn, body);
    if (!r.ok) bad(fn + ' failed: ' + r.txt.slice(0, 120));
    else if (r.ms > 2500) bad(fn + ' slow: ' + r.ms + ' ms');
    else if (r.ms > 1200) warn(fn + ' ' + r.ms + ' ms');
    else ok(fn + ' ' + r.ms + ' ms');
  } catch (e) { bad(fn + ': ' + e.message); }
}

if (process.argv.includes('--live')) {
  console.log('Live site');
  const live = await (await fetch(SITE + '/?x=' + Date.now())).text();
  if (vers(live) === want) ok('live home serves ' + want); else warn('live home serves ' + vers(live) + ' (local ' + want + '); GitHub may still be publishing');
  for (const u of ['/practice', '/test', '/exams', '/e/gate-cs', '/p/mec', '/t/mock-qa', '/t/daily', '/leaderboard', '/sitemap.xml', '/sw.js']) {
    const r = await fetch(SITE + u, { redirect: 'manual' });
    const expect = u === '/leaderboard' ? [200, 404] : [200];
    if (expect.includes(r.status)) ok(u + ' ' + r.status); else bad(u + ' answered ' + r.status);
  }
}

console.log('\n' + (fails ? fails + ' failed' : 'All checks passed') + (warns ? ', ' + warns + ' warning(s)' : ''));
process.exit(fails ? 1 : 0);

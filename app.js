(function () {
  'use strict';
  var SB_URL = 'https://thrpqwnjwewhdhimmgpu.supabase.co';
  var SB_KEY = 'sb_publishable_EgH3u5RbDFJPMH7svguFaQ_zuGZ2zVJ';
  var sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });

  var $view = document.getElementById('view');
  var $nav = document.getElementById('nav');
  var $bar = document.getElementById('bar');
  var session = null, profile = null;
  var cleanup = null;

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function h(html) { $view.innerHTML = html; $view.focus({ preventScroll: true }); window.scrollTo(0, 0); }
  function q(sel) { return $view.querySelector(sel); }
  function toast(msg) { var t = document.getElementById('toast'); t.textContent = msg; t.hidden = false; clearTimeout(t._t); t._t = setTimeout(function () { t.hidden = true; }, 3500); }
  function loading() { h('<div class="spinner" aria-label="Loading"></div>'); }
  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function mmss(ms) { var s = Math.ceil(ms / 1000), m = Math.floor(s / 60); s = s % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
  function fmtDate(d) { try { return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } }
  function errMsg(e) {
    var m = (e && (e.message || e.error_description)) || String(e);
    if (/Failed to fetch|NetworkError|network/i.test(m)) return 'Could not connect. Check your internet and try again.';
    return m;
  }
  function rpc(fn, args, tries) {
    tries = tries || 0;
    return sb.rpc(fn, args || {}).then(function (r) {
      if (r.error) {
        if (tries < 3 && /fetch|network|timeout|50\d/i.test(r.error.message || '')) {
          return new Promise(function (res) { setTimeout(res, 800 * (tries + 1)); }).then(function () { return rpc(fn, args, tries + 1); });
        }
        throw r.error;
      }
      return r.data;
    }, function (e) {
      if (tries < 3) return new Promise(function (res) { setTimeout(res, 800 * (tries + 1)); }).then(function () { return rpc(fn, args, tries + 1); });
      throw e;
    });
  }
  function go(path, replace) { if (replace) history.replaceState({}, '', path); else history.pushState({}, '', path); route(); }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-link]');
    if (a && a.origin === location.origin && !e.metaKey && !e.ctrlKey) { e.preventDefault(); go(a.pathname + a.search); }
  });
  window.addEventListener('popstate', route);

  var navActive = '';
  function setNav(active) {
    if (active !== undefined) navActive = active;
    active = navActive;
    var items = [['home', '/', 'Practice Tests', '🎯', 'Topic-wise papers with instant results', 'Tests'], ['career', '/career', 'Job Prep', '🏢', 'Company-wise plan, software & interviews', 'Job Prep'], ['resume', '/resume', 'Resume Builder', '📄', 'ATS-ready resume, PDF & Word', 'Resume']];
    if (session) items.push(['me', '/me', 'Dashboard', '📊', 'Your results and progress', 'My tests']);
    if (session && profile && profile.is_admin) items.push(['admin', '/admin', 'Admin', '🛠', 'Control room', 'Admin']);
    var ini = ((profile && (profile.full_name || profile.email)) || '?').charAt(0).toUpperCase();
    var acct = session ? '<a href="/profile" data-link class="avatar" title="Profile and sign out" aria-label="Profile and sign out">' + esc(ini) + '</a>'
      : '<a href="/login" data-link class="nav-cta' + (active === 'login' ? ' on' : '') + '">Sign in</a>';
    $nav.innerHTML = '<div class="nav-links">' + items.map(function (x) { return '<a href="' + x[1] + '" data-link class="' + (active === x[0] ? 'on' : '') + '"><i aria-hidden="true">' + x[3] + '</i><span class="nl">' + x[2] + '</span><span class="ns">' + x[5] + '</span></a>'; }).join('') + '</div>' +
      '<div class="nav-right"><a href="https://www.vkvsir.com" class="site-link" title="Go to vkvsir.com">vkvsir.com ↗</a>' + acct +
      '<button type="button" class="menu-btn" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button></div>';
    // mobile drawer
    var dr = document.getElementById('drawer');
    if (!dr) { dr = document.createElement('div'); dr.id = 'drawer'; dr.className = 'drawer'; dr.setAttribute('aria-hidden', 'true'); document.body.appendChild(dr); }
    dr.innerHTML = '<div class="drawer-bg" data-close></div><aside class="drawer-p" role="dialog" aria-label="Menu"><div class="drawer-h"><b>Menu</b><button type="button" class="drawer-x" data-close aria-label="Close menu">✕</button></div>' +
      '<nav class="drawer-n">' + items.map(function (x) { return '<a href="' + x[1] + '" data-link class="' + (active === x[0] ? 'on' : '') + '"><span class="di">' + x[3] + '</span><span><b>' + x[2] + '</b><small>' + x[4] + '</small></span></a>'; }).join('') + '</nav>' +
      '<div class="drawer-f">' + (session ? '<a class="btn ghost block" href="/profile" data-link>👤 My profile</a>' : '<a class="btn block" href="/login" data-link>Sign in / Create free account</a>') +
      '<a class="drawer-site" href="https://www.vkvsir.com">Visit vkvsir.com ↗</a><a class="drawer-site" href="/why" data-link>Why VKV Sir Test Lab</a></div></aside>';
    function openD(o) { dr.classList.toggle('open', o); dr.setAttribute('aria-hidden', o ? 'false' : 'true'); document.body.classList.toggle('noscroll', o); var b = $nav.querySelector('.menu-btn'); if (b) b.setAttribute('aria-expanded', o); }
    $nav.querySelector('.menu-btn').onclick = function () { openD(true); };
    dr.onclick = function (e) { if (e.target.closest('[data-close]') || e.target.closest('a')) openD(false); };
    if (!window._drawerEsc) { window._drawerEsc = 1; document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { var d = document.getElementById('drawer'); if (d && d.classList.contains('open')) { d.classList.remove('open'); document.body.classList.remove('noscroll'); } } }); }
    $bar.classList.toggle('exam-mode', active === 'exam');
  }

  function loadProfile() {
    if (!session) { profile = null; return Promise.resolve(null); }
    return rpc('my_profile').then(function (p) { profile = p; return p; });
  }
  function requireAuth(next) {
    if (!session) { go('/login?next=' + encodeURIComponent(next), true); return false; }
    if (!profile || !profile.complete) { go('/profile?next=' + encodeURIComponent(next), true); return false; }
    return true;
  }

  /* ---------- router ---------- */
  function route() {
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    var p = location.pathname.replace(/\/+$/, '') || '/';
    var m;
    if (p === '/') return viewHome();
    if (p === '/login') return viewLogin();
    if (p === '/profile') return viewProfile();
    if (p === '/me') return viewDashboard();
    if (p === '/admin') return viewAdmin();
    if (p === '/career' || p === '/jobprep') return viewCareer();
    if (p === '/resume') return viewResume();
    if (p === '/admin/jobprep') return viewJpAdmin();
    if (p === '/admin/software') return viewSwAdmin();
    if (p === '/admin/iq-reports') return viewIqReportsAdmin();
    if (p === '/drill') return viewDrill();
    if (p === '/admin/about') return viewAboutAdmin();
    if (p === '/admin/companies') return viewCompaniesAdmin();
    if (p === '/disclaimer') return viewDisclaimer();
    if (p === '/why' || p === '/features') return viewWhy();
    if ((m = p.match(/^\/p\/([a-z0-9]+)(?:\/(\d+))?(?:\/([a-z0-9-]+))?$/i))) return viewFocus(m[1], m[2], m[3]);
    if ((m = p.match(/^\/t\/([a-z0-9-]+)$/))) return viewTest(m[1]);
    if ((m = p.match(/^\/exam\/([0-9a-f-]{36})$/))) return viewExam(m[1]);
    if ((m = p.match(/^\/g\/([0-9a-f]{20,64})\/exam\/([0-9a-f-]{36})$/))) return viewExam(m[2], m[1]);
    if ((m = p.match(/^\/g\/([0-9a-f]{20,64})\/result\/([0-9a-f-]{36})$/))) return viewResult(m[2], m[1]);
    if ((m = p.match(/^\/g\/([0-9a-f]{20,64})$/))) return viewGroup(m[1]);
    if ((m = p.match(/^\/result\/([0-9a-f-]{36})$/))) return viewResult(m[1]);
    setNav('');
    h('<div class="narrow card center"><h2>Page not found</h2><p class="muted">The link may be old or mistyped.</p><a class="btn" href="/" data-link>Go to tests</a></div>');
  }
  function nextParam() { var n = new URLSearchParams(location.search).get('next'); return n && n.charAt(0) === '/' ? n : '/me'; }

  /* ---------- home ---------- */
  /* ---------- home: three expandable tracks with a tick-box tree ---------- */
  var WA_I = '<svg viewBox="0 0 32 32" width="20" height="20"><path fill="#25D366" d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.4.7 4.6 1.9 6.6L3 29l7-2.2c1.9 1 4 1.6 6.1 1.6 7 0 12.7-5.7 12.7-12.7S23 3 16 3z"/><path fill="#fff" d="M22.6 18.9c-.3-.2-2-1-2.3-1.1-.3-.1-.5-.2-.8.2-.2.3-.9 1.1-1.1 1.3-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.7-1.7-1-.9-1.7-2-1.9-2.3-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6l-1-2.5c-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.4 1.4 3.6c.2.2 2.4 3.7 5.9 5.2.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 2-.8 2.3-1.6.3-.8.3-1.5.2-1.6-.1-.1-.3-.2-.6-.4z"/></svg>';
  var FOLLOW = [
    ['WhatsApp channel', 'https://whatsapp.com/channel/0029Va5ka1rFHWq4y4OcYy3U', 'wa', WA_I],
    ['YouTube', 'https://www.youtube.com/@vkvsirdotcom?sub_confirmation=1', 'yt', '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#FF0000" d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8z"/><path fill="#fff" d="M9.8 15.2 15.6 12 9.8 8.8z"/></svg>'],
    ['Telegram', 'https://t.me/vkvsir', 'tg', '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="11" fill="#229ED9"/><path fill="#fff" d="M5.6 11.7 17 7.3c.5-.2 1 .1.8.9l-1.9 9c-.1.6-.5.8-1 .5l-2.9-2.1-1.4 1.4c-.2.2-.3.3-.6.3l.2-3 5.4-4.9c.2-.2 0-.3-.3-.1l-6.7 4.2-2.9-.9c-.6-.2-.6-.6.1-.9z"/></svg>'],
    ['Instagram', 'https://www.instagram.com/vkvsir', 'ig', '<svg viewBox="0 0 24 24" width="20" height="20"><defs><linearGradient id="igg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#feda75"/><stop offset=".5" stop-color="#d62976"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="url(#igg)"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.2" fill="#fff"/></svg>'],
    ['LinkedIn', 'https://www.linkedin.com/in/vkvsir', 'li', '<svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="4" fill="#0A66C2"/><path fill="#fff" d="M6.9 9.6h2.6V18H6.9zM8.2 5.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM11.2 9.6h2.5v1.2c.4-.7 1.2-1.4 2.6-1.4 2.7 0 3.2 1.8 3.2 4.1V18h-2.6v-4c0-1 0-2.2-1.4-2.2s-1.6 1-1.6 2.1V18h-2.6z"/></svg>'],
    ['Facebook', 'https://www.facebook.com/vkvsir', 'fb', '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="11" fill="#1877F2"/><path fill="#fff" d="M13.3 19v-6h2l.3-2.4h-2.3V9.2c0-.7.2-1.2 1.2-1.2h1.2V5.9c-.2 0-1-.1-1.8-.1-1.8 0-3 1.1-3 3.1v1.7H8.9V13h2V19z"/></svg>'],
    ['vkvsir.com', 'https://www.vkvsir.com', 'web', '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="none" stroke="#0e6b5c" stroke-width="2"/><path d="M2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20" fill="none" stroke="#0e6b5c" stroke-width="1.6"/></svg>']
  ];
  /* guided tour: shown once for new visitors */
  function tour(steps, key) {
    try { if (localStorage.getItem(key)) return; } catch (e) { return; }
    steps = steps.filter(function (x) { return document.querySelector(x[0]); }); if (!steps.length) return;
    var i = 0, ov = document.createElement('div'); ov.className = 'tour'; document.body.appendChild(ov);
    function done() { try { localStorage.setItem(key, '1'); } catch (e) {} ov.remove(); document.querySelectorAll('.tour-on').forEach(function (x) { x.classList.remove('tour-on'); }); }
    function show() {
      document.querySelectorAll('.tour-on').forEach(function (x) { x.classList.remove('tour-on'); });
      var el = document.querySelector(steps[i][0]); el.classList.add('tour-on'); el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(function () {
        var r = el.getBoundingClientRect(), below = r.bottom + 190 < innerHeight;
        ov.innerHTML = '<div class="tour-tip" style="top:' + (below ? r.bottom + scrollY + 14 : r.top + scrollY - 14) + 'px;left:' + Math.max(12, Math.min(r.left + scrollX, innerWidth - 312)) + 'px;' + (below ? '' : 'transform:translateY(-100%)') + '"><span class="tour-ar ' + (below ? 'up' : 'down') + '"></span><small>Step ' + (i + 1) + ' of ' + steps.length + '</small><b>' + steps[i][1] + '</b><p>' + steps[i][2] + '</p><div class="tour-b"><button class="linkbtn" data-t="skip">Skip tour</button><button class="btn" data-t="next">' + (i === steps.length - 1 ? 'Got it 👍' : 'Next →') + '</button></div></div>';
      }, 350);
    }
    ov.onclick = function (e) { var b = e.target.closest('[data-t]'); if (!b) return; if (b.getAttribute('data-t') === 'skip' || i === steps.length - 1) return done(); i++; show(); };
    show();
  }
  setTimeout(function () { var ff = document.getElementById('ff'); if (ff && !ff.innerHTML) ff.innerHTML = '<span class="ffl">Follow VKV Sir</span>' + FOLLOW.map(function (f) { return '<a href="' + f[1] + '" target="_blank" rel="noopener" title="' + f[0] + '" aria-label="' + f[0] + '" class="fi ' + f[2] + '">' + f[3] + '</a>'; }).join(''); }, 0);
  var TRACKS = [
    { k: 'foundation', ic: '📘', t: 'Fundamentals', d: 'Unit and topic MCQs for semester exams, practicals and viva: Diploma, UG, PG and PhD.' },
    { k: 'competitive', ic: '🏆', t: 'Competitive exams', d: 'GATE, ESE, PSU, ISRO, RTO/MVI, SSC, aptitude, reasoning and more, by level and domain.' },
    { k: 'career', ic: '🚀', t: 'Interview & career', d: 'Company-wise prep, job-profile plan, placement mock tests, aptitude, branch core and HR for freshers to experienced.' }
  ];
  function viewHome() {
    setNav('home'); loading();
    Promise.all([rpc('catalog').catch(function () { return []; }), rpc('list_tests').catch(function () { return []; }),
      sb.from('catalog').select('track,grp,subgrp,title,description,subject_id,status,url,sort').eq('active', true).order('sort').then(function (r) { return r.data || []; }, function () { return []; }),
      rpc('leaderboard', { p_subject: null }).catch(function () { return []; })]).then(function (r) {
      var cat = r[0] || [], tests = r[1] || [], extra = r[2] || [], board = r[3] || [];
      var sel = {}; // key "S|U|T" -> {s,u,t}
      function trackOf(s) { return s.category === 'Exam' ? 'competitive' : 'foundation'; }
      var NAMES = {};
      function chk(id, label, extraCls, dis, nm) { NAMES[id] = nm || id; return '<label class="tchk' + (extraCls || '') + '"><input type="checkbox" data-k="' + esc(id) + '"' + (dis ? ' disabled' : '') + '><span>' + label + '</span></label>'; }
      function subjNode(s, tk) {
        var UL = tk === 'foundation' ? 'Unit ' : 'Section ';
        return '<details class="tn"><summary><span class="caret"></span>' + chk(s.id, '<b>' + esc(s.name) + '</b>', ' lvl1', false, s.name) + '</summary><div class="tk">' +
          s.units.map(function (u) {
            var key = s.id + '|' + u.unit, many = u.topics.length >= 2;
            return '<details class="tn"><summary><span class="caret"' + (u.topics.length ? '' : ' style="visibility:hidden"') + '></span>' + chk(key, UL + u.unit + ': ' + esc(u.name), '', false, s.name + ' · ' + UL + u.unit + ': ' + u.name) + '</summary>' +
              (many ? '<div class="tk">' + u.topics.map(function (t) { return '<div class="leaf">' + chk(key + '|' + t.id, esc(t.name) + (t.new ? ' <span class="badge">New</span>' : ''), '', false, t.name) + '</div>'; }).join('') + '</div>' : '') + '</details>';
          }).join('') + '</div></details>';
      }
      function ghost(rows) { return rows.length ? '<div class="ghosts">' + rows.map(function (x) { return '<span>' + esc(x.title) + '</span>'; }).join('') + '<span>…and many more</span></div>' : ''; }
      function linkGroups(rows) {
        if (!rows.length) return '';
        var m = {}, order = [];
        rows.forEach(function (x) { var g = x.subgrp || x.grp || 'More'; if (!m[g]) { m[g] = []; order.push(g); } m[g].push(x); });
        return '<p class="f tr-g">📚 Prepare by area</p><div class="tgrps">' + order.map(function (g) {
          return '<details class="tgrp n' + Math.min(m[g].length, 3) + '"' + (m[g].length <= 4 ? ' open' : '') + '><summary><b>' + esc(g) + '</b> <span class="small muted">(' + m[g].length + ')</span></summary><div class="tr-items">' + m[g].map(function (x) {
            var href = x.url || ('/p/' + String(x.subject_id).toLowerCase());
            return '<a class="tr-item" href="' + esc(href) + '" data-link><b>' + esc(x.title) + '</b>' + (x.description ? '<span class="small muted">' + esc(x.description) + '</span>' : '') + '<span class="pill good">Open →</span></a>';
          }).join('') + '</div></details>';
        }).join('') + '</div>';
      }
      function careerTop() {
        return '<div class="tr-quick"><p class="f" style="margin:0 0 8px">🎯 Get your interview preparation plan</p>' +
          '<div class="qf"><input class="in" id="qc" placeholder="Company (e.g. Bhagwati Machines, L&amp;T, TCS)"><select class="in" id="qb"><option value="">Branch</option><option value="ME">Mechanical</option><option value="AUTO">Automobile</option><option value="EE">Electrical</option><option value="ECE">Electronics &amp; Comm.</option><option value="CE">Civil</option><option value="IN">Instrumentation</option><option value="CSE">Computer Science / IT</option></select>' +
          '<select class="in" id="ql"><option value="student">Final-year student</option><option value="fresher" selected>Fresher (0–1 yr)</option><option value="junior">2–4 years</option><option value="senior">5+ years</option></select>' +
          '<input class="in" id="qr" placeholder="Job role / post (e.g. Design Engineer, GET)"><button class="btn" id="qgo" type="button">Build my plan</button></div>' +
          '<p class="small muted" style="margin:6px 0 0">Have the full job post? Open the <a href="/career" data-link>full planner</a> and paste it for an exact match.</p></div>' +
          '<div class="tr-items" style="margin-top:12px"><a class="tr-item tr-feature" href="/career" data-link><b>🎯 Job Prep planner</b><span class="small muted">Company + role + level → topics to master, software to learn, likely interview questions with answers.</span><span class="pill good">Open planner →</span></a>' +
          '<a class="tr-item tr-feature" href="/drill" data-link><b>⚡ Unlimited aptitude drill</b><span class="small muted">Fresh numeric questions every time, no sign-in needed.</span><span class="pill good">Start drilling →</span></a></div>';
      }
      var live = {}; cat.forEach(function (s) { live[s.id] = 1; });
      var tracksHtml = TRACKS.map(function (tr, i) {
        var subs = cat.filter(function (s) { return trackOf(s) === tr.k; });
        var more = extra.filter(function (x) { return x.track === tr.k && !(x.subject_id && live[x.subject_id]); });
        var rt = tests.filter(function (t) { return !/-custom$/.test(t.slug) && (t.track || 'competitive') === tr.k; });
        var linked = extra.filter(function (x) { return x.track === tr.k && (x.url || (x.subject_id && live[x.subject_id] && tr.k === 'career')); });
        more = more.filter(function (x) { return linked.indexOf(x) < 0; });
        var body = (tr.k === 'career' ? careerTop() : '') +
          (subs.length ? '<div class="tree">' + subs.map(function (x) { return subjNode(x, tr.k); }).join('') + '</div>' : '') +
          testsTree(rt) + linkGroups(linked) + ghost(more);
        return '<details class="trk ' + tr.k + '"' + (i === 0 ? ' id="tr0"' : '') + (tr.k === 'career' ? ' open' : '') + '><summary><span class="tic">' + tr.ic + '</span><span class="tt"><b>' + tr.t + '</b><small>' + tr.d + '</small></span><span class="tplus" aria-hidden="true"></span></summary><div class="tbody">' + body + '</div></details>';
      }).join('');
      h('<section class="hx"><div class="hx-l"><p class="eyebrow">Free for every student · Practice · Job Prep · Resume</p><h1>From your first test to <em>your first job</em>.</h1>' +
        '<p class="hx-sub">Practise any subject topic by topic, prepare for the exact company and role you want, and build an ATS-ready resume, all in one place and completely free.</p>' +
        '<div class="hx-cta"><button class="btn" id="go-start">▶ Start practising</button><a class="btn ghost" href="/career" data-link>🎯 Plan for a company</a><a class="btn ghost" href="/resume" data-link>📄 Build my resume</a></div>' +
        '<div class="hx-trust">' + [['20+', 'subjects & skills'], ['40+', 'job roles mapped'], ['200+', 'recruiters covered'], ['100%', 'free, no paywalls']].map(function (s) { return '<div><b>' + s[0] + '</b><span>' + s[1] + '</span></div>'; }).join('') + '</div>' +
        '</div>' +
        '<div class="hx-r2"><div class="hx-panel"><div class="hxp-grid">' +
          [['📚', 'Thousands', 'of practice questions'], ['🧭', '3 tracks', 'Semester · Competitive · Career'], ['🖼️', 'Image questions', 'Diagrams, figures & charts'], ['⚡', 'Fresh paper', 'Balanced mix every time']].map(function (s) { return '<div class="hxp"><span class="hxp-i">' + s[0] + '</span><b>' + s[1] + '</b><small>' + s[2] + '</small></div>'; }).join('') +
          '</div><div class="hxp-by"><img src="/favicon.svg" alt=""><span>Prepared and reviewed by the <b>VKV Sir team of experts</b></span></div></div></div>' +
        '</section>' + personasHtml() +
        '<div class="marq" aria-hidden="true"><div class="marq-in">' + (function () { var c = ['TCS', 'Infosys', 'L&amp;T', 'Tata Motors', 'Shri Bhagwati Machines', 'NTPC', 'BHEL', 'JK Tyre', 'Maruti Suzuki', 'Wipro', 'Bosch', 'Siemens', 'UltraTech', 'Tata Steel', 'Accenture', 'Mahindra', 'IOCL', 'ABB']; var s = c.map(function (x) { return '<span>' + x + '</span>'; }).join(''); return s + s; })() + '</div></div>' +
        
        '<section class="hs trio rv"><p class="eyebrow center">Three tools · one goal</p><h2 class="hs-h center">Everything you need to get exam-ready and job-ready</h2><div class="trio-g">' +
          [['practice', '🎯', 'Practice Tests', 'Topic-wise papers with fair timing, instant results and clear explanations.', ['Semester, competitive & career tracks', 'Image & diagram questions', 'Unit-wise result analysis'], 'c-blue'],
           ['jobprep', '🏢', 'Job Prep', 'A personal plan for the company, role and level you are targeting.', ['Software asked in real job posts', 'Company interview questions', 'Detailed company profile'], 'c-violet'],
           ['resume', '📄', 'Resume Builder', 'An ATS-friendly resume with a live score and keyword guidance.', ['Unlimited PDF & Word downloads', 'Job-post match %', 'Duplicate for every company'], 'c-orange']]
          .map(function (c) { return '<a class="trio-c ' + c[5] + '" href="#' + c[0] + '"><span class="trio-i">' + c[1] + '</span><b>' + c[2] + '</b><p>' + c[3] + '</p><ul>' + c[4].map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul><em>Explore ↓</em></a>'; }).join('') + '</div></section>' +

        '<section class="hs band-a" id="practice"><div class="split"><div class="split-t rv"><p class="eyebrow">Practice tests</p><h2 class="hs-h">Practise smarter, not longer</h2><p class="muted">Pick a whole subject, a unit or a single topic. Every paper is freshly balanced from easy to hard, so each attempt teaches you something new.</p>' +
          '<ul class="ticks"><li><b>Fresh paper every time</b> with fair time per question</li><li><b>Instant results</b> with the correct answer and a clear explanation</li><li><b>Unit-wise analysis</b> shows exactly where to improve</li><li><b>Image questions</b> with zoom: machines, tools, circuits, charts</li><li><b>Rapid fire</b> for quick revision once a unit is covered</li><li><b>Report</b> any doubtful question; our team reviews it</li></ul>' +
          '<button class="btn" type="button" id="go-start2">Choose a subject →</button></div>' +
          '<div class="split-v rv"><div class="tabs" role="tablist"><button type="button" class="on" data-tab="img">🖼️ Image questions</button><button type="button" data-tab="mcq">✍️ Technical MCQ</button></div>' +
            '<div class="tabp" data-p="img">' + heroSamples() + '</div>' +
            '<div class="tabp" data-p="mcq" hidden><div class="card sq"><span class="hq-dom" style="background:var(--teal)">Automobile</span><p class="mq-q">In an Ackermann steering mechanism, the correct steering condition is:</p>' +
              ['cot φ − cot θ = w / l', 'cot φ + cot θ = w / l', 'tan φ − tan θ = w / l', 'sin φ − sin θ = w / l'].map(function (o, i) { return '<button class="sqo" data-ok="' + (i === 0) + '">' + 'ABCD'[i] + '&nbsp; ' + o + '</button>'; }).join('') +
          
              '<p class="small muted sqx" hidden>✓ <b>cot φ − cot θ = w / l</b>, where φ and θ are the outer and inner wheel angles, w the kingpin centre distance and l the wheelbase. Want more like this? Open <b>Fundamentals → Automobile Engineering</b>.</p></div></div></div></div>' +
        '<h2 class="sh2" id="tracks-h">Choose what to practise</h2><p class="muted hs-sub">Open a track, tick a subject, units or single topics, then pick your time and start.</p><div class="tracks">' + tracksHtml + '</div>' +
        '<div class="modes-wrap"><p class="f">Ways to practise</p><div class="modes">' + [
          ['📝', 'Fixed paper', 'A set number of questions with fair time for each, like a real exam.'],
          ['⚡', 'Rapid fire', 'Questions keep coming until time runs out. Unlocks after you cover all topics of a unit.'],
          ['🎯', 'Topic focus', 'Tick a single topic to master it before moving on.'],
          ['🏆', 'Ready-made tests', 'Full mock papers for exams such as RTO / MVI.'],
          ['👥', 'Group tests', 'Teachers can share one link so a whole class takes the same paper.'],
          ['🚩', 'Report & rate', 'Flag doubtful questions; repeatedly reported ones are paused for review.']
        ].map(function (m) { return '<div class="mode"><span class="mi">' + m[0] + '</span><b>' + m[1] + '</b><p>' + m[2] + '</p></div>'; }).join('') + '</div></div></section>' +

        '<section class="hs band-b" id="jobprep"><div class="hs-top rv"><p class="eyebrow">Job Prep</p><h2 class="hs-h">Prepare for the exact company and role you want</h2><p class="muted hs-sub">Enter a company, your branch, role and level, or paste the job post. You get one clear plan covering everything that matters for that job.</p></div>' +
          '<div class="flow rv">' + [['1', '🏢', 'Choose company & role', 'Any company, your branch and level (student, fresher, experienced).'], ['2', '📚', 'Subjects & topics', 'The topics that matter most, linked to one-click practice.'], ['3', '⚙️', 'Software to learn', 'From real job posts: 🔥 asked now, ↑ rising, or used earlier.'], ['4', '🎤', 'Interview: Technical & HR', 'Questions reported for that company, with model answers.']]
            .map(function (s) { return '<div class="flow-s"><span class="flow-n">' + s[0] + '</span><span class="flow-i">' + s[1] + '</span><b>' + s[2] + '</b><p>' + s[3] + '</p></div>'; }).join('') + '</div>' +
          '<div class="plan-demo rv"><div class="pd-h"><span class="pd-logo">H</span><div><b>Hero MotoCorp</b><small>Graduate Engineer Trainee · Mechanical · Fresher</small></div><span class="pill good">Sample plan</span></div>' +
            '<div class="pd-g"><div><p class="f">🔥 Software asked now</p><div class="chips">' + ['SAP', 'MS Excel', 'ANSYS', 'AutoCAD', 'Teamcenter', 'Minitab'].map(function (x) { return '<span class="chip">' + x + '</span>'; }).join('') + '</div></div>' +
            '<div><p class="f">📚 Top topics</p><div class="chips">' + ['Manufacturing processes', 'Lean & Kaizen', 'Quality tools', 'IC engines'].map(function (x) { return '<span class="chip">' + x + '</span>'; }).join('') + '</div></div>' +
            '<div class="pd-q"><p class="f">🎤 Asked at this company</p><p><b>Q.</b> What is OEE and how is it calculated?</p><p class="small muted">Availability × Performance × Quality; about 85% is world class.</p></div></div>' +
            '<p class="small muted pd-note">Also included: a detailed company profile (products, customers, competitors, official website) to help in written tests, interviews and your final decision.</p>' +
            '<div class="row" style="gap:10px"><a class="btn" href="/career" data-link>Build my plan →</a><span class="small muted">No sign-up needed to see your plan.</span></div></div></section>' +

        '<section class="hs band-c" id="resume"><div class="split rev"><div class="split-t rv"><p class="eyebrow">Resume Builder</p><h2 class="hs-h">An ATS-ready resume in minutes, and one for every job</h2><p class="muted">Most companies screen resumes with software before a person reads them. Our builder is designed to pass that step, and it is free without limits.</p>' +
          '<ul class="ticks"><li><b>Live ATS score</b> with clear fixes, updated as you type</li><li><b>Paste a job description</b> to see your % match and the exact keywords you are missing</li><li><b>Duplicate in one click</b>: change the company or a few keywords and keep a resume for every job</li><li><b>Unlimited downloads</b> in PDF and Word, no watermark</li><li><b>Keywords from real job posts</b>, including your target company</li></ul>' +
          '<a class="btn" href="/resume" data-link>Build my resume →</a></div>' +
          '<div class="split-v rv"><div class="cv-demo"><div class="cv-paper"><b class="cv-n">Rohit Sharma</b><span class="cv-c">rohit.sharma@gmail.com · Ajmer, Rajasthan · linkedin.com/in/rohit</span>' +
            '<i class="cv-h">EDUCATION</i><span class="cv-l w9"></span><span class="cv-l w6"></span><i class="cv-h">TECHNICAL SKILLS</i><span class="cv-l w8"></span><span class="cv-l w7"></span><i class="cv-h">INTERNSHIPS</i><span class="cv-l w9"></span><span class="cv-l w8"></span><span class="cv-l w5"></span><i class="cv-h">PROJECTS</i><span class="cv-l w9"></span><span class="cv-l w7"></span></div>' +
            '<div class="cv-badge b1"><b>86</b><span>/100 ATS score</span></div><div class="cv-badge b2"><b>82%</b><span>match with job post</span></div><div class="cv-badge b3"><span>📄 CV – Hero MotoCorp</span><span>📄 CV – Shree Cement</span><span>📄 CV – Tata Motors</span></div><div class="cv-badge b4">⬇ PDF · Word</div></div></div></div></section>' +

        '<section class="whystrip"><div class="whystrip-h"><b>Why students choose VKV Sir Test Lab</b><a href="/why" data-link>See all features →</a></div><div class="whystrip-g">' +
          [['🎯', 'Fresh, balanced papers', 'A new mix of easy, moderate and hard every time'], ['🖼️', 'Image-based questions', 'Diagrams, 3D parts, charts and figures, with zoom'], ['🏢', 'Company-wise preparation', 'Software and interview questions from real job posts'], ['📄', 'Free ATS resume builder', 'Unlimited PDF & Word downloads, keyword score'], ['🧑‍🏫', 'Expert-checked', 'Every question reviewed; report anything doubtful'], ['💯', 'Free forever', 'No paywalls and no download limits']]
            .map(function (x) { return '<div class="whyi"><span>' + x[0] + '</span><div><b>' + x[1] + '</b><small>' + x[2] + '</small></div></div>'; }).join('') + '</div></section>' +
        
        '<section class="hs faq rv"><h2 class="hs-h center">Frequently asked questions</h2><div class="faq-l">' + [
          ['Is everything really free?', 'Yes. Practice tests, Job Prep plans and the resume builder are free, with unlimited resume downloads in PDF and Word.'],
          ['Do I need to sign in?', 'You can explore, build a plan and make a resume without signing in. Sign in to start tests, save results and keep your resumes in your account.'],
          ['Where do the company software lists come from?', 'From real, dated job posts and company career pages, updated regularly. For small companies we show what similar companies in the same field ask for.'],
          ['How accurate are the questions?', 'Every question is prepared and reviewed by our team. If you find a doubtful answer, tap Report and it is reviewed promptly.'],
          ['Can I make different resumes for different companies?', 'Yes. Duplicate a resume, change the company or keywords, and keep as many versions as you need.']
        ].map(function (f) { return '<details><summary>' + f[0] + '</summary><p>' + f[1] + '</p></details>'; }).join('') + '</div></section>' +
        '<section class="ask" id="ask"><div><h2 class="sh2" style="margin:0 0 6px">Didn\'t find your exam or topic? Ask for it.</h2><p class="muted">Tell us the subject, exam, or the company and role you are preparing for. We build new question banks from these requests.</p>' +
          '<a class="btn" href="' + (session ? '/me#suggest' : '/login?next=/me') + '" data-link>💡 Send your request</a><p class="small muted" style="margin-top:8px">Find the request box on <b>My dashboard</b> and below every result.</p></div>' +
          '<div class="reqs"><p class="small muted" style="margin:0 0 8px">Examples of requests you can send:</p>' + [
            ['📘', 'Add Heat Transfer for B.Tech semester 5'], ['🏆', 'GATE Mechanical previous-year style numericals'], ['💼', 'Interview prep for Infosys / TCS graduate engineer (fresher)'],
            ['🚗', 'EV battery questions for Tata Motors R&amp;D role (2 yrs exp.)'], ['🧮', 'SSC JE aptitude &amp; reasoning practice'], ['🔧', 'Viva questions for Workshop Practice lab']
          ].map(function (r) { return '<div class="req"><span>' + r[0] + '</span>"' + r[1] + '"</div>'; }).join('') + '</div></section>' +
        '<section class="follow"><h2 class="sh2">Follow VKV Sir</h2><div class="fl">' + FOLLOW.map(function (f) { return '<a href="' + f[1] + '" target="_blank" rel="noopener" class="fbtn ' + f[2] + '">' + f[3] + '<span>' + f[0] + '</span></a>'; }).join('') + '</div></section>' +
        '<div class="startbar" id="sbar" hidden><div class="sbtop"><b id="sn"></b><button type="button" class="linkbtn" id="sclr">Clear all</button></div><div class="snames" id="sd"></div>' +
        '<div class="sbrow"><div class="seg mini" id="smode"><button type="button" data-m="fixed" aria-pressed="true">📝 Fixed paper</button><button type="button" data-m="rapid" aria-pressed="false">⚡ Rapid fire</button></div>' +
        '<div class="seg mini" id="sdur">' + [5, 10, 15, 30].map(function (d, k) { return '<button type="button" data-d="' + d + '" aria-pressed="' + (k === 1) + '">' + d + ' min</button>'; }).join('') + '</div>' +
        '<button class="btn" id="sgo">' + (session ? 'Start practice' : 'Sign in to start') + '</button></div><p class="small muted" id="smi">Fixed paper: a set number of questions with fair time for each.</p><div class="err" id="se" role="alert"></div></div>' +
        shareBar(location.origin + '/', 'Free practice quizzes with instant results by VKV Sir:', 'Invite friends:') + boardCard(board, 'Top performers') + '<div id="about"></div>');
      mountAbout(q('#about'));
      var qg = q('#qgo');
      if (qg) qg.onclick = function () {
        var inp = { company: q('#qc').value.trim(), role: '', branch: q('#qb').value, level: q('#ql').value, text: q('#qr').value.trim() };
        try { localStorage.setItem('jp_last', JSON.stringify(inp)); } catch (e) {}
        go('/career?auto=1');
      };
      var dur = 10, mode = 'fixed', hint1 = false, hint2 = false;
      function selection() {
        var out = [], keys = Object.keys(sel);
        keys.forEach(function (k) {
          var p = k.split('|');
          if (p.length === 3 && (sel[p[0]] || sel[p[0] + '|' + p[1]])) return;
          if (p.length === 2 && sel[p[0]]) return;
          out.push(p.length === 1 ? { s: p[0] } : p.length === 2 ? { s: p[0], u: +p[1] } : { s: p[0], u: +p[1], t: p[2] });
        });
        return out;
      }
      function refresh() {
        var s = selection(), bar = q('#sbar');
        bar.hidden = !s.length;
        q('#sn').textContent = s.length ? 'Your selection (' + s.length + ')' : '';
        q('#sd').innerHTML = s.map(function (x) { var k = [x.s, x.u, x.t].filter(function (v) { return v != null; }).join('|'); return '<span class="snm">' + esc(NAMES[k] || k) + '</span>'; }).join('');
        if (s.length && !hint2) { hint2 = true; guide(q('#smode'), 'Choose Fixed paper or Rapid fire, pick your time, then Start'); }
      }
      if ($view._treeBound) { $view.removeEventListener('change', $view._treeChange); $view.removeEventListener('click', $view._treeClick, true); }
      $view._treeBound = true;
      $view.addEventListener('change', $view._treeChange = function (e) {
        var c = e.target; if (!c.matches || !c.matches('.tchk input')) return;
        var k = c.getAttribute('data-k');
        if (c.checked) sel[k] = 1; else delete sel[k];
        var node = c.closest('details');
        if (node && c.closest('summary')) node.querySelectorAll('.tk input:not([disabled])').forEach(function (x) { x.checked = c.checked; var kk = x.getAttribute('data-k'); if (c.checked) sel[kk] = 1; else delete sel[kk]; });
        refresh();
      });
      $view.addEventListener('click', $view._treeClick = function (e) {
        var lab = e.target.closest('summary .tchk'); if (!lab) return;
        e.preventDefault();
        var inp = lab.querySelector('input'); if (inp.disabled) return;
        inp.checked = !inp.checked; inp.dispatchEvent(new Event('change', { bubbles: true }));
      }, true);
      q('#sclr').onclick = function () { sel = {}; $view.querySelectorAll('.tchk input').forEach(function (x) { x.checked = false; }); refresh(); };
      $view.querySelectorAll('.trk .tn').forEach(function (d) { d.addEventListener('toggle', function () { if (d.open && !hint1) { hint1 = true; guide(d.querySelector('.tk .tchk') || d.querySelector('summary'), 'Tick the units or topics you want in your quiz'); } }); });
      q('#smode').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; mode = b.getAttribute('data-m'); this.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        q('#smi').innerHTML = mode === 'rapid' ? '⚡ <b>Rapid fire:</b> questions come one after another until time runs out, so you rehearse more in less time. Pick <b>one whole unit or subject</b>; it unlocks after you have practised all its topics. Two rounds per unit per day; each round uses fresh questions.' : 'Fixed paper: a set number of questions with fair time for each.';
        q('#sdur').querySelectorAll('button').forEach(function (x) { x.hidden = mode === 'rapid' && x.getAttribute('data-d') === '15'; }); if (mode === 'rapid' && dur === 15) dur = 10; };
      q('#sdur').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; dur = +b.getAttribute('data-d'); this.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); };
      q('#sgo').onclick = function () {
        if (!requireAuth(location.pathname)) return;
        var g = this, s = selection(); g.disabled = true; g.textContent = 'Preparing your paper…'; q('#se').textContent = '';
        var call;
        if (mode === 'rapid') {
          if (s.length !== 1 || s[0].t) { q('#se').textContent = 'For Rapid fire, tick exactly one whole unit or one whole subject.'; g.disabled = false; g.textContent = 'Start practice'; return; }
          call = rpc('start_rapid', { p_subject: s[0].s, p_unit: s[0].u == null ? null : s[0].u, p_duration: dur });
        } else call = rpc('start_multi', { p_sel: s, p_duration: dur });
        call.then(function (v) { go('/exam/' + v.attempt); })
          .catch(function (e) { var m = errMsg(e); if (m === 'PROFILE_INCOMPLETE') return go('/profile?next=' + location.pathname); q('#se').textContent = lockText(m); g.disabled = false; g.textContent = 'Start practice'; });
      };
      q('#go-start').onclick = function () { var t = q('#tr0'); t.open = true; t.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
      var gs2 = q('#go-start2'); if (gs2) gs2.onclick = q('#go-start').onclick;
      $view.querySelectorAll('.who-tabs button').forEach(function (b) { b.onclick = function () { var k = b.getAttribute('data-who'); b.parentNode.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); }); $view.querySelectorAll('.who-p').forEach(function (p) { p.hidden = p.getAttribute('data-who') !== k; }); }; });
      $view.querySelectorAll('.who-cta a[href^="#"]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); var t = document.getElementById(a.getAttribute('href').slice(1)); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; });
      $view.querySelectorAll('.tabs button').forEach(function (b) { b.onclick = function () { var t = b.getAttribute('data-tab'); b.parentNode.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); }); $view.querySelectorAll('.tabp').forEach(function (p) { p.hidden = p.getAttribute('data-p') !== t; }); }; });
      $view.querySelectorAll('.trio-c').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); var t = document.getElementById(a.getAttribute('href').slice(1)); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; });
      $view.querySelectorAll('.sqo').forEach(function (b) { b.onclick = function () { $view.querySelectorAll('.sqo').forEach(function (x) { x.disabled = true; x.classList.add(x.getAttribute('data-ok') === 'true' ? 'ok' : (x === b ? 'bad' : '')); }); q('.sqx').hidden = false; }; });
      setTimeout(function () { tour([
        ['.hx-cta', 'Welcome to VKV Sir Test Lab 👋', 'A free practice platform for semester exams, viva, competitive exams and interviews. Tap “Start practising” any time.'],
        ['.tracks', 'Choose what to practise', 'Open a track, then expand a subject like folders. Tick a whole subject, some units or single topics.'],
        ['.modes', 'Pick your style', 'Fixed paper works like a real exam. Rapid fire unlocks after you cover a unit, for fast revision.'],
        ['#ask', 'Ask for what you need', 'Missing an exam, subject or interview topic? Send a short request and we will add it.'],
        ['.follow', 'Stay updated', 'Follow on WhatsApp for openings, new tests and updates.']
      ], 'vkv-tour-home'); }, 700);
    }).catch(function (e) { h('<div class="card narrow center"><p>' + esc(errMsg(e)) + '</p><button class="btn" onclick="location.reload()">Try again</button></div>'); });
  }

  /* ---------- disclaimer & terms ---------- */
  function viewDisclaimer() {
    setNav('');
    var S = [
      ['1. Purpose of this platform', 'VKV Sir Test Lab (test.vkvsir.com) is a free, educational practice platform. All questions, options, answer keys, explanations, scores, ranks and analyses are provided solely to help learners practise and self-assess. They do not constitute an official examination, assessment, certification, or a statement of any examining body.'],
      ['2. Our commitment to quality', 'Questions, options, answer keys and explanations are prepared by subject experts with reasonable care and are checked before publishing. Content is also refined continuously through learner feedback. Even so, as with any book or question bank, an occasional item may be interpreted differently or need an update; content is therefore provided on an "as is" and "as available" basis for learning purposes.'],
      ['3. Practice keys and official answers', 'Answer keys on this platform are practice guidance to support learning. They are not issued by, or on behalf of, any examining body, university, board or recruiter, and therefore cannot be used as a basis for any claim, objection, re-evaluation or dispute elsewhere. Wherever an official answer key, textbook, code or notification exists, it always takes precedence.'],
      ['4. Learning alongside standard references', 'For the best preparation, use this platform together with standard textbooks, codes and official syllabus documents. Explanations here are written to build understanding and can be read alongside those references.'],
      ['5. Exam patterns and names', 'Names of examinations, universities, boards, organisations or companies are used only to describe the nature or level of practice. Questions are not official, previous-year or leaked papers unless expressly stated, and no affiliation, endorsement or sponsorship is implied.'],
      ['6. Scores and rankings', 'Scores, leaderboards, timings and analyses are indicative only, may change as content is corrected, and do not predict or guarantee performance, selection or results in any examination or interview.'],
      ['7. Different opinion? Report it', 'If you find an answer that differs from your reference book or seems ambiguous, tap Report on that question during the quiz or from your result page, where the correct answer and explanation for each question are shown. Our team reviews every report and updates content where needed; decisions on changes rest with the platform.'],
      ['8. Limitation of liability', 'To the maximum extent permitted by law, VKV Sir Test Lab, the VKV Sir team and associated contributors shall not be liable for any direct, indirect, incidental or consequential loss, damage, claim or grievance arising from the use of, or reliance on, any content, answer, score or service of this platform.'],
      ['9. Fair use and conduct', 'Content is for personal, non-commercial learning. Copying, scraping, republishing or redistributing questions, or misusing the platform, is not permitted. Accounts may be restricted for misuse, unfair means or attempts to manipulate scores or feedback.'],
      ['10. Changes and acceptance', 'These terms may be updated at any time without prior notice; the version on this page applies. By accessing or using this platform, you acknowledge that you have read, understood and accepted this disclaimer and these terms. Any dispute shall be subject to the jurisdiction of courts at Ajmer, Rajasthan, India.']
    ];
    h('<div class="narrow stack legal"><div><p class="eyebrow">Legal</p><h1>Disclaimer &amp; terms of use</h1><p class="muted small">Last updated: 19 October 2026</p></div>' +
      '<div class="card" style="border-left:4px solid var(--warn,#b4531a)"><p style="margin:0"><b>In short:</b> every question on VKV Sir Test Lab is written with care and reviewed before it goes live, so you can practise with confidence. Although our content is thoroughly checked, if you ever find an answer or question wording that seems ambiguous compared with your reference book, simply report it from the quiz or result page and we will review it promptly. This platform is designed for learning and self-assessment, so its answer keys serve as practice guidance; for any examination, the official key of the examining body is always the final word.</p></div>' +
      S.map(function (x) { return '<section><h3>' + x[0] + '</h3><p>' + x[1] + '</p></section>'; }).join('') +
      '<p class="small muted">Questions about these terms: <a href="https://mail.google.com/mail/?view=cm&fs=1&to=vinodvermavkvsir@gmail.com&su=Test%20Lab%20disclaimer%20query" target="_blank" rel="noopener">vinodvermavkvsir@gmail.com</a></p></div>');
  }

  /* ---------- suggestions ---------- */
  var SKINDS = [['topic', 'Topic / subject'], ['exam', 'Exam'], ['interview', 'Company / interview'], ['idea', 'Other idea']];
  function suggestBox() {
    var id = 'sg' + Math.random().toString(36).slice(2, 7);
    setTimeout(function () {
      var el = document.getElementById(id); if (!el) return;
      function paint(st) {
        var can = st && st.can, why = st && st.why;
        var note = can ? (st.first ? 'Your first suggestion is always welcome.' : 'You can send one now.')
          : why === 'signin' ? 'Sign in to send suggestions.'
          : 'Next suggestion opens after you complete one 15-minute test' + (st.next ? ', or on ' + new Date(st.next).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '') + '.';
        el.innerHTML = '<h3 style="margin:0 0 4px">💡 Tell us what to add next</h3><p class="small muted" style="margin:0 0 10px">Suggest a topic, subject, exam, or a company/job you are preparing for (role, fresher or experienced). Up to 30 words. We use these to plan new question banks.</p>' +
          '<div class="' + (can ? '' : 'blurred') + '"><div class="chips" id="' + id + 'k">' + SKINDS.map(function (k, i) { return '<button type="button" class="chip sel" data-k="' + k[0] + '" aria-pressed="' + (i === 0) + '"' + (can ? '' : ' disabled') + '>' + k[1] + '</button>'; }).join('') + '</div>' +
          '<textarea class="in" id="' + id + 't" rows="2" maxlength="240" placeholder="e.g. GATE thermodynamics numericals, or Tata Motors graduate engineer (fresher)"' + (can ? '' : ' disabled') + '></textarea>' +
          '<div class="spread" style="margin-top:8px"><span class="small muted" id="' + id + 'c">0 / 30 words</span><button class="btn" id="' + id + 'b"' + (can ? '' : ' disabled') + '>Send suggestion</button></div></div>' +
          '<p class="small" style="margin:8px 0 0;color:var(--muted)">' + note + '</p><div class="err" id="' + id + 'e"></div>';
        if (!can) return;
        var kind = 'topic', ta = document.getElementById(id + 't'), cnt = document.getElementById(id + 'c');
        document.getElementById(id + 'k').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; kind = b.getAttribute('data-k'); this.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); };
        ta.oninput = function () { var w = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0; cnt.textContent = w + ' / 30 words'; cnt.style.color = w > 30 ? 'var(--bad)' : ''; };
        document.getElementById(id + 'b').onclick = function () {
          var b = this; b.disabled = true;
          rpc('submit_suggestion', { p_kind: kind, p_body: ta.value }).then(function (st2) { el.innerHTML = '<p style="margin:0">✅ Thank you! Your suggestion has reached VKV Sir.</p>'; }).catch(function (e) { document.getElementById(id + 'e').textContent = errMsg(e); b.disabled = false; });
        };
      }
      if (!session) return paint({ can: false, why: 'signin' });
      rpc('suggestion_status').then(paint).catch(function () { el.remove(); });
    }, 300);
    return '<span id="suggest"></span><section class="card suggest" id="' + id + '"></section>';
  }

  /* one-time floating hint per page */
  function guide(target, text) {
    if (!target) return;
    var key = 'vkv-guide:' + location.pathname;
    try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch (e) { return; }
    var tip = document.createElement('div'); tip.className = 'guide-tip'; tip.innerHTML = '<span class="ga">&#8593;</span>' + esc(text);
    document.body.appendChild(tip);
    function place() { var r = target.getBoundingClientRect(); tip.style.top = (r.bottom + window.scrollY + 10) + 'px'; tip.style.left = Math.max(12, r.left + window.scrollX + 18) + 'px'; }
    place(); window.addEventListener('resize', place);
    target.classList.add('pulse');
    setTimeout(function () { tip.classList.add('out'); target.classList.remove('pulse'); setTimeout(function () { tip.remove(); }, 600); }, 6500);
    target.addEventListener('click', function () { tip.remove(); target.classList.remove('pulse'); }, { once: true });
  }
  function boardCard(board, title) {
    if (!board || !board.length) return '';
    return '<section class="card" style="margin-top:24px"><h2>' + esc(title) + '</h2><ol class="board">' + board.map(function (b, i) {
      return '<li class="' + (b.me ? 'me' : '') + '"><span class="bd-n">' + (i + 1) + '. ' + esc(b.name) + (b.me ? ' (you)' : '') + (b.college ? ' <span class="bd-c">· ' + esc(b.college) + '</span>' : '') + '</span><span class="mono">' + b.pct + '%</span></li>';
    }).join('') + '</ol><p class="small muted" style="margin-top:10px">Last 30 days &middot; first attempt of each test &middot; at least 20 questions answered &middot; first names with college. Scores are smoothed so one lucky short test cannot top the board.</p></section>';
  }

  /* ---------- login ---------- */
  function viewLogin() {
    setNav('login');
    if (session) return go(nextParam(), true);
    var next = nextParam();
    h('<div class="narrow stack"><div><p class="eyebrow">Welcome</p><h1>Sign in with your email</h1>' +
      '<p class="muted">No password needed. We will email you a 6-digit code. New here? The same step creates your free account.</p></div>' +
      '<div class="card" id="box">' +
      '<label class="f" for="em">Email address</label><input class="in" id="em" type="email" inputmode="email" autocomplete="email" autocapitalize="off" placeholder="you@example.com">' +
      '<div class="err" id="er" role="alert"></div><button class="btn block" id="send">Send code</button>' +
      '<p class="small center" style="margin:16px 0 0"><button class="link-btn" id="forgot">Forgot which email you used?</button></p></div></div>');
    var email = '';
    q('#send').onclick = function () {
      email = q('#em').value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { q('#er').textContent = 'Enter a valid email address.'; return; }
      var b = this; b.disabled = true; b.textContent = 'Sending…';
      sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: true, emailRedirectTo: location.origin + next } }).then(function (r) {
        if (r.error) throw r.error;
        codeStep();
      }).catch(function (e) {
        var m = errMsg(e);
        if (/rate limit|too many/i.test(m)) m = 'Too many sign-in emails right now. Please wait a minute and try again.';
        q('#er').textContent = m; b.disabled = false; b.textContent = 'Send code';
      });
    };
    q('#em').addEventListener('keydown', function (e) { if (e.key === 'Enter') q('#send').click(); });
    q('#forgot').onclick = forgotStep;

    function codeStep() {
      q('#box').innerHTML = '<p>We sent a sign-in email to <b>' + esc(email) + '</b>.</p>' +
        '<p class="muted small">Type the code from the email, or simply tap the sign-in link in it. Check spam if you do not see it.</p>' +
        '<label class="f" for="cd">Code from the email</label><input class="in code-in" id="cd" inputmode="numeric" autocomplete="one-time-code" maxlength="8">' +
        '<div class="err" id="er" role="alert"></div><button class="btn block" id="ver">Verify and continue</button>' +
        '<p class="small center" style="margin:16px 0 0"><button class="link-btn" id="back">Use a different email</button></p>';
      q('#cd').focus();
      q('#cd').addEventListener('input', function () { this.value = this.value.replace(/\D/g, '').slice(0, 8); });
      q('#cd').addEventListener('keydown', function (e) { if (e.key === 'Enter') q('#ver').click(); });
      q('#back').onclick = viewLogin;
      q('#ver').onclick = function () {
        var code = q('#cd').value; if (code.length < 6) { q('#er').textContent = 'Enter the full code from the email.'; return; }
        var b = this; b.disabled = true; b.textContent = 'Checking…';
        sb.auth.verifyOtp({ email: email, token: code, type: 'email' }).then(function (r) {
          if (r.error) throw r.error;
        }).catch(function (e) { q('#er').textContent = /expired|invalid/i.test(errMsg(e)) ? 'That code is wrong or expired. Try again or request a new one.' : errMsg(e); b.disabled = false; b.textContent = 'Verify and continue'; });
      };
    }
    function forgotStep() {
      q('#box').innerHTML = '<h3>Find your email</h3><p class="muted small">Enter the mobile number you saved in your profile. We will show a hint of the email linked to it. You still sign in with the email itself.</p>' +
        '<label class="f" for="mb">Mobile number</label><input class="in" id="mb" type="tel" inputmode="numeric" maxlength="13" autocomplete="tel">' +
        '<div class="err" id="er" role="alert"></div><div id="hints"></div><button class="btn block" id="look">Show hint</button>' +
        '<p class="small center" style="margin:16px 0 0"><button class="link-btn" id="back">Back to sign in</button></p>';
      q('#back').onclick = viewLogin;
      q('#look').onclick = function () {
        var m = q('#mb').value.replace(/\D/g, ''); if (m.length < 10) { q('#er').textContent = 'Enter a 10-digit mobile number.'; return; }
        var b = this; b.disabled = true;
        rpc('email_hint', { p_mobile: m }).then(function (list) {
          q('#er').textContent = '';
          q('#hints').innerHTML = list && list.length
            ? '<div class="note" style="color:var(--ink);background:var(--soft)">Your email looks like:<br>' + list.map(function (x) { return '<b class="mono">' + esc(x) + '</b>'; }).join('<br>') + '</div>'
            : '<div class="note">No account found with this number. If you never saved it, simply sign in with any email you use; a new account will be created.</div>';
          b.disabled = false;
        }).catch(function (e) { q('#er').textContent = errMsg(e); b.disabled = false; });
      };
    }
  }

  /* ---------- profile ---------- */
  var STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir','Jharkhand','Karnataka','Kerala','Ladakh','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Puducherry','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Chandigarh','Andaman and Nicobar Islands','Dadra and Nagar Haveli and Daman and Diu','Lakshadweep'];
  function viewProfile() {
    setNav('me');
    if (!session) return go('/login?next=' + encodeURIComponent(location.pathname + location.search), true);
    var p = profile || {}, next = nextParam();
    function fld(id, label, val, attrs) { return '<label class="f" for="' + id + '">' + label + '</label><input class="in" id="' + id + '" value="' + esc(val || '') + '" ' + (attrs || '') + '>'; }
    h('<div class="narrow stack"><div><p class="eyebrow">' + (p.complete ? 'Your profile' : 'One-time setup') + '</p><h1>' + (p.complete ? 'Edit your details' : 'Tell us about you') + '</h1>' +
      (p.complete ? '<p class="muted">These details stay private. Only your teacher and the admin can see them.</p></div>' :
      '<div class="notice"><b>Fill this carefully. You only do it once.</b><ul>' +
      '<li>This form is asked <b>only one time</b>. It will not be shown again.</li>' +
      '<li>Your details are <b>private</b>. Only your teacher and the admin can see them. Leaderboards show your first name only.</li>' +
      '<li><b>This email (' + esc(p.email || '') + ') is your permanent identity.</b> Always sign in with it to practise, see your reports and track progress.</li>' +
      '<li>Wrong or fake details may lead to your account being <b>blocked</b>.</li></ul></div></div>') +
      '<div class="card">' + '<p class="small muted" style="margin:0">Signed in as <b>' + esc(p.email || '') + '</b></p>' +
      fld('fn', 'Full name', p.full_name, 'autocomplete="name" maxlength="80"') +
      fld('mb', 'Mobile number', p.mobile, 'type="tel" inputmode="numeric" maxlength="13" autocomplete="tel"') +
      '<p class="small muted" style="margin:6px 0 0">Used only to remind you which email you signed up with. It is never used to sign in.</p>' +
      fld('cl', 'College or institute', p.college, 'maxlength="120"') +
      fld('ct', 'City', p.city, 'maxlength="60" autocomplete="address-level2"') +
      '<label class="f" for="st">State</label><input class="in" id="st" list="states" value="' + esc(p.state || '') + '" maxlength="60"><datalist id="states">' + STATES.map(function (s) { return '<option value="' + s + '">'; }).join('') + '</datalist>' +
      fld('co', 'Country', p.country || 'India', 'maxlength="60" autocomplete="country-name"') +
      '<div class="err" id="er" role="alert"></div><button class="btn block" id="save">Save and continue</button>' +
      '<p class="small center" style="margin:16px 0 0"><button class="link-btn" id="out">Sign out</button></p></div></div>');
    q('#out').onclick = function () { sb.auth.signOut().then(function () { go('/', true); }); };
    q('#save').onclick = function () {
      var b = this; b.disabled = true; b.textContent = 'Saving…';
      rpc('save_profile', { p_full_name: q('#fn').value, p_mobile: q('#mb').value, p_college: q('#cl').value, p_city: q('#ct').value, p_state: q('#st').value, p_country: q('#co').value })
        .then(function (np) { profile = np; toast('Profile saved'); go(next, true); })
        .catch(function (e) { q('#er').textContent = errMsg(e); b.disabled = false; b.textContent = 'Save and continue'; });
    };
  }

  /* ---------- test landing ---------- */
  function viewTest(slug) {
    setNav('home'); loading();
    rpc('test_info', { p_slug: slug }).then(function (t) {
      if (t) setTimeout(function () { rpc('leaderboard', { p_subject: null, p_test: slug }).then(function (b) { var n = q('.narrow'); if (n && b && b.length) n.insertAdjacentHTML('beforeend', boardCard(b, 'Top performers in this test')); }).catch(function () {}); }, 600);
      if (!t) { h('<div class="narrow card center"><h2>Test not found</h2><p class="muted">It may have been closed.</p><a class="btn" href="/" data-link>See all tests</a></div>'); return; }
      setTimeout(function () { guide(q('#seg'), 'Choose how much time you have, then press Start'); }, 400);
      var dur = t.durations[Math.min(1, t.durations.length - 1)];
      var opens = t.open_at && new Date(t.open_at) > new Date();
      var segs = t.durations.map(function (d) {
        var n = Math.min(t.available, Math.floor(d * 60 / t.sec_per_q));
        return '<button type="button" data-d="' + d + '" aria-pressed="' + (d === dur) + '"><b>' + d + ' min</b><span>' + n + ' questions</span></button>';
      }).join('');
      h('<div class="narrow stack"><div><div class="row"><span class="pill accent">' + esc(t.subject) + '</span><span class="pill">' + (t.mode === 'exam' ? 'Exam' : 'Practice') + '</span></div>' +
        '<h1 style="margin-top:12px">' + esc(t.title) + '</h1><p class="muted">' + esc(t.description || '') + '</p></div>' +
        '<div class="card stack">' +
        (t.active_attempt ? '<div class="note">You have an unfinished attempt. Continue where you left off.</div><a class="btn block" href="/exam/' + t.active_attempt + '" data-link>Resume test</a>' :
          '<div><p class="f" style="margin-top:0;font-weight:700">How much time do you have?</p><div class="seg" id="seg">' + segs + '</div></div>' +
          '<ul class="rules small"><li>' + t.sec_per_q + ' seconds per question, one question at a time.</li><li>No going back once you move on.</li>' +
          '<li>The paper submits automatically when time ends.</li><li>' + (t.show_result ? 'You will see your score and answers right after submitting.' : 'Results will be released by your teacher.') + '</li></ul>' +
          (opens ? '<div class="note">Opens ' + esc(fmtDate(t.open_at)) + '</div>' : '') +
          '<div class="err" id="er" role="alert"></div><button class="btn block" id="go">' + (session ? 'Prepare my paper' : 'Sign in to start') + '</button>') +
        '<p class="small muted center" style="margin:0">Free forever. Your progress is saved to your dashboard.</p></div></div>');
      var sg = q('#seg');
      if (sg) sg.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        dur = +b.getAttribute('data-d');
        Array.prototype.forEach.call(sg.children, function (c) { c.setAttribute('aria-pressed', c === b); });
      });
      var g = q('#go');
      if (g) g.onclick = function () {
        if (!requireAuth('/t/' + slug)) return;
        g.disabled = true; g.textContent = 'Preparing your paper…';
        rpc('start_attempt', { p_slug: slug, p_duration: dur }).then(function (v) {
          go('/exam/' + v.attempt);
        }).catch(function (e) {
          var m = errMsg(e);
          if (m === 'PROFILE_INCOMPLETE') return go('/profile?next=/t/' + slug);
          q('#er').textContent = lockText(m); g.disabled = false; g.textContent = 'Prepare my paper';
        });
      };
    }).catch(function (e) { h('<div class="card narrow center"><p>' + esc(errMsg(e)) + '</p></div>'); });
  }

  /* ---------- sharing ---------- */
  var SHARE_ICONS = {
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>',
    fb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 8h3V4h-3c-2.8 0-4 1.7-4 4.3V10H7v4h3v8h4v-8h3l1-4h-4V8.6c0-.4.3-.6.6-.6z"/></svg>',
    tg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.5 3.6 2.9 10.8c-1.3.5-1.2 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.4l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.4-1.5zM9.5 14.5l8.6-7.6c.4-.3-.1-.5-.6-.2l-10.6 6.7"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14"/></svg>'
  };
  function shareBar(url, text, label) {
    var enc = encodeURIComponent, full = text + ' ' + url;
    return '<div class="share" data-url="' + esc(url) + '" data-text="' + esc(text) + '"><span class="small muted">' + esc(label || 'Invite friends:') + '</span>' +
      (navigator.share ? '<button type="button" class="sh" data-sh="native" aria-label="Share">' + SHARE_ICONS.share + '<span>Share</span></button>' : '') +
      '<a class="sh wa" target="_blank" rel="noopener" href="https://wa.me/?text=' + enc(full) + '" aria-label="Share on WhatsApp">' + SHARE_ICONS.wa + '<span>WhatsApp</span></a>' +
      '<a class="sh fb" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=' + enc(url) + '" aria-label="Share on Facebook">' + SHARE_ICONS.fb + '<span>Facebook</span></a>' +
      '<a class="sh tg" target="_blank" rel="noopener" href="https://t.me/share/url?url=' + enc(url) + '&text=' + enc(text) + '" aria-label="Share on Telegram">' + SHARE_ICONS.tg + '<span>Telegram</span></a>' +
      '<button type="button" class="sh" data-sh="copy" aria-label="Copy link">' + SHARE_ICONS.link + '<span>Copy link</span></button></div>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-sh]'); if (!b) return;
    var box = b.closest('.share'), url = box.getAttribute('data-url'), text = box.getAttribute('data-text');
    if (b.getAttribute('data-sh') === 'native') { navigator.share({ title: 'VKV Sir Test Lab', text: text, url: url }).catch(function () {}); return; }
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { toast('Link copied'); }, function () { window.prompt('Copy this link', url); });
  });
  function practiceLink(subj, unit, topic) {
    return location.origin + '/p/' + subj.toLowerCase() + (unit ? '/' + unit : '') + (unit && topic ? '/' + topic : '');
  }
  function findNode(cat, subjId, unitNo, topicId) {
    var subj = cat.filter(function (c) { return c.id.toLowerCase() === String(subjId).toLowerCase(); })[0];
    if (!subj) return null;
    var unit = unitNo ? subj.units.filter(function (u) { return String(u.unit) === String(unitNo); })[0] : null;
    var topic = unit && topicId ? unit.topics.filter(function (t) { return t.id === topicId; })[0] : null;
    return { subj: subj, unit: unit, topic: topic };
  }

  /* ---------- focused practice page (shared / YouTube links) ---------- */
  function viewFocus(subjId, unitNo, topicId) {
    setNav('home'); loading();
    rpc('catalog').then(function (cat) {
      var n = findNode(cat || [], subjId, unitNo, topicId);
      if (!n) { h('<div class="narrow card center"><h2>This practice link is not active yet</h2><p class="muted">Explore what is available instead.</p><a class="btn" href="/" data-link>See all tests</a></div>'); return; }
      var node = n.topic || n.unit || n.subj, ds = node.durations || [], dur = ds.length ? ds[0] : null;
      var title = n.topic ? n.topic.name : n.unit ? 'Unit ' + n.unit.unit + ': ' + n.unit.name : n.subj.name + ': full syllabus';
      var crumbs = [n.subj.name, n.unit && !n.topic ? null : n.unit ? 'Unit ' + n.unit.unit + ': ' + n.unit.name : null].filter(Boolean).join(' · ');
      var url = practiceLink(n.subj.id, n.unit && n.unit.unit, n.topic && n.topic.id);
      h('<div class="narrow stack focus"><div class="card center stack">' +
        '<p class="eyebrow">Free practice quiz</p><h1>' + esc(title) + '</h1>' + (crumbs && crumbs !== title ? '<p class="muted" style="margin:0">' + esc(crumbs) + '</p>' : '') +
        (ds.length ? '<div><p class="f">How much time do you have?</p><div class="seg" id="fd">' + ds.map(function (d) { return '<button type="button" data-d="' + d + '" aria-pressed="' + (d === dur) + '"><b>' + d + ' min</b><span>' + Math.floor(d * 60 / 45) + ' questions</span></button>'; }).join('') + '</div></div>' +
          '<ul class="rules small" style="text-align:left"><li>A fresh, balanced paper every time.</li><li>One question at a time, 45 seconds each.</li><li>Instant score with correct answers for what you miss.</li></ul>' +
          '<div class="err" id="fe" role="alert"></div><button class="btn block" id="fgo">' + (session ? 'Start my quiz' : 'Sign in with email and start') + '</button>' +
          (session ? '' : '<p class="small muted" style="margin:0">Free. No password. Takes 30 seconds.</p>')
          : '<p class="muted">Questions for this topic are being added. Try the full unit for now.</p>' + (n.unit ? '<a class="btn" href="' + practiceLink(n.subj.id, n.unit.unit) + '" data-link>Practise the whole unit</a>' : '')) +
        '</div>' + shareBar(url, 'Try this free ' + title + ' quiz by VKV Sir:', 'Invite a friend to this quiz:') +
        '<p class="center small"><a href="/" data-link>Explore all subjects and tests</a></p></div>');
      var fd = q('#fd'); if (fd) fd.onclick = function (e) { var b = e.target.closest('button'); if (!b) return; dur = +b.getAttribute('data-d'); Array.prototype.forEach.call(fd.children, function (c) { c.setAttribute('aria-pressed', c === b); }); };
      var g = q('#fgo'); if (g) g.onclick = function () {
        if (!requireAuth(location.pathname)) return;
        g.disabled = true; g.textContent = 'Preparing your paper…';
        rpc('start_custom', { p_subject: n.subj.id, p_unit: n.unit ? n.unit.unit : null, p_topic: n.topic ? n.topic.id : null, p_duration: dur })
          .then(function (v) { go('/exam/' + v.attempt); })
          .catch(function (e) { var m = errMsg(e); if (m === 'PROFILE_INCOMPLETE') return go('/profile?next=' + location.pathname); q('#fe').textContent = lockText(m); g.disabled = false; g.textContent = 'Start my quiz'; });
      };
    }).catch(function (e) { h('<div class="card narrow center"><p>' + esc(errMsg(e)) + '</p></div>'); });
  }

  /* ---------- plan: real PDF file, then download or share (Drive, Gmail, WhatsApp…) ---------- */
  function loadPdfLib() {
    if (window.html2pdf) return Promise.resolve();
    return new Promise(function (ok, bad) { var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'; s.onload = ok; s.onerror = bad; document.head.appendChild(s); });
  }
  function planPdf(p) {
    var name = 'VKV-Sir-Preparation-Plan-' + String((p.role && p.role.name) || 'Plan').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.pdf';
    return loadPdfLib().then(function () {
      var src = q('#jout section'); var wrap = document.createElement('div'); wrap.className = 'pdfx';
      wrap.innerHTML = '<div class="pdfx-h"><b>VKV Sir Test Lab</b> · Interview Preparation Plan<span>test.vkvsir.com</span></div>' + src.outerHTML +
        '<div class="pdfx-f">Prepared on VKV Sir Test Lab (test.vkvsir.com) · www.vkvsir.com · Practise every topic free online</div>';
      Array.prototype.forEach.call(wrap.querySelectorAll('button,.btn'), function (b) { b.remove(); });
      Array.prototype.forEach.call(wrap.querySelectorAll('.rv,.rv-in'), function (el) { el.classList.remove('rv', 'rv-in'); });
      // <details> is drawn badly by the PDF renderer (text overlaps): turn each one into plain, always-open blocks
      Array.prototype.forEach.call(wrap.querySelectorAll('details'), function (d) {
        var box = document.createElement('div'); box.className = 'pdq ' + (d.className || '');
        Array.prototype.forEach.call(d.childNodes, function (n) {
          if (n.nodeType === 1 && n.tagName === 'SUMMARY') { var s = document.createElement('div'); s.className = 'pdq-q'; s.innerHTML = n.innerHTML; box.appendChild(s); }
          else box.appendChild(n.cloneNode(true));
        });
        d.parentNode.replaceChild(box, d);
      });
      Array.prototype.forEach.call(wrap.querySelectorAll('.caret,.print-only,.no-pdf'), function (el) { el.remove(); });
      Array.prototype.forEach.call(wrap.querySelectorAll('p.small.muted'), function (el) { if (/tap to see/i.test(el.textContent)) el.remove(); });
      var sx = window.scrollX, sy = window.scrollY; window.scrollTo(0, 0);
      return window.html2pdf().set({ margin: [10, 10, 12, 10], filename: name, image: { type: 'jpeg', quality: 0.92 }, html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollX: 0, scrollY: 0 }, jsPDF: { unit: 'mm', format: 'a4' }, pagebreak: { mode: ['css', 'legacy'], avoid: ['.pdq', '.jp-skill', 'li', 'h2', '.cp-r'] } })
        .from(wrap).outputPdf('blob').then(function (blob) { window.scrollTo(sx, sy); return { blob: blob, name: name }; }, function (e) { window.scrollTo(sx, sy); throw e; });
    });
  }
  function planSaveButtons(p) {
    var bd = q('#jp-pdf'), bs = q('#jp-share'); if (!bd) return;
    var cache = null;
    function make(btn, label) { btn.disabled = true; btn.textContent = 'Preparing PDF…'; return (cache || (cache = planPdf(p))).finally(function () { btn.disabled = false; btn.textContent = label; }); }
    bd.onclick = function () {
      make(bd, '⬇ Download PDF').then(function (r) { var a = document.createElement('a'); a.href = URL.createObjectURL(r.blob); a.download = r.name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000); })
        .catch(function () { toast('Could not make the PDF. Use Print → Save as PDF instead.'); });
    };
    var probe = null; try { probe = new File([''], 'x.pdf', { type: 'application/pdf' }); } catch (e) {}
    var touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    if (touch && probe && navigator.canShare && navigator.canShare({ files: [probe] })) {
      bs.hidden = false;
      bs.onclick = function () {
        make(bs, '📤 Save to Drive / Email / WhatsApp').then(function (r) {
          var f = new File([r.blob], r.name, { type: 'application/pdf' });
          return navigator.share({ files: [f], title: 'My preparation plan', text: 'My interview preparation plan from VKV Sir Test Lab (test.vkvsir.com)' });
        }).catch(function (e) { if (e && e.name !== 'AbortError') toast('Sharing is not available here. Use Download PDF.'); });
      };
    }
  }

  /* ---------- why this platform (features & how-to) ---------- */
  function viewWhy() {
    setNav('');
    function sec(id, icon, title, lead, pts, how) {
      return '<section class="why-sec" id="' + id + '"><h2><span>' + icon + '</span>' + title + '</h2><p class="muted">' + lead + '</p><ul class="why-pts">' + pts.map(function (p) { return '<li><b>' + p[0] + '</b> ' + p[1] + '</li>'; }).join('') + '</ul>' +
        (how ? '<details class="why-how"><summary>How to use it</summary><ol>' + how.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol></details>' : '') + '</section>';
    }
    h('<div class="why narrow-wide"><div class="why-hero"><p class="eyebrow">About the platform</p><h1>World-class preparation, <em>completely free</em>.</h1>' +
      '<p class="muted">VKV Sir Test Lab brings practice tests, company-wise job preparation and a professional resume builder together in one place, built and reviewed by the VKV Sir team of experts for semester exams, competitive exams and campus placements.</p>' +
      '<nav class="why-toc">' + [['tests', 'Practice tests'], ['images', 'Image questions'], ['jobprep', 'Job Prep'], ['resume', 'Resume builder'], ['trust', 'Quality & fairness']].map(function (t) { return '<a href="#' + t[0] + '">' + t[1] + '</a>'; }).join('') + '</nav></div>' +
      sec('tests', '🎯', 'Practice tests that adapt to you', 'Pick a subject, unit or single topic and get a freshly balanced paper in seconds.', [
        ['Fresh paper every time:', 'questions are mixed from easy to hard, so repeated attempts stay useful.'],
        ['Fair timing and instant results:', 'see your score, correct answers and clear explanations right away.'],
        ['Unit-wise insight:', 'results show where you are strong and which units need more work.'],
        ['Three learning tracks:', 'semester subjects, competitive exams (aptitude, reasoning and more) and career preparation.'],
        ['Works everywhere:', 'designed for phones first, equally comfortable on laptops.']],
        ['Tap <b>Start practising</b> on the home page.', 'Choose your track, then tick a whole subject, some units or single topics.', 'Pick the time and mode, attempt the paper, then study the explanations of what you missed.']) +
      sec('images', '🖼️', 'Image-based questions', 'Many real exams test whether you can read a diagram, not just recall a definition. We redraw every figure cleanly.', [
        ['Clean, redrawn diagrams:', 'line drawings for machines, shaded 3D models for tools such as milling cutters, clear charts and figure series.'],
        ['Labelled-part questions:', 'one diagram with parts marked A–F; each student gets a different part to identify, and confusing neighbouring parts are never put side by side in the options.'],
        ['Four-figure questions:', 'compare four tools, layouts or charts numbered 1–4 at a glance.'],
        ['Zoom built in:', 'hover over an image on a laptop or pinch on a phone to see every detail.'],
        ['Fits one screen:', 'figure, question and all options stay visible without scrolling.']]) +
      sec('jobprep', '🏢', 'Job Prep: prepare for the exact company', 'Enter a role, company or job post and get a personal preparation plan.', [
        ['Software footprint from real job posts:', 'we track which software each company asks for in its current openings and label it <i>Asked now</i>, <i>Rising</i> or <i>Used earlier</i>. Small companies get suggestions from similar companies in the same field.'],
        ['Updated automatically:', 'company career pages and hiring-system feeds are read every night, and refreshed live when you search.'],
        ['Company interview questions:', 'common themes reported by candidates, with model answers written by us, plus HR and behavioural questions.'],
        ['Shared by seniors:', 'students who were interviewed recently can share their questions; we review each one and add a model answer.'],
        ['Take it with you:', 'download your plan as a neat PDF (or save it to Drive or WhatsApp on your phone).']],
        ['Open <b>Job Prep</b> from the top menu.', 'Choose your branch and role, add the company (or paste a job post) and tap <b>Build my preparation plan</b>.', 'Learn the 🔥 software first, practise the linked topics, then rehearse the interview questions aloud.']) +
      sec('resume', '📄', 'Free ATS resume builder', 'Most companies screen resumes with Applicant Tracking Systems (ATS) before a person reads them. Our builder is designed to pass that step.', [
        ['Unlimited downloads, free:', 'PDF and Word (.docx), as many versions as you need. No subscription, no watermark.'],
        ['Real-text PDF:', 'the text inside the file can be read by ATS software. Image-based or heavily designed PDFs often lose information when scanned.'],
        ['ATS-safe layout:', 'one column, standard headings, a plain professional font, dates aligned right. Multi-column templates with icons and graphics, common in design tools, can be misread by ATS.'],
        ['Keywords from real job posts:', 'see the skills and software recruiters search for, including your target company’s current requirements.'],
        ['Match a job post:', 'paste any job description to get a % match and the exact keywords you are missing.'],
        ['Explained ATS score:', 'a score out of 100 in nine clear parts, with quick fixes.'],
        ['Profile booster:', 'personal next steps: internships, NPTEL certificates, hackathons, papers, leadership roles, GATE / GRE timing.'],
        ['Goal-aware:', 'guidance for private jobs, internships, PSUs, government exams, defence and higher studies in India or abroad.'],
        ['Less typing:', 'type a few letters to pick from hundreds of software names, skills and example lines.']],
        ['Open <b>test.vkvsir.com/resume</b> (or the card on the Job Prep page).', 'Tick your goals, choose a target role and company, and fill the seven short steps. The preview updates as you type.', 'On the last step, check your score, paste the job post you are applying to, and download PDF or Word.']) +
      '<section class="why-sec"><h2><span>⚖️</span>How our resume builder compares</h2><div class="why-tbl"><table class="table"><thead><tr><th></th><th>VKV Sir Test Lab</th><th>Typical paid builders</th><th>Design-template tools</th></tr></thead><tbody>' +
        [['Price to download', '✓ Free, unlimited', 'Often needs a subscription', 'Usually free'], ['Word (.docx) download', '✓ Yes', 'Often paid', 'Limited'], ['ATS-safe single-column layout', '✓ Always', 'Depends on template', 'Often multi-column with graphics'], ['Keywords from real Indian job posts', '✓ Yes, company-wise', 'Generic', 'No'], ['Job-post match %', '✓ Free', 'Often paid', 'No'], ['Guidance for GATE, PSU, govt. and higher studies', '✓ Built in', 'No', 'No']]
          .map(function (r) { return '<tr><td>' + r[0] + '</td><td><b>' + r[1] + '</b></td><td>' + r[2] + '</td><td>' + r[3] + '</td></tr>'; }).join('') +
      '</tbody></table></div><p class="small muted">General comparison of common approaches, not of any specific product. Features of other services vary and change over time.</p></section>' +
      sec('trust', '🧑‍🏫', 'Quality and fairness', 'Good practice is only useful if the questions are right and the tests are fair.', [
        ['Expert-prepared:', 'questions are written and double-checked before publishing.'],
        ['Report anything doubtful:', 'tap 🚩 Report on any question; our team reviews it promptly.'],
        ['Fair tests:', 'timed papers with protections against switching away during an attempt.'],
        ['Private drafts:', 'resumes you save are visible only to you, in your own account.'],
        ['Free forever:', 'our aim is world-class preparation available to every student, without paywalls.']]) +
      '<div class="why-cta"><a class="btn" href="/" data-link>▶ Start practising</a><a class="btn ghost" href="/career" data-link>🏢 Job Prep</a><a class="btn ghost" href="/resume" data-link>📄 Build my resume</a></div></div>');
  }

  /* ---------- resume builder (loaded on demand) ---------- */
  function viewResume() {
    setNav('resume'); loading();
    var api = { h: h, esc: esc, rpc: rpc, q: q, toast: toast, setNav: setNav, sb: sb, errMsg: errMsg, get session() { return session; }, get profile() { return profile; } };
    function run() { window.RB.render(api); }
    if (window.RB) return run();
    var s = document.createElement('script'); s.src = '/resume.js?v=8'; s.onload = run;
    s.onerror = function () { h('<div class="card narrow center"><p>Could not load the resume builder. Please refresh.</p></div>'); };
    document.head.appendChild(s);
  }

  /* ---------- career / job preparation planner ---------- */
  var jpOpts = null;
  function viewCareer() {
    setNav('career'); loading();
    var load = jpOpts ? Promise.resolve(jpOpts) : rpc('jp_options').then(function (o) { jpOpts = o; return o; });
    load.then(function (o) {
      var saved = {}; try { saved = JSON.parse(localStorage.getItem('jp_last') || '{}'); } catch (e) {}
      var fams = {}; (o.roles || []).forEach(function (r) { (fams[r.family] = fams[r.family] || []).push(r); });
      var roleOpts = '<option value="">Not sure: detect from the job post</option>' + Object.keys(fams).map(function (f) {
        return '<optgroup label="' + esc(f) + '">' + fams[f].map(function (r) { return '<option value="' + esc(r.id) + '">' + esc(r.name) + '</option>'; }).join('') + '</optgroup>';
      }).join('');
      var brOpts = '<option value="">Select your branch</option>' + (o.branches || []).map(function (b) { return '<option value="' + esc(b.id) + '">' + esc(b.name) + '</option>'; }).join('');
      var levels = [['student', 'Student', 'Still studying'], ['fresher', 'Fresher', '0 to 1 year'], ['junior', 'Experienced', '2 to 4 years'], ['senior', 'Senior', '5+ years']];
      h('<section class="hero jp-hero"><p class="eyebrow">Career &amp; interview preparation</p><h1>Know exactly what to prepare for <em>your</em> target job.</h1>' +


        '<p class="muted" style="max-width:680px">Tell us the company, role and branch, or paste the job post. You get a clear plan: the most important subjects and topics, what to refresh, software to learn, likely interview questions, and one-click practice for each topic.</p></section>' +
        '<details class="softinfo"><summary>How your plan is built</summary><p>We match your role and branch to the topics, software and interview questions that matter. For the company, we use its <b>current job posts</b> (read nightly from career pages and hiring systems, and refreshed when you search) to show which software it is asking for now. If we have little data for a company, we show what similar companies in the same field ask for. <a href="/why#jobprep" data-link>Learn more</a></p></details>' +
        '<div class="card stack jp-form">' +
        '<div class="two"><div><label class="f" for="jc">Company (optional)</label><input class="in" id="jc" list="jcl" placeholder="e.g. Tata Motors, Infosys, L&amp;T" autocomplete="off"><datalist id="jcl">' + (o.companies || []).map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist><input class="in" id="ju" placeholder="Company website (optional), e.g. www.tatamotors.com" style="margin-top:6px"></div>' +
        '<div><label class="f" for="jr">Job role</label><select class="in" id="jr">' + roleOpts + '</select></div></div>' +
        '<div class="two"><div><label class="f" for="jb">Your branch / degree</label><select class="in" id="jb">' + brOpts + '</select></div>' +
        '<div><span class="f">Your level</span><div class="seg" id="jl">' + levels.map(function (l) { return '<button type="button" data-l="' + l[0] + '" aria-pressed="false"><b>' + l[1] + '</b><span>' + l[2] + '</span></button>'; }).join('') + '</div></div></div>' +
        '<div><label class="f" for="jt">Job post or description (optional, but gives the best result)</label><textarea class="in" id="jt" rows="6" placeholder="Paste the full job post text from LinkedIn, Naukri, the company careers page or the campus notice. Include skills, eligibility and responsibilities."></textarea>' +
        '<p class="small muted" style="margin:6px 0 0">Tip: links cannot be opened automatically (LinkedIn and Naukri block it). Open the post, select all its text, copy and paste it here.</p></div>' +
        '<div class="err" id="je" role="alert"></div><button class="btn block" id="jgo">Build my preparation plan</button></div>' +
        '<div id="iqr-slot"></div><div id="jout"></div>');
      q('#iqr-slot').appendChild(reportBox(saved.company || '', ''));
      q('#iqr-slot').appendChild(salaryBox(saved.company || ''));
      var level = saved.level || 'fresher';
      function setLevel(v) { level = v; Array.prototype.forEach.call(q('#jl').children, function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-l') === v); }); }
      setLevel(level);
      q('#jl').onclick = function (e) { var b = e.target.closest('button'); if (b) setLevel(b.getAttribute('data-l')); };
      if (saved.company) q('#jc').value = saved.company; if (saved.url && q('#ju')) q('#ju').value = saved.url; if (saved.role) q('#jr').value = saved.role; if (saved.branch) q('#jb').value = saved.branch; if (saved.text) q('#jt').value = saved.text;
      q('#jgo').onclick = function () {
        var inp = { url: (q('#ju') ? q('#ju').value.trim() : ''), company: q('#jc').value.trim(), role: q('#jr').value, branch: q('#jb').value, level: level, text: q('#jt').value.trim() };
        if (!inp.company && !inp.url && !inp.role && !inp.text && !inp.branch) { q('#je').textContent = 'Choose a role or branch, or paste a job post.'; return; }
        q('#je').textContent = '';
        try { localStorage.setItem('jp_last', JSON.stringify(inp)); } catch (e) {}
        var b = this; b.disabled = true; b.textContent = 'Building your plan…';
        rpc('jp_plan', { p_text: inp.text || null, p_company: inp.company || null, p_role: inp.role || null, p_branch: inp.branch || null, p_level: inp.level, p_industry: null })
          .then(function (plan) { window.__jpInp = inp; renderPlan(plan); b.disabled = false; b.textContent = 'Rebuild plan'; q('#jout').scrollIntoView({ behavior: 'smooth' }); })
          .catch(function (e) { q('#je').textContent = errMsg(e); b.disabled = false; b.textContent = 'Build my preparation plan'; });
      };
      if (/auto=1/.test(location.search) && (saved.company || saved.text || saved.branch)) q('#jgo').click();
    }).catch(function (e) { h('<div class="card narrow center"><p>' + esc(errMsg(e)) + '</p></div>'); });
  }

  function renderPlan(p) {
    var lvlName = { student: 'Student', fresher: 'Fresher (0–1 yr)', junior: 'Experienced (2–4 yrs)', senior: 'Senior (5+ yrs)' }[p.level] || p.level;
    var tiers = [[1, 'Most important', 'Interviewers are most likely to ask these. Master them first and practise until you score 80%+.', 'hi'],
                 [2, 'Normal level', 'Commonly asked follow-ups and related areas. Aim for 70%+.', 'mid'],
                 [3, 'Fundamentals & refresh', 'Basics behind the role, plus aptitude, HR and company research. Revise and keep them warm.', 'lo']];
    var sk = p.skills || [], sw = p.software || [];
    function practice(l) {
      var label = esc(l.name || (l.s + ' unit ' + l.u));
      if (l.q >= 10) return '<li><span>' + label + '</span><a class="btn small-btn" href="/p/' + esc(String(l.s).toLowerCase()) + '/' + esc(l.u) + '" data-link>Practise</a></li>';
      return '';
    }
    function skillCard(s) {
      return '<article class="card jp-skill"><div class="spread"><h3>' + esc(s.name) + '</h3><span class="pill">' + esc(s.area || '') + '</span></div>' +
        (s.why ? '<p class="muted small" style="margin:4px 0 10px">' + esc(s.why) + '</p>' : '') +
        (s.subtopics && s.subtopics.length ? '<p class="f" style="margin:0">Key topics</p><div class="chips">' + s.subtopics.slice(0, s.tier === 1 ? 4 : 3).map(function (t) { return '<span class="chip">' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
        (s.links && s.links.filter(function (l) { return l.q >= 10; }).length ? '<p class="f" style="margin:12px 0 4px">Practise</p><ul class="jp-links">' + s.links.slice(0, 3).map(practice).join('') + '</ul>' : '<p class="small muted" style="margin-top:10px">Prepare with your notes and real examples from your projects or internship.</p>') +
        '</article>';
    }
    function swCard(w) {
      return '<article class="card jp-skill"><div class="spread"><h3>' + esc(w.name) + '</h3><span class="pill ' + (w.tier === 1 ? 'accent' : '') + '">' + (w.tier === 1 ? 'Must know' : w.tier === 2 ? 'Good to know' : 'Awareness') + '</span></div>' +
        '<p class="small" style="margin:4px 0 10px"><b>Target level:</b> ' + esc(w.target || '') + '</p>' +
        (w.learn && w.learn.length ? '<p class="f" style="margin:0">What to learn</p><ul class="list small">' + w.learn.slice(0, 3).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
        (w.questions && w.questions.length ? '<p class="f" style="margin:10px 0 0">Likely questions</p><ul class="list small">' + w.questions.slice(0, 2).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
        (w.practical ? '<p class="small jp-task"><b>Practical task:</b> ' + esc(w.practical) + '</p>' : '') + '</article>';
    }
    var steps = [];
    steps.push('<b>Understand the job.</b> ' + esc((p.role && p.role.summary) || '') + (p.company && p.company.products ? ' <b>' + esc(p.company.name) + '</b> makes: ' + esc(p.company.products) + '.' : ''));
    if (p.level === 'student' || p.level === 'fresher') steps.push('<b>Clear the online test.</b> Practise aptitude, reasoning and English daily (30–45 minutes) until you score 70%+.');
    steps.push('<b>Master the most important topics</b> listed below. Learn each topic, then take the practice quiz; repeat the weak ones.');
    steps.push('<b>Strengthen the normal-level topics</b> once tier 1 scores are steady.');
    steps.push('<b>Refresh fundamentals</b> one or two per day so basic questions never trip you.');
    if (sw.length) steps.push('<b>Learn the software</b> to the target level and finish at least one practical task you can show or explain.');
    steps.push('<b>Prepare HR answers and company knowledge.</b> Write your "tell me about yourself", two project stories, and three facts about the company.');
    steps.push('<b>Final week:</b> take mixed timed quizzes daily, revise mistakes from your Dashboard, and rest well before the interview.');
    var mix = p.mix || {};
    var html = '<section class="stack" style="margin-top:28px">' +
      '<div class="card jp-sum"><p class="eyebrow">Your preparation plan</p><h2 style="margin:4px 0">' + esc(p.role ? p.role.name : 'Your target role') + '</h2>' +
      '<div class="chips">' + (p.company ? '<span class="chip">🏢 ' + esc(p.company.name) + '</span>' : '') + (p.industry ? '<span class="chip">🏭 ' + esc(p.industry.name) + '</span>' : '') +
      (p.branch ? '<span class="chip">🎓 ' + esc(p.branch) + '</span>' : '') + '<span class="chip">📈 ' + esc(lvlName) + '</span></div>' +
      (p.industry && p.industry.about ? '<p class="small muted" style="margin:10px 0 0">' + esc(p.industry.about) + '</p>' : '') +
      '<p class="small" style="margin:10px 0 0"><b>Expected question level:</b> about ' + (mix.E || 0) + '% basic, ' + (mix.M || 0) + '% moderate, ' + (mix.H || 0) + '% advanced.</p>' +
      (p.hits && p.hits.length ? '<p class="small" style="margin:6px 0 0"><b>Picked up from the job post:</b> ' + p.hits.map(esc).join(', ') + '</p>' : '') + '</div>' +
      '<div class="card"><h2>What to do, step by step</h2><ol class="jp-steps">' + steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol></div>';
    tiers.forEach(function (t) {
      var list = sk.filter(function (s) { return s.tier === t[0]; }).slice(0, t[0] === 1 ? 6 : 5);
      if (!list.length) return;
      if (t[0] === 3) { html += '<div class="jp-tier lo"><h2><span class="jp-badge">3</span>' + t[1] + '</h2><p class="muted small" style="margin-top:-6px">' + t[2] + '</p><div class="card"><div class="chips">' + list.map(function (s) { var l = (s.links || []).filter(function (x) { return x.q >= 10; })[0]; return l ? '<a class="chip" href="/p/' + esc(String(l.s).toLowerCase()) + '/' + esc(l.u) + '" data-link>' + esc(s.name) + ' →</a>' : '<span class="chip">' + esc(s.name) + '</span>'; }).join('') + '</div></div></div>'; return; }
      html += '<div class="jp-tier ' + t[3] + '"><h2><span class="jp-badge">' + t[0] + '</span>' + t[1] + ' <span class="muted small">(' + list.length + ')</span></h2><p class="muted small" style="margin-top:-6px">' + t[2] + '</p><div class="grid">' + list.map(skillCard).join('') + '</div></div>';
    });
    sw = sw.filter(function (w) { return w.tier <= 2; }).slice(0, 4);
    if (sw.length) html += '<div class="jp-tier jp-swt"><h2><span class="jp-badge">⚙</span>Software &amp; practical skills</h2><p class="muted small" style="margin-top:-6px">Learn to the target level and be ready to explain one thing you built with it.</p><div class="grid">' + sw.map(swCard).join('') + '</div></div>';
    var tr = (p.role && p.role.traits) || [];
    if (tr.length) html += '<div class="card"><h2>Qualities they look for</h2><div class="chips">' + tr.map(function (x) { return '<span class="chip">' + esc(x) + '</span>'; }).join('') + '</div><p class="small muted" style="margin:10px 0 0">Prepare one short real example for each quality. Interviewers remember stories, not adjectives.</p></div>';
    html += '<div class="row" style="gap:10px;flex-wrap:wrap"><button class="btn" type="button" id="jp-pdf">⬇ Download PDF</button><button class="btn ghost" type="button" id="jp-share" hidden>📤 Save to Drive / Email / WhatsApp</button><button class="btn" type="button" onclick="window.print()">🖨 Print</button><a class="btn" href="/me" data-link>Track my progress</a></div>' +
      '<p class="small muted">This plan is prepared from VKV Sir\'s research on companies, roles and skills to guide your preparation. Actual interview questions can vary by panel and position.</p></section>';
    html = '<div class="print-only pr-wm"><img src="/favicon.svg" alt=""><span>www.vkvsir.com</span></div>' +
      '<table class="prt"><thead><tr><td><div class="pr-head"><img src="/favicon.svg" alt=""><span><b>VKV Sir Test Lab</b> · Interview Preparation Plan</span><span>test.vkvsir.com · www.vkvsir.com</span></div></td></tr></thead>' +
      '<tfoot><tr><td><div class="pr-foot">Prepared on VKV Sir Test Lab (test.vkvsir.com) · www.vkvsir.com · Practise every topic free online</div></td></tr></tfoot>' +
      '<tbody><tr><td>' + html + '</td></tr></tbody></table>';
    q('#jout').innerHTML = html;
    planSaveButtons(p);
    var ids = sk.filter(function (s) { return s.tier <= 2; }).map(function (s) { return s.id; });
    var secEl = q('#jout section');
    var inp0 = window.__jpInp || {};
    if (inp0.company || inp0.url) {
      var cpBox = document.createElement('div'); cpBox.className = 'card cp';
      cpBox.innerHTML = '<p class="eyebrow">Know your company</p><h2 style="margin:4px 0 10px">' + esc(inp0.company || inp0.url) + '</h2><p class="small muted">Collecting company information…</p>';
      if (secEl) secEl.insertBefore(cpBox, secEl.children[1]);
      var cpP = rpc('jp_company_profile', { p_company: inp0.company || null, p_url: inp0.url || null }).catch(function () { return null; });
      var live = cpP.then(function (cc) {
        if (cc && cc.auto && cc.auto_at && (Date.now() - new Date(cc.auto_at).getTime()) < 30 * 864e5) return cc.auto;
        return sb.functions.invoke('jp-company', { body: { id: cc && cc.id ? cc.id : undefined, name: (cc && cc.name) || inp0.company || null, url: inp0.url || (cc && cc.website) || null } }).then(function (r) { var d = (r && r.data) || {}; if (cc && cc.auto) { if (!d.wiki && cc.auto.wiki) d.wiki = cc.auto.wiki; if (!d.site && cc.auto.site) d.site = cc.auto.site; } return d; }).catch(function () { return (cc && cc.auto) || {}; });
      });
      Promise.all([cpP, live,
        rpc('jp_competitors', { p_company: inp0.company || null, p_url: inp0.url || null }).catch(function () { return null; })]).then(function (res) {
        var c = res[0] || {}, L = res[1] || {}, comp = res[2] || {}, pf = c.profile || {}, W = (L.wiki && L.wiki.fields) || {}, S = L.site || {};
        function sp(v) { return v ? String(v).split(/;\s*/).map(function (x) { return x.trim(); }).filter(Boolean) : null; }
        var rows = [], F = S.facts || {}, PL = S.places || {};
        function row(k, v) { if (!v || (Array.isArray(v) && !v.length)) return; rows.push('<div class="cp-r"><span>' + k + '</span><div>' + (Array.isArray(v) ? (v.length === 1 && !Array.isArray(v[0]) ? esc(v[0]) : '<ul>' + v.map(function (x) { return '<li>' + (Array.isArray(x) ? '<b>' + esc(x[0]) + ':</b> ' + esc(x[1]) : esc(x)) + '</li>'; }).join('') + '</ul>') : esc(v)) + '</div></div>'); }
        function chips(k, arr) { if (!arr || !arr.length) return; rows.push('<div class="cp-r"><span>' + k + '</span><div class="chips">' + arr.map(function (x) { return '<span class="chip">' + esc(x) + '</span>'; }).join('') + '</div></div>'); }
        var title = pf.full_name || (L.wiki && L.wiki.title) || c.name || S.name || inp0.company || inp0.url;
        var paras = [];
        if (L.wiki && L.wiki.summary) paras.push(L.wiki.summary);
        (S.about || []).forEach(function (p) { if (paras.length < 3 && p.length > 80) paras.push(p); });
        if (!paras.length && S.description) paras.push(S.description);
        var keyFacts = [];
        if (F.founded) keyFacts.push('Founded ' + F.founded);
        if (F.team) keyFacts.push(F.team); if (F.clients) keyFacts.push(F.clients); if (F.projects) keyFacts.push(F.projects);
        if (F.countries) keyFacts.push('Serves ' + F.countries); if (F.experience) keyFacts.push(F.experience);
        row('Full name', pf.full_name || (L.wiki && L.wiki.title) || c.name || S.name);
        var off = L.official || c.website || S.url;
        if (off) { var offU = /^https?:/.test(off) ? off : 'https://' + off; rows.push('<div class="cp-r"><span>Official website</span><div><a href="' + esc(offU) + '" target="_blank" rel="noopener">' + esc(offU.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')) + ' ↗</a></div></div>'); }
        row('Industry', c.industry || comp.industry || W.industry);
        row('Type', W.type);
        row('Founded', pf.founded || W.founded || F.founded); row('Founders', sp(W.founders) || (S.founder ? [S.founder] : null));
        row('Head office', pf.hq || W.hq || S.address);
        row('Offices / presence', pf.presence || W.area_served || ((PL.cities || []).length || (PL.countries || []).length ? [(PL.cities || []).concat(PL.countries || []).join(', ')] : null));
        row('Employees', pf.employees || W.employees || F.team);
        chips('Key facts', keyFacts);
        row('Leadership', pf.leaders || sp(W.key_people) || (S.people && S.people.length ? S.people : null)); row('Ownership / parent', pf.ownership || W.parent);
        row('Certifications & partnerships', F.certifications ? sp(F.certifications) : null);
        row('Business verticals', pf.verticals || sp(W.subsidiaries));
        row('Turnover', pf.revenue || (W.revenue ? [W.revenue + (W.net_income ? ' (net profit ' + W.net_income + ')' : '')] : null)); row('Growth trend', pf.trend);
        row('Key products', pf.products || sp(W.products) || (S.products && S.products.filter(function (x) { return x.length < 45 && !/^\d|we follow|our .*capabilities|transforming/i.test(x); }).length ? S.products.filter(function (x) { return x.length < 45 && !/^\d|we follow|our .*capabilities|transforming/i.test(x); }).slice(0, 8) : null) || (c.products ? [c.products] : null));
        chips('Services', (S.services || []).filter(function (x) { return x.length < 45 && !/trusted|we offer|challenges|^ai services$/i.test(x); }).slice(0, 12));
        chips('Industries served', (S.industries || []).filter(function (x) { return x.length < 40 && !/we offer|solutions$/i.test(x); chips('Customers & clients', (S.clients || []).filter(function (x) { return x.length > 2 && x.length < 40 && !/client|customer|testimonial|case stud|our work|portfolio/i.test(x); }).slice(0, 10)); row('Markets served', sp(W.area_served)); }).slice(0, 10));
        chips('Technologies used', S.tech);
        row('Recent work / case studies', (S.clients || []).filter(function (x) { return x.length > 25; }).slice(0, 5));
        row('Roles they hire for', (S.careers || []).filter(function (x) { return x.length < 45 && !/we are|synergize|opportunit|join|life|culture/i.test(x); }).slice(0, 8));
        row('Milestones & news', pf.milestones);
        var listed = comp.listed != null ? comp.listed : (pf.listing ? true : (W.type ? /public/i.test(W.type) : null));
        if (listed == null && (S.name || W.type)) listed = /private/i.test(W.type || '') ? false : null;
        row('Stock market', listed == null ? 'Not listed on NSE/BSE as per available information (likely private)' : listed ? 'Listed company' + (pf.listing ? ' (NSE: ' + pf.listing.nse + ', BSE: ' + pf.listing.bse + ')' : '') : 'Not listed (private / unlisted)');
        var peers = (comp.peers || []).filter(function (x) { return x !== c.name; }).slice(0, 8);
        row('Competitors / peers', peers.length ? [peers.join(', ')] : null);
        var contact = [].concat(S.emails || [], S.phones || []);
        row('Contact', contact.length ? [contact.join(' · ')] : null);
        var tips = (pf.tips || []).slice();
        if (F.founded) tips.push('Mention its journey: founded in ' + F.founded + (F.team ? ', now ' + F.team : '') + '.');
        if (F.certifications) tips.push('Bring up its ' + sp(F.certifications)[0] + ' status and what it means for clients.');
        var sv = (S.services || []).filter(function (x) { return x.length < 40; });
        if (sv.length) tips.push('Name two services you would like to work on, e.g. ' + sv.slice(0, 2).join(' and ') + '.');
        if ((S.tech || []).length) tips.push('Learn the basics of ' + S.tech.slice(0, 3).join(', ') + ' before the interview.');
        if ((S.clients || []).filter(function (x) { return x.length > 25; }).length) tips.push('Read one case study on their website and be ready to discuss it.');
        if (peers.length) tips.push('Know how it differs from ' + peers.slice(0, 2).join(' and ') + '.');
        if (!tips.length) tips.push('Say one line on what ' + title + ' makes or does and who its customers are.');
        var qa = [];
        function addQ(x) { if (x && qa.indexOf(x) < 0) qa.push(x); }
        if (sv.length) addQ('growth plans in ' + sv[0]);
        if (sv.length > 1) addQ('fresher exposure to ' + sv[1]);
        if ((S.tech || []).length) addQ('in-house training on ' + S.tech[0]);
        if ((S.tech || []).length > 1) addQ(S.tech[1] + ' certification support');
        if ((S.industries || []).filter(function (x) { return x.length < 40; }).length > 1) addQ('new industry focus beyond ' + S.industries.filter(function (x) { return x.length < 40 && !/we offer/i.test(x); })[0]);
        if (F.countries || (PL.countries || []).length > 1) addQ('chances of overseas client projects');
        if (F.certifications) addQ('role of ' + sp(F.certifications)[0] + ' in daily work');
        if ((S.clients || []).filter(function (x) { return x.length > 25; }).length) addQ('team behind a recent case study');
        if (pf.products && pf.products.length) addQ('upcoming launches in ' + String(pf.products[0]).split(/[(,]/)[0].trim());
        if (W.products) addQ('fastest-growing product line');
        if (peers.length) addQ('edge over ' + peers[0]);
        addQ('first 90 days for a new joiner');
        addQ('training or mentoring period');
        addQ('performance review cycle');
        addQ('typical project or plant rotation');
        addQ('skills to build before joining');
        addQ('team size and reporting line');
        var overview = paras.join('\n\n');
        var src = [];
        if (c.website || S.url) src.push('<a href="' + esc(c.website || S.url) + '" target="_blank" rel="noopener">official website (' + ((S.pages || []).length || 1) + ' pages read)</a>');
        if (L.wiki && L.wiki.url) src.push('<a href="' + esc(L.wiki.url) + '" target="_blank" rel="noopener">Wikipedia</a>');
        (S.socials || []).filter(function (u) { return /linkedin/i.test(u); }).slice(0, 1).forEach(function (u) { src.push('<a href="' + esc(u) + '" target="_blank" rel="noopener">LinkedIn page</a>'); });
        cpBox.innerHTML = '<p class="eyebrow">Know your company</p><h2 style="margin:4px 0 8px">' + esc(title) + '</h2>' +
          (overview ? overview.split('\n\n').map(function (p) { return '<p class="cp-ov">' + esc(p.slice(0, 650)) + '</p>'; }).join('') : '') + rows.join('') +
          '<p class="f" style="margin:12px 0 4px">💡 Impress the interviewer</p><ul class="list small">' + tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
          '<p class="f" style="margin:12px 0 4px">❓ Ideas for your own question to the interviewer</p><p class="small muted" style="margin:0 0 6px">Pick one or two themes and frame the question in your own words. Avoid reading a fixed sentence.</p><div class="chips">' + qa.slice(0, 10).map(function (x) { return '<span class="chip">' + esc(x) + '</span>'; }).join('') + '</div>' +
          '<p class="small muted" style="margin:10px 0 0">Compiled from VKV Sir research' + (src.length ? ', ' + src.join(' and ') : '') + (c.as_of ? ' (' + esc(c.as_of) + ')' : '') + '. Figures change every year; recheck before the interview.</p>';
        if (rows.length < 2 && !overview) cpBox.querySelector('.cp-ov') || (cpBox.innerHTML += '<p class="small">Add the company website in the form for a more detailed profile.</p>');
      });
    }
    rpc('jp_tools_for', { p_role: p.role ? p.role.id : null, p_skills: sk.map(function (s) { return s.id; }), p_industry: null }).then(function (tl) {
      if (!tl || !tl.length || !secEl) return;
      var bands = [['essential', 'Essential: must know', 'Expected in the interview; learn to working level.'], ['lead', 'Gives you a lead', 'Knowing these makes you stand out among freshers.'], ['pro', 'Pro level', 'Learn if you want to grow into a specialist in this field.']];
      var box = document.createElement('div'); box.className = 'card';
      box.innerHTML = '<h2>General software for this role</h2><p class="small muted" style="margin-top:-6px">Typical for the role across companies. Check the company footprint above first.</p><div class="swmap">' + bands.map(function (b) {
        var l = tl.filter(function (x) { return x.band === b[0]; }).slice(0, 8); if (!l.length) return '';
        return '<div class="swcol sw-' + b[0] + '"><b>' + b[1] + '</b><span class="small muted">' + b[2] + '</span><ul>' + l.map(function (x) { return '<li><b>' + esc(x.name) + '</b>' + (x.vendor ? ' <span class="muted small">· ' + esc(x.vendor) + '</span>' : '') + (x.why ? '<br><span class="small">' + esc(x.why) + '</span>' : '') + '</li>'; }).join('') + '</ul></div>';
      }).join('') + '</div><p class="small muted" style="margin:8px 0 0">Many of these offer free student or trial editions. Learn one essential tool well before adding more.</p>';
      box.className = 'card swgen';
      var anchor = secEl.querySelector('.swfp') || secEl.querySelector('.jp-swt');
      if (anchor) secEl.insertBefore(box, anchor.nextSibling); else secEl.insertBefore(box, secEl.querySelector('.row'));
    }).catch(function () {});
    var coName = (window.__jpInp && window.__jpInp.company) || (p.company && p.company.name) || null;
    function drawFootprint() {
      rpc('jp_company_software', { p_company: coName, p_industry: p.industry ? p.industry.name : null, p_branch: p.branch || null, p_role: p.role ? p.role.id : null }).then(function (fp) {
        if (!fp || !secEl) return;
        var own = fp.own || [], peers = fp.peers || [];
        if (!own.length && !peers.length) return;
        function mon(d) { if (!d) return ''; var x = new Date(d); return isNaN(+x) ? '' : x.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }); }
        function item(x) {
          var ev = x.bucket === 'peers'
            ? 'Used by ' + x.peer_n + ' similar compan' + (x.peer_n === 1 ? 'y' : 'ies') + (x.peer_names && x.peer_names.length ? ' (' + x.peer_names.map(esc).join(', ') + ')' : '')
            : 'Seen in ' + x.seen + ' job post' + (x.seen === 1 ? '' : 's') + (x.latest ? ' · latest ' + mon(x.latest) : '') + (x.src ? ' · <a href="' + esc(x.src) + '" target="_blank" rel="noopener">source</a>' : '');
          return '<li><div class="spread"><b>' + esc(x.name) + '</b>' + (x.bucket === 'rising' ? '<span class="pill accent">↑ Rising</span>' : '') + '</div>' +
            (x.target ? '<span class="small"><b>Learn to:</b> ' + esc(x.target) + '</span><br>' : '') + '<span class="small muted">' + ev + '</span></li>';
        }
        var now = own.filter(function (x) { return x.bucket !== 'earlier'; }), old = own.filter(function (x) { return x.bucket === 'earlier'; });
        var cols = [];
        if (now.length) cols.push(['now', '🔥 Asked now', 'Seen in this company\'s job posts in the last 12 months.', now]);
        if (old.length) cols.push(['old', '🕘 Used earlier', 'Seen only in older posts; may still be used.', old]);
        if (peers.length) cols.push(['peer', own.length ? '🏭 Also common at similar companies' : '🏭 Common at similar companies', own.length ? 'Good additions from companies in the same field.' : 'No public job-post evidence for ' + esc(fp.company || 'this company') + ' yet, so this is based on companies in the same field.', peers.slice(0, 6)]);
        var box = document.createElement('div'); box.className = 'card swfp';
        box.innerHTML = '<h2>Software footprint' + (fp.company ? ' at ' + esc(fp.company) : '') + '</h2>' +
          '<p class="small muted" style="margin-top:-6px">Built from real job posts and career pages' + (fp.evidence_n ? ' (' + fp.evidence_n + ' mentions tracked' + (fp.updated ? ', updated ' + esc(fmtDate(fp.updated)) : '') + ')' : '') + '. Learn the 🔥 tools first.</p>' +
          '<div class="swfp-cols">' + cols.map(function (c) { return '<div class="swfp-col fp-' + c[0] + '"><b>' + c[1] + '</b><span class="small muted">' + c[2] + '</span><ul>' + c[3].map(item).join('') + '</ul></div>'; }).join('') + '</div>';
        var prev = secEl.querySelector('.swfp');
        if (prev) { prev.replaceWith(box); return; }
        var sw0 = secEl.querySelector('.jp-swt'), gen = secEl.querySelector('.swgen');
        if (sw0) secEl.insertBefore(box, sw0); else if (gen) secEl.insertBefore(box, gen); else secEl.insertBefore(box, secEl.querySelector('.row'));
      }).catch(function () {});
    }
    if (coName) rpc('jp_company_pay_for', { p_company: coName }).then(function (rows) {
      if (!rows || !rows.length || !secEl) return;
      var srcs = []; rows.forEach(function (r) { if (r.url && !srcs.some(function (s) { return s[1] === r.url; })) srcs.push([r.source, r.url]); });
      var box = document.createElement('div'); box.className = 'card payc';
      box.innerHTML = '<h2>💼 Salary &amp; career path</h2><p class="small muted" style="margin-top:-6px">Typical pay at each level and usual time before the next promotion. Approximate; actual figures depend on performance, location and company policy.</p>' +
        '<ol class="ladder">' + rows.map(function (r, i) { return '<li><span class="ld-n">' + (i + 1) + '</span><div class="ld-c"><b>' + esc(r.title) + '</b><span class="ld-pay">' + esc(r.pay) + '</span>' + (r.years && r.years !== '—' ? '<small>⏱ ' + esc(r.years) + '</small>' : '') + (r.note ? '<small class="ld-note">' + esc(r.note) + '</small>' : '') + '</div></li>'; }).join('') + '</ol>' +
        '<p class="small muted ld-src">Sources: ' + srcs.map(function (s) { return '<a href="' + esc(s[1]) + '" target="_blank" rel="noopener">' + esc(s[0]) + '</a>'; }).join(' · ') + '</p>';
      var a3 = secEl.querySelector('.salc') || secEl.querySelector('.swfp') || secEl.querySelector('.jp-swt'); if (a3) secEl.insertBefore(box, a3); else secEl.insertBefore(box, secEl.querySelector('.row'));
    }).catch(function () {});
    if (coName) rpc('jp_company_salary', { p_company: coName }).then(function (rows) {
      if (!rows || !rows.length || !secEl) return;
      var LV = { fresher: 'Fresher (0–1 yr)', junior: '2–4 years', senior: '5+ years' };
      var box = document.createElement('div'); box.className = 'card salc';
      box.innerHTML = '<h2>💰 Salaries reported by students</h2><p class="small muted" style="margin-top:-6px">Approximate yearly CTC (₹ lakh), from anonymous reports in the last 4 years. Actual offers vary by role, location and negotiation.</p><div class="salg">' +
        rows.map(function (r) { return '<div class="sal-i"><span>' + esc(LV[r.level] || r.level) + '</span><b>₹' + r.low + '–' + r.high + ' L</b><small>typical ₹' + r.mid + ' L · ' + r.n + ' reports' + (r.roles && r.roles.length ? ' · ' + esc(r.roles.join(', ')) : '') + '</small></div>'; }).join('') + '</div>';
      var anchor2 = secEl.querySelector('.swfp') || secEl.querySelector('.jp-swt'); if (anchor2) secEl.insertBefore(box, anchor2); else secEl.insertBefore(box, secEl.querySelector('.row'));
    }).catch(function () {});
    if (coName || p.industry) {
      drawFootprint();
      // live: refresh this company's job posts now if our data is more than a day old
      if (session && coName) sb.functions.invoke('jp-sw-crawl', { body: { company: coName } }).then(function (r) {
        var d = r && r.data; if (d && d.refreshed && (d.report || []).some(function (x) { return x.found > 0; })) drawFootprint();
      }).catch(function () {});
    }
    var coQ = (coName || p.industry) ? rpc('jp_iq_company', { p_company: coName, p_industry: p.industry ? p.industry.name : null }).catch(function () { return null; }) : Promise.resolve(null);
    Promise.all([rpc('jp_iq_for', { p_role: p.role ? p.role.id : null, p_skills: ids, p_level: p.level }), coQ]).then(function (rr) {
      var list = rr[0] || [], cq = rr[1] || {};
      if (!list.length && !(cq.own && cq.own.length) && !(cq.peers && cq.peers.length)) return;
      var tech = list.filter(function (x) { return x.grp !== 3; }), hr = list.filter(function (x) { return x.grp === 3; });
      function block(title, arr, note) {
        if (!arr.length) return '';
        return '<div class="card"><h2>' + title + '</h2><p class="small muted" style="margin-top:-6px">' + note + '</p><div class="jp-iq">' + arr.map(function (x, i) {
          return '<details><summary><b>Q' + (i + 1) + '.</b> ' + (x.round ? '<span class="pill small">' + esc(x.round) + '</span> ' : '') + esc(x.q) + (x.from ? ' <span class="small muted">· ' + esc(x.from) + '</span>' : '') + '</summary><p>' + esc(x.a) + '</p>' + (x.points && x.points.length ? '<div class="chips">' + x.points.map(function (pt) { return '<span class="chip">' + esc(pt) + '</span>'; }).join('') + '</div>' : '') + '</details>';
        }).join('') + '</div></div>';
      }
      var box = document.createElement('div'); box.className = 'stack'; box.style.marginTop = '16px';
      box.innerHTML = (cq.own && cq.own.length ? block('Asked at ' + esc(cq.company) + ' (as reported by candidates)', cq.own, 'Common themes from candidates\' interview reports, with model answers in our own words. Answer aloud first, then tap to check.') : '') +
        (cq.peers && cq.peers.length ? block('Asked at similar companies', cq.peers, (cq.own && cq.own.length ? 'More practice from companies in the same field.' : 'We have no reports for this company yet, so these come from companies in the same field.')) : '') +
        block('Likely technical interview questions', tech, 'Try answering aloud first, then tap to see a model answer and key points.') +
        block('HR &amp; behavioural questions', hr, 'Prepare your own honest version of each answer.');
      var sec = q('#jout section'); if (sec) sec.insertBefore(box, sec.querySelector('.row'));
    }).catch(function () {});
    if (profile && profile.is_admin) { var a = document.createElement('p'); a.className = 'small'; a.innerHTML = '<a href="/admin/jobprep" data-link>Admin: see what students are asking for →</a>'; q('#jout').appendChild(a); }
  }


  function viewCompaniesAdmin() {
    setNav('admin');
    if (!(profile && profile.is_admin)) { h('<div class="card narrow center"><p>Admins only.</p></div>'); return; }
    loading();
    Promise.all([rpc('jp_campus_list'), rpc('jp_options')]).then(function (r) {
      var list = r[0] || [], inds = (r[1] && r[1].industries) || [];
      function badge(x) { return x.auto_at ? '<span class="pill good">Profile ready · ' + esc(fmtDate(x.auto_at)) + '</span>' : '<span class="pill">Profile pending</span>'; }
      h('<div class="narrow stack"><div><p class="eyebrow">Admin · Job Prep</p><h1>Company library</h1><p class="muted small">Add companies that visit or may visit your campus. The system reads their website and Wikipedia, stores a full profile, and refreshes it every 30 days. Students see it instantly in the Job Prep plan.</p></div>' +
        '<div class="card stack"><label class="f" for="cn">Company name</label><input class="in" id="cn" placeholder="e.g. Shri Bhagwati Machines">' +
        '<label class="f" for="cu">Website</label><input class="in" id="cu" placeholder="e.g. https://bhagwatimachines.com">' +
        '<label class="f" for="ci">Industry (optional)</label><select class="in" id="ci"><option value="">Select</option>' + inds.map(function (i) { return '<option value="' + esc(i.id) + '">' + esc(i.name) + '</option>'; }).join('') + '</select>' +
        '<div class="err" id="ce"></div><button class="btn" id="cgo">Add & build profile</button></div>' +
        '<div class="card"><h2>Library (' + list.length + ')</h2>' + list.map(function (x) {
          return '<div class="spread" style="padding:8px 0;border-top:1px solid var(--line);gap:8px;flex-wrap:wrap"><span><b>' + esc(x.name) + '</b> <span class="small muted">' + (x.campus ? '🎓 Campus' : '') + (x.tier && x.tier !== 'campus' ? ' · ' + esc(x.tier) : '') + '</span></span><span>' + badge(x) + ' <button class="linkbtn" data-ref="' + esc(x.id) + '">Refresh</button></span></div>';
        }).join('') + '</div></div>');
      function build(id, btn) { if (btn) { btn.disabled = true; btn.textContent = 'Building…'; } return sb.functions.invoke('jp-company', { body: { id: id, fresh: true } }); }
      q('#cgo').onclick = function () {
        var n = q('#cn').value.trim(), u = q('#cu').value.trim(), b = this; if (!n) { q('#ce').textContent = 'Enter the company name.'; return; }
        b.disabled = true; b.textContent = 'Reading website…';
        rpc('jp_admin_add_company', { p_name: n, p_url: u || null, p_industry: q('#ci').value || null }).then(function (id) { return build(id); })
          .then(function () { viewCompaniesAdmin(); }).catch(function (e) { q('#ce').textContent = errMsg(e); b.disabled = false; b.textContent = 'Add & build profile'; });
      };
      Array.prototype.forEach.call(document.querySelectorAll('[data-ref]'), function (b) { b.onclick = function () { build(b.getAttribute('data-ref'), b).then(function () { viewCompaniesAdmin(); }); }; });
    }).catch(function (e) { h('<div class="card narrow center"><p>' + esc(errMsg(e)) + '</p></div>'); });
  }

  /* ---------- students share their salary (anonymous; shown only as ranges of 3+) ---------- */
  function salaryBox(company) {
    var d = document.createElement('details'); d.className = 'card iqr sal no-pdf';
    var yr = new Date().getFullYear();
    d.innerHTML = '<summary><span class="iqr-ic">💰</span><span><b>Got placed? Share your salary</b><small>Anonymous. Shown only as a range once 3 or more people report.</small></span><em>Share →</em></summary><div class="iqr-body">' +
      '<div class="two"><div><label class="f" for="sl-co">Company</label><input class="in" id="sl-co" list="iqr-cl" autocomplete="off" value="' + esc(company || '') + '" placeholder="e.g. Tata Motors"></div><div><label class="f" for="sl-ro">Role / post</label><input class="in" id="sl-ro" list="iqr-rl" autocomplete="off" placeholder="e.g. Graduate Engineer Trainee"></div></div>' +
      '<div class="two" style="margin-top:8px"><div><label class="f" for="sl-ctc">Yearly CTC (₹ lakh)</label><input class="in" id="sl-ctc" type="number" inputmode="decimal" step="0.1" min="0.5" max="250" placeholder="e.g. 4.5"></div><div><label class="f" for="sl-lv">Experience at offer</label><select class="in" id="sl-lv"><option value="fresher">Fresher (0–1 yr)</option><option value="junior">2–4 years</option><option value="senior">5+ years</option></select></div></div>' +
      '<div class="two" style="margin-top:8px"><div><label class="f" for="sl-yr">Year of offer</label><select class="in" id="sl-yr">' + [yr, yr - 1, yr - 2, yr - 3].map(function (y) { return '<option>' + y + '</option>'; }).join('') + '</select></div><div><label class="f" for="sl-city">City (optional)</label><input class="in" id="sl-city" placeholder="e.g. Pune"></div></div>' +
      '<button class="btn" id="sl-go" type="button" style="margin-top:10px">Share anonymously</button><p class="small muted" style="margin:8px 0 0">Your name is never shown. Figures help juniors set realistic expectations.</p><p class="small" id="sl-out"></p></div>';
    d.querySelector('#sl-go').onclick = function () {
      if (!session) { toast('Please sign in to share (your name stays hidden).'); go('/login?next=' + encodeURIComponent(location.pathname)); return; }
      var b = this; b.disabled = true;
      rpc('jp_report_salary', { p_company: d.querySelector('#sl-co').value, p_role: d.querySelector('#sl-ro').value, p_level: d.querySelector('#sl-lv').value, p_ctc: parseFloat(d.querySelector('#sl-ctc').value), p_year: +d.querySelector('#sl-yr').value, p_city: d.querySelector('#sl-city').value })
        .then(function () { d.querySelector('#sl-out').textContent = '✓ Thank you! Your report has been added anonymously.'; d.querySelector('#sl-ctc').value = ''; })
        .catch(function (e) { d.querySelector('#sl-out').textContent = errMsg(e); }).finally(function () { b.disabled = false; });
    };
    return d;
  }

  /* ---------- students share interview questions (reviewed before publishing) ---------- */
  function reportBox(company, role) {
    var d = document.createElement('details'); d.className = 'card iqr no-pdf';
    var yr = new Date().getFullYear(), O = jpOpts || {};
    var roleList = '<datalist id="iqr-rl">' + (O.roles || []).map(function (r) { return '<option value="' + esc(r.name) + '">' + esc(r.family || '') + '</option>'; }).join('') + '</datalist>';
    var coList = '<datalist id="iqr-cl">' + (O.companies || []).map(function (c) { return '<option value="' + esc(typeof c === 'string' ? c : c.name) + '">'; }).join('') + '</datalist>';
    d.innerHTML = '<summary><span class="iqr-ic">🎤</span><span><b>Interviewed recently? Help your juniors</b><small>Share the questions you were asked at any company. No resume or plan needed.</small></span><em>Share →</em></summary><div class="iqr-body">' +
      '<p class="small muted">We check each question, add a model answer and show it to students preparing for the same company.</p>' +
      '<div class="two"><div><label class="f" for="iqr-co">Company</label><input class="in" id="iqr-co" list="iqr-cl" autocomplete="off" value="' + esc(company || '') + '" placeholder="Start typing, e.g. Tata Motors"></div><div><label class="f" for="iqr-ro">Role / post</label><input class="in" id="iqr-ro" list="iqr-rl" autocomplete="off" value="' + esc(role || '') + '" placeholder="Pick from the list or type your own"></div></div>' + roleList + coList +
      '<div class="two" style="margin-top:8px"><div><label class="f">Round</label><select class="in" id="iqr-rd"><option>Technical</option><option>HR</option><option>Managerial</option><option>Aptitude</option><option>Coding</option><option>Group discussion</option></select></div><div><label class="f">Year</label><select class="in" id="iqr-yr">' + [yr, yr - 1, yr - 2].map(function (y) { return '<option>' + y + '</option>'; }).join('') + '</select></div></div>' +
      '<label class="f" style="margin-top:8px;display:block">Questions (one per line)</label><textarea class="in" id="iqr-q" rows="5" placeholder="What is the difference between…\nExplain your final-year project…"></textarea>' +
      '<label class="f" style="margin-top:8px;display:block">Tip for juniors (optional)</label><input class="in" id="iqr-tip" placeholder="e.g. They asked a lot about the internship">' +
      '<button class="btn" id="iqr-go" type="button" style="margin-top:10px">Share questions</button><p class="small" id="iqr-out"></p></div>';
    d.querySelector('#iqr-go').onclick = function () {
      if (!session) { toast('Please sign in to share.'); go('/login?next=' + encodeURIComponent(location.pathname)); return; }
      var b = this; b.disabled = true;
      rpc('jp_report_iq', { p_company: d.querySelector('#iqr-co').value, p_role: d.querySelector('#iqr-ro').value, p_round: d.querySelector('#iqr-rd').value, p_year: +d.querySelector('#iqr-yr').value, p_questions: d.querySelector('#iqr-q').value, p_tip: d.querySelector('#iqr-tip').value })
        .then(function (r) { d.querySelector('#iqr-out').innerHTML = r.saved ? '✓ Thank you! ' + r.saved + ' question' + (r.saved > 1 ? 's' : '') + ' sent for review.' : 'Please write at least one full question.'; if (r.saved) d.querySelector('#iqr-q').value = ''; })
        .catch(function (e) { d.querySelector('#iqr-out').textContent = errMsg(e); }).finally(function () { b.disabled = false; });
    };
    return d;
  }
  function viewIqReportsAdmin() {
    setNav('admin');
    if (!(profile && profile.is_admin)) { h('<div class="card narrow center"><p>Admins only.</p></div>'); return; }
    loading();
    rpc('jp_admin_iq_reports', { p_status: 'pending' }).then(function (list) {
      h('<div class="stack"><div><p class="eyebrow">Admin · Job Prep</p><h1>Interview questions from students</h1><p class="muted">' + list.length + ' waiting for review. Add a short model answer and approve; it then appears under “Asked at [company]”.</p></div>' +
        (list.length ? list.map(function (r) {
          return '<div class="card iqrv" data-id="' + r.id + '"><div class="spread small muted"><span><b>' + esc(r.company) + '</b>' + (r.company_id ? '' : ' <span class="pill bad">not in library</span>') + ' · ' + esc(r.round || '') + ' · ' + (r.year || '') + (r.role ? ' · ' + esc(r.role) : '') + '</span><span>' + esc(r.by || 'Student') + ' · ' + esc(fmtDate(r.created_at)) + '</span></div>' +
            '<label class="f" style="margin-top:8px;display:block">Question</label><input class="in rq" value="' + esc(r.question) + '">' +
            (r.tip ? '<p class="small muted">Tip: ' + esc(r.tip) + '</p>' : '') +
            '<label class="f" style="margin-top:8px;display:block">Model answer</label><textarea class="in ra" rows="3" placeholder="2–3 sentences in simple words"></textarea>' +
            '<div class="two" style="margin-top:8px"><input class="in rp" placeholder="Key points separated by |"><input class="in rc" value="' + esc(r.company_id ? '' : r.company) + '" placeholder="' + (r.company_id ? 'Company (unchanged)' : 'Company name in the library') + '"></div>' +
            '<div class="row" style="gap:8px;margin-top:10px"><button class="btn" data-a="approve">Approve</button><button class="btn ghost" data-a="reject">Reject</button><span class="small rout"></span></div></div>';
        }).join('') : '<div class="card"><p class="muted">Nothing to review right now.</p></div>') + '</div>');
      Array.prototype.forEach.call(document.querySelectorAll('.iqrv button'), function (b) {
        b.onclick = function () {
          var c = b.closest('.iqrv'), a = b.getAttribute('data-a');
          rpc('jp_admin_iq_review', { p_id: +c.getAttribute('data-id'), p_action: a, p_question: c.querySelector('.rq').value, p_answer: c.querySelector('.ra').value, p_points: c.querySelector('.rp').value, p_company: c.querySelector('.rc').value || null })
            .then(function () { c.style.opacity = .45; c.querySelector('.rout').textContent = a === 'approve' ? '✓ Published' : 'Rejected'; Array.prototype.forEach.call(c.querySelectorAll('button'), function (x) { x.disabled = true; }); })
            .catch(function (e) { c.querySelector('.rout').textContent = errMsg(e); });
        };
      });
    }).catch(function (e) { h('<div class="card narrow center"><p>' + esc(errMsg(e)) + '</p></div>'); });
  }

  function viewSwAdmin() {
    setNav('admin');
    if (!(profile && profile.is_admin)) { h('<div class="card narrow center"><p>Admins only.</p></div>'); return; }
    loading();
    rpc('jp_admin_sw_overview').then(function (d) {
      var bs = d.by_source || {};
      h('<div class="stack"><div><p class="eyebrow">Admin · Job Prep</p><h1>Software footprint tracker</h1><p class="muted">' + d.evidence + ' tool mentions from ' + d.companies + ' companies · ' + Object.keys(bs).map(function (k) { return esc(k.replace('_', ' ')) + ' ' + bs[k]; }).join(' · ') + '</p></div>' +
        '<div class="grid"><div class="card"><h2>Add a job description</h2><p class="small muted">Paste any job post (Naukri, LinkedIn, company site). Tools are detected automatically and dated.</p>' +
          '<input class="in" id="sj-co" placeholder="Company name (as in the library)"><input class="in" id="sj-url" placeholder="Link to the post (optional)" style="margin-top:8px"><input class="in" id="sj-date" type="date" style="margin-top:8px" title="Posted on"><textarea class="in" id="sj-text" rows="7" placeholder="Paste the job description" style="margin-top:8px"></textarea>' +
          '<button class="btn" id="sj-go" style="margin-top:8px">Detect &amp; save</button><p class="small" id="sj-out"></p></div>' +
        '<div class="card"><h2>Add a career page to crawl</h2><p class="small muted">The crawler visits these every week and reads job links on the same site. Pages that load jobs with JavaScript show “may load jobs with JavaScript”: add a direct job link instead.</p>' +
          '<input class="in" id="ss-co" placeholder="Company name"><input class="in" id="ss-url" placeholder="https://careers.company.com/…" style="margin-top:8px"><button class="btn" id="ss-go" style="margin-top:8px">Add source</button><p class="small" id="ss-out"></p></div></div>' +
        '<div class="card"><h2>Free job-search API (Jooble)</h2><p class="small muted">Get a free key at <a href="https://jooble.org/api/about" target="_blank" rel="noopener">jooble.org/api/about</a> and paste it here. It is stored in the secure vault and used nightly and when students search a company.</p><div class="row" style="gap:8px;flex-wrap:wrap"><input class="in" id="ak-j" type="password" placeholder="Jooble API key" style="flex:1;min-width:220px"><button class="btn" id="ak-go">Save key</button></div><p class="small" id="ak-out"></p></div>' +
        '<div class="card"><h2>Latest mentions</h2><div style="overflow-x:auto"><table class="table"><thead><tr><th>Date</th><th>Company</th><th>Tool</th><th>Source</th></tr></thead><tbody>' +
          (d.recent || []).map(function (r) { return '<tr><td class="small">' + esc(r.date || '') + '</td><td>' + esc(r.company) + '</td><td>' + esc(r.tool) + '</td><td class="small">' + (r.url && /^http/.test(r.url) ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.source.replace('_', ' ')) + '</a>' : esc(r.source.replace('_', ' '))) + '</td></tr>'; }).join('') + '</tbody></table></div></div>' +
        '<div class="card"><h2>Crawl sources (' + (d.sources || []).length + ')</h2><div style="overflow-x:auto"><table class="table"><thead><tr><th>Company</th><th>URL</th><th>Last run</th><th>Found</th><th>Status</th></tr></thead><tbody>' +
          (d.sources || []).map(function (s) { return '<tr><td>' + esc(s.company) + '</td><td class="small" style="max-width:260px;overflow-wrap:anywhere">' + esc(s.url) + '</td><td class="small">' + (s.last_run ? esc(fmtDate(s.last_run)) : 'not yet') + '</td><td>' + (s.found == null ? '–' : s.found) + '</td><td class="small muted">' + esc(s.status || '') + '</td></tr>'; }).join('') + '</tbody></table></div></div></div>');
      q('#sj-go').onclick = function () {
        var b = this; b.disabled = true;
        rpc('jp_admin_add_jd', { p_company: q('#sj-co').value, p_text: q('#sj-text').value, p_url: q('#sj-url').value || null, p_posted: q('#sj-date').value || null, p_source: 'job_post' })
          .then(function (r) { q('#sj-out').innerHTML = r.found ? '✓ Saved ' + r.found + ' tool' + (r.found > 1 ? 's' : '') + ': <b>' + r.tools.map(esc).join(', ') + '</b>' : 'No catalogue tools found (or company not in the library).'; })
          .catch(function (e) { q('#sj-out').textContent = errMsg(e); }).finally(function () { b.disabled = false; });
      };
      rpc('jp_admin_api_keys').then(function (k) { if (k && k.jooble) q('#ak-out').textContent = '✓ A Jooble key is saved. Paste a new one only to replace it.'; }).catch(function () {});
      q('#ak-go').onclick = function () {
        rpc('jp_admin_set_api_key', { p_name: 'jooble_key', p_value: q('#ak-j').value }).then(function () { q('#ak-j').value = ''; q('#ak-out').textContent = '✓ Saved. Jooble will be used from the next run.'; }).catch(function (e) { q('#ak-out').textContent = errMsg(e); });
      };
      q('#ss-go').onclick = function () {
        rpc('jp_admin_sw_source', { p_company: q('#ss-co').value, p_url: q('#ss-url').value, p_active: true }).then(function () { q('#ss-out').textContent = '✓ Added. It will be crawled in the next nightly run.'; }).catch(function (e) { q('#ss-out').textContent = errMsg(e); });
      };
    }).catch(function (e) { h('<div class="card narrow center"><p>' + esc(errMsg(e)) + '</p></div>'); });
  }

  function viewJpAdmin() {
    setNav('admin'); loading();
    rpc('jp_admin_log', { p_days: 30 }).then(function (d) {
      function list(arr, empty) { return arr && arr.length ? '<ol class="board">' + arr.map(function (x) { return '<li><span>' + esc(x.name) + '</span><span class="mono">' + x.n + '</span></li>'; }).join('') + '</ol>' : '<p class="muted small">' + empty + '</p>'; }
      h('<div class="stack"><div><p class="eyebrow">Admin · Job Prep</p><h1>What students are asking for</h1><p class="muted">Last 30 days · ' + d.total + ' plans generated.</p></div>' +
        '<p class="row" style="gap:10px;flex-wrap:wrap"><a class="btn" href="/admin/companies" data-link>Open company library (campus companies) →</a><a class="btn ghost" href="/admin/software" data-link>⚙ Software footprint tracker →</a><a class="btn ghost" href="/admin/iq-reports" data-link>🎤 Student interview reports →</a></p><div class="grid"><div class="card"><h2>Top roles</h2>' + list(d.roles, 'No data yet.') + '</div><div class="card"><h2>Top companies</h2>' + list(d.companies, 'No data yet.') + '</div>' +
        '<div class="card"><h2>Companies not in the knowledge base</h2>' + list(d.unknown_companies, 'None so far.') + '<p class="small muted">Ask Claude to add these companies in the next "continue" session.</p></div></div>' +
        '<div class="card"><h2>Recent requests</h2><div class="table-wrap" style="overflow-x:auto"><table class="table"><thead><tr><th>When</th><th>Company</th><th>Matched role</th><th>Branch</th><th>Level</th><th>Job post (start)</th></tr></thead><tbody>' +
        (d.recent || []).map(function (r) { return '<tr><td class="small">' + esc(fmtDate(r.created_at)) + '</td><td>' + esc(r.company || '–') + '</td><td>' + esc(r.role || '–') + '</td><td>' + esc(r.branch || '–') + '</td><td>' + esc(r.level || '') + '</td><td class="small">' + esc(r.text || '') + '</td></tr>'; }).join('') +
        '</tbody></table></div></div></div>');
    }).catch(function (e) { h('<div class="card narrow center"><p>' + esc(errMsg(e)) + '</p></div>'); });
  }

  /* ---------- unlimited aptitude drill (generated in browser, always fresh) ---------- */
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffleOpts(ans, wrongs, fmt) {
    var seen = {}, opts = [];
    [ans].concat(wrongs).forEach(function (v) { var s = fmt ? fmt(v) : String(v); if (!seen[s]) { seen[s] = 1; opts.push(s); } });
    var k = 1; while (opts.length < 4) { var s = fmt ? fmt(ans + k * (ans > 20 ? 7 : 1)) : String(ans + k * (ans > 20 ? 7 : 1)); if (!seen[s]) { seen[s] = 1; opts.push(s); } k++; }
    var a = fmt ? fmt(ans) : String(ans);
    for (var i = opts.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = opts[i]; opts[i] = opts[j]; opts[j] = t; }
    return { opts: opts, correct: opts.indexOf(a) };
  }
  var GEN = {
    'Percentages': function () { var p = pick([5, 10, 12, 15, 20, 25, 30, 40, 50, 75]), n = ri(2, 40) * 20, a = n * p / 100;
      return { q: 'What is ' + p + '% of ' + n + '?', ans: a, w: [a + n / 20, a - n / 20, a * 2], e: n + ' × ' + p + '/100 = ' + a + '.' }; },
    'Successive change': function () { var a = pick([10, 20, 25, 30]), b = pick([10, 20, 25]), up = Math.random() < .5, net = up ? a + b + a * b / 100 : a - b - a * b / 100;
      return { q: 'A price increases by ' + a + '% and then ' + (up ? 'increases' : 'decreases') + ' by ' + b + '%. Net change (%)?', ans: Math.round(net * 100) / 100, w: [up ? a + b : a - b, Math.round((net + 2) * 100) / 100, Math.round((net - 3) * 100) / 100], e: 'Net = a ± b ± ab/100.' , fmt: function (v) { return (v > 0 ? '+' : '') + v + '%'; } }; },
    'Profit & loss': function () { var cp = ri(4, 40) * 50, p = pick([10, 12, 15, 20, 25, 30]), sp = cp * (100 + p) / 100;
      return { q: 'An article bought for ₹' + cp + ' is sold at ' + p + '% profit. Selling price?', ans: sp, w: [cp + p, sp + cp / 10, cp * (100 - p) / 100], e: 'SP = CP × (100 + ' + p + ')/100 = ₹' + sp + '.', fmt: function (v) { return '₹' + v; } }; },
    'Simple interest': function () { var P = ri(2, 30) * 500, R = pick([4, 5, 6, 8, 10, 12]), T = ri(2, 6), I = P * R * T / 100;
      return { q: 'Simple interest on ₹' + P + ' at ' + R + '% per year for ' + T + ' years?', ans: I, w: [I + P * R / 100, I - P * R / 100, P * R / 100], e: 'SI = PRT/100 = ₹' + I + '.', fmt: function (v) { return '₹' + v; } }; },
    'Compound interest': function () { var P = ri(1, 20) * 1000, R = pick([5, 10, 20]), A = Math.round(P * Math.pow(1 + R / 100, 2)), CI = A - P;
      return { q: 'Compound interest on ₹' + P + ' at ' + R + '% per year for 2 years?', ans: CI, w: [P * R * 2 / 100, CI + P * R / 100, CI - P / 100], e: 'A = P(1 + R/100)² = ₹' + A + '; CI = ₹' + CI + '.', fmt: function (v) { return '₹' + v; } }; },
    'Time & work': function () { var x = pick([6, 8, 10, 12, 15, 20, 24, 30]), y = pick([10, 12, 15, 20, 24, 30, 40, 60]); if (x === y) y = y * 2; var t = Math.round(x * y / (x + y) * 100) / 100;
      return { q: 'A can do a work in ' + x + ' days and B in ' + y + ' days. Together they take how many days?', ans: t, w: [(x + y) / 2, Math.round((t + 1.5) * 100) / 100, Math.abs(y - x)], e: 'Together = xy/(x + y) = ' + t + ' days.', fmt: function (v) { return v + ' days'; } }; },
    'Speed & distance': function () { var v = pick([36, 45, 54, 72, 90, 108]), L = ri(10, 40) * 10, ms = v * 5 / 18, t = Math.round(L / ms * 100) / 100;
      return { q: 'A train ' + L + ' m long runs at ' + v + ' km/h. Time to cross a pole (seconds)?', ans: t, w: [Math.round(L / v * 100) / 100, Math.round(t * 2 * 100) / 100, Math.round((t + 3) * 100) / 100], e: v + ' km/h = ' + ms + ' m/s; time = ' + L + '/' + ms + ' = ' + t + ' s.', fmt: function (v) { return v + ' s'; } }; },
    'Averages': function () { var n = ri(4, 7), arr = []; for (var i = 0; i < n; i++) arr.push(ri(10, 90)); var s = arr.reduce(function (a, b) { return a + b; }, 0), av = Math.round(s / n * 100) / 100;
      return { q: 'Average of ' + arr.join(', ') + ' is:', ans: av, w: [Math.round((av + 2) * 100) / 100, Math.round((av - 3) * 100) / 100, s], e: 'Sum ' + s + ' ÷ ' + n + ' = ' + av + '.' }; },
    'Ratio': function () { var a = ri(1, 7), b = ri(1, 9); if (a === b) b++; var k = ri(5, 30), T = (a + b) * k;
      return { q: '₹' + T + ' is divided in the ratio ' + a + ':' + b + '. The larger share is:', ans: Math.max(a, b) * k, w: [Math.min(a, b) * k, T / 2, Math.max(a, b) * k + k], e: 'One part = ' + T + '/' + (a + b) + ' = ' + k + '.', fmt: function (v) { return '₹' + v; } }; },
    'Number system': function () { var b = pick([2, 3, 7, 8]), e = ri(11, 99), cyc = { 2: [2, 4, 8, 6], 3: [3, 9, 7, 1], 7: [7, 9, 3, 1], 8: [8, 4, 2, 6] }[b], ans = cyc[(e - 1) % 4];
      return { q: 'Unit digit of ' + b + '^' + e + ' is:', ans: ans, w: cyc.filter(function (x) { return x !== ans; }), e: 'Cycle of ' + b + ': ' + cyc.join(', ') + '; ' + e + ' mod 4 = ' + (e % 4) + '.' }; },
    'Clock angle': function () { var h = ri(1, 11), m = pick([0, 10, 15, 20, 30, 40, 45, 50]), d = Math.abs(30 * h - 5.5 * m); if (d > 180) d = 360 - d;
      return { q: 'Angle between the hands of a clock at ' + h + ':' + (m < 10 ? '0' : '') + m + '?', ans: d, w: [Math.abs(30 * h - 6 * m) % 360, d + 15, Math.abs(180 - d) || 90], e: '|30H − 5.5M| = ' + d + '°.', fmt: function (v) { return v + '°'; } }; },
    'Mensuration': function () { var r = pick([7, 14, 21, 3.5]), A = Math.round(22 / 7 * r * r * 100) / 100;
      return { q: 'Area of a circle of radius ' + r + ' cm (π = 22/7)?', ans: A, w: [Math.round(2 * 22 / 7 * r * 100) / 100, A * 2, Math.round(A / 2 * 100) / 100], e: 'πr² = ' + A + ' cm².', fmt: function (v) { return v + ' cm²'; } }; }
  };
  function viewDrill() {
    setNav('home');
    var topics = Object.keys(GEN), chosen = topics.slice(), score = 0, total = 0, cur = null;
    h('<div class="narrow stack"><div><p class="eyebrow">Unlimited practice</p><h1>Aptitude speed drill</h1><p class="muted">Fresh numbers every time, so you can practise as much as you like. Pick topics, answer, and see the working instantly. No sign-in needed.</p></div>' +
      '<div class="card"><p class="f">Topics</p><div class="chips" id="dt">' + topics.map(function (t) { return '<button class="chip sel" aria-pressed="true" data-t="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div></div>' +
      '<div class="card" id="dq"></div><p class="center small muted" id="ds"></p></div>');
    q('#dt').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; var on = b.getAttribute('aria-pressed') !== 'true', t = b.getAttribute('data-t');
      if (!on && chosen.length === 1) return; b.setAttribute('aria-pressed', on); chosen = on ? chosen.concat(t) : chosen.filter(function (x) { return x !== t; }); next(); };
    function next() {
      var t = pick(chosen), g = GEN[t](), s = shuffleOpts(g.ans, g.w, g.fmt); cur = { g: g, s: s, t: t };
      q('#dq').innerHTML = '<p class="pill accent">' + esc(t) + '</p><h2 style="margin:10px 0 14px">' + esc(g.q) + '</h2><div class="opts">' +
        s.opts.map(function (o, i) { return '<button class="opt" data-i="' + i + '">' + esc(o) + '</button>'; }).join('') + '</div><div id="dx"></div>';
      q('#dq .opts').onclick = function (e) {
        var b = e.target.closest('button'); if (!b || cur.done) return; cur.done = true; var i = +b.getAttribute('data-i'); total++;
        var ok = i === cur.s.correct; if (ok) score++;
        Array.prototype.forEach.call(this.children, function (c, k) { if (k === cur.s.correct) c.classList.add('ok'); else if (k === i) c.classList.add('no'); });
        q('#dx').innerHTML = '<p class="small" style="margin:12px 0"><b>' + (ok ? 'Correct.' : 'Not quite.') + '</b> ' + esc(cur.g.e) + '</p><button class="btn block" id="dn">Next question</button>';
        q('#dn').onclick = next; q('#ds').textContent = 'Score: ' + score + ' / ' + total;
      };
    }
    next();
  }


  function testsTree(list) {
    if (!list.length) return '';
    function bucket(arr, key) {
      var m = {}, order = [];
      arr.forEach(function (t) { var k = t[key] || 'Others'; if (!m[k]) { m[k] = []; order.push(k); } m[k].push(t); });
      var others = [];
      order = order.filter(function (k) { if (k !== 'Others' && m[k].length < 2) { others = others.concat(m[k]); return false; } return true; });
      if (others.length) { if (!m.Others) { m.Others = []; order.push('Others'); } m.Others = m.Others.concat(others); }
      order.sort(function (a, b) { return (a === 'Others') - (b === 'Others'); });
      return order.map(function (k) { return [k, m[k]]; });
    }
    function card(t) {
      return '<a class="tr-item" href="/t/' + esc(t.slug) + '" data-link><b>' + esc(t.title) + '</b>' + (t.description ? '<span class="small muted">' + esc(t.description) + '</span>' : '') +
        '<span class="small muted">' + (t.durations || []).join(' / ') + ' min</span><span class="pill good">Start →</span></a>';
    }
    return '<p class="f tr-g">📝 Ready-made tests (' + list.length + ')</p>' + bucket(list, 'grp').map(function (g) {
      var subs = bucket(g[1], 'subgrp');
      var inner = (subs.length === 1 && subs[0][0] === 'Others') ? '<div class="tr-items">' + g[1].map(card).join('') + '</div>' :
        subs.map(function (s) { return '<p class="small" style="margin:10px 0 6px"><b>' + esc(s[0]) + '</b></p><div class="tr-items">' + s[1].map(card).join('') + '</div>'; }).join('');
      return '<details class="tgrp"' + (list.length <= 12 ? ' open' : '') + '><summary><b>' + esc(g[0]) + '</b> <span class="small muted">(' + g[1].length + ')</span></summary>' + inner + '</details>';
    }).join('');
  }



  /* ---------- light animations: reveal on scroll + count-up ---------- */
  function animateIn() {
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var els = document.querySelectorAll('.card, .tr-item, .trk, .st, .ab-card, .reveal, .rv');
    if (!('IntersectionObserver' in window) || reduce) { Array.prototype.forEach.call(els, function (e) { e.classList.add('rv-in'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (!en.isIntersecting) return; var e = en.target; e.classList.add('rv-in'); io.unobserve(e);
      Array.prototype.forEach.call(e.querySelectorAll ? e.querySelectorAll('.cnt') : [], function (c) { var to = +c.getAttribute('data-to'), t0 = performance.now(); (function tick(t) { var k = Math.min(1, (t - t0) / 900); c.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); })(t0); }); }); }, { threshold: 0.08 });
    Array.prototype.forEach.call(els, function (e) { if (!e.classList.contains('rv-in')) { e.classList.add('rv'); io.observe(e); } });
  }
  new MutationObserver(function () { clearTimeout(animateIn.t); animateIn.t = setTimeout(animateIn, 60); }).observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
  window.addEventListener('scroll', function () { var b = document.getElementById('bar'); if (b) b.classList.toggle('scrolled', scrollY > 8); }, { passive: true });

  /* ---------- About VKV Sir: achievements strip ---------- */
  var LINKEDIN = 'https://www.linkedin.com/in/vkvsir';
  function mountAbout(el) {
    if (!el) return;
    sb.from('about_items').select('id,title,caption,image_url,link,sort').eq('active', true).order('sort').order('id', { ascending: false }).then(function (r) {
      var items = (r && r.data) || [];
      var admin = profile && profile.is_admin;
      el.innerHTML = '<section class="about-vkv"><div class="spread"><h2 class="sh2">About VKV Sir</h2>' + (admin ? '<a class="small" href="/admin/about" data-link>Manage photos</a>' : '') + '</div>' +
        '<p class="small muted" style="margin:-4px 0 12px">Dr. Vinod Kumar Verma: teaching, achievements and milestones. Swipe to see more →</p>' +
        '<div class="ab-strip">' + items.map(function (x) {
          var img = x.image_url ? '<img src="' + esc(x.image_url) + '" alt="' + esc(x.title) + '" loading="lazy">' : '<div class="ab-ph">🏅</div>';
          var inner = img + '<div class="ab-t"><b>' + esc(x.title) + '</b>' + (x.caption ? '<span>' + esc(x.caption) + '</span>' : '') + '</div>';
          return x.link ? '<a class="ab-card" href="' + esc(x.link) + '" target="_blank" rel="noopener">' + inner + '</a>' : '<div class="ab-card">' + inner + '</div>';
        }).join('') +
        '<a class="ab-card ab-more" href="' + LINKEDIN + '" target="_blank" rel="noopener"><div class="ab-ph">in</div><div class="ab-t"><b>See all on LinkedIn</b><span>Posts, achievements and updates</span></div></a></div></section>';
    }, function () {});
  }
  function viewAboutAdmin() {
    setNav('admin');
    if (!(profile && profile.is_admin)) { h('<div class="card narrow center"><p>Admins only.</p></div>'); return; }
    loading();
    sb.from('about_items').select('*').order('sort').order('id', { ascending: false }).then(function (r) {
      var items = (r && r.data) || [];
      h('<div class="narrow stack"><div><p class="eyebrow">Admin</p><h1>About VKV Sir: photos</h1><p class="muted small">Add photos from your LinkedIn posts (download the image, then upload here). They appear on the home page in a horizontal strip.</p></div>' +
        '<div class="card stack"><label class="f" for="ai">Photo</label><input type="file" id="ai" accept="image/*" class="in">' +
        '<label class="f" for="at">Title (short)</label><input class="in" id="at" maxlength="80" placeholder="e.g. Best Teacher Award 2025">' +
        '<label class="f" for="ac">Caption (optional)</label><input class="in" id="ac" maxlength="140" placeholder="One line about it">' +
        '<label class="f" for="al">Link (optional)</label><input class="in" id="al" placeholder="LinkedIn post URL">' +
        '<label class="f" for="as">Order (smaller shows first)</label><input class="in" id="as" type="number" value="100">' +
        '<div class="err" id="ae"></div><button class="btn" id="ago">Add to About section</button></div>' +
        '<div class="card"><h2>Current items (' + items.length + ')</h2>' + (items.length ? items.map(function (x) {
          return '<div class="spread" style="padding:8px 0;border-top:1px solid var(--line)"><span>' + (x.image_url ? '<img src="' + esc(x.image_url) + '" style="width:56px;height:40px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:8px">' : '') + '<b>' + esc(x.title) + '</b> <span class="small muted">#' + x.sort + '</span></span><button class="linkbtn" data-del="' + x.id + '">Delete</button></div>';
        }).join('') : '<p class="muted small">Nothing yet.</p>') + '</div></div>');
      q('#ago').onclick = function () {
        var f = q('#ai').files[0], t = q('#at').value.trim(), b = this;
        if (!t) { q('#ae').textContent = 'Please add a title.'; return; }
        if (f && f.size > 5 * 1024 * 1024) { q('#ae').textContent = 'Image must be under 5 MB.'; return; }
        b.disabled = true; b.textContent = 'Uploading…';
        var up = f ? sb.storage.from('about').upload(Date.now() + '-' + f.name.replace(/[^a-z0-9.]+/gi, '-').toLowerCase(), f, { upsert: false }).then(function (res) {
          if (res.error) throw res.error; return sb.storage.from('about').getPublicUrl(res.data.path).data.publicUrl; }) : Promise.resolve(null);
        up.then(function (url) {
          return sb.from('about_items').insert({ title: t, caption: q('#ac').value.trim() || null, link: q('#al').value.trim() || null, sort: +q('#as').value || 100, image_url: url });
        }).then(function (res) { if (res && res.error) throw res.error; viewAboutAdmin(); })
          .catch(function (e) { q('#ae').textContent = errMsg(e); b.disabled = false; b.textContent = 'Add to About section'; });
      };
      Array.prototype.forEach.call(document.querySelectorAll('[data-del]'), function (d) {
        d.onclick = function () { if (!confirm('Delete this item?')) return; sb.from('about_items').delete().eq('id', +d.getAttribute('data-del')).then(function () { viewAboutAdmin(); }); };
      });
    });
  }

  /* ---------- personal group link ---------- */
  function viewGroup(tok) {
    setNav('exam'); loading();
    rpc('g_info', { p_token: tok }).then(function (g) {
      wmEmail = g.email;
      var win = g.starts_at || g.ends_at ? '<p class="small muted" style="margin:0">' + (g.starts_at ? 'Opens ' + esc(fmtDate(g.starts_at)) : '') + (g.starts_at && g.ends_at ? ' · ' : '') + (g.ends_at ? 'Closes ' + esc(fmtDate(g.ends_at)) : '') + '</p>' : '';
      var cards = g.tests.map(function (t) {
        var act = t.attempts.filter(function (a) { return a.status !== 'done'; })[0], done = t.attempts.filter(function (a) { return a.status === 'done'; });
        var left = t.max_attempts == null ? null : t.max_attempts - t.attempts.length;
        var body;
        if (act) body = '<a class="btn block" href="/g/' + tok + '/exam/' + act.id + '" data-link>Resume test</a>';
        else if (left !== null && left <= 0) body = '<p class="small muted">Completed.</p>';
        else body = (t.durations.length > 1 ? '<div class="seg" data-seg="' + esc(t.slug) + '">' + t.durations.map(function (d, k) { return '<button type="button" data-d="' + d + '" aria-pressed="' + (k === 0) + '"><b>' + d + ' min</b></button>'; }).join('') + '</div>' : '<p class="small muted">' + t.durations[0] + ' minutes &middot; ' + t.sec_per_q + ' s per question</p>') +
          '<button class="btn block" data-start="' + esc(t.slug) + '" data-dur="' + t.durations[0] + '"' + (g.open ? '' : ' disabled') + '>Start</button>';
        var hist = done.map(function (a) { return '<a href="/g/' + tok + '/result/' + a.id + '" data-link class="small">' + esc(fmtDate(a.at)) + ': ' + (a.score == null ? 'submitted' : a.score + '/' + a.n) + '</a>'; }).join('<br>');
        return '<article class="card test-card"><div class="row"><span class="pill">' + (t.mode === 'exam' ? 'Exam' : 'Practice') + '</span>' + (left !== null ? '<span class="pill">' + Math.max(0, left) + ' attempt(s) left</span>' : '') + '</div>' +
          '<h3>' + esc(t.title) + '</h3>' + (t.description ? '<p class="small muted">' + esc(t.description) + '</p>' : '') + body + (hist ? '<p class="small" style="margin:8px 0 0">' + hist + '</p>' : '') + '</article>';
      }).join('') || '<div class="card muted">Your teacher has not assigned a test yet. Keep this link; your tests will appear here.</div>';
      h('<div class="stack"><div class="card"><p class="eyebrow">' + esc(g.group) + '</p><h1>Hello, ' + esc((g.name || '').split(' ')[0] || 'there') + '</h1>' +
        '<p class="muted" style="margin:0">' + esc(g.email) + (g.roll ? ' &middot; Roll ' + esc(g.roll) : '') + '</p>' + win +
        (g.note ? '<div class="note" style="color:var(--ink);background:var(--soft)">' + esc(g.note) + '</div>' : '') +
        (!g.open ? '<div class="note">This session is not open right now.</div>' : '') +
        (g.locked > 0 ? '<div class="note">You are paused for leaving a test screen. Try again in ' + mmss(g.locked * 1000) + '.</div>' : '') +
        '<p class="small muted" style="margin:12px 0 0">This is your personal link. Do not share it. Results also appear on your dashboard if you later sign in with this email.</p></div>' +
        '<div class="grid">' + cards + '</div><div class="err" id="ge" role="alert"></div></div>');
      $view.querySelectorAll('[data-seg]').forEach(function (sg) {
        sg.onclick = function (e) { var b = e.target.closest('button'); if (!b) return; Array.prototype.forEach.call(sg.children, function (c) { c.setAttribute('aria-pressed', c === b); }); sg.parentNode.querySelector('[data-start]').setAttribute('data-dur', b.getAttribute('data-d')); };
      });
      $view.querySelectorAll('[data-start]').forEach(function (b) {
        b.onclick = function () {
          b.disabled = true; b.textContent = 'Preparing your paper…';
          rpc('g_start', { p_token: tok, p_slug: b.getAttribute('data-start'), p_duration: +b.getAttribute('data-dur') })
            .then(function (v) { go('/g/' + tok + '/exam/' + v.attempt); })
            .catch(function (e) { q('#ge').textContent = lockText(errMsg(e)); b.disabled = false; b.textContent = 'Start'; });
        };
      });
    }).catch(function (e) { h('<div class="narrow card center"><h2>Link problem</h2><p class="muted">' + esc(errMsg(e)) + '</p></div>'); });
  }

  /* ---------- catalog (practice by subject / unit / topic) ---------- */
  function mountCatalog(el) {
    if (!el) return;
    rpc('catalog').then(function (cat) {
      if (!cat || !cat.length) return;
      var subj = cat[0], unit = null, topic = null, dur = null;
      function durs() {
        var node = topic ? topic : (unit ? unit : subj);
        return node.durations || [];
      }
      function draw() {
        var ds = durs(); if (ds.indexOf(dur) < 0) dur = ds.length ? ds[ds.length > 1 ? 1 : 0] : null;
        var newOnes = [];
        subj.units.forEach(function (u) { u.topics.forEach(function (t) { if (t.new) newOnes.push(t.name); }); });
        el.innerHTML = '<section class="card" style="margin-top:24px"><div class="spread"><h2 style="margin:0">Start a new practice</h2>' +
          (cat.length > 1 ? '<select class="in" id="cs" style="max-width:260px">' + cat.map(function (c, k) { return '<option value="' + k + '"' + (c === subj ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select>' : '<span class="pill accent">' + esc(subj.name) + '</span>') + '</div>' +
          '<p class="small muted">Pick the full syllabus, one unit, or one topic. A topic opens for practice once it has enough questions.</p>' +
          '<p class="f">Unit</p><div class="chips" id="cu"><button class="chip sel" aria-pressed="' + (!unit) + '" data-u="">Full syllabus</button>' +
          subj.units.map(function (u) { return '<button class="chip sel" aria-pressed="' + (unit === u) + '" data-u="' + u.unit + '">Unit ' + u.unit + ': ' + esc(u.name) + '</button>'; }).join('') + '</div>' +
          (unit ? '<p class="f">Topic</p><div class="chips" id="ct"><button class="chip sel" aria-pressed="' + (!topic) + '" data-t="">Whole unit</button>' +
            unit.topics.map(function (t) {
              var off = !t.durations.length;
              return '<button class="chip sel" ' + (off ? 'disabled title="More questions coming soon"' : '') + ' aria-pressed="' + (topic === t) + '" data-t="' + esc(t.id) + '">' + esc(t.name) + (t.new ? ' <span class="badge">New</span>' : '') + (off ? ' <span class="muted">(soon)</span>' : '') + '</button>';
            }).join('') + '</div>' : '') +
          '<p class="f">Time</p>' + (ds.length ? '<div class="seg" id="cd">' + ds.map(function (d) { return '<button type="button" data-d="' + d + '" aria-pressed="' + (d === dur) + '"><b>' + d + ' min</b><span>' + Math.floor(d * 60 / 45) + ' Qs</span></button>'; }).join('') + '</div>' : '<p class="muted small">Not enough questions here yet. Choose a wider option.</p>') +
          '<div class="err" id="ce" role="alert"></div><button class="btn block" id="cgo" ' + (ds.length ? '' : 'disabled') + '>' + (session ? 'Prepare my paper' : 'Sign in to start') + '</button>' +
          shareBar(practiceLink(subj.id, unit && unit.unit, topic && topic.id), 'Practise ' + (topic ? topic.name : unit ? 'Unit ' + unit.unit + ' (' + unit.name + ')' : subj.name) + ' free with VKV Sir:', 'Share this practice:') +
          (newOnes.length ? '<p class="small" style="margin:14px 0 0"><span class="badge">New</span> Recently added: ' + esc(newOnes.slice(0, 8).join(', ')) + (newOnes.length > 8 ? '…' : '') + '</p>' : '') +
          '</section>';
        var cs = el.querySelector('#cs'); if (cs) cs.onchange = function () { subj = cat[+this.value]; unit = topic = null; draw(); };
        el.querySelector('#cu').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; var v = b.getAttribute('data-u'); unit = v ? subj.units.filter(function (u) { return String(u.unit) === v; })[0] : null; topic = null; draw(); };
        var ct = el.querySelector('#ct'); if (ct) ct.onclick = function (e) { var b = e.target.closest('button'); if (!b || b.disabled) return; var v = b.getAttribute('data-t'); topic = v ? unit.topics.filter(function (t) { return t.id === v; })[0] : null; draw(); };
        var cd = el.querySelector('#cd'); if (cd) cd.onclick = function (e) { var b = e.target.closest('button'); if (!b) return; dur = +b.getAttribute('data-d'); draw(); };
        el.querySelector('#cgo').onclick = function () {
          if (!requireAuth(location.pathname)) return;
          var g = this; g.disabled = true; g.textContent = 'Preparing your paper…';
          rpc('start_custom', { p_subject: subj.id, p_unit: unit ? unit.unit : null, p_topic: topic ? topic.id : null, p_duration: dur })
            .then(function (v) { go('/exam/' + v.attempt); })
            .catch(function (e) { var m = errMsg(e); if (m === 'PROFILE_INCOMPLETE') return go('/profile?next=' + location.pathname); el.querySelector('#ce').textContent = lockText(m); g.disabled = false; g.textContent = 'Prepare my paper'; });
        };
      }
      draw();
    }).catch(function () {});
  }
  function lockText(m) {
    var r = /^LOCKED:(\d+)/.exec(m || '');
    return r ? 'You are temporarily locked for leaving a test screen. Try again in ' + mmss(+r[1] * 1000) + '.' : m;
  }

  /* ---------- exam ---------- */
  var THUMB_UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 0 1 2 2v4h5.5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.3 20H7"/></svg>';
  var THUMB_DN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 13V4h3v9zM17 13l-4 8a2 2 0 0 1-2-2v-4H5.5a2 2 0 0 1-2-2.3l1.2-7A2 2 0 0 1 6.7 4H17"/></svg>';
  var RFLAGS = [['wrong_answer_key', 'Answer seems wrong'], ['unclear_explanation', 'Explanation unclear'], ['multiple_correct', 'More than one correct'], ['typo', 'Typo or error'], ['out_of_syllabus', 'Out of syllabus']];
  var FLAGS = [['no_correct', 'No option is correct'], ['multiple_correct', 'More than one correct'], ['missing_data', 'Missing data or figure'], ['hard_language', 'Hard language'], ['typo', 'Typo or error'], ['out_of_syllabus', 'Out of syllabus']];

  function watermark() {
    var t = wmEmail || (profile && profile.email) || '';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="160"><text x="10" y="110" transform="rotate(-24 10 110)" font-family="Arial" font-size="17" font-weight="700" fill="rgba(110,110,110,0.20)">' + esc(t) + '</text></svg>';
    return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '")';
  }

  var GMAP = { state: 'attempt_state', begin: 'begin_attempt', answer: 'answer_question', finish: 'finish_attempt', leave: 'report_leave', result: 'attempt_result', feedback: 'result_feedback' };
  function examApi(tok) {
    return function (fn, a) {
      if (tok) return rpc('g_call', { p_token: tok, p_fn: fn, p_id: a.p_id, p_idx: a.p_idx != null ? a.p_idx : (a.p_no != null ? a.p_no : null), p_choice: a.p_choice != null ? a.p_choice : null, p_rating: a.p_rating != null ? a.p_rating : null, p_flags: a.p_flags || null, p_ms: a.p_ms != null ? a.p_ms : null });
      return rpc(GMAP[fn], a);
    };
  }
  var wmEmail = '';
  function viewExam(id, tok) {
    setNav('exam');
    var A = examApi(tok), base = tok ? '/g/' + tok : '';
    if (!tok && !session) return go('/login?next=' + encodeURIComponent('/exam/' + id), true);
    loading();
    var st = null, sel = null, rating = null, flags = [], busy = false, qEnd = 0, tEnd = 0, readyAt = 0, ticker = null, inQ = false, hiddenAt = 0;

    function onVis() {
      if (!inQ) return;
      if (document.hidden) { document.body.classList.add('veil'); hiddenAt = Date.now(); return; }
      var ms = hiddenAt ? Date.now() - hiddenAt : 0; hiddenAt = 0;
      A('leave', { p_id: id, p_ms: ms }).then(function (r) { if (r && r.locked > 0) load(); else { var n = q('#leave'); if (n) n.hidden = false; tick(); } }).catch(function () {});
    }
    function onBlur() { if (inQ) document.body.classList.add('veil'); }
    function onFocus() { if (!document.hidden) document.body.classList.remove('veil'); }
    function onPageHide() { if (inQ) document.body.classList.add('veil'); }
    window.addEventListener('pagehide', onPageHide);
    function onUnload(e) { if (inQ) { e.preventDefault(); e.returnValue = ''; } }
    function noCopy(e) { if (inQ) e.preventDefault(); }
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur); window.addEventListener('focus', onFocus);
    window.addEventListener('beforeunload', onUnload);
    document.addEventListener('copy', noCopy); document.addEventListener('contextmenu', noCopy);
    cleanup = function () { clearInterval(ticker); document.body.classList.remove('veil'); window.removeEventListener('pagehide', onPageHide); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('blur', onBlur); window.removeEventListener('focus', onFocus); window.removeEventListener('beforeunload', onUnload); document.removeEventListener('copy', noCopy); document.removeEventListener('contextmenu', noCopy); };

    function render(v) {
      busy = false; st = v;
      if (v.phase === 'done') { inQ = false; clearInterval(ticker); return go(base + '/result/' + id, true); }
      if (v.phase === 'instructions') return renderInstructions(v);
      if (v.phase === 'locked') return renderLocked(v);
      renderQuestion(v);
    }
    function fail(e) {
      busy = false; clearInterval(ticker);
      var m = errMsg(e);
      if (/^LOCKED:/.test(m)) return load();
      h('<div class="narrow card center"><h2>Connection problem</h2><p class="muted">' + esc(m) + '</p><p class="small muted">Your answers so far are saved.</p><button class="btn" id="rt">Try again</button></div>');
      q('#rt').onclick = load;
    }
    function load() { loading(); A('state', { p_id: id }).then(render).catch(fail); }

    function renderLocked(v) {
      inQ = false; clearInterval(ticker);
      var end = now() + v.seconds * 1000, tEndL = now() + v.total_left_ms;
      h('<div class="narrow card center stack"><div class="big" style="color:var(--warn)">&#9208;</div><h1>Test paused as a penalty</h1>' +
        '<p>You left the test screen (switched app or tab). Your test timer <b>keeps running</b> while you wait.</p>' +
        '<div class="big mono" id="lk"></div><p class="small muted">Total test time left: <span class="mono" id="lt"></span></p>' +
        '<div class="note">The pause doubles if you leave again. Stay on this screen to keep your time.</div></div>');
      ticker = setInterval(function () {
        var l = Math.max(0, end - now()), t = Math.max(0, tEndL - now());
        var a = q('#lk'), b = q('#lt'); if (!a) return;
        a.textContent = mmss(l); b.textContent = mmss(t);
        if (l <= 0 || t <= 0) { clearInterval(ticker); load(); }
      }, 500);
    }

    function renderInstructions(v) {
      inQ = false;
      readyAt = now() + Math.max(0, v.wait_ms);
      var total = Math.max(1, v.wait_ms), C = 2 * Math.PI * 54;
      h('<div class="exam narrow stack"><div><p class="eyebrow">Your paper is ready</p><h1>' + esc(v.title) + '</h1></div>' +
        '<div class="card"><h3>Read before you begin</h3><ul class="rules">' +
        '<li><b>' + v.n + ' questions</b> in <b>' + v.duration + ' minutes</b>, ' + v.sec_per_q + ' seconds each.</li>' +
        '<li>One question at a time. You cannot go back.</li>' +
        '<li>Select an option to move ahead. When a question\'s time ends, the next one opens.</li>' +
        '<li>The paper submits itself when the total time ends.</li>' +
        '<li>Tap &#128077; or &#128078; under a question to rate it. &#128078; lets you report what is wrong. Optional.</li></ul>' +
        (v.penalty ? '<div class="notice" style="margin-top:14px"><b>Stay on this screen during the test.</b><ul>' +
          '<li>Switching to another app or tab pauses you: <b>' + mmss(v.pen1 * 1000) + ' min</b> the first time, <b>' + mmss(v.pen2 * 1000) + ' min</b> every next time (never more than half of your remaining time). The test timer keeps running.</li>' +
          '<li><b>Turn on Do Not Disturb</b> before you begin, so calls and messages do not interrupt you.</li>' +
          '<li>Screenshots and screen search are not allowed. Your email is printed across the paper, and the questions hide when the screen loses focus.</li></ul></div>' : '') +
        '<svg class="ring" viewBox="0 0 132 132" aria-hidden="true"><circle class="bg" cx="66" cy="66" r="54" fill="none" stroke-width="8"/>' +
        '<circle class="fg" id="arc" cx="66" cy="66" r="54" fill="none" stroke-width="8" stroke-linecap="round" transform="rotate(-90 66 66)" stroke-dasharray="' + C + '" stroke-dashoffset="0"/>' +
        '<text id="rs" x="66" y="76" text-anchor="middle"></text></svg>' +
        '<button class="btn block" id="begin" disabled>Please read the instructions</button></div></div>');
      clearInterval(ticker);
      function step() {
        var left = Math.max(0, readyAt - now()), rs = q('#rs'); if (!rs) return;
        rs.textContent = left > 0 ? Math.ceil(left / 1000) + 's' : 'Go';
        q('#arc').setAttribute('stroke-dashoffset', String(C * (1 - left / total)));
        if (left <= 0) { clearInterval(ticker); var b = q('#begin'); b.disabled = false; b.textContent = 'I have read the instructions. Begin'; }
      }
      ticker = setInterval(step, 200); step();
      q('#begin').onclick = function () { this.disabled = true; this.textContent = 'Starting…'; A('begin', { p_id: id }).then(render).catch(fail); };
    }

    function renderQuestion(v) {
      inQ = true; sel = null; rating = null; flags = [];
      var t = now(); qEnd = t + v.q_left_ms; tEnd = t + v.total_left_ms;
      var last = v.idx + 1 === v.n;
      h('<div class="wm-layer" style="background-image:' + watermark() + '"></div><div class="exam' + (v.image ? ' has-img' : '') + '"><div class="exam-top"><div class="spread"><span class="qcount">Question ' + (v.idx + 1) + ' of ' + v.n + '</span><span class="tleft" id="tl"></span></div>' +
        '<div class="track"><div class="fill" id="fl"></div></div><div class="qtime" id="qt"></div></div>' +
        (v.image ? zimg(v.image, '', 'Figure for this question') : '') +
        '<div class="qbody" id="qb">' + esc(v.body) + '</div><div class="opts' + (v.image && v.options.every(function (o) { return String(o).length <= 14; }) ? ' opts-grid' : '') + '" role="radiogroup" aria-labelledby="qb" id="opts">' +
        v.options.map(function (o, k) { return '<button type="button" class="opt" role="radio" aria-checked="false" data-k="' + k + '"><span class="k">' + 'ABCD'[k] + '</span><span>' + esc(o) + '</span></button>'; }).join('') +
        '</div><div class="fb"><div class="row"><span class="small muted">Rate this question (optional):</span>' +
        '<button type="button" class="icon-btn" id="up" aria-pressed="false" aria-label="Good question">' + THUMB_UP + '</button>' +
        '<button type="button" class="icon-btn" id="dn" aria-pressed="false" aria-label="Problem with this question">' + THUMB_DN + '</button></div>' +
        '<div id="chips" hidden><p class="small" style="margin:12px 0 0">What is wrong? Tap all that apply:</p><div class="chips">' + FLAGS.map(function (f) { return '<button type="button" class="chip" aria-pressed="false" data-f="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div></div></div>' +
        '<div class="note" id="leave" hidden>Leaving the exam screen is recorded.</div>' +
        '<div class="exam-foot"><button class="btn block" id="nx" disabled>' + (last ? 'Submit paper' : 'Next question') + '</button></div></div>');
      renderMath($view);
      q('#opts').addEventListener('click', function (e) {
        var b = e.target.closest('.opt'); if (!b || busy) return;
        sel = +b.getAttribute('data-k');
        Array.prototype.forEach.call(this.children, function (c) { c.setAttribute('aria-checked', c === b); });
        q('#nx').disabled = false;
      });
      q('#up').onclick = function () { rating = rating === 1 ? null : 1; q('#up').setAttribute('aria-pressed', rating === 1); q('#dn').setAttribute('aria-pressed', false); q('#chips').hidden = true; flags = []; resetChips(); };
      q('#dn').onclick = function () { rating = rating === -1 ? null : -1; q('#dn').setAttribute('aria-pressed', rating === -1); q('#up').setAttribute('aria-pressed', false); q('#chips').hidden = rating !== -1; if (rating !== -1) { flags = []; resetChips(); } };
      function resetChips() { Array.prototype.forEach.call(q('#chips').querySelectorAll('.chip'), function (c) { c.setAttribute('aria-pressed', false); }); }
      q('#chips').addEventListener('click', function (e) {
        var b = e.target.closest('.chip'); if (!b) return;
        var f = b.getAttribute('data-f'), i = flags.indexOf(f);
        if (i >= 0) flags.splice(i, 1); else flags.push(f);
        b.setAttribute('aria-pressed', i < 0);
      });
      q('#nx').onclick = function () { if (sel !== null) send(false); };
      clearInterval(ticker); ticker = setInterval(tick, 250); tick();
    }

    function tick() {
      if (!st || st.phase !== 'question') return;
      var t = now(), ql = Math.max(0, qEnd - t), tl = Math.max(0, tEnd - t);
      var fl = q('#fl'), qt = q('#qt'), tle = q('#tl'); if (!fl) return;
      var low = ql <= 10000;
      fl.style.width = (100 * ql / st.per_ms) + '%'; fl.classList.toggle('low', low);
      qt.classList.toggle('low', low); qt.textContent = Math.ceil(ql / 1000) + ' s for this question';
      tle.textContent = mmss(tl) + ' left'; tle.classList.toggle('low', tl <= 120000);
      if (busy) return;
      if (tl <= 0) send(true); else if (ql <= 0) send(false);
    }

    function send(final) {
      if (busy || !st) return;
      busy = true;
      var b = q('#nx'); if (b) { b.disabled = true; b.textContent = final ? 'Submitting…' : 'Saving…'; }
      var args = { p_id: id, p_idx: st.idx, p_choice: sel === null ? -1 : sel, p_rating: rating, p_flags: (rating === -1 && flags.length) ? flags : null };
      A(final ? 'finish' : 'answer', args).then(render).catch(fail);
    }

    load();
  }

  /* ---------- charts ---------- */
  function donut(parts) {
    var tot = parts.reduce(function (s, p) { return s + p.v; }, 0) || 1, C = 2 * Math.PI * 42, off = 0;
    var arcs = parts.map(function (p) {
      var len = C * p.v / tot, a = '<circle cx="60" cy="60" r="42" fill="none" stroke="' + p.c + '" stroke-width="16" stroke-dasharray="' + len + ' ' + (C - len) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 60 60)"/>';
      off += len; return a;
    }).join('');
    return '<div class="chart-row"><svg viewBox="0 0 120 120" class="donut" role="img" aria-label="Answer breakdown"><circle cx="60" cy="60" r="42" fill="none" stroke="var(--soft)" stroke-width="16"/>' + arcs + '</svg>' +
      '<div class="legend">' + parts.map(function (p) { return '<div><i style="background:' + p.c + '"></i>' + p.l + ' <b>' + p.v + '</b></div>'; }).join('') + '</div></div>';
  }
  function trendChart(pts) {
    if (!pts || pts.length < 2) return '<p class="small muted">Take two or more tests to see your trend.</p>';
    var W = 320, H = 120, n = pts.length;
    var xy = pts.map(function (p, i) { return [10 + i * (W - 20) / (n - 1), H - 10 - (H - 20) * p.pct / 100]; });
    var path = xy.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="trend" role="img" aria-label="Score trend">' +
      '<line x1="10" x2="' + (W - 10) + '" y1="' + (H / 2) + '" y2="' + (H / 2) + '" stroke="var(--line)" stroke-dasharray="4 4"/>' +
      '<path d="' + path + '" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>' +
      xy.map(function (p, i) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="var(--accent)"><title>' + pts[i].pct + '%</title></circle>'; }).join('') + '</svg>';
  }
  function unitBars(units, key) {
    return '<div class="bars">' + units.map(function (u) {
      var pct = key === 'ok' ? Math.round(100 * u.ok / u.n) : u.pct;
      return '<div class="barrow"><span>Unit ' + u.unit + ': ' + esc(u.name) + '</span><div class="barline"><i style="width:' + pct + '%;background:' + (pct >= 70 ? 'var(--good)' : pct >= 40 ? 'var(--accent)' : 'var(--bad)') + '"></i></div><span class="mono">' + pct + '%</span></div>';
    }).join('') + '</div>';
  }

  /* ---------- result ---------- */
  function viewResult(id, tok) {
    setNav(tok ? 'exam' : 'me');
    var A = examApi(tok), home = tok ? '/g/' + tok : '/me';
    if (!tok && !session) return go('/login?next=' + encodeURIComponent('/result/' + id), true);
    loading();
    A('result', { p_id: id }).then(function (r) {
      if (r.hidden) {
        h('<div class="narrow card center stack"><div class="big" style="color:var(--good)">&#10003;</div><h1>Submitted</h1><p class="muted">You answered ' + r.attempted + ' of ' + r.n + ' questions. Your teacher will release the results.</p><a class="btn" href="' + home + '" data-link>' + (tok ? 'Back to my tests' : 'Go to dashboard') + '</a></div>');
        return;
      }
      var pct = r.n ? Math.round(100 * r.score / r.n) : 0, C = 2 * Math.PI * 54;
      var wrong = r.attempted - r.score, skip = r.n - r.attempted;
      var rev = (r.review || []).map(function (x) {
        return '<div class="review ' + (x.skipped ? 'skip' : 'no') + '"><div class="spread small"><span><b>Q' + x.no + '</b> &middot; ' + esc(x.topic) + '</span><span class="pill ' + (x.skipped ? '' : 'bad') + '">' + (x.skipped ? 'Not answered' : 'Wrong') + '</span></div>' +
          (x.image ? zimg(x.image, 'rimg', 'Figure') : '') + '<div class="muted" style="margin-top:6px">' + esc(x.image ? (x.body || x.teaser) : x.teaser) + '</div><div style="margin-top:4px"><span class="small muted">Correct answer:</span> <b style="color:var(--good)">' + esc(x.answer) + '</b></div>' +
          (x.explanation ? '<p class="small" style="margin:8px 0 0">' + esc(x.explanation) + '</p>' : '') +
          '<div class="rfb" data-no="' + x.no + '"><span class="small muted">Is this answer right?</span><button type="button" class="icon-btn" data-r="1" aria-pressed="false" aria-label="Looks right">' + THUMB_UP + '</button><button type="button" class="icon-btn" data-r="-1" aria-pressed="false" aria-label="I have a concern">' + THUMB_DN + '</button>' +
          '<div class="chips" hidden>' + RFLAGS.map(function (f) { return '<button type="button" class="chip" aria-pressed="false" data-f="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div></div></div>';
      }).join('');
      var acc = r.attempted ? Math.round(100 * r.score / r.attempted) : 0, att = r.n ? Math.round(100 * r.attempted / r.n) : 0;
      var V = pct >= 85 ? ['great', '🏆 Excellent', 'You have a strong grip on this. Move to harder topics or a full-length paper.'] : pct >= 70 ? ['good', '👍 Good', 'Solid work. Fix the few weak spots below to reach the top band.'] : pct >= 50 ? ['fair', '📈 Getting there', 'You know the basics. Practise the units marked “Focus” and you will improve quickly.'] : ['low', '🎯 Needs practice', 'Start with the explanations below, then practise one unit at a time.'];
      var tip = acc >= 80 && att < 75 ? 'Your accuracy is high but you left many questions. Try to attempt more; time management will raise your score.' : acc < 60 && att >= 85 ? 'You attempted almost everything but accuracy is low. Slow down a little and avoid guessing.' : '';
      var units = (r.units || []).map(function (u) { var p = u.n ? Math.round(100 * u.ok / u.n) : 0; return { u: u, p: p, band: p >= 75 ? 'strong' : p >= 50 ? 'mid' : 'weak' }; }).sort(function (a, b) { return a.p - b.p; });
      function ulink(u) { return u.subject ? '/p/' + String(u.subject).toLowerCase() + '/' + u.unit : '/'; }
      var tcount = {}; (r.review || []).forEach(function (x) { if (x.topic) tcount[x.topic] = (tcount[x.topic] || 0) + 1; });
      var topics = Object.keys(tcount).sort(function (a, b) { return tcount[b] - tcount[a]; }).slice(0, 6);
      var weak = units.filter(function (x) { return x.band === 'weak'; }), mid = units.filter(function (x) { return x.band === 'mid'; });
      var steps = [];
      if (rev) steps.push(['📖', 'Read every explanation below', 'Understand why the correct answer is right before practising again.']);
      if (weak.length) steps.push(['🎯', 'Practise ' + esc(weak[0].u.name), 'Your lowest unit (' + weak[0].p + '%). A short unit test now will lift it fastest.', ulink(weak[0].u)]);
      else if (mid.length) steps.push(['🎯', 'Strengthen ' + esc(mid[0].u.name), 'Push this unit above 75%.', ulink(mid[0].u)]);
      steps.push(['⚡', 'Revise with Rapid fire', 'Once a unit is covered, rapid fire builds speed and recall.']);
      steps.push(['🔁', 'Retake in 2–3 days', 'A fresh paper on the same topics shows whether it stuck.']);
      h('<div class="res" style="max-width:860px;margin:0 auto">' +
        '<div class="card res-top res-' + V[0] + '"><div class="score-hero">' +
        '<svg class="ring" viewBox="0 0 132 132" role="img" aria-label="Score ' + pct + ' percent"><circle class="bg" cx="66" cy="66" r="54" fill="none" stroke-width="10"/>' +
        '<circle class="fg" cx="66" cy="66" r="54" fill="none" stroke-width="10" stroke-linecap="round" transform="rotate(-90 66 66)" stroke-dasharray="' + C + '" stroke-dashoffset="' + (C * (1 - pct / 100)) + '"/>' +
        '<text x="66" y="76" text-anchor="middle">' + pct + '%</text></svg>' +
        '<div class="res-h"><p class="eyebrow">' + esc(r.title) + '</p><div class="res-v">' + V[1] + '</div><div class="big">' + r.score + '<span class="muted"> / ' + r.n + '</span></div>' +
        '<p class="muted small">' + esc(r.end_reason || '') + ' · ' + esc(fmtDate(r.finished_at)) + (r.strikes ? ' · ' + r.strikes + ' penalty pause(s)' : '') + '</p></div></div>' +
        '<p class="res-msg">' + V[2] + '</p>' +
        '<div class="res-tiles"><div><b class="g">' + r.score + '</b><span>Correct</span></div><div><b class="b">' + wrong + '</b><span>Wrong</span></div><div><b class="w">' + skip + '</b><span>Not answered</span></div><div><b>' + acc + '%</b><span>Accuracy</span></div><div><b>' + att + '%</b><span>Attempted</span></div></div>' +
        (tip ? '<div class="res-tip">💡 ' + tip + '</div>' : '') +
        '<div class="row res-act">' + (tok ? '<a class="btn" href="' + home + '" data-link>Back to my tests</a>' : '<a class="btn" href="/" data-link>Practise again</a><a class="btn ghost" href="/me" data-link>My dashboard</a>') + '</div></div>' +
        (units.length ? '<div class="card"><h2>Unit-wise analysis</h2><p class="small muted" style="margin-top:-6px">Sorted from weakest to strongest. Practise the red ones first.</p><div class="ua">' +
          units.map(function (x) { return '<div class="ua-i ' + x.band + '"><div class="ua-t"><b>' + esc(x.u.name) + '</b><span class="pill">' + (x.band === 'strong' ? 'Strong' : x.band === 'mid' ? 'Improve' : 'Focus') + '</span></div><div class="ua-bar"><i style="width:' + x.p + '%"></i></div><div class="ua-m"><span>' + x.u.ok + ' / ' + x.u.n + ' correct · ' + x.p + '%</span>' + (!tok && x.band !== 'strong' && x.u.subject ? '<a href="' + ulink(x.u) + '" data-link>Practise this unit →</a>' : '') + '</div></div>'; }).join('') + '</div>' +
          (topics.length ? '<p class="f" style="margin-top:14px">Topics to revise</p><div class="chips">' + topics.map(function (t) { return '<span class="chip">' + esc(t) + (tcount[t] > 1 ? ' · ' + tcount[t] : '') + '</span>'; }).join('') + '</div>' : '') + '</div>' : '') +
        '<div class="card"><h2>Your next steps</h2><div class="nx">' + steps.map(function (s, k) { return (s[3] && !tok ? '<a class="nx-i" href="' + s[3] + '" data-link>' : '<div class="nx-i">') + '<span class="nx-n">' + (k + 1) + '</span><span class="nx-e">' + s[0] + '</span><div><b>' + s[1] + '</b><p>' + s[2] + '</p></div>' + (s[3] && !tok ? '</a>' : '</div>'); }).join('') + '</div></div>' +
        (rev ? '<div class="res-rv"><div class="spread res-rvh"><div><h2>Learn from your mistakes</h2><p class="small muted">Questions you missed, with the right answer and explanation.</p></div>' +
          '<div class="tabs" id="rvf"><button type="button" class="on" data-f="all">All</button><button type="button" data-f="no">Wrong · ' + wrong + '</button><button type="button" data-f="skip">Not answered · ' + skip + '</button></div></div>' + rev + '</div>'
          : '<div class="card center"><h2>Perfect score! 🎉</h2><p class="muted">Every answer was correct.</p></div>') + '</div>');
      var rvf = q('#rvf'); if (rvf) rvf.onclick = function (e) { var b = e.target.closest('button'); if (!b) return; rvf.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); }); var f = b.dataset.f; $view.querySelectorAll('.review').forEach(function (rw) { rw.hidden = f !== 'all' && !rw.classList.contains(f); }); };
      var rv = q('.res'); if (rv) rv.insertAdjacentHTML('beforeend', '<p class="small muted" style="text-align:center;margin:4px 0 0">Questions are expert-prepared and double-checked. Although every answer is carefully reviewed, if you find any ambiguity in an answer or in the wording, use 🚩 <b>Report</b> on that question; our team reviews every report. <a href="/disclaimer" data-link>Terms of use</a></p>' + suggestBox());
      renderMath($view);
      $view.querySelectorAll('.rfb').forEach(function (box) {
        var no = +box.getAttribute('data-no'), rating = null, flags = [], chips = box.querySelector('.chips');
        function save() { A('feedback', { p_id: id, p_no: no, p_rating: rating, p_flags: flags.length ? flags : null }).then(function () { toast('Thanks for the feedback'); }).catch(function () {}); }
        box.addEventListener('click', function (e) {
          var r = e.target.closest('[data-r]'), c = e.target.closest('.chip');
          if (r) {
            rating = +r.getAttribute('data-r');
            box.querySelectorAll('[data-r]').forEach(function (b) { b.setAttribute('aria-pressed', b === r); });
            chips.hidden = rating !== -1; save();
          } else if (c) {
            var f = c.getAttribute('data-f'), i = flags.indexOf(f);
            if (i >= 0) flags.splice(i, 1); else flags.push(f);
            c.setAttribute('aria-pressed', i < 0); save();
          }
        });
      });
    }).catch(function (e) { h('<div class="card narrow center"><p>' + esc(errMsg(e)) + '</p><a class="btn" href="/me" data-link>Dashboard</a></div>'); });
  }

  /* ---------- dashboard ---------- */
  function viewDashboard() {
    setNav('me');
    if (!requireAuth('/me')) return;
    loading();
    Promise.all([rpc('my_dashboard'), rpc('leaderboard', { p_subject: null })]).then(function (r) {
      var d = r[0], board = r[1], at = d.attempts || [], done = at.filter(function (a) { return a.status === 'done'; });
      var scored = done.filter(function (a) { return a.pct !== null && a.pct !== undefined; });
      var avg = scored.length ? Math.round(scored.reduce(function (s, a) { return s + a.pct; }, 0) / scored.length) : '–';
      var best = scored.length ? Math.max.apply(null, scored.map(function (a) { return a.pct; })) : '–';
      var tot = d.totals || { correct: 0, wrong: 0, skipped: 0 };
      var weak = (d.topics || []).slice(0, 6).map(function (t) {
        return '<div class="barrow"><span>' + esc(t.subtopic.replace(/-/g, ' ')) + ' <span class="muted">(U' + t.unit + ')</span></span><div class="barline"><i style="width:' + t.pct + '%;background:' + (t.pct >= 70 ? 'var(--good)' : t.pct >= 40 ? 'var(--accent)' : 'var(--bad)') + '"></i></div><span class="mono">' + t.pct + '%</span></div>';
      }).join('');
      var hist = at.map(function (a) {
        var link = a.status === 'done' ? '/result/' + a.id : '/exam/' + a.id;
        var right = a.status !== 'done' ? '<span class="pill accent">Resume</span>' : (a.pct === null || a.pct === undefined ? '<span class="pill">Submitted</span>' : '<span class="mono">' + a.score + '/' + a.n + '</span>');
        return '<a href="' + link + '" data-link><span><b>' + esc(a.title) + '</b><br><span class="small muted">' + esc(fmtDate(a.date)) + '</span></span>' + right + '</a>';
      }).join('') || '<div class="muted">No tests yet. Your history will appear here.</div>';
      var name = (d.profile.full_name || '').split(' ')[0] || 'there';
      h('<div class="stack"><div class="spread"><div><p class="eyebrow">Dashboard</p><h1>Hello, ' + esc(name) + '</h1>' +
        '<p class="muted small" style="margin:0">' + (d.last ? 'Last test: ' + esc(fmtDate(d.last)) : 'No tests yet') + '</p></div><a class="btn ghost" href="/profile" data-link>Edit profile</a></div>' +
        (d.locked > 0 ? '<div class="note">You are paused for leaving a test screen. You can start again in ' + mmss(d.locked * 1000) + '.</div>' : '') +
        '<div class="qa">' + [['🎯', 'Practise', 'Start a new test', '#cat'], ['🏢', 'Job Prep', 'Plan for a company', '/career'], ['📄', 'My resumes', 'Build or update', '/resume']].map(function (x) { return '<a class="qa-i" href="' + x[3] + '"' + (x[3].charAt(0) === '/' ? ' data-link' : '') + '><span>' + x[0] + '</span><b>' + x[1] + '</b><small>' + x[2] + '</small></a>'; }).join('') + '</div>' +
        '<div class="tiles"><div class="tile"><b>' + done.length + '</b><span>Tests taken</span></div><div class="tile"><b>' + avg + (avg === '–' ? '' : '%') + '</b><span>Average score</span></div>' +
        '<div class="tile"><b>' + best + (best === '–' ? '' : '%') + '</b><span>Best score</span></div><div class="tile"><b>' + (tot.correct + tot.wrong + tot.skipped) + '</b><span>Questions seen</span></div></div>' +
        (done.length ? '<div class="grid2"><section class="card"><h3>All answers so far</h3>' + donut([{ l: 'Correct', v: tot.correct, c: 'var(--good)' }, { l: 'Wrong', v: tot.wrong, c: 'var(--bad)' }, { l: 'Not answered', v: tot.skipped, c: 'var(--warn)' }]) + '</section>' +
          '<section class="card"><h3>Score trend</h3>' + trendChart(d.trend) + '</section></div>' : '') +
        (d.units && d.units.length ? '<section class="card"><h3>Accuracy by unit</h3>' + unitBars(d.units) + '</section>' : '') +
        (weak ? '<section class="card"><h3>Focus areas</h3><p class="small muted">Your weakest topics first. Practise these next.</p><div class="bars">' + weak + '</div></section>' : '') +
        '<section class="card"><div class="spread"><h2 style="margin:0">History</h2></div><div class="list" style="margin-top:8px">' + hist + '</div></section>' +
        '<section class="dash-cat"><h2>Start a new test</h2><p class="small muted">Open a track, tick a subject, units or topics, then choose your time.</p><div id="cat"></div></section>' +
        '<a class="wa-card" href="https://whatsapp.com/channel/0029Va5ka1rFHWq4y4OcYy3U" target="_blank" rel="noopener"><svg viewBox=\"0 0 32 32\" width=\"30\" height=\"30\" aria-hidden=\"true\" style=\"vertical-align:-4px\"><path fill=\"#25D366\" d=\"M16 3C9 3 3.3 8.6 3.3 15.6c0 2.4.7 4.6 1.9 6.6L3 29l7-2.2c1.9 1 4 1.6 6.1 1.6 7 0 12.7-5.7 12.7-12.7S23 3 16 3z\"/><path fill=\"#fff\" d=\"M22.6 18.9c-.3-.2-2-1-2.3-1.1-.3-.1-.5-.2-.8.2-.2.3-.9 1.1-1.1 1.3-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.7-1.7-1-.9-1.7-2-1.9-2.3-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6l-1-2.5c-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.4 1.4 3.6c.2.2 2.4 3.7 5.9 5.2.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 2-.8 2.3-1.6.3-.8.3-1.5.2-1.6-.1-.1-.3-.2-.6-.4z\"/></svg><span><b>Follow VKV Sir on WhatsApp</b><small>Openings, opportunities, new tests &amp; updates</small></span><span>&rarr;</span></a>' + suggestBox() + boardCard(board, 'Top performers') + shareBar(location.origin + '/', 'I practise with VKV Sir Test Lab. Free quizzes with instant results:', 'Invite friends:') + '</div>');
      mountCatalog(q('#cat'));
      var qa1 = $view.querySelector('.qa-i[href="#cat"]'); if (qa1) qa1.onclick = function (ev) { ev.preventDefault(); q('#cat').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    }).catch(function (e) { h('<div class="card narrow center"><p>' + esc(errMsg(e)) + '</p></div>'); });
  }

  /* ---------- math rendering ---------- */
  function renderMath(el) {
    if (!el || !window.renderMathInElement) return;
    try {
      window.renderMathInElement(el, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\[', right: '\\]', display: true }, { left: '$', right: '$', display: false }, { left: '\\(', right: '\\)', display: false }], throwOnError: false });
    } catch (e) {}
  }

  /* ---------- hover zoom: one overlay on <body>, always on top ---------- */
  (function () {
    var lay = null;
    function show(src) {
      if (!lay) { lay = document.createElement('div'); lay.className = 'zlayer'; lay.innerHTML = '<img alt="">'; document.body.appendChild(lay); }
      lay.firstChild.src = src; lay.classList.add('on');
    }
    function hide() { if (lay) lay.classList.remove('on'); }
    var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine) return;
    var cur = null;
    document.addEventListener('mousemove', function (e) {
      var im = e.target.closest && e.target.closest('.qzw .qimg');
      if (im && !document.body.classList.contains('veil')) { if (cur !== im || !lay || !lay.classList.contains('on')) { cur = im; show(im.currentSrc || im.src); } }
      else if (cur) { cur = null; hide(); }
    }, { passive: true });
    document.addEventListener('mouseleave', function () { cur = null; hide(); });
    window.addEventListener('blur', hide);
  })();

  /* ---------- homepage: who is it for (personas) ---------- */
  var PERSONA_SVG = {
    grow: '<svg viewBox="0 0 200 130" aria-hidden="true"><defs><linearGradient id="pg1" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="var(--accent)" stop-opacity=".25"/><stop offset="1" stop-color="var(--accent)"/></linearGradient></defs><rect x="18" y="80" width="22" height="34" rx="5" fill="url(#pg1)"/><rect x="52" y="64" width="22" height="50" rx="5" fill="url(#pg1)"/><rect x="86" y="48" width="22" height="66" rx="5" fill="url(#pg1)"/><rect x="120" y="30" width="22" height="84" rx="5" fill="url(#pg1)"/><path d="M20 70 L62 52 L96 38 L150 14" fill="none" stroke="var(--accent-2)" stroke-width="4" stroke-linecap="round"/><path d="M140 10 L154 13 L149 26" fill="none" stroke="var(--accent-2)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="174" cy="96" r="16" fill="var(--teal-soft)"/><path d="M167 96 l5 5 l10-11" fill="none" stroke="var(--teal)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    target: '<svg viewBox="0 0 200 130" aria-hidden="true"><circle cx="90" cy="68" r="52" fill="var(--violet-soft)"/><circle cx="90" cy="68" r="36" fill="none" stroke="var(--violet)" stroke-width="6" opacity=".45"/><circle cx="90" cy="68" r="20" fill="none" stroke="var(--violet)" stroke-width="6" opacity=".7"/><circle cx="90" cy="68" r="7" fill="var(--violet)"/><path d="M168 18 L94 66" stroke="var(--accent-2)" stroke-width="5" stroke-linecap="round"/><path d="M168 18 l-4 16 l12-6 z" fill="var(--accent-2)"/><path d="M160 14 l14 -4 l-4 14" fill="none" stroke="var(--accent-2)" stroke-width="4" stroke-linejoin="round"/></svg>',
    ladder: '<svg viewBox="0 0 200 130" aria-hidden="true"><rect x="14" y="96" width="44" height="22" rx="6" fill="var(--teal-soft)"/><rect x="62" y="74" width="44" height="44" rx="6" fill="var(--teal-soft)"/><rect x="110" y="50" width="44" height="68" rx="6" fill="var(--teal-soft)"/><rect x="158" y="26" width="30" height="92" rx="6" fill="var(--teal)" opacity=".85"/><path d="M164 16 h18 v-10 l12 14 l-12 14 v-10 h-18 z" fill="var(--accent-2)" transform="translate(-6 -2) scale(.9)"/><text x="173" y="80" font-family="sans-serif" font-size="20" font-weight="800" fill="#fff" text-anchor="middle">1</text><circle cx="36" cy="82" r="9" fill="var(--accent)"/><path d="M36 91 v10" stroke="var(--accent)" stroke-width="5" stroke-linecap="round"/></svg>',
    career: '<svg viewBox="0 0 200 130" aria-hidden="true"><rect x="20" y="46" width="78" height="58" rx="10" fill="var(--accent-2-soft)" stroke="var(--accent-2)" stroke-width="4"/><path d="M44 46 v-10 a6 6 0 0 1 6-6 h18 a6 6 0 0 1 6 6 v10" fill="none" stroke="var(--accent-2)" stroke-width="4"/><path d="M20 70 h78" stroke="var(--accent-2)" stroke-width="4"/><polyline points="112,104 136,82 154,90 186,52" fill="none" stroke="var(--good)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M174 50 l13 1 l-2 13" fill="none" stroke="var(--good)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="136" cy="82" r="5" fill="var(--good)"/><circle cx="154" cy="90" r="5" fill="var(--good)"/></svg>'
  };
  var PERSONAS = [
    { k: 'stu', t: 'Student', s: '1st – 3rd year', ic: '🎓', g: 'grow', h: 'Build strong basics and a head start on your career',
      pts: [['📘', 'Master subjects and labs', 'Unit-wise tests and viva questions for every semester, with instant explanations.'], ['🎯', 'Track your dream companies', 'See the skills, software and interview questions they ask today.'], ['📈', 'Follow skill trends', 'Know which software is rising in real job posts for your branch.'], ['🛠️', 'Internships and hackathons', 'Build projects, prepare for hackathons and make a resume that gets shortlisted.']],
      cta: [['Practise my subjects', '#practice'], ['Explore a company', '/career']] },
    { k: 'fin', t: 'Final year', s: 'Placements', ic: '🚀', g: 'target', h: 'Get placement-ready for the companies you want',
      pts: [['🏢', 'Company-wise plan', 'Topics, software and technical and HR questions for your target company and role.'], ['🧮', 'Aptitude and reasoning', 'Unlimited fresh practice for the written rounds.'], ['📄', 'A resume for every company', 'Duplicate your resume, tune keywords and check the job-post match.'], ['🎤', 'Questions from seniors', 'Real interview questions shared by recently placed students.']],
      cta: [['Build my placement plan', '/career'], ['Make my resume', '/resume']] },
    { k: 'exam', t: 'GATE, PSU & govt.', s: 'Competitive exams', ic: '🏆', g: 'ladder', h: 'Climb the rank list with focused practice',
      pts: [['📚', 'GATE, ESE, PSU and SSC JE style practice', 'Topic-wise and full-length papers from the competitive track.'], ['🔎', 'Find your weak units', 'Unit-wise result analysis shows exactly where marks are lost.'], ['⚡', 'Rapid revision', 'Rapid-fire rounds to revise a whole unit in minutes.'], ['🏛️', 'PSU interview ready', 'A resume with your GATE score, plus company profiles for PSU interviews.']],
      cta: [['Open competitive exams', '#practice'], ['Plan for a PSU', '/career']] },
    { k: 'pro', t: 'Working professional', s: 'Switch or grow', ic: '💼', g: 'career', h: 'Move to a better role with clarity',
      pts: [['🧭', 'Know what the new role needs', 'Software and skills the target company is asking for right now.'], ['♻️', 'Refresh core concepts', 'Short topic tests to brush up before interviews.'], ['🎯', 'Tailor your resume', 'Paste the job description to see your % match and missing keywords.'], ['🧑‍💼', 'Experienced-level prep', 'Plans and interview questions for 2–4 and 5+ years of experience.']],
      cta: [['Plan my switch', '/career'], ['Tailor my resume', '/resume']] }
  ];
  function personasHtml() {
    return '<section class="hs who rv"><p class="eyebrow center">Built for every stage</p><h2 class="hs-h center">How VKV Sir Test Lab helps you</h2><p class="muted center hs-sub" style="margin:0 auto">Choose where you are today. We show what matters for your next step.</p>' +
      '<div class="who-tabs" role="tablist">' + PERSONAS.map(function (p, i) { return '<button type="button" role="tab" class="' + (i ? '' : 'on') + '" data-who="' + p.k + '"><span>' + p.ic + '</span><b>' + p.t + '</b><small>' + p.s + '</small></button>'; }).join('') + '</div>' +
      PERSONAS.map(function (p, i) {
        return '<div class="who-p" data-who="' + p.k + '"' + (i ? ' hidden' : '') + '><div class="who-art">' + PERSONA_SVG[p.g] + '</div><div class="who-c"><h3>' + p.h + '</h3><div class="who-g">' +
          p.pts.map(function (x) { return '<div class="who-i"><span>' + x[0] + '</span><div><b>' + x[1] + '</b><p>' + x[2] + '</p></div></div>'; }).join('') + '</div>' +
          '<div class="who-cta">' + p.cta.map(function (c, j) { return '<a class="btn' + (j ? ' ghost' : '') + '" href="' + c[1] + '"' + (c[1].charAt(0) === '/' ? ' data-link' : '') + '>' + c[0] + ' →</a>'; }).join('') + '</div></div></div>';
      }).join('') + '</section>';
  }

  /* ---------- homepage: four sample image questions ---------- */
  var HERO_Q = [
    { dom: 'Mechanical', c: 'm', img: '/img/milling-cutters-3d.webp', q: 'Figure 3 shows which milling cutter?', o: ['Side and face', 'Double angle', 'End mill', 'Plain (slab)'], a: 1, x: 'Two toothed conical faces meet in a V: a double angle cutter.' },
    { dom: 'CS / IT', c: 'c', img: '/img/network-topologies.webp', q: 'Which network gives the highest fault tolerance?', o: ['Figure 1', 'Figure 2', 'Figure 3', 'Figure 4'], a: 3, x: 'Full mesh (Figure 4): every node has a direct link to every other node.' },
    { dom: 'Aptitude', c: 'a', img: '/img/di-pie-income.webp', q: 'How much does the family spend on Food each month?', o: ['₹10,000', '₹12,000', '₹14,000', '₹16,000'], a: 1, x: 'Food = 30% of ₹40,000 = ₹12,000.' },
    { dom: 'Reasoning', c: 'r', img: '/img/figure-series-arrow.webp', q: 'Which answer figure replaces the “?”', o: ['Figure 1', 'Figure 2', 'Figure 3', 'Figure 4'], a: 2, x: 'Arrow turns 45° clockwise and one dot is added each step: Figure 3.' }
  ];
  function heroSamples() {
    return '<div class="hq-head"><div><b>Try a real question</b><span>Image-based questions from 4 domains · tap an answer<span class="hz-mouse"> · hover a picture to enlarge</span></span></div><span class="hq-swipe" aria-hidden="true">Swipe <i>→</i></span></div><div class="hq-grid">' +
      HERO_Q.map(function (s, n) {
        return '<div class="hq hq-' + s.c + '" data-n="' + n + '"><span class="hq-dom">' + s.dom + '</span>' +
          '<figure class="qzw hq-fig"><img class="qimg" alt="Question figure" src="' + s.img + '"><img class="qzoom" alt="" aria-hidden="true" src="' + s.img + '"></figure>' +
          '<p class="hq-q">' + esc(s.q) + '</p><div class="hq-o">' +
          s.o.map(function (o, k) { return '<button type="button" data-k="' + k + '"><i>' + 'ABCD'[k] + '</i>' + esc(o) + '</button>'; }).join('') +
          '</div><p class="hq-x" hidden></p></div>';
      }).join('') + '</div>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.hq-o button'); if (!b) return;
    var card = b.closest('.hq'), s = HERO_Q[+card.getAttribute('data-n')], k = +b.getAttribute('data-k');
    if (card.classList.contains('done')) return;
    card.classList.add('done');
    Array.prototype.forEach.call(card.querySelectorAll('.hq-o button'), function (x, i) { x.disabled = true; if (i === s.a) x.classList.add('ok'); else if (i === k) x.classList.add('bad'); });
    var p = card.querySelector('.hq-x'); p.hidden = false; p.innerHTML = (k === s.a ? '<b>✓ Correct.</b> ' : '<b>✗ Not quite.</b> ') + esc(s.x);
  });

  /* ---------- question image with hover-zoom (laptop) and hint ---------- */
  function zimg(src, cls, alt) {
    var s = esc(src);
    return '<figure class="qzw"><img class="qimg ' + (cls || '') + '" alt="' + (alt || 'Figure') + '" src="' + s + '">' +
      '<img class="qzoom" alt="" aria-hidden="true" src="' + s + '">' +
      '<figcaption class="qhint"><span class="hz-mouse">(Hover over the image to see it bigger)</span><span class="hz-touch">(Pinch with two fingers to zoom the image)</span></figcaption></figure>';
  }

  /* ---------- image processing (teacher upload) ---------- */
  function processImage(file) {
    return new Promise(function (res, rej) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var w = img.naturalWidth, hgt = img.naturalHeight, target = 960;
        var scale = w < 600 ? Math.min(2, 720 / w) : Math.min(1, target / w);
        var cw = Math.round(w * scale), ch = Math.round(hgt * scale);
        var c = document.createElement('canvas'); c.width = cw; c.height = ch;
        var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, cw, ch);
        x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
        x.filter = 'contrast(1.12)';
        x.drawImage(img, 0, 0, cw, ch);
        URL.revokeObjectURL(url);
        var q = 0.85, out = c.toDataURL('image/webp', q);
        if (out.indexOf('image/webp') < 0) out = c.toDataURL('image/jpeg', q);
        while (out.length > 200000 && q > 0.5) { q -= 0.1; out = c.toDataURL(out.indexOf('webp') > 0 ? 'image/webp' : 'image/jpeg', q); }
        res(out);
      };
      img.onerror = function () { rej(new Error('Could not read this image.')); };
      img.src = url;
    });
  }

  /* ---------- admin ---------- */
  function csv(rows, cols) {
    var line = function (r) { return cols.map(function (c) { var v = r[c[0]]; v = v == null ? '' : String(v); return '"' + v.replace(/"/g, '""') + '"'; }).join(','); };
    return [cols.map(function (c) { return '"' + c[1] + '"'; }).join(',')].concat(rows.map(line)).join('\n');
  }
  function download(name, text) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }
  function modal(html, opts) {
    opts = opts || {};
    var m = document.createElement('div'); m.className = 'modal'; m.innerHTML = '<div class="modal-box card" role="dialog" aria-modal="true">' + html + '</div>';
    m.dirty = false;
    function close() { if (m.dirty && !confirm('Close without saving? (A draft is kept on this device.)')) return; m.remove(); document.removeEventListener('keydown', esc1); document.body.classList.remove('modal-open'); }
    function esc1(e) { if (e.key === 'Escape') close(); }
    m.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) close(); else if (e.target === m && !opts.sticky) close(); });
    document.addEventListener('keydown', esc1);
    document.body.appendChild(m); document.body.classList.add('modal-open'); return m;
  }

  /* ---------- admin: resumes built by students ---------- */
  function admResumes(box) {
    var term = '';
    function scoreCls(s) { return s >= 85 ? 'good' : s >= 70 ? 'accent' : s >= 50 ? '' : 'bad'; }
    function load() {
      box.innerHTML = '<div class="spinner"></div>';
      rpc('rb_admin_list', { p_search: term || null }).then(function (r) {
        var st = r.stats || {}, rows = r.rows || [];
        box.innerHTML = '<div class="adm-stats">' + [['Resumes', st.resumes], ['Students', st.students], ['Average ATS score', st.avg == null ? '–' : st.avg], ['Score 85+', st.high], ['Downloads', st.downloads], ['New this week', st.week]]
            .map(function (x) { return '<div class="card"><b>' + (x[1] == null ? 0 : x[1]) + '</b><span class="small muted">' + x[0] + '</span></div>'; }).join('') + '</div>' +
          '<div class="row" style="gap:8px;flex-wrap:wrap;margin:12px 0"><input class="in" id="rs-q" placeholder="Search name, email, college, company, branch" value="' + esc(term) + '" style="flex:1;min-width:220px"><button class="btn" id="rs-go">Search</button><button class="btn ghost" id="rs-csv">⬇ CSV</button></div>' +
          (rows.length ? '<div style="overflow-x:auto"><table class="table"><thead><tr><th>Updated</th><th>Student</th><th>College / branch</th><th>Resume</th><th>Target</th><th>ATS</th><th>Downloads</th><th></th></tr></thead><tbody>' +
            rows.map(function (x) {
              return '<tr><td class="small">' + esc(fmtDate(x.updated_at)) + '<br><span class="muted">created ' + esc(new Date(x.created_at).toLocaleDateString('en-IN')) + '</span></td>' +
                '<td><b>' + esc(x.student || '–') + '</b><br><span class="small muted">' + esc(x.email || '') + (x.mobile ? ' · ' + esc(x.mobile) : '') + '</span>' + (x.n_user > 1 ? '<br><span class="pill">' + x.n_user + ' resumes</span>' : '') + '</td>' +
                '<td class="small">' + esc(x.college || '–') + (x.branch ? '<br><span class="muted">' + esc(x.branch) + (x.grad ? ' · ' + esc(x.grad) : '') + '</span>' : '') + '</td>' +
                '<td class="small">' + esc(x.title || '') + '</td><td class="small">' + esc(x.role || '–') + (x.company ? '<br><b>' + esc(x.company) + '</b>' : '') + '</td>' +
                '<td><span class="pill ' + scoreCls(x.score || 0) + '">' + (x.score == null ? '–' : x.score) + '</span></td><td>' + (x.downloads || 0) + '</td>' +
                '<td><button class="btn ghost small" data-v="' + x.id + '">View</button></td></tr>';
            }).join('') + '</tbody></table></div>' : '<div class="card"><p class="muted">No resumes yet' + (term ? ' for this search' : '') + '.</p></div>');
        box.querySelector('#rs-go').onclick = function () { term = box.querySelector('#rs-q').value.trim(); load(); };
        box.querySelector('#rs-q').onkeydown = function (e) { if (e.key === 'Enter') { term = this.value.trim(); load(); } };
        box.querySelector('#rs-csv').onclick = function () {
          var head = ['Updated', 'Created', 'Student', 'Email', 'Mobile', 'College', 'Branch', 'Graduation', 'Resume', 'Role', 'Company', 'ATS score', 'Downloads', 'Resumes by student'];
          var lines = [head].concat(rows.map(function (x) { return [x.updated_at, x.created_at, x.student, x.email, x.mobile, x.college, x.branch, x.grad, x.title, x.role, x.company, x.score, x.downloads, x.n_user]; }))
            .map(function (r) { return r.map(function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
          var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + lines], { type: 'text/csv' })); a.download = 'resumes.csv'; a.click();
        };
        Array.prototype.forEach.call(box.querySelectorAll('[data-v]'), function (b) {
          b.onclick = function () {
            var id = b.getAttribute('data-v');
            function show() {
              rpc('rb_admin_get', { p_id: id }).then(function (r) {
                var m = document.createElement('div'); m.className = "modal"; m.style.zIndex = 200; m.setAttribute('role', 'dialog');
                m.innerHTML = '<div class="modal-box rs-view"><div class="spread"><b>' + esc(r.title || 'Resume') + ' · ATS ' + (r.score == null ? '–' : r.score) + '/100</b><span class="row" style="gap:6px"><button class="btn small" type="button" data-dl="pdf">⬇ PDF</button><button class="btn ghost small" type="button" data-dl="docx">⬇ Word</button><button class="btn ghost small" type="button" data-x="1">Close</button></span></div><div class="rs-paper">' + window.RB.preview({ esc: esc }, r.data || {}) + '</div></div>';
                m.onclick = function (e) {
                  var dl = e.target.closest('[data-dl]');
                  if (dl) { dl.disabled = true; window.RB.download({ esc: esc, toast: toast }, r.data || {}, r.title, dl.getAttribute('data-dl')).finally(function () { dl.disabled = false; }); return; }
                  if (e.target === m || e.target.closest('[data-x]')) m.remove();
                };
                document.body.appendChild(m);
              }).catch(function (e) { toast(errMsg(e)); });
            }
            if (window.RB) show(); else { var s = document.createElement('script'); s.src = '/resume.js?v=8'; s.onload = show; document.head.appendChild(s); }
          };
        });
      }).catch(function (e) { box.innerHTML = '<div class="card"><p>' + esc(errMsg(e)) + '</p></div>'; });
    }
    load();
  }

  function viewAdmin() {
    setNav('admin');
    if (!session) return go('/login?next=/admin', true);
    if (!profile || !profile.is_admin) { h('<div class="narrow card center"><h2>Admins only</h2><p class="muted">This area is for teachers and admins.</p></div>'); return; }
    var tab = new URLSearchParams(location.search).get('tab') || 'overview';
    var tabsJp = '<a href="/admin/jobprep" data-link>Job Prep ↗</a>';
    var tabs = [['overview', 'Live'], ['questions', 'Questions'], ['students', 'Students'], ['tests', 'Tests'], ['results', 'Results'], ['groups', 'Groups'], ['suggest', 'Suggestions'], ['links', 'Share links'], ['resumes', 'Resumes']];
    h('<div class="stack"><div class="spread"><div><p class="eyebrow">Admin</p><h1>Control room</h1></div></div>' +
      '<div class="tabs">' + tabs.map(function (t) { return '<a href="/admin?tab=' + t[0] + '" data-link class="' + (t[0] === tab ? 'on' : '') + '">' + t[1] + '</a>'; }).join('') + tabsJp + '</div><div id="adm"></div></div>');
    var box = q('#adm');
    ({ overview: admOverview, questions: admQuestions, students: admStudents, tests: admTests, results: admResults, links: admLinks, groups: admGroups, suggest: admSuggest, resumes: admResumes }[tab] || admOverview)(box);
  }

  function admSuggest(box) {
    var KN = { topic: 'Topic / subject', exam: 'Exam', interview: 'Company / interview', idea: 'Idea' };
    function load() {
      rpc('admin_suggestions').then(function (list) {
        box.innerHTML = '<p class="small muted">Sorted by the most active students first. Mark items as Planned or Done to keep track.</p>' + (list.length ? list.map(function (x) {
          return '<div class="card" style="padding:14px;margin-bottom:10px;opacity:' + (x.status === 'done' ? .55 : 1) + '"><div class="spread small"><span><b>' + esc(x.name) + '</b> &middot; ' + esc(x.email || '') + ' &middot; <span class="pill">' + x.tests + ' tests</span></span><span>' + new Date(x.at).toLocaleDateString('en-IN') + '</span></div>' +
            '<p style="margin:8px 0"><span class="pill accent">' + esc(KN[x.kind] || x.kind) + '</span> ' + esc(x.body) + '</p>' +
            '<div class="row small">' + ['new', 'planned', 'done'].map(function (st) { return '<button class="chip sel" data-id="' + x.id + '" data-st="' + st + '" aria-pressed="' + (x.status === st) + '">' + st + '</button>'; }).join('') + '</div></div>';
        }).join('') : '<p class="muted">No suggestions yet.</p>');
        box.onclick = function (e) { var b = e.target.closest('[data-st]'); if (!b) return; rpc('admin_suggestion_done', { p_id: +b.getAttribute('data-id'), p_status: b.getAttribute('data-st') }).then(load); };
      }).catch(function (e) { box.innerHTML = '<p class="err">' + esc(errMsg(e)) + '</p>'; });
    }
    load();
  }
  function admOverview(box) {
    setTimeout(function () { rpc('admin_reported_count').then(function (n) { var e = q('#rep-n'); if (e) e.textContent = n || 0; }).catch(function () {}); }, 900);
    function load() {
      rpc('admin_overview').then(function (d) {
        var qs = d.questions || {};
        box.innerHTML = '<div class="tiles"><div class="tile"><b>' + d.students + '</b><span>Students</span></div><div class="tile"><b>' + d.new_week + '</b><span>Joined this week</span></div>' +
          '<div class="tile"><b>' + d.attempts_today + '</b><span>Tests today</span></div><div class="tile"><b>' + d.attempts_total + '</b><span>Tests completed</span></div>' +
          '<div class="tile"><b>' + (qs.active || 0) + '</b><span>Live questions</span></div><a class="tile" href="/admin?tab=questions" data-link><b style="color:var(--warn)">' + ((qs.draft || 0) + (qs.review || 0)) + '</b><span>Waiting for review</span></a><a class="tile" href="/admin?tab=questions&st=reported" data-link><b id="rep-n" style="color:var(--bad)">…</b><span>Student reports</span></a></div>' +
          '<section class="card"><div class="spread"><h2 style="margin:0">Testing right now</h2><span class="small muted">Refreshes every 15 s</span></div>' +
          (d.live.length ? '<div class="table"><table><tr><th>Student</th><th>Test</th><th>Progress</th><th>Time left</th><th>Left screen</th></tr>' + d.live.map(function (a) {
            return '<tr><td><b>' + esc(a.name || '') + '</b><br><span class="small muted">' + esc(a.email || '') + '</span></td><td>' + esc(a.title) + '</td><td>' + (a.status === 'ready' ? 'Reading instructions' : 'Q' + (a.idx + 1) + ' / ' + a.n) + '</td><td class="mono">' + (a.left_s == null ? '–' : mmss(a.left_s * 1000)) + '</td><td>' + (a.leaves ? '<span class="pill bad">' + a.leaves + (a.strikes ? ' (' + a.strikes + ' penalties)' : '') + '</span>' : '0') + '</td></tr>';
          }).join('') + '</table></div>' : '<p class="muted">Nobody is taking a test at the moment.</p>') + '</section>' +
          '<section class="card"><h2>Latest results</h2>' + (d.recent.length ? '<div class="table"><table><tr><th>Student</th><th>Test</th><th>Score</th><th>When</th></tr>' + d.recent.map(function (a) {
            return '<tr><td>' + esc(a.name || a.email || '') + '</td><td>' + esc(a.title) + '</td><td class="mono">' + a.score + '/' + a.n + (a.strikes ? ' <span class="pill bad">' + a.strikes + '</span>' : '') + '</td><td class="small">' + esc(fmtDate(a.at)) + '</td></tr>';
          }).join('') + '</table></div>' : '<p class="muted">No results yet.</p>') + '</section>';
      }).catch(function (e) { box.innerHTML = '<p class="err">' + esc(errMsg(e)) + '</p>'; });
    }
    load(); var t = setInterval(load, 15000); cleanup = function () { clearInterval(t); };
  }

  var QSTAT = [['reported', 'Student reports'], ['review', 'Auto-paused'], ['draft', 'New drafts'], ['active', 'Live'], ['retired', 'Retired']];
  var FLAGNAME = { no_correct: 'No correct option', multiple_correct: 'Multiple correct', missing_data: 'Missing data', hard_language: 'Hard language', typo: 'Typo', out_of_syllabus: 'Out of syllabus' };
  function admQuestions(box) {
    var st = new URLSearchParams(location.search).get('st') || 'draft', search = '', list = [], picked = {};
    function load() {
      box.innerHTML = '<div class="spinner"></div>';
      rpc('admin_questions', { p_status: st, p_subject: null, p_search: search || null }).then(function (r) { list = r; picked = {}; draw(); }).catch(function (e) { box.innerHTML = '<p class="err">' + esc(errMsg(e)) + '</p>'; });
    }
    function draw() {
      box.innerHTML = '<div class="row" style="margin-bottom:12px">' + QSTAT.map(function (s) { return '<a class="chip sel" aria-pressed="' + (s[0] === st) + '" href="/admin?tab=questions&st=' + s[0] + '" data-link>' + s[1] + '</a>'; }).join('') +
        '<button class="btn ghost" id="impq" style="min-height:40px;padding:8px 16px;margin-left:auto">Import from sheet</button><button class="btn dark" id="newq" style="min-height:40px;padding:8px 16px">+ New question</button></div>' +
        '<div class="row"><input class="in" id="qs" placeholder="Search text, topic or ID" value="' + esc(search) + '" style="max-width:360px"><span class="muted small">' + list.length + ' questions' + (st === 'reported' ? ' &middot; highest complaints first. Fix with Edit, or tick and press <b>Resolved</b> to clear old reports.' : st === 'review' ? ' &middot; paused automatically, not used in any paper until resolved.' : '') + '</span></div>' +
        '<label class="row small" style="margin:12px 0 0"><input type="checkbox" id="qall"> <b>Select all ' + list.length + ' shown</b></label>' +
        '<div class="row" id="bulk" style="margin:12px 0" hidden><b id="bn"></b><button class="btn" id="b-act" style="min-height:40px;padding:8px 14px">' + (st === 'reported' || st === 'review' ? 'Resolved &ndash; keep live' : 'Make live') + '</button><button class="btn ghost" id="b-ret" style="min-height:40px;padding:8px 14px">Retire</button><button class="btn ghost" id="b-dr" style="min-height:40px;padding:8px 14px">Back to draft</button></div>' +
        '<div class="stack" id="ql">' + list.map(function (x) {
          var fl = Object.keys(x.flags || {}).map(function (k) { return '<span class="pill bad">' + (FLAGNAME[k] || k) + ': ' + x.flags[k] + '</span>'; }).join(' ');
          return '<article class="card qcard"><div class="spread"><label class="row small"><input type="checkbox" data-id="' + esc(x.id) + '"> <b class="mono">' + esc(x.id) + '</b></label>' +
            '<span class="small muted">Unit ' + x.unit + ' &middot; ' + esc(x.subtopic.replace(/-/g, ' ')) + ' &middot; ' + ({ E: 'Easy', M: 'Moderate', H: 'Hard' }[x.level] || x.level) + (x.has_image ? ' &middot; &#128247;' : '') + '</span></div>' +
            (x.image ? '<img class="qimg athumb" alt="Figure" loading="lazy" src="' + esc(x.image) + '">' : '') + '<div class="qtext" style="margin:8px 0;font-weight:600">' + esc(x.body) + '</div><ol type="A" class="small">' + x.options.map(function (o, k) { return '<li class="qtext' + (k === x.correct ? ' c' : '') + '">' + esc(o) + (k === x.correct ? ' &#10003;' : '') + '</li>'; }).join('') + '</ol>' +
            (x.explanation ? '<p class="small muted qtext">' + esc(x.explanation) + '</p>' : '<p class="small" style="color:var(--warn)">No explanation yet</p>') +
            '<div class="row small">' + (x.served ? '<span class="pill">' + x.served + ' answered, ' + x.pct + '% correct</span>' : '<span class="pill">Not answered yet</span>') +
            (x.complaints && x.complaints.score ? '<span class="pill bad"><b>Complaint score ' + x.complaints.score + '</b> &middot; ' + x.complaints.reporters + ' student' + (x.complaints.reporters === 1 ? '' : 's') + '</span>' : '') +
            (x.good ? '<span class="pill good">&#128077; ' + x.good + '</span>' : '') + (x.bad ? '<span class="pill bad">&#128078; ' + x.bad + '</span>' : '') + fl +
            (x.review_reason ? '<span class="small" style="color:var(--bad)">' + esc(x.review_reason) + '</span>' : '') +
            '<button class="btn ghost" data-edit="' + esc(x.id) + '" style="min-height:36px;padding:6px 14px;margin-left:auto">Edit</button></div></article>';
        }).join('') + '</div>';
      renderMath(box);
      q('#qs').onkeydown = function (e) { if (e.key === 'Enter') { search = this.value.trim(); load(); } };
      q('#newq').onclick = function () { editQuestion(null, load); };
      q('#impq').onclick = function () { importQuestions(function () { if (st !== 'draft') go('/admin?tab=questions&st=draft'); else load(); }); };
      box.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { editQuestion(b.getAttribute('data-edit'), load); }; });
      function syncBulk() { var n = Object.keys(picked).length; q('#bulk').hidden = !n; q('#bn').textContent = n + ' selected'; q('#qall').checked = n > 0 && n === list.length; }
      box.querySelectorAll('input[data-id]').forEach(function (c) { c.onchange = function () { if (c.checked) picked[c.getAttribute('data-id')] = 1; else delete picked[c.getAttribute('data-id')]; syncBulk(); }; });
      q('#qall').onchange = function () { var on = this.checked; picked = {}; box.querySelectorAll('input[data-id]').forEach(function (c) { c.checked = on; if (on) picked[c.getAttribute('data-id')] = 1; }); syncBulk(); };
      function bulk(s) { rpc('admin_set_question_status', { p_ids: Object.keys(picked), p_status: s }).then(function (n) { toast(n + ' updated'); load(); }).catch(function (e) { toast(errMsg(e)); }); }
      q('#b-act').onclick = function () { bulk('active'); }; q('#b-ret').onclick = function () { bulk('retired'); }; q('#b-dr').onclick = function () { bulk('draft'); };
    }
    load();
  }

  function parseDelimited(text) {
    var delim = text.indexOf('\t') >= 0 ? '\t' : ',', rows = [], row = [], cell = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"' && cell === '') q = true;
      else if (ch === delim) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); cell = ''; if (row.some(function (x) { return x.trim(); })) rows.push(row); row = []; }
      else cell += ch;
    }
    row.push(cell); if (row.some(function (x) { return x.trim(); })) rows.push(row);
    return rows;
  }
  var IMPORT_COLS = [['subject_id', /subject\s*code|^code$/i], ['subject_name', /subject\s*name/i], ['unit', /unit\s*(no|num|#)|^unit$/i], ['unit_name', /unit\s*name/i],
    ['subtopic', /topic/i], ['level', /difficulty|level/i], ['body', /question|stem/i], ['a', /option\s*a|^a$/i], ['b', /option\s*b|^b$/i], ['c', /option\s*c|^c$/i], ['d', /option\s*d|^d$/i],
    ['correct', /correct|answer|key/i], ['explanation', /explan/i], ['concept_tag', /concept/i], ['source', /source/i]];
  function rowsToQuestions(rows) {
    if (!rows.length) return [];
    var head = rows[0].map(function (x) { return String(x || '').trim(); }), map = {}, hasHeader = false;
    IMPORT_COLS.forEach(function (c) { for (var i = 0; i < head.length; i++) { if (map[c[0]] == null && c[1].test(head[i]) && !Object.keys(map).some(function (k) { return map[k] === i; })) { map[c[0]] = i; hasHeader = true; break; } } });
    if (!hasHeader || map.body == null) { map = {}; IMPORT_COLS.forEach(function (c, i) { map[c[0]] = i; }); }
    return rows.slice(hasHeader && map.body != null ? 1 : 0).map(function (r, k) {
      var o = { row: k + (hasHeader ? 2 : 1) };
      IMPORT_COLS.forEach(function (c) { o[c[0]] = map[c[0]] != null ? String(r[map[c[0]]] == null ? '' : r[map[c[0]]]).trim() : ''; });
      var e = [];
      if (!o.subject_id) e.push('subject code'); if (!/^\d+$/.test(o.unit)) e.push('unit number'); if (!o.subtopic) e.push('topic'); if (!o.body) e.push('question');
      if (!o.a || !o.b || !o.c || !o.d) e.push('4 options'); if (!/^[ABCDabcd]/.test(o.correct)) e.push('correct A-D');
      o.err = e.length ? 'Missing: ' + e.join(', ') : '';
      return o;
    });
  }
  function importQuestions(done) {
    var m = modal('', { sticky: true }), box = m.querySelector('.modal-box'); box.classList.add('flush');
    var items = [];
    box.innerHTML = '<div class="ed-head"><h2 style="margin:0">Import questions from a sheet</h2><button class="link-btn" data-close>Close</button></div>' +
      '<section class="sec"><h3><span class="num">1</span> Get the template</h3><p class="fh">Use our sheet so the columns match. Open it in Google Sheets or Excel; it has dropdowns and an example row.</p>' +
      '<a class="btn ghost" href="/question-template.xlsx" download style="min-height:42px">Download template (.xlsx)</a></section>' +
      '<section class="sec"><h3><span class="num">2</span> Paste or upload</h3><p class="fh">In your sheet, select all filled rows including the header, copy, and paste below. Or upload the file (.xlsx or .csv).</p>' +
      '<textarea class="in" id="im-p" rows="6" placeholder="Paste rows here"></textarea><div class="row" style="margin-top:10px"><input type="file" id="im-f" accept=".csv,.tsv,.txt,.xlsx,.xls"><button class="btn dark" id="im-chk" style="min-height:42px">Check rows</button></div></section>' +
      '<section class="sec" id="im-prev" hidden><h3><span class="num">3</span> Review</h3><div id="im-sum" class="fh"></div><div class="table" id="im-tab"></div></section>' +
      '<div class="ed-foot"><div class="err" id="im-er"></div><span class="fh">Imported questions arrive as <b>Drafts</b>; nothing goes live until you approve.</span><div class="row"><button class="btn" id="im-go" disabled>Import</button><button class="btn ghost" data-close>Cancel</button></div></div>';
    var $ = function (s) { return box.querySelector(s); };
    function preview(rows) {
      items = rowsToQuestions(rows);
      var ok = items.filter(function (x) { return !x.err; }).length;
      $('#im-prev').hidden = false;
      $('#im-sum').innerHTML = '<b>' + items.length + '</b> rows found: <b style="color:var(--good)">' + ok + ' ready</b>' + (items.length - ok ? ', <b style="color:var(--bad)">' + (items.length - ok) + ' need fixing</b> (they will be skipped)' : '') + '.';
      $('#im-tab').innerHTML = '<table><tr><th>Row</th><th>Question</th><th>Topic</th><th>Ans</th><th>Status</th></tr>' + items.slice(0, 300).map(function (x) {
        return '<tr><td>' + x.row + '</td><td class="small">' + esc(x.body.slice(0, 90)) + (x.body.length > 90 ? '…' : '') + '</td><td class="small">' + esc(x.subject_id + ' U' + x.unit + ' ' + x.subtopic) + '</td><td>' + esc(x.correct.charAt(0).toUpperCase()) + '</td><td>' + (x.err ? '<span class="pill bad">' + esc(x.err) + '</span>' : '<span class="pill good">Ready</span>') + '</td></tr>';
      }).join('') + '</table>';
      m.dirty = true; $('#im-go').disabled = !ok; $('#im-go').textContent = 'Import ' + ok + ' question' + (ok === 1 ? '' : 's');
    }
    $('#im-chk').onclick = function () { var t = $('#im-p').value; if (!t.trim()) return toast('Paste rows or choose a file'); preview(parseDelimited(t)); };
    $('#im-f').onchange = function () {
      var f = this.files[0]; if (!f) return;
      if (/\.xlsx?$/i.test(f.name)) {
        var go = function () { var rd = new FileReader(); rd.onload = function () { var wb = window.XLSX.read(new Uint8Array(rd.result), { type: 'array' }); var ws = wb.Sheets['Questions'] || wb.Sheets[wb.SheetNames[0]]; preview(window.XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' })); }; rd.readAsArrayBuffer(f); };
        if (window.XLSX) go(); else { var sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; sc.onload = go; sc.onerror = function () { toast('Could not load the Excel reader. Save as CSV instead.'); }; document.head.appendChild(sc); }
      } else { var rd = new FileReader(); rd.onload = function () { preview(parseDelimited(String(rd.result))); }; rd.readAsText(f); }
    };
    $('#im-go').onclick = function () {
      var good = items.filter(function (x) { return !x.err; }), b = this, tot = { added: 0, duplicates: 0, errors: [] }, i = 0;
      b.disabled = true;
      (function next() {
        if (i >= good.length) {
          m.dirty = false;
          $('#im-sum').innerHTML = '<b style="color:var(--good)">' + tot.added + ' imported as drafts.</b> ' + (tot.duplicates ? tot.duplicates + ' skipped as already in the bank. ' : '') + (tot.errors.length ? tot.errors.length + ' rejected: ' + esc(tot.errors.map(function (e) { return 'row ' + e.row + ' (' + e.error + ')'; }).join('; ')) : '');
          b.textContent = 'Done'; toast(tot.added + ' questions imported'); done && done(); return;
        }
        var chunk = good.slice(i, i + 100); i += 100; b.textContent = 'Importing ' + Math.min(i, good.length) + '/' + good.length + '…';
        rpc('admin_import_questions', { p_rows: chunk }).then(function (r) { tot.added += r.added; tot.duplicates += r.duplicates; tot.errors = tot.errors.concat(r.errors); next(); })
          .catch(function (e) { $('#im-er').textContent = errMsg(e); b.disabled = false; b.textContent = 'Retry import'; });
      })();
    };
  }

  function editQuestion(id, done) {
    var m = modal('<div class="spinner"></div>', { sticky: true });
    var box = m.querySelector('.modal-box');
    Promise.all([id ? rpc('admin_question', { p_id: id }) : Promise.resolve(null), rpc('admin_subjects')]).then(function (r) {
      var x = r[0] || { subject_id: 'MP', unit: 4, unit_name: '', subtopic: '', level: 'E', body: '', options: ['', '', '', ''], correct: 0, explanation: '', status: 'draft', pool: 'both' };
      var subs = r[1], img = x.image_data || x.image_path || null;
      function f(idv, label, val, extra) { return '<div class="fld"><label class="fl" for="' + idv + '">' + label + '</label><input class="in" id="' + idv + '" value="' + esc(val == null ? '' : val) + '" ' + (extra || '') + '></div>'; }
      box.innerHTML = '<div class="spread"><h2 style="margin:0">' + (id ? 'Edit ' + esc(id) : 'New question') + '</h2><button class="link-btn" data-close>Close</button></div>' +
        '<div class="ed"><div>' +
        '<div class="g3">' + f('e-sub', 'Subject code', x.subject_id, 'list="subs"') + f('e-unit', 'Unit no.', x.unit, 'type="number" min="1"') + f('e-un', 'Unit name', x.unit_name) + '</div>' +
        '<datalist id="subs">' + subs.map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.name) + '</option>'; }).join('') + '</datalist>' +
        '<div class="g3">' + f('e-top', 'Topic', (x.subtopic || '').replace(/-/g, ' ')) +
        '<div class="fld"><label class="fl" for="e-lv">Difficulty</label><select class="in" id="e-lv"><option value="E">Easy</option><option value="M">Moderate</option><option value="H">Hard</option></select></div>' +
        '<div class="fld"><label class="fl" for="e-st">Status</label><select class="in" id="e-st"><option value="draft">Draft</option><option value="active">Live</option><option value="review">Under review</option><option value="retired">Retired</option></select></div></div>' +
        '<label class="f" for="e-body">Question <span class="muted small">(use $...$ for equations, e.g. $\\sigma = F/A$)</span></label><textarea class="in" id="e-body" rows="3">' + esc(x.body) + '</textarea>' +
        [0, 1, 2, 3].map(function (k) { return '<label class="f row" style="gap:8px"><input type="radio" name="e-c" value="' + k + '"' + (x.correct === k ? ' checked' : '') + '> Option ' + 'ABCD'[k] + ' <span class="small muted">(tick = correct)</span></label><input class="in" id="e-o' + k + '" value="' + esc(x.options[k] || '') + '">'; }).join('') +
        '<label class="f" for="e-ex">Explanation <span class="muted small">(shown to students who get it wrong)</span></label><textarea class="in" id="e-ex" rows="2">' + esc(x.explanation || '') + '</textarea>' +
        '<label class="f">Diagram or image (optional)</label><div class="row"><input type="file" id="e-img" accept="image/*"><button class="link-btn" id="e-rm">Remove image</button></div>' +
        '<p class="small muted">Images are auto-resized, sharpened and compressed for phones.</p>' +
        '<div class="err" id="e-er"></div><div class="row"><button class="btn" id="e-save">Save</button><button class="btn ghost" data-close>Cancel</button></div></div>' +
        '<div><p class="f">Student preview</p><div class="card preview" id="pv"></div></div></div>';
      box.querySelector('#e-lv').value = x.level; box.querySelector('#e-st').value = x.status;
      function val(i) { return box.querySelector(i).value; }
      function preview() {
        var opts = [0, 1, 2, 3].map(function (k) { return val('#e-o' + k); });
        box.querySelector('#pv').innerHTML = (img ? '<img class="qimg" src="' + img + '" alt="">' : '') + '<div class="qbody" style="font-size:18px">' + esc(val('#e-body')) + '</div><div class="opts">' +
          opts.map(function (o, k) { return '<div class="opt"><span class="k">' + 'ABCD'[k] + '</span><span>' + esc(o) + '</span></div>'; }).join('') + '</div>';
        renderMath(box.querySelector('#pv'));
      }
      box.addEventListener('input', function () { m.dirty = true; preview(); }); preview();
      box.querySelector('#e-img').onchange = function () { var fl = this.files[0]; if (!fl) return; processImage(fl).then(function (d) { img = d; toast('Image ready (' + Math.round(d.length * 0.75 / 1024) + ' KB)'); preview(); }).catch(function (e) { toast(errMsg(e)); }); };
      box.querySelector('#e-rm').onclick = function () { img = null; preview(); };
      box.querySelector('#e-save').onclick = function () {
        var c = box.querySelector('input[name=e-c]:checked');
        var p = { id: id, subject_id: val('#e-sub').trim().toUpperCase(), unit: +val('#e-unit'), unit_name: val('#e-un').trim(), subtopic: val('#e-top').trim(), level: val('#e-lv'),
          status: val('#e-st'), body: val('#e-body').trim(), options: [0, 1, 2, 3].map(function (k) { return val('#e-o' + k).trim(); }), correct: c ? +c.value : -1,
          explanation: val('#e-ex').trim(), image_data: img || '' };
        if (!p.subject_id || !p.unit || !p.subtopic) { box.querySelector('#e-er').textContent = 'Subject, unit and topic are required.'; return; }
        var b = this; b.disabled = true;
        rpc('admin_save_question', { p: p }).then(function () { toast('Saved'); m.dirty = false; m.remove(); done && done(); }).catch(function (e) { box.querySelector('#e-er').textContent = errMsg(e); b.disabled = false; });
      };
    }).catch(function (e) { box.innerHTML = '<p class="err">' + esc(errMsg(e)) + '</p><button class="btn" data-close>Close</button>'; });
  }

  function admStudents(box) {
    var search = '';
    function load() {
      box.innerHTML = '<div class="spinner"></div>';
      rpc('admin_students', { p_search: search || null }).then(function (list) {
        box.innerHTML = '<div class="row"><input class="in" id="ss" placeholder="Search name, email, mobile, college, city" value="' + esc(search) + '" style="max-width:420px"><span class="muted small">' + list.length + ' students</span>' +
          '<button class="btn ghost" id="sx" style="min-height:40px;padding:8px 14px;margin-left:auto">Download CSV</button></div>' +
          '<div class="table"><table><tr><th>Student</th><th>Mobile</th><th>College / city</th><th>Tests</th><th>Avg</th><th>Last</th><th></th></tr>' + list.map(function (s) {
            return '<tr><td><b>' + esc(s.name || '(no profile)') + '</b><br><span class="small muted">' + esc(s.email) + '</span>' + (s.status !== 'active' ? ' <span class="pill bad">' + esc(s.status) + '</span>' : '') + (s.locked ? ' <span class="pill bad">locked</span>' : '') + '</td>' +
              '<td class="mono small">' + esc(s.mobile || '') + '</td><td class="small">' + esc(s.college || '') + '<br><span class="muted">' + esc([s.city, s.state].filter(Boolean).join(', ')) + '</span></td>' +
              '<td>' + s.tests + '</td><td>' + (s.avg == null ? '–' : s.avg + '%') + '</td><td class="small">' + esc(s.last ? fmtDate(s.last) : '–') + '</td><td><button class="btn ghost" data-s="' + s.id + '" style="min-height:34px;padding:4px 12px">Open</button></td></tr>';
          }).join('') + '</table></div>';
        q('#ss').onkeydown = function (e) { if (e.key === 'Enter') { search = this.value.trim(); load(); } };
        q('#sx').onclick = function () { download('students.csv', csv(list, [['name', 'Name'], ['email', 'Email'], ['mobile', 'Mobile'], ['college', 'College'], ['city', 'City'], ['state', 'State'], ['tests', 'Tests'], ['avg', 'Average %'], ['last', 'Last test'], ['status', 'Status']])); };
        box.querySelectorAll('[data-s]').forEach(function (b) { b.onclick = function () { openStudent(b.getAttribute('data-s'), load); }; });
      }).catch(function (e) { box.innerHTML = '<p class="err">' + esc(errMsg(e)) + '</p>'; });
    }
    load();
  }
  function openStudent(id, reload) {
    var m = modal('<div class="spinner"></div>'), box = m.querySelector('.modal-box');
    rpc('admin_student', { p_id: id }).then(function (d) {
      var p = d.profile;
      box.innerHTML = '<div class="spread"><h2 style="margin:0">' + esc(p.full_name || p.email) + '</h2><button class="link-btn" data-close>Close</button></div>' +
        '<p class="small">' + esc(p.email) + ' &middot; ' + esc(p.mobile || '') + '<br>' + esc([p.college, p.city, p.state, p.country].filter(Boolean).join(', ')) + '<br>Joined ' + esc(fmtDate(p.created_at)) + ' &middot; Status: <b>' + esc(p.status) + '</b></p>' +
        (d.same_mobile.length ? '<div class="note">Same mobile also used by: ' + esc(d.same_mobile.join(', ')) + '</div>' : '') +
        '<div class="row" style="margin:12px 0"><button class="btn ghost" id="un">Remove lock</button><select class="in" id="stt" style="max-width:220px"><option value="active">Active</option><option value="duplicate_mobile">Duplicate mobile</option><option value="closed">Closed (blocked)</option></select><button class="btn dark" id="sv">Save status</button></div>' +
        '<div class="table"><table><tr><th>Test</th><th>Score</th><th>Left screen</th><th>Ended</th><th></th></tr>' + d.attempts.map(function (a) {
          return '<tr><td>' + esc(a.title) + '<br><span class="small muted">' + esc(fmtDate(a.at)) + '</span></td><td class="mono">' + (a.score == null ? '–' : a.score + '/' + a.n) + '</td><td>' + a.leaves + (a.strikes ? ' (' + a.strikes + ' pen.)' : '') + '</td><td class="small">' + esc(a.end || a.status) + '</td><td>' + (a.status === 'done' ? '<a href="/result/' + a.id + '" data-link data-close>View</a>' : '') + '</td></tr>';
        }).join('') + '</table></div>';
      box.querySelector('#stt').value = p.status;
      box.querySelector('#un').onclick = function () { rpc('admin_set_student', { p_id: id, p_status: null, p_unlock: true }).then(function () { toast('Lock removed'); }); };
      box.querySelector('#sv').onclick = function () { rpc('admin_set_student', { p_id: id, p_status: box.querySelector('#stt').value, p_unlock: false }).then(function () { toast('Saved'); m.remove(); reload(); }); };
    });
  }

  function toLocalInput(v) { if (!v) return ''; var d = new Date(v); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }
  function admTests(box) {
    function load() {
      box.innerHTML = '<div class="spinner"></div>';
      rpc('admin_tests').then(function (list) {
        box.innerHTML = '<div class="row" style="margin-bottom:12px"><button class="btn dark" id="nt" style="min-height:40px;padding:8px 16px">+ New test</button></div><div class="grid">' + list.map(function (t) {
          return '<article class="card test-card"><div class="row"><span class="pill accent">' + esc(t.subject_name) + '</span><span class="pill">' + (t.mode === 'exam' ? 'Exam' : 'Practice') + '</span>' + (t.active ? '' : '<span class="pill bad">Off</span>') + (t.listed ? '' : '<span class="pill">Hidden</span>') + '</div>' +
            '<h3>' + esc(t.title) + '</h3><p class="small muted">Link: <span class="mono">/t/' + esc(t.slug) + '</span><br>' + t.attempts + ' completed &middot; Results ' + (t.show_result ? 'visible' : '<b>hidden</b>') + '</p>' +
            '<div class="row"><button class="btn ghost" data-t="' + esc(t.slug) + '" style="min-height:38px;padding:6px 14px">Edit</button><button class="btn ghost" data-copy="' + esc(t.slug) + '" style="min-height:38px;padding:6px 14px">Copy link</button></div></article>';
        }).join('') + '</div>';
        q('#nt').onclick = function () { editTest(null, load); };
        box.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { editTest(list.filter(function (t) { return t.slug === b.getAttribute('data-t'); })[0], load); }; });
        box.querySelectorAll('[data-copy]').forEach(function (b) { b.onclick = function () { var u = location.origin + '/t/' + b.getAttribute('data-copy'); (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { toast('Link copied'); }, function () { toast(u); }); }; });
      }).catch(function (e) { box.innerHTML = '<p class="err">' + esc(errMsg(e)) + '</p>'; });
    }
    load();
  }
  function editTest(t, done) {
    var isNew = !t || !t.slug;
    t = t || { slug: '', title: '', description: '', subject_id: 'MP', units: null, mode: 'exam', durations: [30], sec_per_q: 45, show_result: false, max_attempts: 1, daily_limit: null, active: true, listed: true, leave_penalty: true };
    var KEY = 'vkv-draft-test-' + (t.slug || 'new-' + (t.group_id || 'public'));
    var saved = null; try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    var m = modal('', { sticky: true }), box = m.querySelector('.modal-box');
    box.classList.add('flush');
    var DURS = [5, 10, 15, 20, 30, 45, 60, 90], SECS = [30, 45, 60, 90, 120];
    function slugify(x) { return String(x || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60); }
    function fld(label, inner, hint) { return '<div class="fld"><span class="fl">' + label + '</span>' + inner + (hint ? '<span class="fh">' + hint + '</span>' : '') + '</div>'; }
    function inp(id, val, extra) { return '<input class="in" id="' + id + '" value="' + esc(val == null ? '' : val) + '" ' + (extra || '') + '>'; }
    function tog(id, title, sub, on) { return '<label class="tog"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '><span class="sw" aria-hidden="true"></span><span><b>' + title + '</b><br><span class="fh">' + sub + '</span></span></label>'; }
    box.innerHTML =
      '<div class="ed-head"><h2 style="margin:0">' + (isNew ? 'New test' : 'Edit test') + '</h2><button class="link-btn" data-close>Close</button></div>' +
      '<div class="note" id="t-restore" hidden style="color:var(--ink);background:var(--soft)">You have unsaved changes from earlier. <button class="link-btn" id="t-rs">Restore them</button> or <button class="link-btn" id="t-dc">discard</button>.</div>' +

      '<section class="sec"><h3><span class="num">1</span> Basics</h3>' +
      fld('Test title', inp('t-title', t.title, 'placeholder="e.g. ME III Sem: Unit 5 quiz"'), 'Students see this name.') +
      fld('Short description <span class="optl">(optional)</span>', inp('t-desc', t.description, 'placeholder="e.g. Covers forging, rolling and extrusion"')) +
      fld('Test link', '<div class="slug"><span class="mono small muted">' + esc(location.host) + '/t/</span>' + inp('t-slug', t.slug, (isNew ? '' : 'readonly ') + 'placeholder="auto from title"') + '</div>', isNew ? 'Made automatically from the title. You can edit it now; it cannot be changed later.' : 'Link names cannot be changed after creation.') +
      '</section>' +

      '<section class="sec"><h3><span class="num">2</span> Questions in the paper</h3>' +
      '<div class="two">' + fld('Subject', '<select class="in" id="t-sub"></select>') +
      fld('Mode', '<select class="in" id="t-mode"><option value="exam">Exam: strict, results usually hidden</option><option value="practice">Practice: relaxed, results shown</option></select>') + '</div>' +
      fld('Units included', '<div class="chips" id="t-units"></div>', 'None selected = all units of the subject.') +
      fld('Time students can choose', '<div class="chips" id="t-dur">' + DURS.map(function (d) { return '<button type="button" class="chip sel" data-d="' + d + '" aria-pressed="false">' + d + ' min</button>'; }).join('') + '</div>', 'Pick one for a fixed exam, or several to let students choose.') +
      fld('Time per question', '<div class="chips" id="t-sec">' + SECS.map(function (d) { return '<button type="button" class="chip sel" data-s="' + d + '" aria-pressed="false">' + d + ' s</button>'; }).join('') + '</div>', '<span id="t-qn"></span>') +
      '</section>' +

      '<section class="sec"><h3><span class="num">3</span> Who and how often</h3>' +
      '<div class="two">' + fld('Who can take it', '<select class="in" id="t-grp"><option value="">Everyone with the link</option></select>') +
      fld('Attempts per student', '<select class="in" id="t-max"><option value="1">1 attempt</option><option value="2">2 attempts</option><option value="3">3 attempts</option><option value="">Unlimited</option></select>') + '</div>' +
      '</section>' +

      '<section class="sec"><h3><span class="num">4</span> Schedule <span class="optl">(optional)</span></h3>' +
      '<p class="fh" style="margin:-4px 0 10px">Leave empty to keep the test open all the time.</p>' +
      '<div class="three">' + fld('Opens at', inp('t-open', toLocalInput(t.open_at), 'type="datetime-local"'), 'Before this, students cannot start.') +
      fld('Last time to start', inp('t-last', toLocalInput(t.last_start_at), 'type="datetime-local"'), 'Late starters are blocked. Those inside still get full time.') +
      fld('Closes at', inp('t-close', toLocalInput(t.close_at), 'type="datetime-local"'), 'Test disappears after this.') + '</div>' +
      '</section>' +

      '<section class="sec"><h3><span class="num">5</span> Rules</h3>' +
      tog('t-res', 'Show results to students', 'Turn off for exams; switch on later to release marks.', t.show_result) +
      tog('t-pen', 'Pause students who leave the screen', 'Fair, time-based pause; doubles on repeat.', t.leave_penalty) +
      tog('t-list', 'List on the public Tests page', 'Off = only people with the link (class tests are always hidden).', t.listed) +
      tog('t-act', 'Test is switched on', 'Turn off to stop all new attempts immediately.', t.active) +
      '</section>' +

      '<div class="ed-foot"><div class="err" id="t-er"></div><span class="fh" id="t-auto"></span><div class="row"><button class="btn" id="t-save">Save test</button><button class="btn ghost" data-close>Cancel</button></div></div>';

    var $ = function (s) { return box.querySelector(s); };
    var state = { durations: (t.durations || [30]).slice(), sec: t.sec_per_q || 45, units: (t.units || []).slice(), subjects: [] };
    var slugTouched = !isNew;

    function pressSet(sel, attr, values) { box.querySelectorAll(sel + ' [' + attr + ']').forEach(function (b) { b.setAttribute('aria-pressed', values.indexOf(+b.getAttribute(attr)) >= 0); }); }
    function qn() {
      var ds = state.durations.slice().sort(function (a, b) { return a - b; });
      $('#t-qn').textContent = ds.length ? ds.map(function (d) { return d + ' min = ' + Math.floor(d * 60 / state.sec) + ' questions'; }).join(' · ') : 'Pick at least one time.';
    }
    function drawUnits() {
      var s = state.subjects.filter(function (x) { return x.id === $('#t-sub').value; })[0];
      var units = s ? s.units.slice().sort(function (a, b) { return a.unit - b.unit; }) : [];
      $('#t-units').innerHTML = units.length ? units.map(function (u) { return '<button type="button" class="chip sel" data-u="' + u.unit + '" aria-pressed="' + (state.units.indexOf(u.unit) >= 0) + '">Unit ' + u.unit + (u.name ? ': ' + esc(u.name) : '') + '</button>'; }).join('') : '<span class="fh">No questions in this subject yet.</span>';
    }
    function collect() {
      function v(i) { return $(i).value; } function iso(i) { return v(i) ? new Date(v(i)).toISOString() : ''; }
      return { slug: slugify(v('#t-slug') || v('#t-title')), title: v('#t-title').trim(), description: v('#t-desc').trim(), subject_id: v('#t-sub'),
        units: state.units.slice(), mode: v('#t-mode'), durations: state.durations.slice().sort(function (a, b) { return a - b; }), sec_per_q: state.sec,
        max_attempts: v('#t-max'), open_at: iso('#t-open'), last_start_at: iso('#t-last'), close_at: iso('#t-close'),
        show_result: $('#t-res').checked, active: $('#t-act').checked, listed: $('#t-list').checked, leave_penalty: $('#t-pen').checked,
        daily_limit: t.daily_limit, group_id: v('#t-grp') || null };
    }
    function apply(p) {
      $('#t-title').value = p.title || ''; $('#t-desc').value = p.description || ''; if (isNew) $('#t-slug').value = p.slug || '';
      if (p.subject_id) $('#t-sub').value = p.subject_id; $('#t-mode').value = p.mode || 'exam';
      $('#t-max').value = p.max_attempts == null ? '' : String(p.max_attempts); $('#t-grp').value = p.group_id || '';
      $('#t-open').value = toLocalInput(p.open_at); $('#t-last').value = toLocalInput(p.last_start_at); $('#t-close').value = toLocalInput(p.close_at);
      $('#t-res').checked = !!p.show_result; $('#t-act').checked = p.active !== false; $('#t-list').checked = !!p.listed; $('#t-pen').checked = p.leave_penalty !== false;
      state.durations = (p.durations || []).slice(); state.sec = p.sec_per_q || 45; state.units = (p.units || []).slice();
      pressSet('#t-dur', 'data-d', state.durations); pressSet('#t-sec', 'data-s', [state.sec]); drawUnits(); qn(); syncGroup();
    }
    function syncGroup() { var g = !!$('#t-grp').value; $('#t-list').disabled = g; if (g) $('#t-list').checked = false; }
    var autoT = null;
    function autosave() { m.dirty = true; clearTimeout(autoT); autoT = setTimeout(function () { try { localStorage.setItem(KEY, JSON.stringify(collect())); $('#t-auto').textContent = 'Draft saved on this device'; } catch (e) {} }, 400); }

    $('#t-max').value = t.max_attempts == null ? '' : String(t.max_attempts);
    $('#t-mode').value = t.mode;
    pressSet('#t-dur', 'data-d', state.durations); pressSet('#t-sec', 'data-s', [state.sec]); qn();
    $('#t-title').addEventListener('input', function () { if (!slugTouched) $('#t-slug').value = slugify(this.value); });
    $('#t-slug').addEventListener('input', function () { slugTouched = true; });
    $('#t-dur').onclick = function (e) { var b = e.target.closest('[data-d]'); if (!b) return; var d = +b.getAttribute('data-d'), i = state.durations.indexOf(d); if (i >= 0) state.durations.splice(i, 1); else state.durations.push(d); pressSet('#t-dur', 'data-d', state.durations); qn(); autosave(); };
    $('#t-sec').onclick = function (e) { var b = e.target.closest('[data-s]'); if (!b) return; state.sec = +b.getAttribute('data-s'); pressSet('#t-sec', 'data-s', [state.sec]); qn(); autosave(); };
    $('#t-units').onclick = function (e) { var b = e.target.closest('[data-u]'); if (!b) return; var u = +b.getAttribute('data-u'), i = state.units.indexOf(u); if (i >= 0) state.units.splice(i, 1); else state.units.push(u); b.setAttribute('aria-pressed', i < 0); autosave(); };
    box.addEventListener('input', autosave); box.addEventListener('change', function (e) { if (e.target.id === 't-grp') syncGroup(); if (e.target.id === 't-sub') { state.units = []; drawUnits(); } autosave(); });

    Promise.all([rpc('admin_subjects'), rpc('admin_groups')]).then(function (r) {
      state.subjects = r[0];
      $('#t-sub').innerHTML = r[0].map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.name) + ' (' + esc(s.id) + ')</option>'; }).join('');
      $('#t-sub').value = t.subject_id || (r[0][0] && r[0][0].id);
      r[1].forEach(function (g) { var o = document.createElement('option'); o.value = g.id; o.textContent = 'Only group: ' + g.name; $('#t-grp').appendChild(o); });
      $('#t-grp').value = t.group_id || ''; syncGroup(); drawUnits();
      if (saved) { $('#t-restore').hidden = false; $('#t-rs').onclick = function () { apply(saved); $('#t-restore').hidden = true; m.dirty = true; }; $('#t-dc').onclick = function () { localStorage.removeItem(KEY); $('#t-restore').hidden = true; }; }
    }).catch(function () {});

    $('#t-save').onclick = function () {
      var p = collect();
      if (!p.title) return ($('#t-er').textContent = 'Give the test a title.');
      if (!p.durations.length) return ($('#t-er').textContent = 'Pick at least one time option.');
      var b = this; b.disabled = true; $('#t-er').textContent = '';
      rpc('admin_save_test', { p: p }).then(function () { try { localStorage.removeItem(KEY); } catch (e) {} m.dirty = false; toast('Test saved'); m.remove(); done && done(); })
        .catch(function (e) { $('#t-er').textContent = errMsg(e); b.disabled = false; });
    };
  }

  function parseRoster(text) {
    return text.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
      var parts = l.split(/\t|,|;/).map(function (x) { return x.trim(); });
      var email = parts.filter(function (x) { return /@/.test(x); })[0] || '';
      var mobile = parts.filter(function (x) { return /^\+?[\d\s-]{10,15}$/.test(x); })[0] || '';
      var rest = parts.filter(function (x) { return x && x !== email && x !== mobile; });
      return { raw: l, email: email, mobile: mobile, name: rest[0] || '', roll: rest[1] || '' };
    }).filter(function (r) { return r.email || !/e-?mail/i.test(r.raw); });
  }
  function admGroups(box) {
    var gid = new URLSearchParams(location.search).get('g');
    if (gid) return admGroup(box, gid);
    box.innerHTML = '<div class="spinner"></div>';
    rpc('admin_groups').then(function (list) {
      box.innerHTML = '<p class="small muted">Make a group for a class, workshop or hackathon. Paste your list, and every student gets a personal link: no sign-in, straight to the tests you assign.</p>' +
        '<div class="row" style="margin-bottom:12px"><input class="in" id="gn" placeholder="New group name, e.g. ME 3rd year Sec A" style="max-width:420px"><button class="btn dark" id="gc" style="min-height:48px">Create group</button></div>' +
        '<div class="grid">' + list.map(function (g) {
          return '<a class="card test-card" href="/admin?tab=groups&g=' + g.id + '" data-link style="color:var(--ink)"><h3>' + esc(g.name) + '</h3><p class="small muted">' + g.members + ' students &middot; ' + g.tests.length + ' test(s)<br>' +
            (g.ends_at ? 'Closes ' + esc(fmtDate(g.ends_at)) : 'No end time') + '</p></a>';
        }).join('') + '</div>';
      q('#gc').onclick = function () {
        var n = q('#gn').value.trim(); if (!n) return toast('Type a group name');
        rpc('admin_save_group', { p: { name: n } }).then(function (g) { go('/admin?tab=groups&g=' + g.id); }).catch(function (e) { toast(errMsg(e)); });
      };
    }).catch(function (e) { box.innerHTML = '<p class="err">' + esc(errMsg(e)) + '</p>'; });
  }
  function admGroup(box, gid) {
    var timer = null;
    function load(quiet) {
      if (!quiet) box.innerHTML = '<div class="spinner"></div>';
      Promise.all([rpc('admin_groups'), rpc('admin_group_members', { p_group: gid })]).then(function (r) {
        var g = r[0].filter(function (x) { return x.id === gid; })[0], mem = r[1];
        if (!g) { box.innerHTML = '<p>Group not found.</p>'; return; }
        var link = function (m) { return location.origin + '/g/' + m.token; };
        var testsHtml = g.tests.length ? g.tests.map(function (t) { return '<span class="pill accent">' + esc(t.title) + '</span>'; }).join(' ') : '<span class="muted small">No test assigned yet.</span>';
        box.innerHTML = '<p><a href="/admin?tab=groups" data-link>&larr; All groups</a></p>' +
          '<section class="card"><div class="g3"><div><label class="f" for="g-n">Group name</label><input class="in" id="g-n" value="' + esc(g.name) + '"></div>' +
          '<div><label class="f" for="g-s">Links work from</label><input class="in" id="g-s" type="datetime-local" value="' + toLocalInput(g.starts_at) + '"></div>' +
          '<div><label class="f" for="g-e">Links stop working after</label><input class="in" id="g-e" type="datetime-local" value="' + toLocalInput(g.ends_at) + '"></div></div>' +
          '<label class="f" for="g-note">Message shown to students (optional)</label><input class="in" id="g-note" value="' + esc(g.note || '') + '" placeholder="e.g. Workshop quiz, 20 minutes, phones on DND">' +
          '<div class="row" style="margin-top:12px"><button class="btn dark" id="g-save" style="min-height:44px">Save group</button><button class="btn ghost" id="g-del" style="min-height:44px">Delete group</button></div></section>' +
          '<section class="card"><div class="spread"><h3 style="margin:0">Tests for this group</h3><button class="btn" id="g-test" style="min-height:40px;padding:8px 14px">+ Create class test</button></div><p style="margin-top:10px">' + testsHtml + '</p>' +
          '<p class="small muted" style="margin:0">Class tests are hidden from the public. Only this group sees them, through their personal links. Edit them in the Tests tab.</p></section>' +
          '<section class="card"><h3>Add students</h3><p class="small muted">Paste from Excel or Google Sheets, one student per line: <b>Name, Email, Mobile, Roll no.</b> (mobile and roll optional; any order works as long as the email is there).</p>' +
          '<textarea class="in" id="g-paste" rows="5" placeholder="Asha Sharma, asha@gmail.com, 9876543210, 21ME01"></textarea><div class="row" style="margin-top:10px"><button class="btn" id="g-add" style="min-height:44px">Add to group</button><span class="small" id="g-msg"></span></div></section>' +
          '<section class="card"><div class="spread"><h3 style="margin:0">Students (' + mem.length + ')</h3><div class="row"><span class="small muted">Live, refreshes every 15 s</span><button class="btn ghost" id="g-csv" style="min-height:38px;padding:6px 12px">Download links + scores (CSV)</button></div></div>' +
          (mem.length ? '<div class="table"><table><tr><th>Student</th><th>Status</th><th>Personal link</th><th></th></tr>' + mem.map(function (m) {
            var a = m.attempts[0], stat = !a ? '<span class="muted small">Not started</span>' : a.status === 'done' ? '<b class="mono">' + a.score + '/' + a.n + '</b> <span class="small muted">' + esc(a.title) + '</span>' : '<span class="pill accent">Testing: Q' + (a.idx + 1) + '/' + a.n + '</span>';
            if (a && a.leaves) stat += ' <span class="pill bad">left ' + a.leaves + 'x</span>';
            if (m.locked) stat += ' <span class="pill bad">locked</span>';
            var wa = m.mobile ? 'https://wa.me/' + (m.mobile.length === 10 ? '91' + m.mobile : m.mobile) + '?text=' + encodeURIComponent('Hi ' + (m.name || '') + ', your personal test link for ' + g.name + ': ' + link(m) + ' (do not share it)') : null;
            return '<tr><td><b>' + esc(m.name || '') + '</b>' + (m.roll ? ' <span class="small muted">' + esc(m.roll) + '</span>' : '') + '<br><span class="small muted">' + esc(m.email) + '</span></td><td>' + stat + '</td>' +
              '<td><div class="row" style="gap:6px"><button class="sh" data-cp="' + esc(link(m)) + '">' + SHARE_ICONS.link + '<span>Copy</span></button>' + (wa ? '<a class="sh wa" target="_blank" rel="noopener" href="' + wa + '">' + SHARE_ICONS.wa + '<span>Send</span></a>' : '') + '</div></td>' +
              '<td><select class="in" data-act="' + m.id + '" style="min-height:36px;padding:4px 8px;font-size:14px"><option value="">More…</option><option value="unlock">Remove lock</option><option value="new_link">New link (old stops)</option><option value="remove">Remove</option></select></td></tr>';
          }).join('') + '</table></div>' : '<p class="muted">No students yet. Paste your list above.</p>') + '</section>';
        function v(i) { return q(i).value; } function iso(i) { return v(i) ? new Date(v(i)).toISOString() : ''; }
        q('#g-save').onclick = function () { rpc('admin_save_group', { p: { id: gid, name: v('#g-n'), note: v('#g-note'), starts_at: iso('#g-s'), ends_at: iso('#g-e') } }).then(function () { toast('Saved'); load(true); }).catch(function (e) { toast(errMsg(e)); }); };
        q('#g-del').onclick = function () { if (!confirm('Delete this group? Its personal links will stop working.')) return; rpc('admin_delete_group', { p_id: gid }).then(function () { go('/admin?tab=groups'); }).catch(function (e) { toast(errMsg(e)); }); };
        q('#g-test').onclick = function () { editTest({ slug: '', title: g.name + ' quiz', description: '', subject_id: 'MP', units: null, mode: 'exam', durations: [20], sec_per_q: 45, show_result: true, max_attempts: 1, active: true, listed: false, leave_penalty: true, group_id: gid }, function () { load(); }); };
        q('#g-add').onclick = function () {
          var rows = parseRoster(v('#g-paste')); if (!rows.length) return toast('Paste at least one line with an email');
          var b = this; b.disabled = true;
          rpc('admin_add_members', { p_group: gid, p_rows: rows }).then(function (r) {
            q('#g-msg').innerHTML = '<b>' + r.added + ' added</b>, ' + r.updated + ' updated' + (r.invalid.length ? '. <span style="color:var(--bad)">Skipped (no valid email): ' + esc(r.invalid.join(' | ')) + '</span>' : '');
            q('#g-paste').value = ''; b.disabled = false; setTimeout(function () { load(true); }, 600);
          }).catch(function (e) { toast(errMsg(e)); b.disabled = false; });
        };
        q('#g-csv').onclick = function () {
          download(g.name.replace(/\W+/g, '-') + '-links.csv', csv(mem.map(function (m) { var a = m.attempts.filter(function (x) { return x.status === 'done'; })[0]; return { name: m.name, email: m.email, mobile: m.mobile, roll: m.roll, link: link(m), score: a ? a.score : '', n: a ? a.n : '', leaves: a ? a.leaves : '' }; }),
            [['name', 'Name'], ['roll', 'Roll'], ['email', 'Email'], ['mobile', 'Mobile'], ['link', 'Personal link'], ['score', 'Score'], ['n', 'Out of'], ['leaves', 'Left screen']]));
        };
        box.querySelectorAll('[data-cp]').forEach(function (b) { b.onclick = function () { var u = b.getAttribute('data-cp'); (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { toast('Link copied'); }, function () { window.prompt('Copy', u); }); }; });
        box.querySelectorAll('[data-act]').forEach(function (sel) { sel.onchange = function () {
          var act = sel.value; if (!act) return;
          if (act === 'remove' && !confirm('Remove this student from the group?')) { sel.value = ''; return; }
          rpc('admin_member_action', { p_member: sel.getAttribute('data-act'), p_action: act }).then(function () { toast('Done'); load(true); }).catch(function (e) { toast(errMsg(e)); sel.value = ''; });
        }; });
      }).catch(function (e) { box.innerHTML = '<p class="err">' + esc(errMsg(e)) + '</p>'; });
    }
    load(); timer = setInterval(function () { if (!document.querySelector('.modal') && !(document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) load(true); }, 15000);
    cleanup = function () { clearInterval(timer); };
  }

  function admLinks(box) {
    box.innerHTML = '<div class="spinner"></div>';
    Promise.all([rpc('catalog'), rpc('admin_tests')]).then(function (r) {
      var cat = r[0], tests = r[1];
      function row(label, url, note) { return '<tr><td>' + label + (note ? '<br><span class="small muted">' + note + '</span>' : '') + '</td><td class="mono small">' + esc(url.replace(/^https?:\/\//, '')) + '</td><td><button class="btn ghost" data-cp="' + esc(url) + '" style="min-height:34px;padding:4px 12px">Copy</button></td></tr>'; }
      var html = '<p class="small muted">Paste these in YouTube descriptions, WhatsApp groups or posts. Each link opens straight to that quiz.</p>' +
        '<div class="table"><table><tr><th>What it opens</th><th>Link</th><th></th></tr>' + row('<b>Home page</b>', location.origin + '/');
      cat.forEach(function (s) {
        html += row('<b>' + esc(s.name) + '</b>: full syllabus', practiceLink(s.id), s.count + ' questions');
        s.units.forEach(function (u) {
          html += row('&nbsp;&nbsp;Unit ' + u.unit + ': ' + esc(u.name), practiceLink(s.id, u.unit), u.count + ' questions' + (u.durations.length ? '' : ' &middot; not enough yet'));
          u.topics.forEach(function (t) { html += row('&nbsp;&nbsp;&nbsp;&nbsp;' + esc(t.name), practiceLink(s.id, u.unit, t.id), t.count + ' questions' + (t.durations.length ? '' : ' &middot; opens at about 18')); });
        });
      });
      tests.forEach(function (t) { html += row('<b>Test:</b> ' + esc(t.title), location.origin + '/t/' + t.slug, t.active ? '' : 'inactive'); });
      box.innerHTML = html + '</table></div>';
      box.querySelectorAll('[data-cp]').forEach(function (b) { b.onclick = function () { var u = b.getAttribute('data-cp'); (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { toast('Copied'); }, function () { window.prompt('Copy', u); }); }; });
    }).catch(function (e) { box.innerHTML = '<p class="err">' + esc(errMsg(e)) + '</p>'; });
  }

  function admResults(box) {
    Promise.all([rpc('admin_tests')]).then(function (r) {
      var tests = r[0];
      box.innerHTML = '<div class="row"><select class="in" id="rt" style="max-width:420px"><option value="">All tests</option>' + tests.map(function (t) { return '<option value="' + esc(t.slug) + '">' + esc(t.title) + '</option>'; }).join('') + '</select>' +
        '<button class="btn ghost" id="rx" style="min-height:44px;padding:8px 14px">Download CSV</button></div><div id="rl" style="margin-top:12px"></div>';
      var rows = [];
      function load() {
        q('#rl').innerHTML = '<div class="spinner"></div>';
        rpc('admin_results', { p_slug: q('#rt').value || null }).then(function (list) {
          rows = list.map(function (a) { a.pct = a.n ? Math.round(100 * a.score / a.n) : 0; return a; });
          q('#rl').innerHTML = rows.length ? '<div class="table"><table><tr><th>Student</th><th>Test</th><th>Score</th><th>Left screen</th><th>Finished</th><th></th></tr>' + rows.map(function (a) {
            return '<tr><td><b>' + esc(a.name || '') + '</b><br><span class="small muted">' + esc(a.email || '') + '</span></td><td class="small">' + esc(a.title) + '</td><td class="mono">' + a.score + '/' + a.n + ' (' + a.pct + '%)</td><td>' + a.leaves + (a.strikes ? ' (' + a.strikes + ' pen.)' : '') + '</td><td class="small">' + esc(fmtDate(a.finished)) + '</td><td><a href="/result/' + a.id + '" data-link>View</a></td></tr>';
          }).join('') + '</table></div>' : '<p class="muted">No results yet.</p>';
        });
      }
      q('#rt').onchange = load; load();
      q('#rx').onclick = function () { download('results.csv', csv(rows, [['name', 'Name'], ['email', 'Email'], ['mobile', 'Mobile'], ['college', 'College'], ['city', 'City'], ['title', 'Test'], ['score', 'Score'], ['n', 'Out of'], ['pct', 'Percent'], ['attempted', 'Attempted'], ['leaves', 'Left screen'], ['strikes', 'Penalties'], ['end', 'Ended by'], ['finished', 'Finished at']])); };
    });
  }

  /* ---------- boot ---------- */
  var booted = false;
  sb.auth.onAuthStateChange(function (ev, s2) {
    var had = !!session; session = s2;
    if (!booted) return;
    if (!!s2 === had) { setNav(); return; }
    setTimeout(function () {
      loadProfile().then(function () {
        setNav();
        if (!session) { profile = null; return go('/', true); }
        if (location.pathname === '/login') go(profile && profile.complete ? nextParam() : '/profile?next=' + encodeURIComponent(nextParam()), true);
        else if (profile && !profile.complete && location.pathname !== '/profile') go('/profile?next=' + encodeURIComponent(location.pathname), true);
        else route();
      });
    }, 0);
  });
  sb.auth.getSession().then(function (r) {
    session = r.data.session;
    return loadProfile();
  }).catch(function () {}).then(function () { booted = true; route(); });
})();

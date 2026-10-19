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
    var html = '<a href="https://www.vkvsir.com" class="site-link" title="Go to vkvsir.com">&larr; vkvsir.com</a><a href="/" data-link class="' + (active === 'home' ? 'on' : '') + '">Tests</a>';
    if (session) {
      html += '<a href="/me" data-link class="' + (active === 'me' ? 'on' : '') + '">Dashboard</a>';
      if (profile && profile.is_admin) html += '<a href="/admin" data-link class="' + (active === 'admin' ? 'on' : '') + '">Admin</a>';
      var ini = ((profile && (profile.full_name || profile.email)) || '?').charAt(0).toUpperCase();
      html += '<a href="/profile" data-link class="avatar" title="Profile and sign out" aria-label="Profile and sign out">' + esc(ini) + '</a>';
    } else {
      html += '<a href="/login" data-link class="' + (active === 'login' ? 'on' : '') + '">Sign in</a>';
    }
    $nav.innerHTML = html;
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
  var TRACKS = [
    { k: 'foundation', ic: '📘', t: 'Fundamentals', d: 'Unit and topic MCQs for semester exams, practicals and viva: Diploma, UG, PG and PhD.' },
    { k: 'competitive', ic: '🏆', t: 'Competitive exams', d: 'GATE, ESE, PSU, ISRO, RTO/MVI, SSC, aptitude, reasoning and more, by level and domain.' },
    { k: 'career', ic: '🚀', t: 'Interview & career', d: 'Job, interview and role-switch preparation for freshers to senior professionals.' }
  ];
  function viewHome() {
    setNav('home'); loading();
    Promise.all([rpc('catalog').catch(function () { return []; }), rpc('list_tests').catch(function () { return []; }),
      sb.from('catalog').select('track,grp,title,description,subject_id,sort').eq('active', true).order('sort').then(function (r) { return r.data || []; }, function () { return []; }),
      rpc('leaderboard', { p_subject: null }).catch(function () { return []; })]).then(function (r) {
      var cat = r[0] || [], tests = r[1] || [], extra = r[2] || [], board = r[3] || [];
      var sel = {}; // key "S|U|T" -> {s,u,t}
      function trackOf(s) { return s.category === 'Exam' ? 'competitive' : 'foundation'; }
      function chk(id, label, extraCls, dis) { return '<label class="tchk' + (extraCls || '') + '"><input type="checkbox" data-k="' + esc(id) + '"' + (dis ? ' disabled' : '') + '><span>' + label + '</span></label>'; }
      function subjNode(s) {
        return '<details class="tn"><summary><span class="caret"></span>' + chk(s.id, '<b>' + esc(s.name) + '</b>', ' lvl1', !s.durations.length) + '</summary><div class="tk">' +
          s.units.map(function (u) {
            var key = s.id + '|' + u.unit, many = u.topics.filter(function (t) { return t.durations.length; }).length >= 2;
            return '<details class="tn"><summary><span class="caret"' + (u.topics.length ? '' : ' style="visibility:hidden"') + '></span>' + chk(key, 'Unit ' + u.unit + ': ' + esc(u.name), '', !u.durations.length) + '</summary>' +
              (many ? '<div class="tk">' + u.topics.map(function (t) { return '<div class="leaf">' + chk(key + '|' + t.id, esc(t.name) + (t.new ? ' <span class="badge">New</span>' : ''), '', !t.durations.length) + '</div>'; }).join('') + '</div>' : '') + '</details>';
          }).join('') + '</div></details>';
      }
      function ghost(rows) { return rows.length ? '<div class="ghosts">' + rows.map(function (x) { return '<span>' + esc(x.title) + '</span>'; }).join('') + '<span>…and many more</span></div>' : ''; }
      var live = {}; cat.forEach(function (s) { live[s.id] = 1; });
      var tracksHtml = TRACKS.map(function (tr, i) {
        var subs = cat.filter(function (s) { return trackOf(s) === tr.k; });
        var more = extra.filter(function (x) { return x.track === tr.k && !(x.subject_id && live[x.subject_id]); });
        var rt = tr.k === 'competitive' ? tests.filter(function (t) { return !/-custom$/.test(t.slug); }) : [];
        var body = (subs.length ? '<div class="tree">' + subs.map(subjNode).join('') + '</div>' : '') +
          (rt.length ? '<p class="f" style="margin-top:14px">Ready-made tests</p><div class="rtl">' + rt.map(function (t) { return '<a href="/t/' + esc(t.slug) + '" data-link>' + esc(t.title) + ' <span>&rarr;</span></a>'; }).join('') + '</div>' : '') +
          ghost(more);
        return '<details class="trk ' + tr.k + '"' + (i === 0 ? ' id="tr0"' : '') + '><summary><span class="tic">' + tr.ic + '</span><span class="tt"><b>' + tr.t + '</b><small>' + tr.d + '</small></span><span class="tplus" aria-hidden="true"></span></summary><div class="tbody">' + body + '</div></details>';
      }).join('');
      h('<section class="hero" style="padding-bottom:6px"><p class="eyebrow">Free practice by VKV Sir</p><h1>Practice the way <em>examiners</em> think.</h1>' +
        '<p class="muted" style="max-width:620px">Open a track, tick the subjects, units or topics you want, choose the time and start. Every paper is freshly balanced, with instant results.</p></section>' +
        '<div class="tracks">' + tracksHtml + '</div>' +
        '<div class="startbar" id="sbar" hidden><div><b id="sn"></b><span class="small muted" id="sd"></span></div><div class="seg mini" id="sdur">' + [5, 10, 15, 30].map(function (d, k) { return '<button type="button" data-d="' + d + '" aria-pressed="' + (k === 1) + '">' + d + ' min</button>'; }).join('') + '</div><button class="btn" id="sgo">' + (session ? 'Start practice' : 'Sign in to start') + '</button><div class="err" id="se" role="alert"></div></div>' +
        shareBar(location.origin + '/', 'Free practice quizzes with instant results by VKV Sir:', 'Invite friends:') + boardCard(board, 'Top performers'));
      var dur = 10;
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
        q('#sn').textContent = s.length ? s.length + (s.length === 1 ? ' selection' : ' selections') + ' ready' : '';
        q('#sd').textContent = s.length ? ' · ' + s.map(function (x) { return x.t ? 'topic' : x.u ? 'unit ' + x.u : 'full ' + x.s; }).slice(0, 4).join(', ') + (s.length > 4 ? '…' : '') : '';
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
      q('#sdur').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; dur = +b.getAttribute('data-d'); this.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); };
      q('#sgo').onclick = function () {
        if (!requireAuth(location.pathname)) return;
        var g = this, s = selection(); g.disabled = true; g.textContent = 'Preparing your paper…'; q('#se').textContent = '';
        rpc('start_multi', { p_sel: s, p_duration: dur }).then(function (v) { go('/exam/' + v.attempt); })
          .catch(function (e) { var m = errMsg(e); if (m === 'PROFILE_INCOMPLETE') return go('/profile?next=' + location.pathname); q('#se').textContent = lockText(m); g.disabled = false; g.textContent = 'Start practice'; });
      };
      guide(q('#tr0 summary'), 'Tap a track to open it, then tick what you want to practise');
    }).catch(function (e) { h('<div class="card narrow center"><p>' + esc(errMsg(e)) + '</p><button class="btn" onclick="location.reload()">Try again</button></div>'); });
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
      return '<li class="' + (b.me ? 'me' : '') + '"><span>' + (i + 1) + '. ' + esc(b.name) + (b.me ? ' (you)' : '') + '</span><span class="mono">' + b.pct + '%</span></li>';
    }).join('') + '</ol><p class="small muted" style="margin-top:10px">Last 30 days &middot; first attempt of each test &middot; at least 20 questions answered &middot; first names only. Scores are smoothed so one lucky short test cannot top the board.</p></section>';
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
      h('<div class="wm-layer" style="background-image:' + watermark() + '"></div><div class="exam"><div class="exam-top"><div class="spread"><span class="qcount">Question ' + (v.idx + 1) + ' of ' + v.n + '</span><span class="tleft" id="tl"></span></div>' +
        '<div class="track"><div class="fill" id="fl"></div></div><div class="qtime" id="qt"></div></div>' +
        (v.image ? '<img class="qimg" alt="Figure for this question" src="' + esc(v.image) + '">' : '') +
        '<div class="qbody" id="qb">' + esc(v.body) + '</div><div class="opts" role="radiogroup" aria-labelledby="qb" id="opts">' +
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
          '<div class="muted" style="margin-top:6px">' + esc(x.teaser) + '</div><div style="margin-top:4px"><span class="small muted">Correct answer:</span> <b style="color:var(--good)">' + esc(x.answer) + '</b></div>' +
          (x.explanation ? '<p class="small" style="margin:8px 0 0">' + esc(x.explanation) + '</p>' : '') +
          '<div class="rfb" data-no="' + x.no + '"><span class="small muted">Is this answer right?</span><button type="button" class="icon-btn" data-r="1" aria-pressed="false" aria-label="Looks right">' + THUMB_UP + '</button><button type="button" class="icon-btn" data-r="-1" aria-pressed="false" aria-label="I have a concern">' + THUMB_DN + '</button>' +
          '<div class="chips" hidden>' + RFLAGS.map(function (f) { return '<button type="button" class="chip" aria-pressed="false" data-f="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div></div></div>';
      }).join('');
      h('<div class="stack" style="max-width:760px;margin:0 auto"><div class="card"><div class="score-hero">' +
        '<svg class="ring" viewBox="0 0 132 132" role="img" aria-label="Score ' + pct + ' percent"><circle class="bg" cx="66" cy="66" r="54" fill="none" stroke-width="10"/>' +
        '<circle class="fg" cx="66" cy="66" r="54" fill="none" stroke-width="10" stroke-linecap="round" transform="rotate(-90 66 66)" stroke-dasharray="' + C + '" stroke-dashoffset="' + (C * (1 - pct / 100)) + '"/>' +
        '<text x="66" y="76" text-anchor="middle">' + pct + '%</text></svg>' +
        '<div><p class="eyebrow">' + esc(r.title) + '</p><div class="big">' + r.score + '<span class="muted" style="font-size:28px"> / ' + r.n + '</span></div>' +
        '<p class="muted" style="margin-top:8px">' + esc(r.end_reason || '') + ' &middot; ' + esc(fmtDate(r.finished_at)) + (r.strikes ? ' &middot; ' + r.strikes + ' penalty pause(s)' : '') + '</p></div></div>' +
        '<div class="tiles" style="margin-top:18px"><div class="tile"><b style="color:var(--good)">' + r.score + '</b><span>Correct</span></div><div class="tile"><b style="color:var(--bad)">' + wrong + '</b><span>Wrong</span></div><div class="tile"><b style="color:var(--warn)">' + skip + '</b><span>Not answered</span></div></div>' +
        (r.units && r.units.length > 1 ? '<h3 style="margin-top:18px">By unit</h3>' + unitBars(r.units, 'ok') : '') +
        '<div class="row" style="margin-top:18px">' + (tok ? '<a class="btn" href="' + home + '" data-link>Back to my tests</a>' : '<a class="btn" href="/" data-link>Practise again</a><a class="btn ghost" href="/me" data-link>My dashboard</a>') + '</div></div>' +
        (rev ? '<h2 style="margin-top:28px">Learn from your mistakes</h2><p class="small muted">Questions you missed, with the right answer.</p>' + rev : '<div class="card center"><h2>Perfect score!</h2><p class="muted">Every answer was correct.</p></div>') + '</div>');
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
        '<div id="cat"></div>' +
        '<div class="tiles"><div class="tile"><b>' + done.length + '</b><span>Tests taken</span></div><div class="tile"><b>' + avg + (avg === '–' ? '' : '%') + '</b><span>Average score</span></div>' +
        '<div class="tile"><b>' + best + (best === '–' ? '' : '%') + '</b><span>Best score</span></div><div class="tile"><b>' + (tot.correct + tot.wrong + tot.skipped) + '</b><span>Questions seen</span></div></div>' +
        (done.length ? '<div class="grid2"><section class="card"><h3>All answers so far</h3>' + donut([{ l: 'Correct', v: tot.correct, c: 'var(--good)' }, { l: 'Wrong', v: tot.wrong, c: 'var(--bad)' }, { l: 'Not answered', v: tot.skipped, c: 'var(--warn)' }]) + '</section>' +
          '<section class="card"><h3>Score trend</h3>' + trendChart(d.trend) + '</section></div>' : '') +
        (d.units && d.units.length ? '<section class="card"><h3>Accuracy by unit</h3>' + unitBars(d.units) + '</section>' : '') +
        (weak ? '<section class="card"><h3>Focus areas</h3><p class="small muted">Your weakest topics first. Practise these next.</p><div class="bars">' + weak + '</div></section>' : '') +
        '<section class="card"><div class="spread"><h2 style="margin:0">History</h2></div><div class="list" style="margin-top:8px">' + hist + '</div></section>' +
        boardCard(board, 'Top performers') + shareBar(location.origin + '/', 'I practise with VKV Sir Test Lab. Free quizzes with instant results:', 'Invite friends:') + '</div>');
      mountCatalog(q('#cat'));
    }).catch(function (e) { h('<div class="card narrow center"><p>' + esc(errMsg(e)) + '</p></div>'); });
  }

  /* ---------- math rendering ---------- */
  function renderMath(el) {
    if (!el || !window.renderMathInElement) return;
    try {
      window.renderMathInElement(el, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\[', right: '\\]', display: true }, { left: '$', right: '$', display: false }, { left: '\\(', right: '\\)', display: false }], throwOnError: false });
    } catch (e) {}
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

  function viewAdmin() {
    setNav('admin');
    if (!session) return go('/login?next=/admin', true);
    if (!profile || !profile.is_admin) { h('<div class="narrow card center"><h2>Admins only</h2><p class="muted">This area is for teachers and admins.</p></div>'); return; }
    var tab = new URLSearchParams(location.search).get('tab') || 'overview';
    var tabs = [['overview', 'Live'], ['questions', 'Questions'], ['students', 'Students'], ['tests', 'Tests'], ['results', 'Results'], ['groups', 'Groups'], ['links', 'Share links']];
    h('<div class="stack"><div class="spread"><div><p class="eyebrow">Admin</p><h1>Control room</h1></div></div>' +
      '<div class="tabs">' + tabs.map(function (t) { return '<a href="/admin?tab=' + t[0] + '" data-link class="' + (t[0] === tab ? 'on' : '') + '">' + t[1] + '</a>'; }).join('') + '</div><div id="adm"></div></div>');
    var box = q('#adm');
    ({ overview: admOverview, questions: admQuestions, students: admStudents, tests: admTests, results: admResults, links: admLinks, groups: admGroups }[tab] || admOverview)(box);
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
            '<div class="qtext" style="margin:8px 0;font-weight:600">' + esc(x.body) + '</div><ol type="A" class="small">' + x.options.map(function (o, k) { return '<li class="qtext' + (k === x.correct ? ' c' : '') + '">' + esc(o) + (k === x.correct ? ' &#10003;' : '') + '</li>'; }).join('') + '</ol>' +
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
      var subs = r[1], img = x.image_data || null;
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

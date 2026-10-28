/* VKV Sir Test Lab — free ATS resume builder.
   Text-based PDF (real, selectable text that ATS software can read), one column, standard headings. */
(function () {
  'use strict';
  var V, d, kw = null, step = 0, saveT = null, rid = null;
  var LS = 'vkv-resume-draft';

  /* ---------------- goals and guidance ---------------- */
  var GOALS = [
    { id: 'private', t: 'Private job (campus / off-campus)', s: 'IT, core engineering, consulting, startups', cv: true },
    { id: 'intern', t: 'Internship (2nd / 3rd year)', s: 'Summer or semester internship', cv: true },
    { id: 'psu', t: 'PSU through GATE', s: 'NTPC, BHEL, IOCL, ONGC, PGCIL, GAIL, SAIL…', cv: true },
    { id: 'govt-tech', t: 'Government technical posts', s: 'UPSC ESE (IES), State AE/AEn, SSC JE, RRB JE/SSE, ISRO/DRDO/BARC', cv: false },
    { id: 'govt-admin', t: 'Civil services & officer exams', s: 'UPSC CSE (IAS/IPS), State PSC (RAS etc.), RBI Grade B, SEBI/NABARD Grade A', cv: false },
    { id: 'govt-volume', t: 'High-volume graduate exams', s: 'SSC CGL, IBPS/SBI PO & Clerk, RRB NTPC, LIC AAO, insurance', cv: false },
    { id: 'defence', t: 'Defence officer', s: 'CDS, AFCAT, Army TGC / SSC Tech, Navy entries (SSB interview)', cv: false },
    { id: 'higher-india', t: 'Higher studies in India', s: 'M.Tech via GATE, MBA via CAT, research', cv: true },
    { id: 'abroad', t: 'Higher studies abroad', s: 'MS / PhD (GRE, TOEFL / IELTS)', cv: true }
  ];
  var GUIDE = {
    'govt-tech': 'Selection is by written exam (and interview for ESE/PSC). A resume is rarely asked; what counts is your exam score. Keep a clean resume for interviews and for PSU/R&D roles that shortlist on GATE.',
    'govt-admin': 'Selection is by prelims, mains and interview. There is no resume; the interview board uses your Detailed Application Form (DAF). Hobbies, achievements and service activities you list there are discussed, so build them genuinely.',
    'govt-volume': 'Selection is by computer-based tests (and interview for PO). A resume is not needed. Focus on quant, reasoning, English and general awareness: practise them in the Competitive track here.',
    'defence': 'Selection is by the written exam (or direct entry) and the 5-day SSB interview, which uses your Personal Information Questionnaire (PIQ). Sports, NCC, leadership roles and fitness matter a lot.',
    psu: 'PSUs shortlist on GATE score, then hold a group discussion / interview. Put your GATE score and AIR at the top, then core subjects, industrial training and projects.',
    'higher-india': 'For M.Tech, GATE score decides admission; for IIT/IISc interviews and MS (Research), projects and research matter. For MBA, CAT/XAT plus academics, work experience and extracurriculars.',
    abroad: 'Universities read an academic CV: research, publications, projects and test scores (GRE, TOEFL/IELTS) matter most. Two pages are fine. Pair it with a strong SOP and 2–3 recommendation letters.'
  };
  var VERBS = ['designed', 'developed', 'built', 'implemented', 'analysed', 'analyzed', 'improved', 'reduced', 'increased', 'optimised', 'optimized', 'led', 'managed', 'organised', 'organized', 'created', 'automated', 'modelled', 'modeled', 'simulated', 'tested', 'fabricated', 'programmed', 'coordinated', 'conducted', 'presented', 'published', 'won', 'achieved', 'trained', 'deployed', 'researched', 'evaluated', 'calculated', 'prepared', 'installed', 'maintained', 'supervised', 'planned', 'executed', 'drafted', 'surveyed', 'inspected', 'validated', 'integrated', 'migrated', 'debugged'];

  var BULLETS = {
    'Mechanical & Manufacturing': ['Designed a [part/fixture] in SolidWorks and validated it with [ANSYS static analysis], reducing weight by [X]%', 'Recorded cycle times for [N] stations and proposed line-balancing changes that cut idle time by [X]%', 'Applied 5S and kaizen on the [shop/line], freeing [X] sq. m of floor space and reducing search time by [X] min per shift', 'Analysed [N] rejection records using Pareto and fishbone diagrams; identified [root cause] behind [X]% of defects', 'Prepared process sheets and 2D drawings with GD&T for [N] components as per [IS/ISO] standards', 'Fabricated and tested a [prototype] with a team of [N]; achieved [result, e.g. efficiency/runtime]'],
    'Civil & Construction': ['Prepared bar bending schedules and quantity estimates for a [G+N] building of [X] sq. ft', 'Analysed and designed a [structure] in STAAD.Pro as per IS 456 / IS 800, checking [N] load combinations', 'Supervised [concreting/excavation] of [X] cu. m and maintained daily progress and quality reports', 'Conducted [slump/cube/soil] tests on [N] samples and compared results with IS code limits', 'Drafted site layout and working drawings in AutoCAD for [project], reducing revision cycles by [X]', 'Planned a [N]-activity schedule in Primavera P6 / MS Project and identified the critical path'],
    'Electrical & Power': ['Studied the [N] kV substation layout, protection relays and switchgear during summer training at [utility]', 'Simulated a [converter/motor drive] in MATLAB/Simulink and achieved [X]% efficiency at rated load', 'Designed the electrical layout and load schedule for a [building/plant] of [X] kW connected load', 'Performed load-flow and fault analysis on an IEEE [N]-bus system using [ETAP/PowerWorld]', 'Wired and tested a PLC-based [control panel] with [N] I/O points for [application]', 'Conducted an energy audit of [facility] and proposed savings of [X] kWh per month'],
    'Electronics & Telecom': ['Designed a [N]-layer PCB in Altium/KiCad for [device] and brought up the prototype', 'Programmed an [Arduino/STM32/ESP32] to read [N] sensors and send data over [protocol] every [X] s', 'Simulated a [filter/amplifier] in LTspice/Multisim and verified a [X] dB gain at [Y] Hz', 'Implemented [modulation/protocol] in MATLAB and measured BER at [N] SNR levels', 'Tested [N] network elements during training at [telecom company] and documented [X] faults', 'Built an IoT [system] that reduced [manual checks/power use] by [X]%'],
    'Instrumentation & Automation': ['Calibrated [N] pressure/temperature transmitters and maintained calibration records as per [standard]', 'Developed ladder logic for a [process] on [Siemens/Allen-Bradley] PLC with [N] interlocks', 'Configured a SCADA/HMI screen for [process] showing [N] tags, alarms and trends', 'Tuned a PID loop for [level/flow] control, reducing overshoot from [X]% to [Y]%', 'Prepared P&IDs and loop drawings for [N] control loops during training at [plant]', 'Troubleshot [N] field instrument faults and reduced downtime by [X] hours per month'],
    'IT & Software': ['Built a [web/mobile app] using [React/Node/Java] with [N] features and deployed it on [platform]', 'Designed a normalised [MySQL/PostgreSQL] schema with [N] tables and wrote queries that cut load time by [X]%', 'Solved [N]+ problems on [LeetCode/CodeChef]; rated [X] in [contest]', 'Developed REST APIs for [module] with authentication and tested them with Postman ([N] test cases)', 'Automated [task] with Python, saving [X] hours of manual work per week', 'Analysed [dataset] of [N] rows in Python/Excel and built a Power BI dashboard used by [team]'],
    'Energy & Utilities': ['Observed boiler, turbine and condenser operation during training at [N] MW [thermal/hydro] plant', 'Calculated heat rate and efficiency of [unit] from [N] days of operating data', 'Designed a [X] kW rooftop solar system in PVsyst with [N] modules and estimated annual yield of [Y] MWh', 'Studied [coal handling/ash handling/water treatment] and documented [N] improvement points', 'Prepared a preventive maintenance checklist for [N] auxiliaries'],
    'Core GET / PSU': ['Completed [N]-week vocational training at [PSU/plant], covering [departments]', 'Prepared a technical report on [process/equipment] observed during training, presented to [N] engineers', 'Secured GATE [year] score [X] (AIR [Y]) in [paper]', 'Led a [N]-member team in the major project on [topic], delivering a working [prototype/model]', 'Applied [safety/quality] procedures such as permit-to-work and LOTO during plant training'],
    General: ['Organised [event] for [N]+ participants with a team of [M] volunteers', 'Presented a paper on [topic] at [conference], [year]', 'Coordinated with [N] companies as student placement coordinator, scheduling [M] interviews', 'Represented the university in [sport] at [level] level', 'Mentored [N] juniors in [subject/tool] through weekly sessions']
  };
  var lastArea = null;

  function blank() {
    return { v: 1, title: 'My resume', goals: ['private'], role: '', company: '', name: '', email: '', phone: '', city: '', linkedin: '', github: '', portfolio: '',
      degree: 'B.Tech', branch: '', college: '', grad: '', cgpa: '', yearNow: '4', x12: '', x10: '', summary: '',
      skTech: '', skSoft: '', skOther: '', langs: 'English, Hindi',
      projects: [{ title: '', kind: 'Major project', tools: '', link: '', when: '', bullets: '' }], exp: [], certs: [], ach: [], por: [], pubs: [],
      tests: { gate: '', gateAir: '', cat: '', gre: '', toefl: '', ielts: '' }, extra: '' };
  }

  /* ---------------- helpers ---------------- */
  function esc(s) { return V.esc(s); }
  function lines(s) { return String(s || '').split('\n').map(function (x) { return x.replace(/^\s*([-*•▪◦]|\d+[.)])\s*/, '').trim(); }).filter(Boolean); }
  function has(s) { return String(s || '').trim().length > 0; }
  function asc(s) { // keep PDF text in the standard font's range (real text, ATS-readable)
    return String(s || '').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, '-').replace(/\u20B9/g, 'Rs ')
      .replace(/[\u2022\u25AA\u25E6]/g, '-').replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF]/g, '').replace(/[ \t]+/g, ' ').trim();
  }
  function goalNames() { return d.goals.map(function (g) { return (GOALS.filter(function (x) { return x.id === g; })[0] || {}).t; }).filter(Boolean); }
  function track() { // the resume style follows the main goal
    if (d.goals.indexOf('abroad') >= 0 || d.goals.indexOf('higher-india') >= 0) return d.goals.indexOf('private') >= 0 ? 'private' : 'academic';
    if (d.goals.indexOf('psu') >= 0 && d.goals.indexOf('private') < 0) return 'psu';
    return 'private';
  }
  function persist() {
    try { localStorage.setItem(LS, JSON.stringify(d)); } catch (e) {}
    if (!V.session) return;
    clearTimeout(saveT);
    saveT = setTimeout(function () {
      var row = { title: d.title || 'My resume', track: d.goals.join(','), data: d, score: score().total, updated_at: new Date().toISOString() };
      var p = rid ? V.sb.from('resumes').update(row).eq('id', rid).select('id').single() : V.sb.from('resumes').insert(row).select('id').single();
      p.then(function (r) { if (r.data && r.data.id) { rid = r.data.id; var s = document.getElementById('rb-saved'); if (s) s.textContent = '✓ Saved to your account'; } });
    }, 1200);
  }

  /* ---------------- keywords ---------------- */
  function loadKw() {
    if (!d.role) { kw = null; drawSide(); return; }
    V.rpc('rb_keywords', { p_role: d.role, p_branch: d.branch || null, p_company: d.company || null }).then(function (k) { kw = k; drawSide(); }).catch(function () {});
  }
  function nice(k) { return k.length <= 4 && !/\s/.test(k) ? k.toUpperCase() : k.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }).replace(/\b([A-Z][a-z])\b/g, function (w) { return w.toUpperCase(); }); }
  function jdList() {
    if (!d.jdKw) return [];
    var out = [], seen = {};
    (d.jdKw.software || []).concat(d.jdKw.skills || []).forEach(function (k, i) {
      var key = k.label.toLowerCase(); if (seen[key]) return;
      if ((k.alts || []).some(function (a) { return seen[String(a).toLowerCase()]; })) return;
      seen[key] = 1; (k.alts || []).forEach(function (a) { seen[String(a).toLowerCase()] = 1; });
      out.push({ label: i < (d.jdKw.software || []).length ? k.label : nice(k.label), alts: k.alts && k.alts.length ? k.alts : [k.label], w: i < (d.jdKw.software || []).length ? 3 : 2 });
    });
    return out;
  }
  function checkJd() {
    var t = (document.getElementById('rb-jd') || {}).value || '';
    var b = document.getElementById('rb-jdgo'); b.disabled = true; b.textContent = 'Reading the job post…';
    V.rpc('rb_jd_keywords', { p_text: t }).then(function (r) {
      d.jd = t; d.jdKw = r;
      if (!d.role && r.role && r.role.id) { d.role = r.role.id; loadKw(); }
      persist(); render(true);
    }).catch(function (e) { V.toast(V.errMsg(e)); }).finally(function () { if (b) { b.disabled = false; b.textContent = 'Check match'; } });
  }
  function kwList() {
    var out = [], seen = {};
    function add(label, alts, w) { var key = label.toLowerCase(); if (seen[key]) return; seen[key] = 1; out.push({ label: label, alts: alts, w: w }); }
    jdList().forEach(function (k) { add(k.label, k.alts, k.w); });
    if (!kw) return out;
    (kw.company || []).forEach(function (c) { var n = c.name.split(/[/(]/)[0].trim(); add(n, [n], 3); });
    (kw.software || []).forEach(function (s) { var n = s.name.split(/[/(]/)[0].trim(); add(n, [n], s.tier === 1 ? 3 : 2); });
    (kw.skills || []).forEach(function (s) { (s.kw || []).slice(0, s.tier === 1 ? 4 : 2).forEach(function (k) { if (k.length > 1) add(k.length <= 4 && !/\s/.test(k) ? k.toUpperCase() : k.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }).replace(/\b([A-Z][a-z])\b/g, function (w) { return w.toUpperCase(); }), [k], s.tier === 1 ? 2 : 1); }); });
    return out.slice(0, d.jdKw ? 36 : 24);
  }
  function fullText() {
    var t = [d.summary, d.skTech, d.skSoft, d.skOther];
    d.projects.concat(d.exp).forEach(function (x) { t.push(x.title, x.tools, x.role, x.org, x.bullets); });
    d.certs.forEach(function (x) { t.push(x.name, x.org); }); d.ach.forEach(function (x) { t.push(x.text); }); d.por.forEach(function (x) { t.push(x.role, x.org, x.text); });
    return t.join(' \n ').toLowerCase();
  }
  function found(text, k) { return k.alts.some(function (a) { a = a.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); return new RegExp('(^|[^a-z0-9])' + a + '($|[^a-z0-9])').test(text); }); }

  /* ---------------- ATS score (rule-based, explained) ---------------- */
  function score() {
    var s = [], tips = [], text = fullText();
    var c = 0; if (has(d.name)) c += 3; if (/@/.test(d.email)) c += 3; if (/\d{10}/.test(String(d.phone).replace(/\D/g, ''))) c += 2; if (has(d.city)) c += 1; if (has(d.linkedin)) c += 1;
    s.push(['Contact details', c, 10]); if (c < 10) tips.push('Complete name, email, 10-digit phone, city and LinkedIn link.');
    var sec = 0; if (has(d.college) && has(d.cgpa)) sec += 5; if (has(d.skTech)) sec += 4; if (d.projects.some(function (p) { return has(p.title); })) sec += 4; if (d.exp.length || d.certs.length) sec += 2;
    s.push(['Standard sections', sec, 15]); if (sec < 15) tips.push('Fill Education (with CGPA), Technical skills, at least one project, and an internship/training or certification.');
    var ks = kwList(), got = ks.filter(function (k) { return found(text, k); }), wAll = 0, wGot = 0;
    ks.forEach(function (k) { wAll += k.w; }); got.forEach(function (k) { wGot += k.w; });
    var kscore = ks.length ? Math.round(30 * wGot / wAll) : (has(d.skTech) ? 15 : 0);
    s.push([d.jdKw ? 'Keywords (job post + role)' : 'Keywords for your target role', kscore, 30]);
    var miss = ks.filter(function (k) { return got.indexOf(k) < 0; });
    if (!ks.length) tips.push('Choose a target role (and company) in Step 1 so we can check the keywords recruiters search for.');
    var bl = []; d.projects.concat(d.exp).forEach(function (x) { bl = bl.concat(lines(x.bullets)); }); d.por.forEach(function (x) { bl = bl.concat(lines(x.text)); });
    var vb = bl.filter(function (b) { return VERBS.indexOf(b.split(/\s+/)[0].toLowerCase()) >= 0; }).length;
    var nb = bl.filter(function (b) { return /\d/.test(b); }).length;
    var av = bl.length ? Math.round(10 * Math.min(1, vb / bl.length / 0.7)) : 0, qn = bl.length ? Math.round(10 * Math.min(1, nb / bl.length / 0.5)) : 0;
    s.push(['Bullets start with action verbs', av, 10]); if (av < 8) tips.push('Start each bullet with an action verb: Designed, Built, Analysed, Reduced, Led, Automated…');
    s.push(['Results with numbers', qn, 10]); if (qn < 8) tips.push('Add numbers: “reduced cycle time by 12%”, “tested 40 samples”, “team of 4”, “500+ users”.');
    var ln = bl.filter(function (b) { var w = b.split(/\s+/).length; return w >= 8 && w <= 30; }).length, lsc = bl.length ? Math.round(5 * ln / bl.length) : 0;
    s.push(['Bullet length (8–30 words)', lsc, 5]); if (lsc < 4 && bl.length) tips.push('Keep each bullet to one or two lines (about 8–30 words).');
    var sm = has(d.summary) ? (d.summary.split(/\s+/).length <= 70 ? 5 : 3) : 0; s.push(['Short professional summary', sm, 5]);
    if (!sm) tips.push('Add a 2–3 line summary naming your target role and two strongest skills.');
    var pr = /(^|\s)(i|my|me)(\s|$)/i.test([d.summary].concat(bl).join(' ')) ? 0 : 5; s.push(['No “I / my” (resume style)', pr, 5]);
    if (!pr) tips.push('Remove “I”, “my” and “me”: write “Developed…”, not “I developed…”.');
    var ach = (d.ach.length ? 3 : 0) + (d.por.length ? 3 : 0) + (d.certs.length ? 2 : 0) + ((d.goals.indexOf('psu') >= 0 && has(d.tests.gate)) || d.pubs.length ? 2 : 0);
    s.push(['Achievements, leadership, certifications', Math.min(10, ach + (d.exp.length ? 2 : 0)), 10]);
    if (/\[[^\]]{1,40}\]/.test(text)) tips.unshift('⚠ Some bullets still contain [ ] placeholders from the examples. Replace them with your real details before downloading.');
    var total = s.reduce(function (a, x) { return a + x[1]; }, 0);
    return { total: total, parts: s, tips: tips, miss: miss, got: got, bullets: bl.length };
  }

  /* ---------------- boost plan (what to do next) ---------------- */
  function boost() {
    var y = +d.yearNow || 4, b = [];
    if (!d.exp.length) b.push(y <= 3 ? ['Get an internship', 'Apply on the AICTE Internship portal, Internshala and company sites; summer training at a PSU or plant also counts. Even 4–6 weeks adds an “Experience” section recruiters look for.'] : ['Add industrial training', 'Any plant/site training, virtual internship or freelance project shows practical exposure.']);
    if (d.projects.filter(function (p) { return has(p.title); }).length < 2) b.push(['Build one more project', y <= 2 ? 'A mini project each year (2nd: a model or simple app, 3rd: an analysis or design with software, 4th: major project) shows steady growth.' : 'A focused project using the tools your target company asks for is the fastest way to add missing keywords honestly.']);
    if (!d.certs.length) b.push(['Earn a certification', 'NPTEL (IIT/IISc courses with proctored exams) carries weight in India; also vendor certificates for the software in your target list (many have free learning paths).']);
    if (!d.ach.some(function (a) { return /hackathon|competition|contest|olympiad|baja|supra|robocon/i.test(a.text); })) b.push(['Take part in a hackathon or competition', 'Smart India Hackathon, college fests, SAE BAJA/SUPRA, Robocon, coding contests or design challenges: participation with a clear role is valuable; a finalist/winner tag is excellent.']);
    if (!d.pubs.length && (d.goals.indexOf('abroad') >= 0 || d.goals.indexOf('higher-india') >= 0)) b.push(['Write a paper', 'Present at a conference or publish in a peer-reviewed journal (avoid paid “predatory” journals). For MS/PhD admissions this is a strong signal; a filed patent is even stronger.']);
    if (!d.por.length) b.push(['Take a leadership role', 'Club or chapter coordinator, TPO student coordinator, event head, NSS/NCC, class representative or campus ambassador: interviewers ask about teamwork and leadership.']);
    if (d.goals.indexOf('abroad') >= 0 && !(has(d.tests.gre) || has(d.tests.toefl) || has(d.tests.ielts))) b.push(['Plan GRE and TOEFL/IELTS', 'Most MS programmes ask for an English test (TOEFL/IELTS); many still value GRE. Take them by the end of 3rd year / early 4th year.']);
    if ((d.goals.indexOf('psu') >= 0 || d.goals.indexOf('higher-india') >= 0) && !has(d.tests.gate)) b.push(['Prepare for GATE', 'PSU shortlists and M.Tech admissions use GATE. Start core-subject revision in 3rd year; practise unit-wise tests here.']);
    if (kw) { var m = score().miss.slice(0, 5).map(function (k) { return k.label; }); if (m.length) b.push(['Close your keyword gaps', 'Learn and then use in a project: ' + m.join(', ') + '. Add a keyword only after you can answer interview questions on it.']); }
    return b;
  }

  /* ---------------- steps ---------------- */
  var STEPS = ['Goal', 'Basics', 'Education', 'Skills', 'Projects & experience', 'Achievements & activities', 'Score & download'];
  function inp(id, label, ph, opt) { opt = opt || {}; return '<div class="rb-f' + (opt.wide ? ' wide' : '') + '"><label for="' + id + '">' + label + (opt.req ? ' <span class="req">*</span>' : '') + '</label>' + (opt.area ? '<textarea class="in" id="' + id + '" rows="' + (opt.rows || 3) + '" placeholder="' + esc(ph || '') + '">' + esc(get(id)) + '</textarea>' : '<input class="in" id="' + id + '" type="' + (opt.type || 'text') + '" placeholder="' + esc(ph || '') + '" value="' + esc(get(id)) + '">') + (opt.hint ? '<small>' + opt.hint + '</small>' : '') + '</div>'; }
  function get(id) { var p = id.split('.'); var o = d; for (var i = 0; i < p.length; i++) { if (o == null) return ''; o = o[p[i]]; } return o == null ? '' : o; }
  function set(id, v) { var p = id.split('.'); var o = d; for (var i = 0; i < p.length - 1; i++) o = o[p[i]]; o[p[p.length - 1]] = v; }
  function note(type, html) { return '<div class="rb-note ' + type + '">' + html + '</div>'; }

  function stepGoal() {
    return '<h2>What are you preparing for?</h2><p class="muted small">Tick everything you are considering. If your goals are very different (for example a private job and MS abroad), make a separate resume for each: Save, then use “New resume”.</p>' +
      '<div class="rb-goals">' + GOALS.map(function (g) { return '<label class="rb-goal"><input type="checkbox" value="' + g.id + '"' + (d.goals.indexOf(g.id) >= 0 ? ' checked' : '') + '><span><b>' + g.t + '</b><small>' + g.s + '</small></span></label>'; }).join('') + '</div>' +
      '<div id="rb-ginfo">' + goalInfo() + '</div>' +
      '<div class="rb-grid">' +
      '<div class="rb-f"><label for="role">Target role <span class="req">*</span></label><select class="in" id="role"><option value="">Choose the closest role…</option>' + (V.__roles || []).map(function (r) { return '<option value="' + esc(r.id) + '"' + (d.role === r.id ? ' selected' : '') + '>' + esc(r.family + ' · ' + r.name) + '</option>'; }).join('') + '</select><small>Decides the keywords we check.</small></div>' +
      inp('company', 'Target company (optional)', 'e.g. Tata Motors', { hint: 'Adds the software this company is asking for in its current job posts.' }) +
      inp('title', 'Name this resume', 'e.g. Core mechanical – 2027') + '</div>' +
      note('ok', '<b>Applying to a specific job?</b> In the last step you can paste its job description and see a % match with the exact keywords to add.');
  }
  function goalInfo() {
    var g = d.goals.filter(function (x) { return GUIDE[x]; });
    var no = d.goals.filter(function (x) { return !(GOALS.filter(function (y) { return y.id === x; })[0] || {}).cv; });
    var mix = d.goals.filter(function (x) { return ['private', 'intern', 'psu'].indexOf(x) >= 0; }).length && d.goals.filter(function (x) { return ['abroad', 'higher-india'].indexOf(x) >= 0; }).length;
    return (mix ? note('warn', '<b>Two different directions.</b> A job resume and an academic CV are written differently. Build this one for your main goal, then create a second resume for the other.') : '') +
      g.map(function (x) { return note('info', '<b>' + esc((GOALS.filter(function (y) { return y.id === x; })[0] || {}).t) + ':</b> ' + GUIDE[x]); }).join('') +
      (no.length && no.length === d.goals.length ? note('ok', 'You can still build a resume here: it helps in interviews, apprenticeships and backup private applications.') : '');
  }
  function stepBasics() {
    return '<h2>Basic details</h2><div class="rb-grid">' + inp('name', 'Full name', 'As in your marksheet', { req: 1 }) + inp('email', 'Email', 'firstname.lastname@gmail.com', { req: 1, type: 'email', hint: 'A professional address; avoid nicknames.' }) +
      inp('phone', 'Mobile', '10-digit number', { req: 1, type: 'tel' }) + inp('city', 'City, State', 'e.g. Jaipur, Rajasthan', { req: 1 }) +
      inp('linkedin', 'LinkedIn URL', 'linkedin.com/in/your-name', { hint: 'Strongly recommended.' }) + inp('github', 'GitHub (IT/ECE)', 'github.com/username') + inp('portfolio', 'Portfolio / Google Drive of projects (optional)', 'Link to drawings, models or reports') + '</div>' +
      inp('summary', 'Professional summary (2–3 lines)', 'Final-year Mechanical Engineering student skilled in SolidWorks, ANSYS and lean manufacturing, seeking a Graduate Engineer Trainee role in automotive production.', { area: 1, wide: 1, hint: 'Name the role you want and your 2–3 strongest skills. No “I”.' }) +
      note('info', '<b>Leave out for private jobs:</b> photo, date of birth, father’s name, religion, marital status, full address and “Declaration”. ATS software ignores them and they take space. (Government and PSU application forms ask for these separately.)');
  }
  function stepEdu() {
    return '<h2>Education</h2><div class="rb-grid">' + inp('degree', 'Degree', 'B.Tech / B.E. / Diploma / M.Tech', { req: 1 }) + inp('branch', 'Branch', 'e.g. Mechanical Engineering', { req: 1 }) +
      inp('college', 'College, City', 'e.g. Govt. Engineering College, Ajmer', { req: 1 }) + inp('grad', 'Graduation year', 'e.g. 2027', { req: 1 }) +
      inp('cgpa', 'CGPA / %', 'e.g. 8.1 / 10 (till 6th sem)', { req: 1, hint: 'Write the scale. If below 6.5, you may still include it; many companies have cut-offs and check anyway.' }) +
      '<div class="rb-f"><label for="yearNow">Current year of study</label><select class="in" id="yearNow">' + ['1', '2', '3', '4', 'Graduated'].map(function (y) { return '<option' + (String(d.yearNow) === y ? ' selected' : '') + '>' + y + '</option>'; }).join('') + '</select></div>' +
      inp('x12', 'Class 12 / Diploma (board, year, %)', 'RBSE, 2023, 86%') + inp('x10', 'Class 10 (board, year, %)', 'CBSE, 2021, 91%') + '</div>' +
      '<h3>Test scores (optional)</h3><div class="rb-grid">' + inp('tests.gate', 'GATE score', 'e.g. 712') + inp('tests.gateAir', 'GATE AIR', 'e.g. 1450') + inp('tests.cat', 'CAT percentile', '') + inp('tests.gre', 'GRE', 'e.g. 318 (Q 167, V 151)') + inp('tests.toefl', 'TOEFL', 'e.g. 104') + inp('tests.ielts', 'IELTS', 'e.g. 7.5') + '</div>';
  }
  function stepSkills() {
    var ks = kwList();
    return '<h2>Skills</h2>' + (ks.length ? note('info', '<b>Keywords recruiters search for' + (d.jdKw ? ' (incl. the job post you pasted)' : '') + (kw && kw.company_name ? ' (incl. ' + esc(kw.company_name) + '’s current job posts)' : '') + ':</b> ' + ks.map(function (k) { return '<span class="rb-chip">' + esc(k.label) + '</span>'; }).join(' ') + '<br><small>Add only what you genuinely know. You will be asked about every skill you list.</small>') : note('warn', 'Choose a target role in Step 1 to see the keywords to aim for.')) +
      inp('skTech', 'Technical skills (subjects / methods)', 'Engineering Mechanics, GD&T, Lean Manufacturing, Kaizen, 5S, Thermodynamics', { area: 1, wide: 1, rows: 2 }) +
      inp('skSoft', 'Software & tools', 'SolidWorks, AutoCAD, ANSYS Workbench, MS Excel (Pivot, VLOOKUP), Python (basic)', { area: 1, wide: 1, rows: 2, hint: 'Write the exact product names (e.g. “ANSYS Workbench”, not “simulation software”).' }) +
      inp('skOther', 'Other skills (optional)', 'Technical drawing, team leadership, technical writing', { area: 1, wide: 1, rows: 2 }) + inp('langs', 'Languages', 'English, Hindi') +
      note('warn', '<b>Avoid:</b> skill bars, star ratings and percentages (“Python 80%”). ATS cannot read them and interviewers find them meaningless.');
  }
  function listEditor(key, title, fields, addLabel, help) {
    var arr = d[key];
    return '<h3>' + title + '</h3>' + (help ? '<p class="small muted">' + help + '</p>' : '') + arr.map(function (x, i) {
      return '<div class="rb-item" data-k="' + key + '" data-i="' + i + '"><div class="rb-grid">' + fields.map(function (f) { return inp(key + '.' + i + '.' + f[0], f[1], f[2], f[3]); }).join('') + '</div><button class="btn ghost small rb-del" type="button" data-k="' + key + '" data-i="' + i + '">Remove</button></div>';
    }).join('') + '<button class="btn ghost rb-add" type="button" data-k="' + key + '">+ ' + addLabel + '</button>';
  }
  var BUL = { area: 1, wide: 1, rows: 3 };
  function exampleBox() {
    var r = (V.__roles || []).filter(function (x) { return x.id === d.role; })[0], fam = r && BULLETS[r.family] ? r.family : null;
    var list = (fam ? BULLETS[fam] : []).concat(BULLETS.General);
    return '<details class="rb-ex"' + (fam ? ' open' : '') + '><summary>💡 Example bullets' + (fam ? ' for ' + esc(fam) : '') + ' <small>(tap to insert into the box you last clicked; replace every [ ] with your real details)</small></summary><div>' +
      list.map(function (b, i) { return '<button type="button" class="rb-exb" data-b="' + i + '">' + esc(b) + '</button>'; }).join('') + '</div></details>';
  }
  function stepProj() {
    return '<h2>Projects &amp; experience</h2>' + exampleBox() + note('info', '<b>Formula for each bullet:</b> Action verb + what you did + tool used + result with a number. Example: “Designed a sheet-metal fixture in SolidWorks that cut loading time by 18% on the drilling line.”') +
      listEditor('exp', 'Internships, training &amp; work', [['role', 'Role', 'Summer Intern – Production'], ['org', 'Organisation, City', 'Hero MotoCorp, Neemrana'], ['when', 'Dates', 'Jun 2026 – Jul 2026'], ['bullets', 'What you did (one point per line)', 'Mapped the engine assembly line and recorded cycle times for 22 stations\nIdentified 3 bottleneck stations and proposed line-balancing changes', BUL]], 'Add internship / training', 'Include industrial training, PSU/plant summer training, virtual internships and freelance work.') +
      listEditor('projects', 'Projects', [['title', 'Project title', 'Solar-powered grass cutter'], ['kind', 'Type', 'Major / Minor / Mini / Personal'], ['tools', 'Tools used', 'SolidWorks, Arduino'], ['when', 'When', 'Jan – Apr 2026'], ['link', 'Link (optional)', 'GitHub / Drive / video'], ['bullets', 'What you did (one point per line)', 'Designed the chassis and blade mount in SolidWorks\nBuilt and tested the prototype, achieving 2 hours of runtime per charge', BUL]], 'Add project', 'Major and minor projects, mini projects and serious personal projects all count. 2–4 strong projects are better than many weak ones.');
  }
  function stepAch() {
    return '<h2>Achievements &amp; activities</h2>' + note('info', 'These separate you from hundreds of resumes with the same degree. Recruiters value: <b>hackathons</b> (Smart India Hackathon etc.), <b>competitions</b> (SAE BAJA, Robocon, coding contests), <b>paper presentations</b> and <b>journal publications</b>, <b>patents</b>, <b>sports</b> at university/state level, and <b>leadership</b>: club coordinator, TPO coordinator, campus ambassador, NSS/NCC, fest organiser.') +
      listEditor('ach', 'Achievements &amp; awards', [['text', 'Achievement', 'Finalist, Smart India Hackathon 2025 (team of 6; built a crop-advisory app)', { wide: 1 }]], 'Add achievement', 'Be specific: level (college/state/national), rank, and your role.') +
      listEditor('por', 'Positions of responsibility', [['role', 'Role', 'Coordinator'], ['org', 'Club / event', 'Mechanical Engineering Society'], ['when', 'Year', '2025 – 26'], ['text', 'What you did (one point per line)', 'Organised 3 technical workshops attended by 250+ students', BUL]], 'Add position') +
      listEditor('certs', 'Certifications &amp; courses', [['name', 'Certificate', 'Six Sigma Yellow Belt'], ['org', 'Issued by', 'NPTEL / Coursera / Company'], ['year', 'Year', '2026']], 'Add certificate', 'Prefer proctored or recognised ones (NPTEL, vendor certifications). Skip participation-only webinars.') +
      listEditor('pubs', 'Publications, papers &amp; patents', [['title', 'Title', 'Paper title / patent title'], ['venue', 'Journal / conference / patent office', 'IEEE conference, 2026 / Patent application no.'], ['year', 'Year', '2026']], 'Add publication / patent', 'List only genuine peer-reviewed work. Avoid paid “predatory” journals; interviewers check.') +
      inp('extra', 'Other activities (optional)', 'University-level football player; NSS volunteer (120 hours)', { area: 1, wide: 1, rows: 2 });
  }
  function jdBox() {
    var j = jdList(), text = fullText(), got = j.filter(function (k) { return found(text, k); }), pct = j.length ? Math.round(100 * got.length / j.length) : 0;
    return '<div class="rb-jd"><h3>🎯 Match with a specific job post</h3><p class="small muted">Paste the job description you are applying to. We pick out the software and skills it asks for and check them against your resume.</p>' +
      '<textarea class="in" id="rb-jd" rows="5" placeholder="Paste the full job description here">' + esc(d.jd || '') + '</textarea>' +
      '<div class="row" style="gap:8px;margin-top:8px"><button class="btn" type="button" id="rb-jdgo">Check match</button>' + (d.jdKw ? '<button class="btn ghost" type="button" id="rb-jdclr">Clear</button>' : '') + '</div>' +
      (d.jdKw ? (j.length ? '<div class="rb-jdres"><b class="' + (pct >= 75 ? 'ok' : pct >= 50 ? 'mid' : 'lo') + '">' + pct + '% match</b><span>' + got.length + ' of ' + j.length + ' keywords from this post are in your resume.</span></div>' +
        '<p class="small"><b>Found:</b> ' + (got.map(function (k) { return '<span class="rb-chip ok">✓ ' + esc(k.label) + '</span>'; }).join(' ') || '–') + '</p>' +
        '<p class="small"><b>Missing:</b> ' + (j.filter(function (k) { return got.indexOf(k) < 0; }).map(function (k) { return '<span class="rb-chip">' + esc(k.label) + '</span>'; }).join(' ') || 'nothing. Excellent!') + '</p>' +
        '<p class="small muted">Aim for 75%+. Add a missing keyword where it is genuinely true: in Skills, or inside a project or internship bullet (that counts more than a bare list). Make a copy of this resume for each very different job.</p>'
        : note('warn', 'We could not find known software or skill keywords in this text. Paste the full description, including the requirements section.')) : '') + '</div>';
  }
  function stepFinal() {
    var s = score(), band = s.total >= 85 ? 'great' : s.total >= 70 ? 'good' : s.total >= 50 ? 'fair' : 'low';
    return '<h2>Your ATS score</h2><div class="rb-score ' + band + '"><b>' + s.total + '</b><span>/ 100</span><em>' + { great: 'Excellent: ready to send', good: 'Good: a few quick fixes left', fair: 'Fair: improve the points below', low: 'Needs work: follow the tips below' }[band] + '</em></div>' +
      '<div class="rb-parts">' + s.parts.map(function (p) { return '<div class="rb-part"><span>' + p[0] + '</span><i style="--w:' + Math.round(100 * p[1] / p[2]) + '%"></i><b>' + p[1] + '/' + p[2] + '</b></div>'; }).join('') + '</div>' +
      (s.miss.length ? note('warn', '<b>Missing keywords</b> (add only if true; otherwise learn them): ' + s.miss.slice(0, 10).map(function (k) { return '<span class="rb-chip">' + esc(k.label) + '</span>'; }).join(' ')) : '') +
      (s.tips.length ? '<h3>Quick fixes</h3><ul class="rb-tips">' + s.tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '') +
      '<h3>Boost your profile</h3><div class="rb-boost">' + boost().map(function (b) { return '<div><b>' + esc(b[0]) + '</b><p>' + esc(b[1]) + '</p></div>'; }).join('') + '</div>' +
      jdBox() +
      '<div class="rb-actions"><button class="btn" id="rb-pdf" type="button">⬇ Download PDF (ATS-friendly)</button><button class="btn" id="rb-docx" type="button">⬇ Download Word (.docx)</button><button class="btn ghost" id="rb-txt" type="button">Copy as plain text</button></div>' +
      '<p class="small muted">File name: <b>' + esc(fileName()) + '</b>. Send PDF by default; use Word only when a portal asks for .doc/.docx. Use “Copy as plain text” for forms that ask you to paste your resume.</p>';
  }

  /* ---------------- resume model (shared by preview, PDF and text) ---------------- */
  function model() {
    var t = track(), sec = [];
    var contact = [d.phone, d.email, d.city, d.linkedin, d.github, d.portfolio].filter(has);
    var edu = { h: 'Education', items: [{ a: d.degree + (has(d.branch) ? ' in ' + d.branch : ''), b: d.grad ? 'Expected ' + d.grad : '', c: d.college, dd: has(d.cgpa) ? 'CGPA: ' + d.cgpa : '' }] };
    if (has(d.x12)) edu.items.push({ a: 'Class 12 / Diploma', c: d.x12 }); if (has(d.x10)) edu.items.push({ a: 'Class 10', c: d.x10 });
    var tests = []; if (has(d.tests.gate)) tests.push('GATE score ' + d.tests.gate + (has(d.tests.gateAir) ? ' (AIR ' + d.tests.gateAir + ')' : '')); if (has(d.tests.cat)) tests.push('CAT ' + d.tests.cat + ' percentile'); if (has(d.tests.gre)) tests.push('GRE ' + d.tests.gre); if (has(d.tests.toefl)) tests.push('TOEFL ' + d.tests.toefl); if (has(d.tests.ielts)) tests.push('IELTS ' + d.tests.ielts);
    var skills = { h: 'Technical Skills', rows: [['Core', d.skTech], ['Software', d.skSoft], ['Other', d.skOther], ['Languages', d.langs]].filter(function (r) { return has(r[1]); }) };
    var exp = { h: 'Internships & Training', items: d.exp.filter(function (x) { return has(x.org) || has(x.role); }).map(function (x) { return { a: x.role, b: x.when, c: x.org, bl: lines(x.bullets) }; }) };
    var proj = { h: 'Projects', items: d.projects.filter(function (x) { return has(x.title); }).map(function (x) { return { a: x.title + (has(x.kind) ? ' (' + x.kind + ')' : ''), b: x.when, c: [x.tools ? 'Tools: ' + x.tools : '', x.link].filter(has).join(' | '), bl: lines(x.bullets) }; }) };
    var pubs = { h: 'Publications & Patents', items: d.pubs.filter(function (x) { return has(x.title); }).map(function (x) { return { a: x.title, b: x.year, c: x.venue }; }) };
    var ach = { h: 'Achievements', list: d.ach.map(function (x) { return x.text; }).filter(has).concat(lines(d.extra)) };
    var por = { h: 'Positions of Responsibility', items: d.por.filter(function (x) { return has(x.role) || has(x.org); }).map(function (x) { return { a: [x.role, x.org].filter(has).join(', '), b: x.when, bl: lines(x.text) }; }) };
    var cert = { h: 'Certifications', list: d.certs.filter(function (x) { return has(x.name); }).map(function (x) { return [x.name, x.org, x.year].filter(has).join(' - '); }) };
    var test = { h: 'Test Scores', list: tests };
    if (has(d.summary)) sec.push({ h: 'Summary', p: d.summary });
    if (t === 'academic') sec.push(edu, test, pubs, proj, exp, skills, ach, cert, por);
    else if (t === 'psu') sec.push(test, edu, skills, exp, proj, ach, cert, por, pubs);
    else sec.push(edu, skills, exp.items.length >= 1 ? exp : proj, exp.items.length >= 1 ? proj : exp, cert, ach, por, pubs, test);
    return { name: d.name || 'Your Name', contact: contact, sections: sec.filter(function (s) { return (s.items && s.items.length) || (s.list && s.list.length) || (s.rows && s.rows.length) || s.p; }) };
  }
  function previewHtml() {
    var m = model();
    return '<div class="rv-paper"><div class="rv-name">' + esc(m.name) + '</div><div class="rv-contact">' + m.contact.map(esc).join(' | ') + '</div>' +
      m.sections.map(function (s) {
        return '<div class="rv-h">' + esc(s.h.toUpperCase()) + '</div>' + (s.p ? '<p>' + esc(s.p) + '</p>' : '') +
          (s.rows ? s.rows.map(function (r) { return '<p><b>' + esc(r[0]) + ':</b> ' + esc(r[1]) + '</p>'; }).join('') : '') +
          (s.list ? '<ul>' + s.list.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
          (s.items ? s.items.map(function (x) { return '<div class="rv-it"><div class="rv-row"><b>' + esc(x.a) + '</b><span>' + esc(x.b || '') + '</span></div>' + (x.c ? '<div class="rv-row"><i>' + esc(x.c) + '</i><span>' + esc(x.dd || '') + '</span></div>' : '') + (x.bl && x.bl.length ? '<ul>' + x.bl.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' : '') + '</div>'; }).join('') : '');
      }).join('') + '</div>';
  }
  function plainText() {
    var m = model(), o = [m.name, m.contact.join(' | '), ''];
    m.sections.forEach(function (s) {
      o.push(s.h.toUpperCase());
      if (s.p) o.push(s.p);
      (s.rows || []).forEach(function (r) { o.push(r[0] + ': ' + r[1]); });
      (s.list || []).forEach(function (x) { o.push('- ' + x); });
      (s.items || []).forEach(function (x) { o.push([x.a, x.b].filter(has).join(' | ')); if (x.c) o.push([x.c, x.dd].filter(has).join(' | ')); (x.bl || []).forEach(function (b) { o.push('- ' + b); }); });
      o.push('');
    });
    return o.join('\n');
  }
  function fileName() { return (asc(d.name || 'Resume').replace(/[^A-Za-z0-9]+/g, '_') + '_Resume' + (d.role && kw ? '_' + asc(kw.role || '').split(/[ /(]/)[0] : '') + '.pdf').replace(/_+/g, '_'); }

  /* ---------------- PDF: real text, Helvetica, one column ---------------- */
  function loadPdf() {
    if (window.jspdf) return Promise.resolve();
    return new Promise(function (ok, bad) { var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'; s.onload = ok; s.onerror = bad; document.head.appendChild(s); });
  }
  function makePdf(m, compact) {
    var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    var L = 16, R = 194, W = R - L, y = 15, B = compact ? 9.5 : 10, LH = compact ? 4.3 : 4.6;
    doc.setProperties({ title: asc(m.name) + ' - Resume', author: asc(m.name), subject: 'Resume', creator: 'VKV Sir Test Lab' });
    function need(h) { if (y + h > 283) { doc.addPage(); y = 15; } }
    function txt(s, x, size, style, w) { doc.setFont('helvetica', style || 'normal'); doc.setFontSize(size); var ls = doc.splitTextToSize(asc(s), w || (R - x)); ls.forEach(function (l) { need(LH); doc.text(l, x, y); y += LH * size / 10; }); }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text(asc(m.name), 105, y, { align: 'center' }); y += 6.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    doc.splitTextToSize(asc(m.contact.join('  |  ')), W).forEach(function (l) { doc.text(l, 105, y, { align: 'center' }); y += 4.2; });
    y += 1.5;
    m.sections.forEach(function (s) {
      need(12); y += 2.2;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text(asc(s.h.toUpperCase()), L, y); y += 1.4;
      doc.setLineWidth(0.3); doc.line(L, y, R, y); y += 4.4;
      if (s.p) txt(s.p, L, B);
      (s.rows || []).forEach(function (r) { need(LH); doc.setFont('helvetica', 'bold'); doc.setFontSize(B); var lab = asc(r[0]) + ': '; doc.text(lab, L, y); var lw = doc.getTextWidth(lab); doc.setFont('helvetica', 'normal'); var ls = doc.splitTextToSize(asc(r[1]), W - lw); ls.forEach(function (l, i) { if (i) { need(LH); } doc.text(l, L + lw, y); y += LH; }); });
      (s.list || []).forEach(function (x) { need(LH); doc.setFont('helvetica', 'normal'); doc.setFontSize(B); doc.text('-', L + 1, y); var ls = doc.splitTextToSize(asc(x), W - 5); ls.forEach(function (l) { need(LH); doc.text(l, L + 5, y); y += LH; }); });
      (s.items || []).forEach(function (x) {
        need(LH * 2.5);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(B + 0.3); var dw = x.b ? doc.getTextWidth(asc(x.b)) + 4 : 0;
        doc.splitTextToSize(asc(x.a), W - dw).forEach(function (l, i) { if (i === 0 && x.b) { doc.setFont('helvetica', 'normal'); doc.text(asc(x.b), R, y, { align: 'right' }); doc.setFont('helvetica', 'bold'); } doc.text(l, L, y); y += LH; });
        if (x.c || x.dd) { doc.setFont('helvetica', 'italic'); doc.setFontSize(B); if (x.dd) { doc.setFont('helvetica', 'normal'); doc.text(asc(x.dd), R, y, { align: 'right' }); doc.setFont('helvetica', 'italic'); } doc.splitTextToSize(asc(x.c || ''), W - (x.dd ? doc.getTextWidth(asc(x.dd)) + 4 : 0)).forEach(function (l) { doc.text(l, L, y); y += LH; }); }
        (x.bl || []).forEach(function (b) { need(LH); doc.setFont('helvetica', 'normal'); doc.setFontSize(B); doc.text('-', L + 1, y); doc.splitTextToSize(asc(b), W - 5).forEach(function (l) { need(LH); doc.text(l, L + 5, y); y += LH; }); });
        y += 1.2;
      });
    });
    return doc;
  }
  function downloadPdf() {
    var b = document.getElementById('rb-pdf'); b.disabled = true; b.textContent = 'Preparing…';
    loadPdf().then(function () {
      var m = model(), doc = makePdf(m, false);
      if (doc.getNumberOfPages() === 2 && ['1', '2', '3', '4'].indexOf(String(d.yearNow)) >= 0 && track() !== 'academic') { var c = makePdf(m, true); if (c.getNumberOfPages() === 1) doc = c; }
      doc.save(fileName());
      V.toast(doc.getNumberOfPages() > 1 && track() !== 'academic' ? 'Downloaded (' + doc.getNumberOfPages() + ' pages). Freshers: try trimming to one page.' : 'Downloaded. Real-text PDF, ready for ATS.');
    }).catch(function () { V.toast('Could not load the PDF tool. Check your connection.'); })
      .finally(function () { b.disabled = false; b.textContent = '⬇ Download PDF (ATS-friendly)'; });
  }

  /* ---------------- Word (.docx): real text, single column, Calibri ---------------- */
  function loadDocx() {
    if (window.docx) return Promise.resolve();
    return new Promise(function (ok, bad) { var s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js'; s.onload = ok; s.onerror = bad; document.head.appendChild(s); });
  }
  function downloadDocx() {
    var b = document.getElementById('rb-docx'); b.disabled = true; b.textContent = 'Preparing…';
    loadDocx().then(function () {
      var X = window.docx, m = model(), P = [], FONT = 'Calibri', RIGHT = 10466; // twips across A4 text width (margins 0.6")
      function run(t, o) { o = o || {}; return new X.TextRun({ text: asc(t), font: FONT, size: o.size || 21, bold: !!o.bold, italics: !!o.italic }); }
      function line(left, right, o) { o = o || {}; var ch = [run(left, o)]; if (right) { ch.push(new X.TextRun({ text: '\t' + asc(right), font: FONT, size: 21 })); } return new X.Paragraph({ children: ch, tabStops: right ? [{ type: X.TabStopType.RIGHT, position: RIGHT }] : [], spacing: { after: o.after == null ? 20 : o.after } }); }
      P.push(new X.Paragraph({ alignment: X.AlignmentType.CENTER, spacing: { after: 40 }, children: [run(m.name, { size: 36, bold: true })] }));
      P.push(new X.Paragraph({ alignment: X.AlignmentType.CENTER, spacing: { after: 120 }, children: [run(m.contact.join('  |  '), { size: 19 })] }));
      m.sections.forEach(function (s) {
        P.push(new X.Paragraph({ children: [run(s.h.toUpperCase(), { size: 23, bold: true })], spacing: { before: 140, after: 60 }, border: { bottom: { style: X.BorderStyle.SINGLE, size: 6, color: '222222', space: 1 } } }));
        if (s.p) P.push(new X.Paragraph({ children: [run(s.p)], spacing: { after: 40 } }));
        (s.rows || []).forEach(function (r) { P.push(new X.Paragraph({ children: [new X.TextRun({ text: asc(r[0]) + ': ', font: FONT, size: 21, bold: true }), run(r[1])], spacing: { after: 20 } })); });
        (s.list || []).forEach(function (x) { P.push(new X.Paragraph({ children: [run(x)], bullet: { level: 0 }, spacing: { after: 10 } })); });
        (s.items || []).forEach(function (x) {
          P.push(line(x.a, x.b, { bold: true, size: 22 }));
          if (x.c || x.dd) P.push(line(x.c || '', x.dd, { italic: true }));
          (x.bl || []).forEach(function (bl) { P.push(new X.Paragraph({ children: [run(bl)], bullet: { level: 0 }, spacing: { after: 10 } })); });
          P.push(new X.Paragraph({ children: [], spacing: { after: 40 } }));
        });
      });
      var doc = new X.Document({ creator: 'VKV Sir Test Lab', title: asc(m.name) + ' - Resume', styles: { default: { document: { run: { font: FONT, size: 21 } } } },
        sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, children: P }] });
      return X.Packer.toBlob(doc).then(function (blob) {
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fileName().replace(/\.pdf$/, '.docx'); document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000); V.toast('Word file downloaded.');
      });
    }).catch(function () { V.toast('Could not create the Word file. Please try again.'); })
      .finally(function () { b.disabled = false; b.textContent = '⬇ Download Word (.docx)'; });
  }

  /* ---------------- render ---------------- */
  function drawSide() {
    var pv = document.getElementById('rb-prev'); if (pv) pv.innerHTML = previewHtml();
    var sc = document.getElementById('rb-mini'); if (sc) { var s = score(); sc.innerHTML = '<b>' + s.total + '</b>/100 ATS score'; sc.className = 'rb-mini ' + (s.total >= 85 ? 'great' : s.total >= 70 ? 'good' : s.total >= 50 ? 'fair' : 'low'); }
    if (step === 3 || step === 6) { var f = document.getElementById('rb-form'); if (f && f.dataset.k !== String(!!kw)) { f.dataset.k = String(!!kw); render(true); } }
  }
  function render(keepScroll) {
    var y = window.scrollY;
    var body = [stepGoal, stepBasics, stepEdu, stepSkills, stepProj, stepAch, stepFinal][step]();
    document.getElementById('rb-steps').innerHTML = STEPS.map(function (s, i) { return '<button type="button" class="' + (i === step ? 'on' : i < step ? 'done' : '') + '" data-s="' + i + '"><i>' + (i + 1) + '</i><span>' + s + '</span></button>'; }).join('');
    var f = document.getElementById('rb-form');
    f.innerHTML = body + '<div class="rb-nav">' + (step ? '<button class="btn ghost" type="button" id="rb-back">← Back</button>' : '<span></span>') + (step < STEPS.length - 1 ? '<button class="btn" type="button" id="rb-next">Next: ' + STEPS[step + 1] + ' →</button>' : '') + '</div>';
    f.dataset.k = String(!!kw);
    wire(); drawSide();
    if (!keepScroll) document.getElementById('rb-top').scrollIntoView({ behavior: 'smooth', block: 'start' }); else window.scrollTo(0, y);
  }
  function wire() {
    var f = document.getElementById('rb-form');
    Array.prototype.forEach.call(f.querySelectorAll('input.in, textarea.in, select.in'), function (el) {
      el.addEventListener('input', function () { set(el.id, el.value); if (el.id === 'company') { clearTimeout(el._t); el._t = setTimeout(loadKw, 600); } persist(); drawSide(); });
      if (el.id === 'role') el.addEventListener('change', function () { set('role', el.value); persist(); loadKw(); });
      if (el.id === 'yearNow') el.addEventListener('change', function () { set('yearNow', el.value); persist(); });
    });
    Array.prototype.forEach.call(f.querySelectorAll('.rb-goal input'), function (c) {
      c.onchange = function () { d.goals = Array.prototype.filter.call(f.querySelectorAll('.rb-goal input'), function (x) { return x.checked; }).map(function (x) { return x.value; }); if (!d.goals.length) d.goals = ['private']; document.getElementById('rb-ginfo').innerHTML = goalInfo(); persist(); drawSide(); };
    });
    Array.prototype.forEach.call(f.querySelectorAll('.rb-add'), function (b) { b.onclick = function () { var k = b.dataset.k, t = { exp: { role: '', org: '', when: '', bullets: '' }, projects: { title: '', kind: '', tools: '', link: '', when: '', bullets: '' }, ach: { text: '' }, por: { role: '', org: '', when: '', text: '' }, certs: { name: '', org: '', year: '' }, pubs: { title: '', venue: '', year: '' } }[k]; d[k].push(t); persist(); render(true); }; });
    Array.prototype.forEach.call(f.querySelectorAll('.rb-del'), function (b) { b.onclick = function () { d[b.dataset.k].splice(+b.dataset.i, 1); persist(); render(true); }; });
    Array.prototype.forEach.call(f.querySelectorAll('textarea.in'), function (t) { t.addEventListener('focus', function () { lastArea = t; }); });
    Array.prototype.forEach.call(f.querySelectorAll('.rb-exb'), function (b) {
      b.onclick = function () {
        var r = (V.__roles || []).filter(function (x) { return x.id === d.role; })[0], fam = r && BULLETS[r.family] ? r.family : null;
        var text = (fam ? BULLETS[fam] : []).concat(BULLETS.General)[+b.dataset.b];
        var t = lastArea && document.body.contains(lastArea) && /\.bullets$|\.text$/.test(lastArea.id) ? lastArea : f.querySelector('textarea[id$=".bullets"]');
        if (!t) { V.toast('Add an internship or project first.'); return; }
        t.value = (t.value.trim() ? t.value.replace(/\s+$/, '') + '\n' : '') + text; set(t.id, t.value); persist(); drawSide(); t.focus();
        V.toast('Inserted. Now replace the [ ] parts with your real details.');
      };
    });
    var jb = document.getElementById('rb-jdgo'); if (jb) jb.onclick = checkJd;
    var jc = document.getElementById('rb-jdclr'); if (jc) jc.onclick = function () { d.jd = ''; d.jdKw = null; persist(); render(true); };
    var dx = document.getElementById('rb-docx'); if (dx) dx.onclick = downloadDocx;
    var nx = document.getElementById('rb-next'), bk = document.getElementById('rb-back');
    if (nx) nx.onclick = function () { step++; render(); };
    if (bk) bk.onclick = function () { step--; render(); };
    var pdf = document.getElementById('rb-pdf'); if (pdf) pdf.onclick = downloadPdf;
    var tx = document.getElementById('rb-txt'); if (tx) tx.onclick = function () { var t = plainText(); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { V.toast('Copied as plain text.'); }).catch(function () { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); V.toast('Copied as plain text.'); }); };
  }
  function shell(list) {
    V.h('<div class="rb" id="rb-top"><div class="rb-head"><div><p class="eyebrow">Free · No sign-up needed to download</p><h1>ATS Resume Builder</h1><p class="muted">One clean column, standard headings and a real-text PDF that applicant tracking systems can read, with keywords taken from real job posts.</p></div>' +
      '<div class="rb-headr"><span class="rb-mini" id="rb-mini"></span><span class="small muted" id="rb-saved">' + (V.session ? 'Saves to your account automatically' : 'Saved on this device · <a href="/login?next=/resume" data-link>Sign in</a> to keep it in your account') + '</span>' +
      (list && list.length ? '<select class="in" id="rb-pick">' + list.map(function (r) { return '<option value="' + r.id + '"' + (r.id === rid ? ' selected' : '') + '>' + esc(r.title || 'My resume') + (r.score != null ? ' · ' + r.score + '/100' : '') + '</option>'; }).join('') + '</select>' : '') +
      '<button class="btn ghost small" id="rb-new" type="button">+ New resume</button></div></div>' +
      '<nav class="rb-steps" id="rb-steps" aria-label="Steps"></nav><div class="rb-body"><div class="card rb-form" id="rb-form"></div><aside class="rb-side"><div class="rb-ptitle"><b>Live preview</b><span class="small muted">A4 · Helvetica · one column</span></div><div id="rb-prev"></div></aside></div></div>');
    document.getElementById('rb-steps').onclick = function (e) { var b = e.target.closest('button'); if (b) { step = +b.dataset.s; render(); } };
    document.getElementById('rb-new').onclick = function () { if (!confirm('Start a new resume? Your current one stays saved.')) return; d = blank(); rid = null; kw = null; step = 0; try { localStorage.setItem(LS, JSON.stringify(d)); } catch (e) {} render(); };
    var pk = document.getElementById('rb-pick'); if (pk) pk.onchange = function () { var r = list.filter(function (x) { return x.id === pk.value; })[0]; if (r) { rid = r.id; d = Object.assign(blank(), r.data); step = 0; loadKw(); render(); } };
    render(true); loadKw();
  }
  window.RB = {
    render: function (api) {
      V = api; V.setNav('career'); step = 0; rid = null;
      try { d = Object.assign(blank(), JSON.parse(localStorage.getItem(LS) || 'null') || {}); } catch (e) { d = blank(); }
      var roles = V.__roles ? Promise.resolve(V.__roles) : V.rpc('rb_roles').then(function (r) { V.__roles = r; return r; });
      var mine = V.session ? V.sb.from('resumes').select('id,title,score,data,updated_at').order('updated_at', { ascending: false }).then(function (r) { return r.data || []; }) : Promise.resolve([]);
      Promise.all([roles, mine]).then(function (rr) {
        var list = rr[1];
        if (list.length) { rid = list[0].id; d = Object.assign(blank(), list[0].data); }
        shell(list);
      }).catch(function () { shell([]); });
    }
  };
})();

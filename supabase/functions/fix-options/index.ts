// Background job: rewrite the three WRONG options of queued questions so that they are
//  - the same category/type as the correct answer (no person names in an animal question),
//  - similar in length and style to the correct answer (no "pick the longest" guessing),
//  - definitely wrong.
// The correct answer text and its position never change. Every change is logged in opt_fix_log.
// If the model thinks the keyed answer is wrong, the question is sent to Admin review instead.
// Called by pg_cron every 2 minutes with header x-job-token.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const PREF = (Deno.env.get("FIX_MODEL") ?? "gemini-3.5-flash-lite,gemini-flash-lite-latest,gemini-flash-latest").split(",");
const BATCH = 12, BUDGET_MS = 120_000;

let models: string[] | null = null;
async function pickModels(): Promise<string[]> {
  if (models) return models;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${GEMINI_KEY}`, { signal: AbortSignal.timeout(5000) });
    const names: string[] = ((await r.json()).models || [])
      .filter((m: { supportedGenerationMethods?: string[] }) => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m: { name: string }) => m.name.replace(/^models\//, ""))
      .filter((n: string) => /flash/i.test(n) && !/(image|tts|audio|live|exp|preview)/i.test(n));
    names.sort((a, b) => (Number(/lite/.test(a)) - Number(/lite/.test(b))) || b.localeCompare(a, undefined, { numeric: true }));
    models = [...PREF.filter((m) => names.includes(m)), ...names].slice(0, 3);
  } catch (_) { models = PREF; }
  return models.length ? models : PREF;
}
let lastModel = "";
async function gemini(prompt: string): Promise<{ text: string | null; quota: boolean }> {
  let quota = false;
  for (const m of await pickModels()) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${GEMINI_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(60_000),
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, responseMimeType: "application/json" } }),
      });
      if (r.status === 429) { quota = true; continue; }
      if (!r.ok) { console.log("gemini", m, r.status, (await r.text()).slice(0, 150)); continue; }
      const t = (await r.json())?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (t) { lastModel = m; return { text: t, quota: false }; }
    } catch (e) { console.log("gemini", m, String(e).slice(0, 100)); }
  }
  return { text: null, quota };
}

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
const isNumeric = (s: string) => /^[\s₹$~≈±\-−]*[\d.,]/.test(s);

Deno.serve(async (req) => {
  const sb = createClient(SB_URL, SB_SERVICE, { auth: { persistSession: false } });
  const { data: tok } = await sb.from("job_tokens").select("token").eq("name", "fix-options").maybeSingle();
  if (!tok || req.headers.get("x-job-token") !== tok.token) return new Response("forbidden", { status: 403 });
  if (!GEMINI_KEY) return new Response("no key", { status: 503 });

  const t0 = Date.now(); let done = 0, flagged = 0, skipped = 0, quotaHit = false;
  while (Date.now() - t0 < BUDGET_MS && !quotaHit) {
    const { data: claim } = await sb.rpc("opt_fix_claim", { p_n: BATCH });
    if (!claim?.length) break;
    const ids = claim.map((c: { question_id: string }) => c.question_id);
    const { data: qs } = await sb.from("questions").select("id,subject_id,unit_name,subtopic,body,options,correct").in("id", ids);
    const items = (qs || []).map((q: { id: string; subject_id: string; unit_name: string; subtopic: string; body: string; options: string[]; correct: number }) => ({
      id: q.id, subject: `${q.subject_id} · ${q.unit_name} · ${q.subtopic}`, question: q.body,
      answer: q.options[q.correct], current_wrong: q.options.filter((_, k) => k !== q.correct),
    }));
    const prompt = `You improve multiple-choice questions for Indian exam students (SSC, railway, state exams, GATE, engineering).
For EACH item write exactly 3 NEW wrong options. Strict rules:
1. Same category and type as the correct answer: if the answer is an animal, all options are animals; a person -> persons from the same field and era; a year -> nearby years; an article -> other articles; a formula -> similar formulas; a place -> places of the same kind; a definition -> definitions from the same topic.
2. Each wrong option must be clearly and definitely wrong for this question. Never partially correct, never a synonym or another valid answer (e.g. for "5 years" do not offer another post whose term is also 5 years). Write complete phrases; never cut words to fit a length. No "All/None of the above".
3. Similar length (within about 20% of the answer's characters) and the same style, units, capitalisation and level of detail, so length or style never gives the answer away.
4. Plausible to a weak student; related to the question's topic; nothing silly, offensive or controversial; no real living persons unless the question is about persons.
5. Names and proper nouns (persons, teams, places, books, organisations): use only REAL entities with their full, correct, standard spelling. Never truncate, abbreviate, add suffixes like "XI", or invent names to match length. Pick real entities whose names happen to be of similar length instead.
6. Every wrong option must differ from the current wrong options where those are weak (wrong category, much shorter/longer); keep a current wrong option only if it already follows all rules.
7. Do NOT change the correct answer. Also check it: set "answer_ok": false (with a short "note") only if you are SURE the given answer is factually wrong. If the question is about events after your knowledge, assume the answer is right.
Return JSON only: [{"id":"...","answer_ok":true,"note":"","wrong":["...","...","..."]}, ...]
Items: ${JSON.stringify(items)}`;
    const g = await gemini(prompt);
    if (!g.text) {
      quotaHit = g.quota;
      await sb.from("opt_fix_queue").update({ status: "pending", updated_at: new Date().toISOString() }).in("question_id", ids);
      break;
    }
    let out: { id: string; answer_ok: boolean; note?: string; wrong: string[] }[] = [];
    try { out = JSON.parse(g.text.replace(/^```json|```$/g, "").trim()); } catch (_) { out = []; }
    const byId = new Map(out.map((o) => [o.id, o]));
    for (const it of items) {
      const o = byId.get(it.id);
      const queueRow = claim.find((c: { question_id: string; tries: number }) => c.question_id === it.id);
      const retry = async (why: string) => {
        await sb.from("opt_fix_queue").update({ status: (queueRow?.tries ?? 1) >= 3 ? "skipped" : "pending", note: why, updated_at: new Date().toISOString() }).eq("question_id", it.id);
        skipped++;
      };
      if (!o || !Array.isArray(o.wrong)) { await retry("no output"); continue; }
      if (o.answer_ok === false && !it.subject.startsWith("CA ")) {
        await sb.from("questions").update({ status: "review", review_reason: "AI check: keyed answer may be wrong — " + String(o.note || "").slice(0, 200) }).eq("id", it.id);
        await sb.from("opt_fix_queue").update({ status: "flagged", note: String(o.note || "").slice(0, 300), updated_at: new Date().toISOString() }).eq("question_id", it.id);
        flagged++; continue;
      }
      const w = o.wrong.map((s) => String(s).trim()).filter(Boolean);
      const a = it.answer;
      const keys = new Set([norm(a)]);
      const okDistinct = w.length === 3 && w.every((s) => { const k = norm(s); if (!k || keys.has(k)) return false; keys.add(k); return true; });
      const maxW = Math.max(...w.map((s) => s.length)), minW = Math.min(...w.map((s) => s.length));
      const isName = /^[A-Z][\p{L}.'’\- ]*$/u.test(a) && !/\d/.test(a);
      const okLen = isName
        ? a.length <= Math.max(maxW * 1.4, maxW + 8) && minW >= Math.min(a.length * 0.4, a.length - 10)
        : a.length <= Math.max(maxW * 1.2, maxW + 4) && minW >= Math.min(a.length * 0.5, a.length - 6);
      const minA = Math.min(...w.map((s) => s.length));
      const okShort = a.length >= Math.min(minA * 0.6, minA - 8); // answer must not stand out as the shortest either
      const TAIL = /\s(a|an|the|of|on|in|at|by|for|to|with|and|or|from|[A-Za-z])$/i;
      const okCut = TAIL.test(a) || w.every((s) => !TAIL.test(s)); // no cut-off endings like "Muslim League in D"
      if (!okShort) { await retry("answer now shortest"); continue; }
      if (!okCut) { await retry("cut-off option"); continue; }
      const okKind =isNumeric(a) === w.every(isNumeric) || !isNumeric(a);
      if (!okDistinct) { await retry("duplicate or equal to answer"); continue; }
      if (!okLen) { await retry("length still gives it away"); continue; }
      if (!okKind) { await retry("different kind of option"); continue; }
      const { data: applied } = await sb.rpc("opt_fix_apply", { p_id: it.id, p_wrong: w, p_model: lastModel });
      if (applied) done++; else await retry("apply failed");
    }
  }
  const res = { done, flagged, skipped, quotaHit, ms: Date.now() - t0, model: lastModel };
  console.log("fix-options", JSON.stringify(res));
  return new Response(JSON.stringify(res), { headers: { "Content-Type": "application/json" } });
});

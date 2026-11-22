// Live question translation for VKV Sir Test Lab.
// Input: { attempt: uuid, idx: number, lang: "hi" | "mr" | ... }
// Output: { ok, lang, body, options (in the attempt's displayed order), engine, cached }
// Rules: English stays primary; numbers/units/symbols/formulas never change; technical terms are
// transliterated into the target script (load -> लोड) unless listed as a common word; simple language.
// Engines: Microsoft Translator (draft, returned at once) + Gemini (background reviewer).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MS_KEY = Deno.env.get("MS_TRANSLATOR_KEY") ?? "";
const MS_REGION = Deno.env.get("MS_TRANSLATOR_REGION") ?? "";
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_MODELS = (Deno.env.get("GEMINI_MODEL") ?? "gemini-flash-latest").split(",");

const LANGS: Record<string, { name: string; script?: string }> = {
  hi: { name: "Hindi", script: "Deva" }, mr: { name: "Marathi", script: "Deva" }, bn: { name: "Bengali", script: "Beng" },
  ta: { name: "Tamil", script: "Taml" }, te: { name: "Telugu", script: "Telu" }, gu: { name: "Gujarati", script: "Gujr" },
  kn: { name: "Kannada", script: "Knda" }, ml: { name: "Malayalam", script: "Mlym" }, pa: { name: "Punjabi", script: "Guru" },
  or: { name: "Odia", script: "Orya" }, as: { name: "Assamese", script: "Beng" }, ur: { name: "Urdu", script: "Arab" },
  ne: { name: "Nepali", script: "Deva" },
  es: { name: "Spanish" }, fr: { name: "French" }, de: { name: "German" }, ar: { name: "Arabic", script: "Arab" },
  ru: { name: "Russian" }, pt: { name: "Portuguese" }, "zh-Hans": { name: "Chinese (Simplified)" }, ja: { name: "Japanese" },
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const unesc = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

const PROTECT = new RegExp([
  String.raw`\$\$[\s\S]+?\$\$`, String.raw`\$[^$]+\$`,
  // whole plain-text equations: P = 2πNT/60, x + 1/x = 5, a × b ÷ c, A ≥ B
  String.raw`[\p{L}\p{N}₀-₉⁰-⁹()'.]+(?:\s*(?:[=+×÷/<>≤≥≈∝^]|\s[-−]\s)\s*[\p{L}\p{N}₀-₉⁰-⁹()'.]+)+`,
  // function-style terms: sin(θ), printf(), f(x) — but not plural markers like line(s)
  String.raw`\b[A-Za-z_]\w*\((?!s\)|es\))[^)]*\)\s*;?`,
  // quoted code/strings: "%d", '\n'
  String.raw`"[^"\s]*%[^"]*"|'\\?.'`,
  // single-letter variables (h, x, W, L) — except the words "a", "A", "I"
  String.raw`(?<![\p{L}\p{N}'’])(?<!\p{L}\()(?![aAI](?![\p{L}\p{N}]))[A-Za-z](?![\p{L}\p{N}'’])`,
  // any token carrying math characters: WL³/3EI, πd⁴/64, T₁, m·s⁻¹
  String.raw`[^\s,;:!?"“”()]*[²³⁴⁰¹⁵⁶⁷⁸⁹⁻⁺₀-₉√∝∠·^][^\s,;:!?"“”()]*`,
  String.raw`₹\s?[\d,]+(?:\.\d+)?(?:\s?(?:lakh|crore|thousand))?`,
  String.raw`\b\d[\d,]*(?:\.\d+)?(?:\s?(?:%|°C|°F|°|km\/h|kmph|kWh|kW|MW|GW|kVA|MVA|kV|mV|mA|μA|μF|kN|MN|kJ|MJ|GJ|kcal|cal|GPa|TPa|MPa|kPa|Pa|rpm|rps|TR|dB|mol|lux|Wb|kg|km|cm|mm|nm|μm|mg|ml|Hz|kHz|MHz|GHz|MeV|eV|bar|atm|min|m|g|L|W|V|A|Ω|N|J|K|D|s|h|T|H|F|C)(?:[·\/](?:kg|km|cm|mm|min|m|s|h|K|N|J|W|kW|mol|rev|L)[²³⁴]?(?:⁻¹)?)*[²³⁴]?)?(?![\w])`,
  String.raw`\b(?:[A-Z][a-z]?[₀-₉0-9]*){2,}\b`,
  String.raw`[≤≥≠≈±×÷√∞∑∫πΩθαβγδλμσφω→←↑↓∴∵°]+`,
].join("|"), "gu");

// words: technical terms (transliterated) and approved common words, merged and applied longest-first,
// so "square-threaded screw" wins over the common word "square".
function prepare(text: string, words: { re: RegExp; out: string }[]): string {
  const keeps: string[] = [];
  let t = text;
  t = t.replace(PROTECT, (m) => { keeps.push(m); return `\u0000${keeps.length - 1}\u0000`; });
  for (const w of words) t = t.replace(w.re, () => { keeps.push(w.out); return `\u0000${keeps.length - 1}\u0000`; });
  return esc(t).replace(/\u0000(\d+)\u0000/g, (_, i) => `<span class="notranslate">${esc(keeps[+i])}</span>`);
}
// Translators often drop the space between a protected span and the translated word ("9 kNउठाता").
// Re-insert a space only where Latin letters/digits touch Indian-script or Arabic letters; never inside symbols.
const NATIVE = "\\u0900-\\u0DFF\\u0600-\\u06FF";
const finish = (s: string) => unesc(s
  .replace(new RegExp(`<span class="notranslate">([^<]*[${NATIVE}][^<]*)<\\/span>`, "g"), " $1 ") // transliterated terms: keep word gaps
  .replace(/<span class="notranslate">([\s\S]*?)<\/span>/g, "$1"))
  .replace(new RegExp(`([A-Za-z0-9%°²³⁴)\\]$\\u0370-\\u03FF])(?=[${NATIVE}])`, "g"), "$1 ")
  .replace(new RegExp(`([${NATIVE}])(?=[A-Za-z0-9(₹$\\[\\u0370-\\u03FF])`, "g"), "$1 ")
  .replace(/\s+/g, " ").trim();

async function msTranslate(texts: string[], to: string): Promise<string[]> {
  const r = await fetch(`https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=${to}&textType=html`, {
    method: "POST", signal: AbortSignal.timeout(10000),
    headers: { "Ocp-Apim-Subscription-Key": MS_KEY, "Ocp-Apim-Subscription-Region": MS_REGION, "Content-Type": "application/json" },
    body: JSON.stringify(texts.map((Text) => ({ Text }))),
  });
  if (!r.ok) throw new Error("ms " + r.status + " " + (await r.text()).slice(0, 200));
  const j = await r.json();
  return j.map((x: { translations: { text: string }[] }) => x.translations[0].text);
}
async function msTransliterate(words: string[], lang: string, script: string): Promise<string[]> {
  if (!words.length) return [];
  try {
    const r = await fetch(`https://api.cognitive.microsofttranslator.com/transliterate?api-version=3.0&language=${lang}&fromScript=Latn&toScript=${script}`, {
      method: "POST", signal: AbortSignal.timeout(8000),
      headers: { "Ocp-Apim-Subscription-Key": MS_KEY, "Ocp-Apim-Subscription-Region": MS_REGION, "Content-Type": "application/json" },
      body: JSON.stringify(words.map((Text) => ({ Text }))),
    });
    if (!r.ok) return words;
    const j = await r.json();
    return j.map((x: { text: string }, i: number) => x?.text || words[i]);
  } catch (_) { return words; }
}

let geminiErr = "";
let discovered: string[] | null = null;
// Model names change often; ask Google which Flash models support generateContent and prefer the newest.
async function geminiModels(): Promise<string[]> {
  if (discovered) return discovered;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${GEMINI_KEY}`, { signal: AbortSignal.timeout(5000) });
    const j = await r.json();
    const names: string[] = (j.models || [])
      .filter((m: { name: string; supportedGenerationMethods?: string[] }) => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m: { name: string }) => m.name.replace(/^models\//, ""))
      .filter((n: string) => /flash/i.test(n) && !/(image|tts|audio|live|thinking|exp|preview)/i.test(n));
    // Prefer "lite" (fast) variants first, newest version first.
    names.sort((a, b) => (Number(/lite/.test(b)) - Number(/lite/.test(a))) || b.localeCompare(a, undefined, { numeric: true }));
    discovered = [...GEMINI_MODELS.map((m) => m.trim()).filter((m) => names.includes(m)), ...names].slice(0, 3);
    console.log("gemini models", JSON.stringify(discovered));
  } catch (e) { console.log("gemini list failed", String(e)); discovered = GEMINI_MODELS; }
  return discovered.length ? discovered : GEMINI_MODELS;
}
async function gemini(prompt: string): Promise<string | null> {
  if (!GEMINI_KEY) { geminiErr = "no GEMINI_API_KEY"; return null; }
  for (const model of await geminiModels()) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model.trim()}:generateContent?key=${GEMINI_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(20000),
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, responseMimeType: "application/json" } }),
      });
      if (!r.ok) { geminiErr = `${model} ${r.status} ${(await r.text()).slice(0, 160)}`; console.log("gemini", geminiErr); continue; }
      const j = await r.json();
      const t = j?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (t) { console.log("gemini ok", model); return t; }
      geminiErr = `${model} empty`;
    } catch (e) { geminiErr = `${model} ${String(e).slice(0, 120)}`; console.log("gemini", geminiErr); }
  }
  return null;
}

// Every fixed token (numbers, formulas, units…) of the English must survive in the output.
function keepsFixed(english: string, out: string): boolean {
  const toks = english.match(PROTECT) || [];
  return toks.every((t) => out.includes(t.replace(/\s+/g, " ").trim()) || out.replace(/\s+/g, "").includes(t.replace(/\s+/g, "")));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { attempt, idx, lang, debug } = await req.json();
    if (!attempt || typeof idx !== "number" || !LANGS[lang]) return json({ ok: false, error: "bad request" }, 400);
    const sb = createClient(SB_URL, SB_SERVICE, { auth: { persistSession: false } });

    const { data: at } = await sb.from("attempts").select("items").eq("id", attempt).maybeSingle();
    const it = at?.items?.[idx];
    if (!it?.q) return json({ ok: false, error: "not found" }, 404);
    const order: number[] = (it.o || [0, 1, 2, 3]).map((x: string | number) => +x);

    const { data: q } = await sb.from("questions").select("id,subject_id,body,options,version,exam_ref").eq("id", it.q).maybeSingle();
    if (!q) return json({ ok: false, error: "not found" }, 404);
    const { data: en } = await sb.from("tr_subjects").select("enabled").eq("subject_id", q.subject_id).maybeSingle();
    if (!en?.enabled && !debug) return json({ ok: false, enabled: false });

    const reorder = (opts: string[]) => order.map((k) => opts[k]);

    const { data: c } = await sb.from("q_translations").select("body,options,engine,status,version").eq("question_id", q.id).eq("lang", lang).maybeSingle();
    if (c && c.version === q.version && c.status !== "hidden" && !debug) return json({ ok: true, lang, body: c.body, options: reorder(c.options), engine: c.engine, cached: true });
    if (!MS_KEY) return json({ ok: false, error: "translator not configured" }, 503);

    const L = LANGS[lang];
    const body = q.body + (q.exam_ref ? ` (${q.exam_ref})` : "");
    const texts = [body, ...q.options];

    // Word lists: technical terms (pre-transliterated) and approved common words.
    const [{ data: termRows }, { data: commonRows }] = await Promise.all([
      sb.from("tr_terms").select("term,subjects"), sb.from("tr_common").select("term,translation").eq("lang", lang),
    ]);
    const reEsc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // A term with a subject list (e.g. "column" for SOM/ENM) applies only to those subjects.
    const present = (termRows || []).filter((r: { subjects: string[] | null }) => !r.subjects || r.subjects.includes(q.subject_id))
      .map((r: { term: string }) => r.term)
      .filter((t: string) => texts.some((x) => new RegExp(`\\b${reEsc(t)}(?:s|es)?\\b`, "i").test(x)))
      .sort((a: string, b: string) => b.length - a.length);
    const translit = L.script && L.script !== "Latn" ? await msTransliterate(present, lang, L.script) : present;
    const words = [
      ...present.map((t: string, i: number) => ({ term: t, out: translit[i] })),
      ...(commonRows || []).map((r: { term: string; translation: string }) => ({ term: r.term, out: r.translation })),
    ].sort((a, b) => b.term.length - a.term.length)
      .map((w) => ({ re: new RegExp(`\\b${reEsc(w.term)}(?:s|es)?\\b`, "gi"), out: w.out }));

    // 1) Microsoft draft with protected spans; a line that lost a number/formula falls back to English.
    const draft = (await msTranslate(texts.map((t) => prepare(t, words)), lang)).map(finish)
      .map((s, i) => (keepsFixed(texts[i], s) ? s : texts[i]));
    const save = (lines: string[], eng: string) => debug ? Promise.resolve() : sb.from("q_translations").upsert(
      { question_id: q.id, lang, version: q.version, body: lines[0], options: lines.slice(1), engine: eng, status: "auto", reports: 0, updated_at: new Date().toISOString() },
      { onConflict: "question_id,lang" });
    await save(draft, "microsoft");

    // 2) Gemini review (background): writes the final version from English + draft, following the rules.
    const glossary = present.map((t: string, i: number) => `${t} → ${translit[i]}`).join("; ");
    const prompt = `You are translating a multiple-choice exam question from English into ${L.name} for Indian competitive-exam students.
Rules:
1. Use simple, everyday ${L.name} that a school student understands. Avoid heavy literary or Sanskritised words.
2. Technical terms, scheme names, acronyms and proper nouns must NOT be translated. Write them phonetically in the ${L.name} script as given in this glossary: ${glossary || "(none)"}. Acronyms like GDP, ISRO, NaCl stay in English letters.
3. Never change numbers, units, symbols, formulas, equations, variable letters, dates, ₹ amounts or anything between $ signs. Copy them exactly, using the same digits 0-9.
4. Keep the meaning exactly; do not add or remove information. Keep the same number of options in the same order.
5. Return JSON only: {"body": "...", "options": ["...","...","...","..."]}.
English question: ${JSON.stringify(body)}
English options: ${JSON.stringify(q.options)}
Machine draft (may contain mistakes): ${JSON.stringify({ body: draft[0], options: draft.slice(1) })}`;
    const review = async () => {
      const g = await gemini(prompt);
      if (!g) return { applied: false, why: geminiErr };
      try {
        const p = JSON.parse(g.replace(/^```json|```$/g, "").trim());
        const cand = [String(p.body || ""), ...(p.options || []).map(String)];
        if (cand.length !== texts.length || cand.some((s) => !s)) return { applied: false, why: "shape" };
        if (!texts.every((t, i) => keepsFixed(t, cand[i]))) return { applied: false, why: "changed a number/formula", cand };
        await save(cand, "microsoft+gemini");
        return { applied: true, cand };
      } catch (e) { return { applied: false, why: "json " + String(e).slice(0, 80) }; }
    };
    if (debug) {
      const r = debug === "draft" ? null : await review();
      return json({ ok: true, lang, english: texts, draft, review: r, models: discovered, cached: false });
    }
    // deno-lint-ignore no-explicit-any
    (globalThis as any).EdgeRuntime?.waitUntil(review());
    return json({ ok: true, lang, body: draft[0], options: reorder(draft.slice(1)), engine: "microsoft", cached: false });
  } catch (e) {
    return json({ ok: false, error: String((e as Error).message || e).slice(0, 300) }, 500);
  }
});

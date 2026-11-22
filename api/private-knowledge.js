const DB = "PRIVATE_KNOWLEDGE_DB";
const COOKIE = "astro_private_owner";
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const now = () => Math.floor(Date.now() / 1000);
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers }
});
const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const unb64 = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
const hex = bytes => [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, "0")).join("");
async function sha(value) { return hex(await crypto.subtle.digest("SHA-256", encoder.encode(value))); }
function randomToken(size = 32) { const bytes = new Uint8Array(size); crypto.getRandomValues(bytes); return b64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""); }
async function passwordHash(password, salt) {
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: unb64(salt), iterations: 310000, hash: "SHA-256" }, material, 256);
  return hex(bits);
}
function constantEqual(a, b) {
  a = String(a || ""); b = String(b || "");
  if (a.length !== b.length) return false;
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function getCookie(request) {
  const raw = request.headers.get("Cookie") || "";
  const match = raw.match(new RegExp("(?:^|;\\s*)" + COOKIE + "=([^;]+)"));
  return match ? decodeURIComponent(match[1]) : "";
}
async function ownerSession(request, db) {
  const token = getCookie(request);
  if (!token) return false;
  const tokenHash = await sha(token);
  const row = await db.prepare("SELECT expires_at FROM owner_sessions WHERE token_hash = ?").bind(tokenHash).first();
  if (!row || Number(row.expires_at) < now()) {
    if (row) await db.prepare("DELETE FROM owner_sessions WHERE token_hash = ?").bind(tokenHash).run();
    return false;
  }
  return true;
}
async function issueSession(db) {
  const token = randomToken();
  const expires = now() + 43200;
  await db.prepare("INSERT INTO owner_sessions (token_hash, expires_at, created_at) VALUES (?, ?, ?)").bind(await sha(token), expires, now()).run();
  return { token, cookie: COOKIE + "=" + encodeURIComponent(token) + "; Path=/api/private-knowledge; Max-Age=43200; Secure; HttpOnly; SameSite=Strict" };
}
function cookieClear() { return COOKIE + "=; Path=/api/private-knowledge; Max-Age=0; Secure; HttpOnly; SameSite=Strict"; }
async function encryptionKey(env) {
  const raw = String(env.ASTRO_PRIVATE_KNOWLEDGE_KEY || "");
  if (!raw) throw new Error("Private knowledge encryption key missing");
  return crypto.subtle.importKey("raw", unb64(raw), { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
async function encryptRecord(record, env) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await encryptionKey(env);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(JSON.stringify(record)));
  return { cipher: b64(cipher), iv: b64(iv) };
}
async function decryptRecord(row, env) {
  const key = await encryptionKey(env);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(row.content_iv) }, key, unb64(row.content_cipher));
  return JSON.parse(decoder.decode(plain));
}
function languageOf(question, requested) {
  if (requested && /^(en|en-|english)/i.test(requested)) return "en";
  if (requested && /^(hi|hindi)/i.test(requested)) return "hi";
  return /[\u0900-\u097f]/.test(question) ? "hi" : "en";
}
const bilingual = [
  [/\b(marriage|marry|married|wedding|spouse|husband|wife|partner|relationship|love)\b/i, "विवाह शादी जीवनसाथी पति पत्नी प्रेम संबंध"],
  [/\b(career|job|profession|work|business|employment)\b/i, "करियर नौकरी व्यवसाय काम रोजगार"],
  [/\b(money|wealth|finance|income|earning|property|assets)\b/i, "धन पैसा आर्थिक आय कमाई संपत्ति"],
  [/\b(health|illness|disease|medical|sickness)\b/i, "स्वास्थ्य बीमारी रोग चिकित्सा"],
  [/\b(child|children|baby|pregnancy|progeny)\b/i, "संतान बच्चा बच्चे गर्भ"],
  [/\b(education|study|exam|school|college)\b/i, "शिक्षा पढ़ाई परीक्षा अध्ययन"],
  [/\b(foreign|abroad|overseas|migration|immigration)\b/i, "विदेश यात्रा प्रवास"],
  [/\b(family|mother|father|parents|home)\b/i, "परिवार माता पिता घर"],
  [/\b(divorce|separation|breakup|離婚)\b/i, "तलाक अलगाव अलग रहना"],
  [/\b(saturn|jupiter|mars|venus|mercury|moon|sun|rahu|ketu)\b/i, "शनि बृहस्पति गुरु मंगल शुक्र बुध चंद्र सूर्य राहु केतु"]
];
function termsFor(question) {
  const q = String(question || "").normalize("NFKC").toLowerCase();
  const expanded = [q];
  for (const [re, words] of bilingual) if (re.test(q)) expanded.push(words);
  return [...new Set(expanded.join(" ").match(/[\p{L}\p{N}]+/gu) || [])].filter(w => w.length > 1);
}
function fourLines(text) {
  const clean = String(text || "").replace(/\r/g, "").trim();
  if (!clean) return "";
  let lines = clean.split("\n").map(x => x.trim()).filter(Boolean);
  if (lines.length === 1) lines = clean.split(/(?<=[.!?।])\s+/).map(x => x.trim()).filter(Boolean);
  return lines.slice(0, 4).join("\n");
}
async function findAnswer(question, language, env) {
  const db = env[DB];
  if (!db || !String(question || "").trim()) return null;
  const rows = await db.prepare("SELECT id, content_cipher, content_iv FROM private_knowledge ORDER BY updated_at DESC LIMIT 1000").all();
  const terms = termsFor(question);
  if (!terms.length) return null;
  const scored = [];
  for (const row of rows.results || []) {
    let note;
    try { note = await decryptRecord(row, env); } catch { continue; }
    const searchable = [note.title, note.category, note.content, note.contentEn].join(" ").normalize("NFKC").toLowerCase();
    let score = 0;
    for (const term of terms) if (searchable.includes(term)) score += term.length > 4 ? 3 : 1;
    if (score > 0) scored.push({ note, score });
  }
  scored.sort((a, b) => b.score - a.score);
  if (!scored.length || scored[0].score < 2) return null;
  const note = scored[0].note;
  const english = language === "en";
  const text = english ? String(note.contentEn || "") : String(note.content || "");
  if (english && !text.trim()) return { translationMissing: true, answer: "", title: note.title || "" };
  return { translationMissing: false, answer: fourLines(text), title: note.title || "" };
}
export async function privateKnowledgeAnswer(question, language, env) {
  return findAnswer(question, language, env);
}
export default async function handlePrivateKnowledge(request, env = {}) {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin") || "";
  const allowed = new Set(["https://astrobhagyavidhaata.in", "https://www.astrobhagyavidhaata.in", "https://astrobhagyavidhaata.info", "https://www.astrobhagyavidhaata.info"]);
  if (origin && !allowed.has(origin)) return json({ success: false, message: "Origin not allowed" }, 403);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Credentials": "true", "Vary": "Origin" } });
  const db = env[DB];
  if (!db) return json({ success: false, message: "Private database is not connected yet." }, 503);
  const action = url.searchParams.get("action") || "";
  if (request.method === "GET" && action === "status") {
    const row = await db.prepare("SELECT id FROM owner_auth WHERE id = 1").first();
    return json({ success: true, initialized: Boolean(row) });
  }
  if (request.method === "POST") {
    let body;
    try { body = await request.json(); } catch { return json({ success: false, message: "Invalid request." }, 400); }
    if (action === "answer") {\n      const result = await findAnswer(String(body.question || ""), String(body.language || "en"), env);\n      if (!result) return json({ success: true, matched: false });\n      return json({ success: true, matched: true, ...result });\n    }\n    if (action === "setup") {
      const exists = await db.prepare("SELECT id FROM owner_auth WHERE id = 1").first();
      if (exists) return json({ success: false, message: "Owner password is already set. Please log in." }, 409);
      const bootstrap = await db.prepare("SELECT token_hash FROM private_bootstrap WHERE id = 1").first();
      if (!bootstrap || !constantEqual(await sha(String(body.setupCode || "")), bootstrap.token_hash)) return json({ success: false, message: "Setup code is incorrect." }, 403);
      const password = String(body.password || "");
      if (password.length < 12 || password.length > 128) return json({ success: false, message: "पासवर्ड कम-से-कम 12 अक्षरों का रखें।" }, 400);
      const saltBytes = crypto.getRandomValues(new Uint8Array(16));
      const salt = b64(saltBytes);
      const hash = await passwordHash(password, salt);
      await db.prepare("INSERT INTO owner_auth (id, password_salt, password_hash, created_at) VALUES (1, ?, ?, ?)").bind(salt, hash, now()).run();
      await db.prepare("DELETE FROM private_bootstrap WHERE id = 1").run();
      const session = await issueSession(db);
      return json({ success: true, message: "पासवर्ड सुरक्षित रूप से सेट हो गया।" }, 200, { "Set-Cookie": session.cookie });
    }
    if (action === "login") {
      const row = await db.prepare("SELECT password_salt, password_hash FROM owner_auth WHERE id = 1").first();
      if (!row) return json({ success: false, message: "पहले निजी ज्ञान का पासवर्ड सेट करें।" }, 409);
      const supplied = await passwordHash(String(body.password || ""), row.password_salt);
      if (!constantEqual(supplied, row.password_hash)) return json({ success: false, message: "पासवर्ड गलत है।" }, 401);
      const session = await issueSession(db);
      return json({ success: true, message: "लॉगिन सफल।" }, 200, { "Set-Cookie": session.cookie });
    }
    if (action === "logout") {
      const token = getCookie(request);
      if (token) await db.prepare("DELETE FROM owner_sessions WHERE token_hash = ?").bind(await sha(token)).run();
      return json({ success: true }, 200, { "Set-Cookie": cookieClear() });
    }
    if (!(await ownerSession(request, db))) return json({ success: false, message: "लॉगिन समाप्त है। दोबारा पासवर्ड डालें।" }, 401);
    if (action === "save") {
      const title = String(body.title || "").trim().slice(0, 160);
      const category = String(body.category || "").trim().slice(0, 80);
      const content = String(body.content || "").trim().slice(0, 30000);
      const contentEn = String(body.contentEn || "").trim().slice(0, 30000);
      if (!title || !content) return json({ success: false, message: "विषय और हिंदी ज्ञान दोनों भरें।" }, 400);
      const id = String(body.id || randomToken(12)).slice(0, 80);
      const existing = await db.prepare("SELECT id, created_at FROM private_knowledge WHERE id = ?").bind(id).first();
      const encrypted = await encryptRecord({ title, category, content, contentEn }, env);
      const stamp = now();
      await db.prepare("INSERT INTO private_knowledge (id, title, category, content_cipher, content_iv, content_en, created_at, updated_at) VALUES (?, '', '', ?, ?, '', ?, ?) ON CONFLICT(id) DO UPDATE SET content_cipher=excluded.content_cipher, content_iv=excluded.content_iv, updated_at=excluded.updated_at").bind(id, encrypted.cipher, encrypted.iv, existing?.created_at || stamp, stamp).run();
      return json({ success: true, id, message: "निजी ज्ञान सुरक्षित सेव हो गया।" });
    }
    if (action === "delete") {
      const id = String(body.id || "");
      await db.prepare("DELETE FROM private_knowledge WHERE id = ?").bind(id).run();
      return json({ success: true });
    }
  }
  if (request.method === "GET" && action === "items") {
    if (!(await ownerSession(request, db))) return json({ success: false, message: "लॉगिन समाप्त है।" }, 401);
    const rows = await db.prepare("SELECT id, content_cipher, content_iv, created_at, updated_at FROM private_knowledge ORDER BY updated_at DESC").all();
    const items = [];
    for (const row of rows.results || []) {
      try { items.push({ id: row.id, ...await decryptRecord(row, env), createdAt: row.created_at, updatedAt: row.updated_at }); } catch {}
    }
    return json({ success: true, items });
  }
  if (request.method === "POST" && action === "answer") {
    const result = await findAnswer(String((await request.json()).question || ""), String(url.searchParams.get("language") || "en"), env);
    if (!result) return json({ success: true, matched: false });
    return json({ success: true, matched: true, ...result });
  }
  return json({ success: false, message: "Not found." }, 404);
}

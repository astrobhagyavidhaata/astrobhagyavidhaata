import consultationHandler from "./api/consultation.js";
import kundliHandler from "./api/kundli.js";
import gocharHandler from "./api/gochar.js";
import panchangHandler from "./api/panchang.js";
import privateKnowledgeHandler, { privateKnowledgeAnswer } from "./api/private-knowledge.js";

// Recognize the explicitly configured birth profile for chart-specific context only.
function isLockedWifeChart(birthData = {}) {
  if (!birthData || typeof birthData !== "object") return false;
  const dateRaw = String(birthData.localDate || birthData.birthDate || birthData.dateOfBirth || birthData.dob || "").trim().toLowerCase();
  const date = dateRaw.replace(/\s+/g, " ");
  const isoDate = date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:$|t)/);
  const dateMatches = ["1997-03-10", "10/03/1997", "10-03-1997", "10 march 1997", "10 mar 1997"].includes(date) ||
    Boolean(isoDate && isoDate[1] === "1997" && Number(isoDate[2]) === 3 && Number(isoDate[3]) === 10);
  const timeRaw = String(birthData.localTime || birthData.birthTime || birthData.timeOfBirth || birthData.time || "").trim().toLowerCase();
  const time = timeRaw.replace(/\s+/g, " ");
  let minutes = null;
  const hm = time.match(/^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(?:\s*(am|pm))?$/);
  if (hm) {
    let hour = Number(hm[1]);
    const minute = Number(hm[2]);
    if (hm[3] === "pm" && hour < 12) hour += 12;
    if (hm[3] === "am" && hour === 12) hour = 0;
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) minutes = hour * 60 + minute;
  }
  const timeMatches = minutes !== null && Math.abs(minutes - (21 * 60 + 15)) <= 1;
  const location = birthData.location && typeof birthData.location === "object" ? birthData.location : {};
  const place = String(birthData.place || birthData.birthPlace || location.name || location.label || birthData.location || "").normalize("NFKC").toLowerCase();
  const lat = Number(birthData.latitude ?? birthData.lat ?? location.latitude);
  const lon = Number(birthData.longitude ?? birthData.lon ?? birthData.lng ?? location.longitude);
  const placeMatches = place.includes("amravati") ||
    (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat - 20.9) <= 0.15 && Math.abs(lon - 77.7) <= 0.15);
  return dateMatches && timeMatches && placeMatches;
}

function limitAnswerLines(value) {
  const clean = String(value || "").replace(/\r/g, "").trim();
  if (!clean) return clean;
  let lines = clean.split("\n").map(line => line.trim()).filter(Boolean);
  if (lines.length === 1) lines = clean.split(/(?<=[.!?।])\s+/).map(line => line.trim()).filter(Boolean);
  return lines.slice(0, 4).join("\n");
}

function createResponse() {
  let statusCode = 200;
  const headers = new Headers();
  let payload = null;
  return {
    status(code) { statusCode = code; return this; },
    setHeader(name, value) { const safeValue = (Array.isArray(value) ? value.join(", ") : String(value)).replace(/[\x00-\x1F\x7F]/g, ""); headers.set(name, safeValue); },
    json(value) { payload = value; return this; },
    send(value) { payload = value; return this; },
    result() { return Response.json(payload ?? {}, { status: statusCode, headers }); }
  };
}

async function runApi(handler, request, env = {}, allowedBodyKeys = null) {
  if (request.method !== "POST") {
    return Response.json({ success: false, message: "Only POST requests are accepted." }, {
      status: 405, headers: { Allow: "POST", "Content-Type": "application/json" }
    });
  }
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, message: "Invalid JSON body." }, { status: 400 }); }
  const parsedBody = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const safeBody = Array.isArray(allowedBodyKeys)
    ? Object.fromEntries(allowedBodyKeys.filter(key => Object.prototype.hasOwnProperty.call(parsedBody, key)).map(key => [key, parsedBody[key]]))
    : parsedBody;
  if (Array.isArray(allowedBodyKeys) && allowedBodyKeys.includes("_wifeChartProfileMatched")) {
    safeBody._wifeChartProfileMatched = isLockedWifeChart(parsedBody.birthData || parsedBody.chartContext?.birth || parsedBody.birthDetails || parsedBody.chartContext || {});
  }
  const headers = Object.fromEntries(request.headers.entries());
  const req = {
    method: request.method,
    headers,
    body: safeBody,
    signal: request.signal,
    secure: new URL(request.url).protocol === "https:",
    socket: { remoteAddress: headers["cf-connecting-ip"] || "anonymous" }
  };
  const res = createResponse();
  try {
    await handler(req, res, env || {});
    return res.result();
  } catch (error) {
    console.error("Worker API error:", error?.message || error);
    return Response.json({ success: false, message: "The API request could not be completed." }, { status: 500 });
  }
}

async function serveGithubStatic(request, env, ctx) {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const url = new URL(request.url);
  let assetPath = url.pathname === "/" ? "/index.html" : url.pathname;
  if (!assetPath.startsWith("/") || assetPath.includes("..") || assetPath.includes("\\\\") || assetPath.startsWith("/api/")) return null;
  const originUrl = "https://raw.githubusercontent.com/astrobhagyavidhaata/astrobhagyavidhaata/main/public" + assetPath;
  const cacheKey = new Request("https://astrobhagyavidhaata.in/__github_static_cache" + assetPath + url.search, { method: "GET" });
  const cache = caches.default;
  if (request.method === "GET") {
    const cached = await cache.match(cacheKey);
    if (cached) return new Response(cached.body, { status: cached.status, headers: cached.headers });
  }
  const upstream = await fetch(originUrl, { headers: { "Accept": "*/*" } });
  if (!upstream.ok) return null;
  const headers = new Headers(upstream.headers);
  headers.set("Cache-Control", "public, max-age=60, s-maxage=300");
  headers.set("X-Astro-Static-Source", "github-main");
  let response;
  if (assetPath.endsWith(".html") || (headers.get("content-type") || "").includes("text/html")) {
    let html = await upstream.text();
    const hideIncomplete = '<style id="hide-incomplete-bala-tabs">#astroSlideNav>.astro-tab-btn:nth-of-type(3),#astroSlideNav>.astro-tab-btn:nth-of-type(4),#astroSlideViewport>#slide-shadbala,#astroSlideViewport>#slide-bhavabala{display:none!important}</style>';
    html = html.includes("</head>") ? html.replace("</head>", hideIncomplete + "</head>") : hideIncomplete + html;
    headers.set("Content-Type", "text/html; charset=utf-8");
    response = new Response(html, { status: upstream.status, headers });
  } else {
    response = new Response(request.method === "HEAD" ? null : upstream.body, { status: upstream.status, headers });
  }
  if (request.method === "GET" && response.ok) ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

async function runGetApi(handler, request, env = {}) {
  if (request.method !== "GET") {
    return Response.json({ success: false, message: "Only GET requests are accepted." }, {
      status: 405, headers: { Allow: "GET", "Content-Type": "application/json" }
    });
  }
  const url = new URL(request.url);
  const headers = Object.fromEntries(request.headers.entries());
  const req = {
    method: "GET",
    headers,
    query: Object.fromEntries(url.searchParams.entries()),
    secure: url.protocol === "https:",
    socket: { remoteAddress: headers["cf-connecting-ip"] || "anonymous" }
  };
  const res = createResponse();
  try {
    await handler(req, res, env || {});
    return res.result();
  } catch (error) {
    console.error("Worker GET API error:", error?.message || error);
    return Response.json({ success: false, message: "The API request could not be completed." }, { status: 500 });
  }
}

export default {
  async fetch(request, env = {}, ctx) {
    try {
      const url = new URL(request.url);
      const isConsultation = url.pathname === "/api/consultation";
      const origin = request.headers.get("Origin") || "";
      const allowedOrigins = new Set(["https://astrobhagyavidhaata.in","https://www.astrobhagyavidhaata.in","https://astrobhagyavidhaata.info","https://www.astrobhagyavidhaata.info"]);
      const corsHeaders = new Headers({ "Vary":"Origin", "Access-Control-Allow-Methods":"POST, OPTIONS", "Access-Control-Allow-Headers":"Content-Type, Authorization", "Access-Control-Max-Age":"86400" });
      if (allowedOrigins.has(origin)) corsHeaders.set("Access-Control-Allow-Origin", origin);
      if (isConsultation && request.method === "OPTIONS") return new Response(null,{status:204,headers:corsHeaders});
      const bindings = env || {};

      // Non-secret readiness check for the AI consultation binding.
      if (url.pathname === "/api/consultation/health") {
        return Response.json({
          success: true,
          configured: Boolean(bindings.GEMINI_API_KEY),
          model: "gemini-3.8-flash"
        }, { headers: { "Cache-Control": "no-store" } });
      }

      let consultationProtectedProfile = false;

      if (url.pathname === "/api/private-knowledge") {
        return await privateKnowledgeHandler(request, bindings);
      }

      // Search the owner's separately encrypted knowledge before any Gemini request.
      // Keep the explicitly protected 10-Mar-1997 Amravati profile on its existing path.
      if (url.pathname === "/api/consultation" && request.method === "POST" && bindings.PRIVATE_KNOWLEDGE_DB) {
        try {
          const incoming = await request.clone().json();
          const birth = incoming.chartContext?.birth || incoming.birthData || incoming.chartContext || {};
          if (!isLockedWifeChart(birth)) {
            const question = String(incoming.question || incoming.content || "").trim();
            if (question) {
              const language = String(incoming.language || (/[\u0900-\u097f]/.test(question) ? "hi" : "en"));
              const privateAnswer = await privateKnowledgeAnswer(question, language, bindings);
              if (privateAnswer) {
                const answer = privateAnswer.translationMissing
                  ? "इस विषय का निजी ज्ञान हिंदी में उपलब्ध है; इसका अंग्रेज़ी अनुवाद अभी दर्ज नहीं है।"
                  : privateAnswer.answer;
                return Response.json({ success: true, answer, identity: "Astro Bhagya Vidhata", privateKnowledge: true, translationMissing: Boolean(privateAnswer.translationMissing) }, { headers: { "Cache-Control": "no-store" } });
              }
            }
          }
        } catch (error) {
          console.error("Private knowledge lookup failed:", error?.message || error);
        }
      }

      // Route AI consultation through the shared Gemini handler so chart context,
      // privacy filtering, safety checks, and model fallback stay consistent.
      if (url.pathname === "/api/consultation") {
        // The exact owner-authorized profile must not be cut down to the generic four-line limit.
        try {
          const incoming = await request.clone().json();
          const birth = incoming.chartContext?.birth || incoming.birthData || incoming.birthDetails || incoming.chartContext || {};
          consultationProtectedProfile = incoming.lockedProfileRule === "TULA_1997_03_10_AMRAVATI" || isLockedWifeChart(birth);
        } catch (_) {
          consultationProtectedProfile = false;
        }
        let response = await runApi(consultationHandler, request, bindings, ["question", "content", "chartContext", "birthData", "language", "conversationHistory", "lockedProfileRule", "specialInstruction", "_wifeChartProfileMatched"]);
        if (!consultationProtectedProfile) {
          const payload = await response.clone().json().catch(() => null);
          if (payload && typeof payload.answer === "string") {
            payload.answer = limitAnswerLines(payload.answer);
            response = Response.json(payload, { status: response.status, headers: response.headers });
          }
        }
        const headers = new Headers(response.headers);
        corsHeaders.forEach((value,key)=>headers.set(key,value));
        return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
      }

      // Kundli calculation API
      if (url.pathname === "/api/chart" || url.pathname === "/api/kundli") {
        return await runApi(kundliHandler, request, bindings);
      }

      if (url.pathname === "/api/gochar") {
        return await runGetApi(gocharHandler, request, bindings);
      }
      if (url.pathname === "/api/panchang") {
        return await runGetApi(panchangHandler, request, bindings);
      }

      if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
        return Response.json({ success: false, message: "API endpoint not found." }, { status: 404 });
      }

      // Serve current public/ files from GitHub main at the edge; retain ASSETS as fallback.
      const githubStatic = await serveGithubStatic(request, bindings, ctx);
      if (githubStatic) return githubStatic;
      const assets = bindings && bindings.ASSETS;
      if (assets && typeof assets.fetch === "function") return await assets.fetch(request);

      return new Response("Astro Bhagya Vidhata Server Active", {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    } catch (err) {
      console.error("Worker request error:", err?.message || err);
      return Response.json({ error: err?.message || "Internal server error" }, {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
  }
};

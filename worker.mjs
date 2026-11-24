import consultationHandler from "./api/consultation.js";
import kundliHandler from "./api/kundli.js";
import gocharHandler from "./api/gochar.js";
import panchangHandler from "./api/panchang.js";

import profileBirthMatch from "./lib/profile-birth-match.js";
const { isLocked1997AmravatiProfile } = profileBirthMatch;

function isLockedWifeChart(birthData = {}) {
  return isLocked1997AmravatiProfile(birthData);
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
    // Never trust a browser-supplied lock flag by itself. Validate the actual
    // birth data on the Worker so another chart cannot inherit this profile lock.
    // Scan the complete submitted chart recursively. The form can store the
    // birth inputs under chartContext.birth, birthDetails, saved chart objects,
    // or location sub-objects; do not depend on one UI payload shape.
    const profileMatched = isLockedWifeChart(parsedBody);
    safeBody._wifeChartProfileMatched = profileMatched;
    safeBody.lockedProfileRule = profileMatched ? "TULA_1997_03_10_AMRAVATI" : null;
    safeBody.specialInstruction = profileMatched ? "इस जन्म-कुंडली के संबंध-विषयक प्रश्नों में D1, D9, सप्तम भाव/सप्तमेश, शुक्र/गुरु, दशा-अंतर्दशा और उपलब्ध गोचर के वास्तविक संकेतों का संतुलित विश्लेषण करें। किसी परिणाम की गारंटी न दें और विरोधी संकेतों को न छिपाएँ।" : "";
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
  const cacheKey = new Request("https://astrobhagyavidhaata.in/__github_static_cache_v20261124_profile_gate_5" + assetPath + url.search, { method: "GET" });
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
      // Keep .info live until the .in nameserver delegation is active.

      const bindings = env || {};

      // Non-secret readiness check for the AI consultation binding.
      if (url.pathname === "/api/consultation/health") {
        return Response.json({
          success: true,
          configured: Boolean(bindings.GEMINI_API_KEY),
          model: "gemini-3.8-flash"
        }, { headers: { "Cache-Control": "no-store" } });
      }

      // Route AI consultation through the shared Gemini handler so chart context,
      // privacy filtering, safety checks, and model fallback stay consistent.
      if (url.pathname === "/api/consultation") {
        const response = await runApi(consultationHandler, request, bindings, ["question", "content", "chartContext", "birthData", "birthDetails", "birth", "chart", "birthDate", "birthTime", "dateOfBirth", "timeOfBirth", "dob", "date", "time", "place", "birthPlace", "location", "latitude", "longitude", "lat", "lon", "lng", "language", "conversationHistory", "lockedProfileRule", "specialInstruction", "_wifeChartProfileMatched"]);
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

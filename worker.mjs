import consultationHandler from "./api/consultation.js";
import kundliHandler from "./api/kundli.js";

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

async function runApi(handler, request, env = {}) {
  if (request.method !== "POST") {
    return Response.json({ success: false, message: "Only POST requests are accepted." }, {
      status: 405, headers: { Allow: "POST", "Content-Type": "application/json" }
    });
  }
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, message: "Invalid JSON body." }, { status: 400 }); }
  const headers = Object.fromEntries(request.headers.entries());
  const req = {
    method: request.method,
    headers,
    body,
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

export default {
  async fetch(request, env = {}, ctx) {
    try {
      const url = new URL(request.url);
      const bindings = env || {};

      // Non-secret readiness check for the AI consultation binding.
      if (url.pathname === "/api/consultation/health") {
        return Response.json({
          success: true,
          configured: Boolean(bindings.GEMINI_API_KEY),
          model: "gemini-2.5-flash-lite"
        }, { headers: { "Cache-Control": "no-store" } });
      }

      // Route AI consultation through the shared Gemini handler so chart context,
      // privacy filtering, safety checks, and model fallback stay consistent.
      if (url.pathname === "/api/consultation") {
        return await runApi(consultationHandler, request, bindings);
      }

      // Kundli calculation API
      if (url.pathname === "/api/chart" || url.pathname === "/api/kundli") {
        return await runApi(kundliHandler, request, bindings);
      }

      if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
        return Response.json({ success: false, message: "API endpoint not found." }, { status: 404 });
      }

      // Static assets binding may be absent in preview or misconfigured deployments.
      const assets = bindings && bindings.ASSETS;
      if (assets && typeof assets.fetch === "function") {
        return await assets.fetch(request);
      }

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

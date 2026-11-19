import consultationHandler from "./api/consultation.js";
import kundliHandler from "./api/kundli.js";

function createResponse() {
  let statusCode = 200;
  const headers = new Headers();
  let payload = null;
  return {
    status(code) { statusCode = code; return this; },
    setHeader(name, value) { headers.set(name, Array.isArray(value) ? value.join(", ") : String(value)); },
    json(value) { payload = value; return this; },
    send(value) { payload = value; return this; },
    result() { return Response.json(payload ?? {}, { status: statusCode, headers }); }
  };
}

async function runApi(handler, request, env) {
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
    secure: new URL(request.url).protocol === "https:",
    socket: { remoteAddress: headers["cf-connecting-ip"] || "anonymous" }
  };
  const res = createResponse();
  try {
    await handler(req, res, env);
    return res.result();
  } catch (error) {
    console.error("Worker API error:", error?.message || error);
    return Response.json({ success: false, message: "The API request could not be completed." }, { status: 500 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/consultation") {
      return runApi(consultationHandler, request, env);
    }
    if (url.pathname === "/api/chart" || url.pathname === "/api/kundli") {
      return runApi(kundliHandler, request, env);
    }
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      return Response.json({ success: false, message: "API endpoint not found." }, { status: 404 });
    }
    if (!env?.ASSETS || typeof env.ASSETS.fetch !== "function") {
      return new Response("Static assets binding is unavailable", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
    return env.ASSETS.fetch(request);
  }
};

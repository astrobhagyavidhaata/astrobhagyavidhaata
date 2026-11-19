import { httpServerHandler } from "cloudflare:node";
import app from "./server.js";
import consultationHandler from "./api/consultation.js";

// Keep the Express server for the remaining API routes and static assets.
app.listen(3000);
const nodeHandler = httpServerHandler({ port: 3000 });

function createApiResponse() {
  let statusCode = 200;
  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
  let payload = {};
  const response = {
    status(code) { statusCode = code; return response; },
    setHeader(name, value) {
      headers.set(name, Array.isArray(value) ? value.join(", ") : String(value));
    },
    json(value) { payload = value; return response; }
  };
  response.toResponse = () => Response.json(payload, {
    status: statusCode,
    headers: { ...Object.fromEntries(headers.entries()), "Cache-Control": "no-store" }
  });
  return response;
}

async function runConsultation(request, env) {
  if (request.method !== "POST") {
    return Response.json(
      { success: false, message: "केवल POST अनुरोध स्वीकार है।" },
      { status: 405, headers: { Allow: "POST", "Content-Type": "application/json; charset=utf-8" } }
    );
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, message: "Invalid JSON body." }, { status: 400 });
  }
  const headers = Object.fromEntries(request.headers.entries());
  const req = {
    method: request.method,
    headers,
    body,
    secure: new URL(request.url).protocol === "https:",
    socket: { remoteAddress: headers["cf-connecting-ip"] || "anonymous" }
  };
  const res = createApiResponse();
  await consultationHandler(req, res, env);
  return res.toResponse();
}

export default {
  async fetch(request, env, ctx) {
    // Forward Cloudflare bindings to the consultation module; GEMINI_API_KEY
    // is read from env by api/consultation.js and never exposed to the client.
    if (request.method === "POST" && new URL(request.url).pathname === "/api/consultation") {
      return runConsultation(request, env || {});
    }

    // The Node server handles kundli, gochar, panchang and all other API routes.
    if (env?.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
    if (env?.GEMINI_MODEL) process.env.GEMINI_MODEL = env.GEMINI_MODEL;
    else if (!process.env.GEMINI_MODEL) process.env.GEMINI_MODEL = "gemini-3.8-flash";
    const pathname = new URL(request.url).pathname;
    if (pathname === "/healthz" || pathname === "/api" || pathname.startsWith("/api/")) {
      return nodeHandler.fetch(request, env, ctx);
    }
    return env.ASSETS.fetch(request);
  }
};

import { httpServerHandler } from "cloudflare:node";
import app from "./server.js";

// Keep the Express API server and serve static files through the ASSETS binding.
app.listen(3000);
const nodeHandler = httpServerHandler({ port: 3000 });

export default {
  async fetch(request, env, ctx) {
    if (env?.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
    if (env?.GEMINI_MODEL) process.env.GEMINI_MODEL = env.GEMINI_MODEL;

    const pathname = new URL(request.url).pathname;
    if (pathname === "/healthz" || pathname === "/api" || pathname.startsWith("/api/")) {
      if (nodeHandler && typeof nodeHandler.fetch === "function") {
        return nodeHandler.fetch(request, env, ctx);
      }
      return Response.json({ error: "API handler unavailable" }, { status: 503 });
    }

    if (env?.ASSETS && typeof env.ASSETS.fetch === "function") {
      return env.ASSETS.fetch(request);
    }

    return new Response("Static assets are unavailable", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
};

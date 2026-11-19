import { httpServerHandler } from "cloudflare:node";
import app from "./server.js";

// Keep the Express server for API routes; Cloudflare serves static files through ASSETS.
app.listen(3000);
const nodeHandler = httpServerHandler({ port: 3000 });

export default {
  async fetch(request, env, ctx) {
    // Expose Cloudflare secret bindings to Node-compatible server modules.
    if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
    if (env.GEMINI_MODEL) process.env.GEMINI_MODEL = env.GEMINI_MODEL;
    const pathname = new URL(request.url).pathname;
    if (pathname === "/healthz" || pathname === "/api" || pathname.startsWith("/api/")) {
      return nodeHandler.fetch(request, env, ctx);
    }
    return env.ASSETS.fetch(request);
  }
};

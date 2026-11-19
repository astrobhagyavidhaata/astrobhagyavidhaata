import { httpServerHandler } from "cloudflare:node";

// Reuse the existing Express API without changing its business logic.
import "./server.js";

const expressHandler = httpServerHandler({ port: 3000 });

export default {
  async fetch(request, env, ctx) {
    // Expose Cloudflare secret bindings to the existing Node-compatible Express modules.
    if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
    if (env.GEMINI_MODEL) process.env.GEMINI_MODEL = env.GEMINI_MODEL;
    const { pathname } = new URL(request.url);

    // All API and health routes continue through the existing Express server.
    if (pathname === "/healthz" || pathname === "/api" || pathname.startsWith("/api/")) {
      return expressHandler(request, env, ctx);
    }

    // Public files are served from Cloudflare Workers Static Assets.
    return env.ASSETS.fetch(request);
  },
};

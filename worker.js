import { httpServerHandler } from "cloudflare:node";

// Reuse the existing Express API without changing its business logic.
import "./server.js";

const expressHandler = httpServerHandler({ port: 3000 });

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);

    // All API and health routes continue through the existing Express server.
    if (pathname === "/healthz" || pathname === "/api" || pathname.startsWith("/api/")) {
      return expressHandler(request, env, ctx);
    }

    // Public files are served from Cloudflare Workers Static Assets.
    return env.ASSETS.fetch(request);
  },
};

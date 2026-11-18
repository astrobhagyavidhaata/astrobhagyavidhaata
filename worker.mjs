import { httpServerHandler } from "cloudflare:node";
import app from "./server.js";

// Keep the Express server for API routes; Cloudflare serves static files through ASSETS.
app.listen(3000);
const nodeHandler = httpServerHandler({ port: 3000 });

export default {
  async fetch(request, env, ctx) {
    const pathname = new URL(request.url).pathname;
    if (pathname === "/healthz" || pathname === "/api" || pathname.startsWith("/api/")) {
      return nodeHandler.fetch(request, env, ctx);
    }
    return env.ASSETS.fetch(request);
  }
};

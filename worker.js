// Cloudflare Worker entry point. Keep Express/server.js out of this bundle.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/healthz") {
      return Response.json({ status: "ok", runtime: "cloudflare-worker" });
    }

    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      return Response.json(
        { success: false, message: "API handlers are not connected to the Worker yet." },
        { status: 503 }
      );
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

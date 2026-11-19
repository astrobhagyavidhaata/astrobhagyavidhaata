// Cloudflare Worker entry point. Keep Express/server.js out of this bundle.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API requests are handled separately; every other request goes straight
    // to the static asset binding (index.html, CSS, JS, images, and other files).
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      return Response.json(
        { success: false, message: "API handlers are not connected to the Worker yet." },
        { status: 503 }
      );
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

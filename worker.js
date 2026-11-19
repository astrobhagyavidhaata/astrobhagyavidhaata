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

async function runGeminiConsultation(request, env = {}) {
  if (request.method !== "POST") return Response.json({ success: false, message: "केवल POST अनुरोध स्वीकार है।" }, { status: 405, headers: { Allow: "POST" } });
  let body;
  try { body = await request.json(); } catch { return Response.json({ success: false, message: "अमान्य JSON अनुरोध।" }, { status: 400 }); }
  const question = String(body?.question || body?.content || "").trim();
  if (!question) return Response.json({ success: false, message: "कृपया अपना प्रश्न लिखें।" }, { status: 400 });
  if (question.length > 4000) return Response.json({ success: false, message: "प्रश्न 4000 अक्षरों से छोटा रखें।" }, { status: 400 });
  const apiKey = String((env && env.GEMINI_API_KEY) || (typeof process !== "undefined" && process.env && process.env.GEMINI_API_KEY) || "").trim();
  if (!apiKey) return Response.json({ success: false, message: "Gemini API key Cloudflare Worker Secret में उपलब्ध नहीं है।" }, { status: 503 });
  const language = String(body.language || "hi").slice(0, 12);
  const chartContext = body.chartContext && typeof body.chartContext === "object" ? body.chartContext : {};
  const prompt = [
    "तुम एस्ट्रो भाग्य विधाता ऐप AI हो। पूछे जाने पर ठीक बताओ: मैं एस्ट्रो भाग्य विधाता ऐप AI हूँ।",
    "केवल दिए गए गणना डेटा के आधार पर उत्तर दो। ग्रह स्थिति, भाव, नक्षत्र, दशा या तारीख मत गढ़ो।",
    "उपयोगकर्ता की चुनी हुई भाषा में ही पूरा उत्तर दो: " + language + "।",
    "कुंडली गणना डेटा (JSON):",
    JSON.stringify(chartContext).slice(0, 28000),
    "उपयोगकर्ता का प्रश्न:",
    question
  ].join("\n\n");
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: "तुम एस्ट्रो भाग्य विधाता ऐप AI हो। अपनी पहचान हमेशा इसी नाम से बताओ। उपलब्ध कुंडली डेटा से सुरक्षित, स्पष्ट ज्योतिषीय उत्तर दो। मृत्यु या जीवनकाल की भविष्यवाणी मत करो। उपयोगकर्ता की चुनी हुई भाषा में ही उत्तर दो।" }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.35, maxOutputTokens: 1800 }
      })
    });
    const data = await response.json();
    if (!response.ok) return Response.json({ success: false, message: data?.error?.message || "Gemini सेवा से उत्तर प्राप्त नहीं हुआ।" }, { status: response.status === 429 ? 429 : 502 });
    const answer = (data?.candidates?.[0]?.content?.parts || []).map(part => part.text || "").join("\n").trim();
    if (!answer) return Response.json({ success: false, message: "Gemini ने खाली उत्तर दिया।" }, { status: 502 });
    return Response.json({ success: true, answer, identity: "एस्ट्रो भाग्य विधाता ऐप AI" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Gemini consultation failed:", error?.message || error);
    return Response.json({ success: false, message: "AI सेवा से संपर्क नहीं हो पाया।" }, { status: 502 });
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
          model: bindings.GEMINI_MODEL || "gemini-2.5-flash"
        }, { headers: { "Cache-Control": "no-store" } });
      }

      // AI consultation API — pass Worker bindings through unchanged.
      if (url.pathname === "/api/consultation") {
        return await runGeminiConsultation(request, bindings);
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

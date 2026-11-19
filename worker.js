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
  const jsonHeaders = { "Content-Type": "application/json; charset=utf-8" };

  if (request.method !== "POST") {
    return Response.json(
      { success: false, message: "केवल POST अनुरोध स्वीकार है।" },
      { status: 405, headers: { ...jsonHeaders, Allow: "POST" } }
    );
  }

  try {
    const body = await request.json();
    const userQuestion = String(body?.question || body?.content || "").trim();
    const userLanguage = String(body?.language || "Hindi").trim();

    if (!userQuestion) {
      return Response.json(
        { success: false, message: "कृपया पहले अपना प्रश्न लिखें।" },
        { status: 400, headers: jsonHeaders }
      );
    }

    if (userQuestion.length > 4000) {
      return Response.json(
        { success: false, message: "प्रश्न 4000 अक्षरों से छोटा रखें।" },
        { status: 400, headers: jsonHeaders }
      );
    }

    // Preserve the app's existing chartContext payload; also accept the
    // alternate kundali/chartData names without discarding other chart fields.
    const rawKundali =
      body?.chartContext || body?.kundali || body?.chartData || {};

    const completeChartData = {
      ...rawKundali,
      d1:
        rawKundali.d1 ??
        rawKundali.d1_lagna_houses ??
        rawKundali.houses ??
        rawKundali.lagna ??
        null,
      planets:
        rawKundali.planets ??
        rawKundali.planets_nakshatra_pada_house ??
        rawKundali.nakshatra ??
        {},
      d9:
        rawKundali.d9 ??
        rawKundali.d9_navamsa ??
        rawKundali.navamsa ??
        null,
      dasha:
        rawKundali.dasha ??
        rawKundali.dasha_antardasha ??
        rawKundali.mahadasha ??
        {},
      taraBala:
        rawKundali.taraBala ??
        rawKundali.tara_bala ??
        rawKundali.navtara ??
        {},
      shadbala: rawKundali.shadbala ?? {},
      gochar:
        rawKundali.gochar ??
        rawKundali.current_gochar ??
        rawKundali.transit ??
        rawKundali.transits ??
        null
    };

    const apiKey = String(
      (env && env.GEMINI_API_KEY) ||
      (typeof process !== "undefined" &&
        process.env &&
        process.env.GEMINI_API_KEY) ||
      ""
    ).trim();

    if (!apiKey) {
      return Response.json(
        { success: false, message: "Cloudflare Secret GEMINI_API_KEY नहीं मिली।" },
        { status: 503, headers: jsonHeaders }
      );
    }

    const host = "generativelanguage.googleapis.com";
    const path = "/v1beta/models/gemini-2.5-flash:generateContent";
    const apiUrl =
      "https://" + host + path + "?key=" + encodeURIComponent(apiKey);

    const strictSystemPrompt = `
तुम "Astro vidhata AI" हो। इन नियमों का पालन करो:

1. पहचान: यदि कोई पूछे कि तुम कौन हो या तुम्हारा नाम क्या है,
तो हमेशा यही बोलो: "मैं Astro vidhata AI हूँ।"

2. कुंडली विश्लेषण: उपलब्ध D1 लग्न कुंडली, D9 नवांश,
ग्रहों के नक्षत्र, चरण और भाव, महादशा-अंतर्दशा,
तारा बल, षड्बल और वर्तमान गोचर का आपस में मिलान करो।
केवल वही डेटा उपयोग करो जो वास्तव में दिया गया है।

3. सटीकता: कोई काल्पनिक ग्रह, राशि, भाव, नक्षत्र,
चरण, दशा या तारीख मत बताओ। जो जानकारी उपलब्ध नहीं है,
उसे स्पष्ट रूप से अनुपलब्ध बताओ। यदि कुंडली डेटा खाली है,
तो ग्राहक से पहले जन्म विवरण भरकर कुंडली बनाने को कहो।

4. उत्तर: ग्राहक के वास्तविक प्रश्न का सीधा और स्पष्ट उत्तर दो।
अलग से फलादेश या भविष्यवाणी का अतिरिक्त अनुभाग मत बनाओ।
यदि ग्राहक ने उपाय नहीं मांगे हैं, तो उपाय मत जोड़ो।

5. भाषा: ग्राहक की चुनी हुई भाषा (${userLanguage})
में स्पष्ट, सटीक और सम्मानजनक उत्तर दो।
`;

    const aiRes = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: strictSystemPrompt }]
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text:
                  "संपूर्ण उपलब्ध कुंडली डेटा (D1, D9, ग्रह, नक्षत्र, चरण, भाव, दशा, अंतर्दशा, तारा बल, षड्बल और गोचर):\\n" +
                  JSON.stringify(completeChartData).slice(0, 28000) +
                  "\\n\\nग्राहक का प्रश्न: " +
                  userQuestion
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1800
        }
      })
    });

    const aiJson = await aiRes.json();

    if (!aiRes.ok) {
      return Response.json(
        {
          success: false,
          message:
            "AI त्रुटि: " +
            (aiJson?.error?.message || aiRes.status)
        },
        { status: aiRes.status === 429 ? 429 : 502, headers: jsonHeaders }
      );
    }

    const replyText = (
      aiJson?.candidates?.[0]?.content?.parts || []
    )
      .map(part => part.text || "")
      .join("\\n")
      .trim();

    if (!replyText) {
      return Response.json(
        {
          success: false,
          message: "कृपया पहले अपनी जन्म कुंडली बनाएं और पुनः प्रश्न पूछें।"
        },
        { status: 502, headers: jsonHeaders }
      );
    }

    // Keep the response shape expected by the existing app frontend.
    return Response.json(
      {
        success: true,
        answer: replyText,
        identity: "Astro vidhata AI"
      },
      { status: 200, headers: { ...jsonHeaders, "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return Response.json(
      {
        success: false,
        message: "सर्वर त्रुटि: " + String(err?.message || err)
      },
      { status: 500, headers: jsonHeaders }
    );
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

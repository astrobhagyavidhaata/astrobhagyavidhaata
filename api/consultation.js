"use strict";
const { askGemini } = require("../lib/gemini");
const { buildLiveAstrologyContext } = require("../lib/consultation-context");
const requestWindow = new Map();

function allowedSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; }
  catch (_) { return false; }
}
function rateLimit(req) {
  const ip = String(req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  const now = Date.now();
  const recent = (requestWindow.get(ip) || []).filter(t => now - t < 60000);
  if (recent.length >= 10) return false;
  recent.push(now);
  if (requestWindow.size > 10000) requestWindow.clear();
  requestWindow.set(ip, recent);
  return true;
}

function compactChartContext(source){
  if(!source||typeof source!=="object"||Array.isArray(source))return {};
  const d=source.dasha||{},current=d.current||{};
  const md=(d.mahadashas||[]).find(x=>x.planet===current.mahadasha);
  const ad=(md?.antardashas||[]).find(x=>x.planet===current.antardasha);
  const pd=(ad?.pratyantardashas||[]).find(x=>x.planet===current.pratyantardasha);
  return {
    name:source.name||"",
    birth:source.birth||{},
    calculation:source.calculation||{},
    d1:source.d1||null,
    d9:source.d9||null,
    vargas:source.vargas||{},
    relationships:source.relationships||{},
    specialLagnas:source.specialLagnas||{},
    kharaPoints:source.kharaPoints||{},
    argala:source.argala||null,
    drishti:source.drishti||null,
    gochar:source.gochar||source.transits||null,
    dasha:{
      birthMoon:d.birthMoon||{},
      startingMahadasha:d.startingMahadasha||null,
      balanceAtBirthYears:d.balanceAtBirthYears||null,
      current,
      currentMahadasha:md?{planet:md.planet,start:md.start,end:md.end}:null,
      currentAntardasha:ad?{planet:ad.planet,start:ad.start,end:ad.end}:null,
      currentPratyantardasha:pd?{planet:pd.planet,start:pd.start,end:pd.end}:null,
      currentMahadashaAntardashas:(md?.antardashas||[]).map(x=>({planet:x.planet,start:x.start,end:x.end})),
      currentAntardashaPratyantardashas:(ad?.pratyantardashas||[]).map(x=>({planet:x.planet,start:x.start,end:x.end}))
    },
    taraChart:source.taraChart||[]
  };
}


module.exports = async function(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, message: "केवल POST अनुरोध स्वीकार है।" });
  }
  if (!allowedSameOrigin(req)) return res.status(403).json({ success: false, message: "यह अनुरोध स्वीकार नहीं है।" });
  if (!rateLimit(req)) return res.status(429).json({ success: false, message: "बहुत जल्दी-जल्दी प्रश्न भेजे जा रहे हैं। एक मिनट बाद फिर प्रयास करें।" });
  try {
    const body = req.body || {};
    const question = body.question || body.content;
    if (typeof question !== "string" || !question.trim()) return res.status(400).json({ success: false, message: "कृपया अपना प्रश्न लिखें।" });
    if (question.length > 4000) return res.status(400).json({ success: false, message: "प्रश्न 4000 अक्षरों से छोटा रखें।" });
    const live = buildLiveAstrologyContext(body.chartContext, new Date());
    const chartContext = compactChartContext(live);
    const history = Array.isArray(body.conversationHistory)
      ? body.conversationHistory.slice(-12).map(item => ({
          role: item.role === "assistant" ? "assistant" : "user",
          content: String(item.content || item.text || "").slice(0, 4000)
        })).filter(item => item.content.trim())
      : [];
    const supported = new Set(["en","hi","mr","pa","ur","fr","de","es","pt","ar","bn","gu","ta","te"]);
    const language = supported.has(body.language) ? body.language : "hi";
    const answer = await askGemini({ question: question.trim(), chartContext, conversationHistory: history, language });
    return res.status(200).json({ success: true, answer });
  } catch (error) {
    console.error("AI chat API error:", error.message);
    const message = error.message.includes("GEMINI_API_KEY")
      ? "Gemini API Key अभी सर्वर में सेट नहीं है।"
      : "AI से उत्तर नहीं मिल पाया। कृपया थोड़ी देर बाद फिर प्रयास करें।";
    return res.status(503).json({ success: false, message });
  }
};

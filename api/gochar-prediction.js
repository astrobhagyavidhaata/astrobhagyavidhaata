"use strict";

const { askGemini } = require("../lib/gemini");
const { getAuthenticatedUser, activeConsultation } = require("../lib/supabase");

const windows = new Map();
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; } catch (_) { return false; }
}
function allowRate(req) {
  const ip = String(req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  const now = Date.now();
  const recent = (windows.get(ip) || []).filter(t => now - t < 60000);
  if (recent.length >= 5) return false;
  recent.push(now);
  if (windows.size > 10000) windows.clear();
  windows.set(ip, recent);
  return true;
}
function cleanPlanet(p) {
  if (!p || typeof p !== "object") return null;
  return {
    planet: String(p.name || "").slice(0, 20),
    longitude: Number(p.longitude),
    degree: String(p.degree?.text || "").slice(0, 30),
    sign: String(p.rashi || "").slice(0, 30),
    nakshatra: String(p.nakshatra || "").slice(0, 40),
    pada: Number(p.pada),
    houseFromLagna: p.lagnaHouse != null && Number.isInteger(Number(p.lagnaHouse)) ? Number(p.lagnaHouse) : null,
    houseFromMoon: p.moonHouse != null && Number.isInteger(Number(p.moonHouse)) ? Number(p.moonHouse) : null,
    retrograde: Boolean(p.retrograde),
    combust: Boolean(p.combust),
    state: String(p.state || "").slice(0, 40)
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success:false, message:"केवल POST अनुरोध स्वीकार है।" });
  }
  if (!sameOrigin(req)) return res.status(403).json({ success:false, message:"यह अनुरोध स्वीकार नहीं है।" });
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return res.status(401).json({ success:false, message:"AI गोचर विश्लेषण के लिए पहले लॉगिन करें।" });
    const consultation = await activeConsultation(user.id);
    if (!consultation) return res.status(402).json({ success:false, message:"Gemini गोचर विश्लेषण के लिए पहले सक्रिय ज्योतिष परामर्श सत्र शुरू करें।" });
    if (!allowRate(req)) return res.status(429).json({ success:false, message:"कृपया एक मिनट बाद फिर प्रयास करें।" });

    const body = req.body || {};
    const source = body.gochar || {};
    if (!Array.isArray(source.planets) || source.planets.length !== 9) {
      return res.status(400).json({ success:false, message:"सभी 9 गोचर ग्रहों का सत्यापित डेटा आवश्यक है।" });
    }
    const planets = source.planets.map(cleanPlanet);
    if (planets.some(p => !p || !p.planet || !Number.isFinite(p.longitude) || !Number.isInteger(p.pada) || p.pada < 1 || p.pada > 4)) {
      return res.status(400).json({ success:false, message:"गोचर डेटा अधूरा या अमान्य है।" });
    }
    const language = String(body.language || "hi").slice(0, 12);
    const chartContext = {
      birth: {
        ascendantSign: String(source.basisLagna || "").slice(0, 30),
        moonSign: String(source.basisRashi || "").slice(0, 30)
      },
      gochar: {
        asOf: String(source.asOf || ""),
        calculation: "Sidereal zodiac; Astronomy Engine; Lahiri linear approximation; whole-sign houses",
        planets
      }
    };
    // Do not pass customer name, email, phone, account ID, birth place, or exact birth details to Gemini.
    const question = "आज के वर्तमान गोचर का वैदिक ज्योतिष के अनुसार विश्लेषण करें। जन्म लग्न/चंद्र राशि और नीचे दिए गए सभी नौ ग्रहों के वास्तविक गोचर डेटा को ही आधार बनाएं। विशेष रूप से शनि, गुरु, राहु और केतु का करियर, धन, स्वास्थ्य और परिवार पर प्रभाव समझाएं। राशि, नक्षत्र, चरण और भाव का कारण जोड़ें। अंत में दो सरल, सुरक्षित और वैकल्पिक उपाय दें। अज्ञात योग या फल न गढ़ें; ग्रह-स्थिति/अयनांश की गणना सीमाओं को स्पष्ट करें। चुनी हुई भाषा में उत्तर दें।";
    const answer = await askGemini({
      question, chartContext, conversationHistory:[], language,
      systemInstruction: "तुम एक विद्वान वैदिक ज्योतिषी हो। यूजर की जन्म लग्न/राशि के आधार पर आज के वर्तमान ग्रह गोचर (नक्षत्र, चरण, राशि और भाव) का विश्लेषण करो। विशेष रूप से शनि, गुरु, राहु और केतु के गोचर का करियर, धन, स्वास्थ्य और परिवार पर पड़ने वाला शुभ-अशुभ प्रभाव सरल हिंदी (या यूजर की चुनी हुई भाषा) में बताओ, और अंत में 2 सरल उपाय लिखो। केवल दिए गए ग्रह डेटा का उपयोग करो; कोई स्थिति या योग मत गढ़ो।"
    });
    return res.status(200).json({ success:true, answer });
  } catch (error) {
    console.error("Gochar prediction failed:", error.message);
    return res.status(503).json({ success:false, message:"AI गोचर विश्लेषण अभी उपलब्ध नहीं है। कृपया बाद में फिर प्रयास करें।" });
  }
};

const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

const SYSTEM_INSTRUCTION = `
तुम “पंडित Astro Vidhata AI” हो—एक अनुभवी वैदिक ज्योतिषी। ग्राहक के केवल पूछे गए प्रश्न का सीधा, छोटा और स्पष्ट उत्तर दो।

उत्तर के नियम:
- प्रश्न हिंदी/हिंग्लिश में हो तो सरल, स्वाभाविक देवनागरी हिंदी में उत्तर दो। अंग्रेज़ी में हो तो अंग्रेज़ी में।
- उत्तर सामान्यतः केवल 1–3 छोटे वाक्यों का हो। अधिकतम लगभग 40–60 शब्द।
- प्रश्न का सीधा निष्कर्ष पहले दो। जैसे नौकरी मिलेगी या नहीं, विवाह होगा या नहीं—स्पष्ट बताओ। कुंडली में उपलब्ध दशा/गोचर से समय का आधार मिले तो संभावित समय भी बताओ।
- केवल उसी विषय की कुंडली के जरूरी संकेत देखो। ग्रहों की लंबी सूची, विस्तृत दोष-विवेचन, भूमिका, दोहराव, शीर्षक, बुलेट या अलग-अलग अनुच्छेद मत बनाओ।
- ग्राहक ने उपाय नहीं पूछा है तो उपाय मत बताओ। ग्राहक ने केवल हाँ/नहीं पूछा है तो अनावश्यक सलाह मत जोड़ो।
- अगला प्रश्न आने पर केवल नए प्रश्न का उत्तर दो; पिछले उत्तर को दोहराओ मत।
- केवल भेजे गए संरचित ज्योतिषीय डेटा का उपयोग करो: D1 लग्न कुंडली, D9 नवांश, सभी ग्रहों के सटीक longitude/rashi/degree/nakshatra/pada, वर्तमान गोचर, Vimshottari महादशा-अंतर्दशा-प्रत्यंतरदशा और Nav Tara/Tara Bala।\n- ग्रहों का longitude, राशि, अंश, नक्षत्र या चरण कभी स्वयं गणना/अनुमान/याददाश्त से मत बनाओ। दिए गए डेटा में जो नहीं है, साफ कहो कि वह डेटा उपलब्ध नहीं है।\n- D1 और D9 की स्थिति को आपस में मत मिलाओ। जन्म ग्रह-स्थिति और वर्तमान गोचर को अलग-अलग रखो। दशा के ग्रह और आरंभ/समाप्ति तारीख केवल दिए गए active period से लो।
- बिल्कुल बिना sugar-coating के फलादेश दो। कुंडली में जो योग, दोष, बाधा, जोखिम, देरी, अलगाव या नकारात्मक परिणाम स्पष्ट दिखते हैं, उन्हें छिपाओ, कम करके बताओ या मीठे शब्दों में बदलो मत।
- शुभ योग हों तो शुभ बताओ और अशुभ योग हों तो अशुभ बताओ। निष्कर्ष ग्राहक को खुश करने, सांत्वना देने या डर से बचाने के लिए कभी मत बदलो। झूठी उम्मीद, झूठा भरोसा, बनावटी सकारात्मकता या केवल अच्छा सुनाने वाला उत्तर मत दो।
- जो कुंडली और उपलब्ध गणना वास्तव में दिखाती है, वही स्पष्ट और निष्पक्ष रूप से बताओ। नकारात्मक फल हो तो सीधे बताओ, लेकिन अपमानजनक या सनसनीखेज भाषा न अपनाओ। योग कमजोर/मिश्रित/अनिश्चित हों तो उतना ही स्पष्ट कहो; निश्चितता का झूठा दावा मत करो।
- मृत्यु/जीवनकाल की तारीख या उम्र की भविष्यवाणी न करो। हिंसा या अपराध में मदद न करो। स्वास्थ्य के प्रश्न में ज्योतिष को चिकित्सकीय निदान या इलाज का विकल्प न बताओ।
`;

function getAgeFromChart(chartContext) {
  const raw = chartContext?.birth?.localDate || chartContext?.birth?.utc;
  if (!raw) return null;
  const dob = new Date(raw);
  if (!Number.isFinite(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;
  return age >= 0 && age <= 120 ? age : null;
}

function getSafetyReply(question, chartContext) {
  const q = String(question || "").toLowerCase();
  const deathTopic = /मृत्यु|मौत|मर(?:ना|ने|ूंगा|ूंगी|ेगा|ेगी)|आयु|जीवन.?काल|death|die|dying|lifespan|longevity/i.test(q);
  const deathPrediction = /कब|कब तक|किस उम्र|कितनी उम्र|समय|तारीख|योग|संकेत|भविष्य|संभावना|क्या|मेरी मृत्यु|मेरी मौत|उसकी मृत्यु|उसकी मौत|होगा|होगी|हो सकती|prediction|predict|when|how long|age|date/i.test(q);
  if (deathTopic && deathPrediction) {
    return "मैं मृत्यु, मृत्यु की तारीख, उम्र या जीवनकाल की भविष्यवाणी नहीं करता—कुंडली के आधार पर भी नहीं। मैं जीवन, स्वास्थ्य और सुरक्षा से जुड़े सामान्य मार्गदर्शन में मदद कर सकता हूँ।";
  }
  const harmfulAct = /मार(?:ना|ने|ूंगा|ूंगी|ेगा|ेगी)|पीट(?:ना|ने)|हमला|हिंसा|हत्या|गोली|छुरा|जख्मी|नुकसान पहुंचा|चोट पहुंचा|kill|attack|assault|hurt|injure|violence|murder|चोरी|चुराना|लूट|डकैती|ठगी|धोखाधड़ी|तस्करी|स्मगल|steal|theft|robbery|burglary|fraud|smuggl/i.test(q);
  const facilitationIntent = /कैसे|किस तरह|कौन सा समय|कौनसे समय|शुभ समय|मुहूर्त|कब करूं|कब करना|योजना|तरीका|पकड़े बिना|best time|auspicious time|when should|how to|plan|method|without getting caught/i.test(q);
  if (harmfulAct && facilitationIntent) {
    return "मैं किसी को नुकसान पहुँचाने, हिंसा करने या चोरी/अपराध करने के तरीके, शुभ समय या मुहूर्त नहीं बता सकता। यदि विवाद चल रहा है, तो मैं उससे बचने, स्थिति शांत रखने और सुरक्षित विकल्प चुनने में मदद कर सकता हूँ।";
  }
  const age = getAgeFromChart(chartContext);
  const explicitMinor = /(?:मैं|मेरी उम्र|मेरी आयु|उम्र)\s*(?:सिर्फ|केवल)?\s*(1[0-7])\s*(?:साल|वर्ष|years?)/i.test(q);
  const isMinor = (age !== null && age < 18) || explicitMinor;
  const examQuestion = /परीक्षा|एग्जाम|इम्तिहान|exam|examination|board/i.test(q);
  const exactMarks = /कितने\s*(?:नंबर|अंक|marks)|कितना\s*स्कोर|exact\s*marks|how many marks|what score|percentage|प्रतिशत/i.test(q);
  if (isMinor && examQuestion && exactMarks) {
    return "मैं परीक्षा में कितने नंबर या प्रतिशत आएँगे, यह नहीं बता सकता। आपकी तैयारी, नियमित अभ्यास और पढ़ाई की योजना बेहतर बनाने में जरूर मदद कर सकता हूँ।";
  }
  return null;
}

const PRIVATE_FIELD_KEYS = new Set([
  "name", "fullname", "email", "phone", "mobile", "birthplace", "place",
  "address", "latitude", "lat", "lon", "coordinates",
  "birthdate", "birthtime", "localdate", "utc", "timezone"
]);

function stripPersonalFields(value) {
  if (Array.isArray(value)) return value.map(stripPersonalFields);
  if (!value || typeof value !== "object") return value;
  const clean = {};
  for (const [key, item] of Object.entries(value)) {
    const normalized = key.replace(/[_\s-]/g, "").toLowerCase();
    if (PRIVATE_FIELD_KEYS.has(normalized)) continue;
    clean[key] = stripPersonalFields(item);
  }
  return clean;
}

async function askGemini({
  question,
  apiKey: suppliedApiKey,
  chartContext = {},
  conversationHistory = [],
  language = "en",
  model = DEFAULT_GEMINI_MODEL,
  signal
}) {
  const languageNames = { en:"English", "en-CA":"Canadian English", hi:"Hindi", mr:"Marathi", pa:"Punjabi", ur:"Urdu", fr:"French", "fr-CA":"Canadian French", de:"German", es:"Spanish", pt:"Portuguese", "pt-BR":"Brazilian Portuguese", ar:"Arabic", "ar-SA":"Saudi Arabic", bn:"Bengali", gu:"Gujarati", ta:"Tamil", te:"Telugu", kn:"Kannada", ml:"Malayalam", or:"Odia", as:"Assamese" };
  const outputLanguage = languageNames[language] || "English";
  const cleanKey = String(suppliedApiKey || "").trim().replace(/[\s\r\n]+/g, "");

  if (!cleanKey) {
    throw new Error("GEMINI_API_KEY server environment में सेट नहीं है।");
  }

  if (!question || typeof question !== "string") {
    throw new Error("ग्राहक का प्रश्न आवश्यक है।");
  }

  const safetyReply = getSafetyReply(question, chartContext);
  if (safetyReply) return safetyReply;

  const detailedPrediction = false;
  // Prior chat messages may contain identifying details; never forward chat history to the external model.
  const history = [];

  const chartText = JSON.stringify(stripPersonalFields(chartContext), null, 2);
  const requestText =
    "उपलब्ध कुंडली का संदर्भ:\n" +
    chartText +
    "\n\nग्राहक का वर्तमान प्रश्न:\n" +
    question +
    (detailedPrediction
      ? "\n\nयह विस्तृत प्रश्न है। केवल पूछे गए विषय का विस्तार से उत्तर दें; अलग फलादेश अनुभाग या 7-खंड वाला प्रारूप न बनाएं। पर्याप्त डेटा न हो तो कमी बताएं; कोई तथ्य न गढ़ें।"
      : "");

  const languageInstruction = language === "hi"
    ? "उत्तर केवल सरल, स्वाभाविक देवनागरी हिंदी में दें। सीधे पूछे गए प्रश्न का जवाब पहले दें। केवल 1–3 छोटे वाक्य लिखें; अधिकतम 40–60 शब्द। अनावश्यक विश्लेषण, उपाय या सलाह न जोड़ें। कुंडली के डेटा से समय का आधार मिले तभी समय-खंड बताएं।"
    : "Answer in fluent English. Answer only the user's exact question directly in 1–3 short sentences, maximum 40–60 words. Do not add unsolicited analysis, remedies, or advice. Give a time window only when supported by the supplied chart data."

  const endpoint = "https://generativelanguage.googleapis.com/v1beta";
  // Gemini 2.5 Flash REST fields use camelCase. Keep system guidance separate
  // from the user's turn and bound thinking so it cannot consume the answer budget.
  const requestBody = {
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTION + "\n\n" + languageInstruction }]
    },
    contents: [{
      role: "user",
      parts: [{ text: requestText }]
    }],
    generationConfig: {
      thinkingConfig: { thinkingLevel: "low" },
      maxOutputTokens: 350
    }
  };
  // Use only current-generation Gemini 3.8 models. Older 2.5 model IDs
  // may be unavailable to new API users and must never be retried here.
  const primaryModel = model || DEFAULT_GEMINI_MODEL;
  const fallbackModel = primaryModel === "gemini-3.5-flash-lite"
    ? "gemini-3.8-flash"
    : "gemini-3.5-flash-lite";
  const fallbackModels = [...new Set([primaryModel, fallbackModel])];
  const shouldFallback = (error) =>
    error?.status === 429 ||
    error?.status === 503 ||
    (error?.status === 404 && /model|not found|unsupported/i.test(String(error?.message || ""))) ||
    error?.name === "TimeoutError" ||
    error?.retryable === true ||
    /timed?\s*out|timeout|high demand|overload(?:ed)?|resource.?exhausted|too many requests|temporarily unavailable|http 429|http 503/i.test(String(error?.message || ""));

  let lastError = null;
  for (let index = 0; index < fallbackModels.length; index++) {
    const activeModel = fallbackModels[index];
    try {
      const url = new URL(`${endpoint}/models/${encodeURIComponent(activeModel)}:generateContent`);
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": cleanKey },
        body: JSON.stringify(requestBody),
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(30000)])
          : AbortSignal.timeout(30000)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(String(data?.error?.message || `Google API HTTP ${response.status}`));
        error.status = response.status;
        error.model = activeModel;
        throw error;
      }

      const answer = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();
      if (!answer) { const emptyError = new Error("AI सेवा ने कोई उत्तर नहीं दिया।"); emptyError.retryable = true; throw emptyError; }
      if (index > 0) console.info("Gemini fallback model succeeded:", activeModel);
      return answer;
    } catch (error) {
      lastError = error;
      if (!shouldFallback(error) || index === fallbackModels.length - 1) throw error;
      console.warn("Gemini model busy; trying fallback:", activeModel, error?.status || error?.message || "unavailable");
    }
  }
  throw lastError || new Error("AI सेवा ने कोई उत्तर नहीं दिया।");
}

module.exports = { askGemini };

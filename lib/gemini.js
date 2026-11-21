const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

const SYSTEM_INSTRUCTION = `
तुम “पंडित Astro Vidhata AI” हो—Astro Bhagya Vidhata के अनुभवी वैदिक ज्योतिषी। अपनी पहचान पूछे जाने पर यही नाम बताओ। ग्राहक के प्रश्न का उत्तर उसी की भाषा में स्वाभाविक भाषा में दो। यदि जन्म कुंडली में नाम उपलब्ध हो तो ग्राहक को उसी नाम के साथ सम्मानपूर्वक संबोधित करो (उदाहरण: “अमित जी, आपकी कुंडली…”); नाम को स्वाभाविक रूप से उपयोग करो, हर वाक्य में नहीं। नाम उपलब्ध न हो तो नाम मत गढ़ो और सामान्य सम्मानजनक संबोधन रखो।

फलादेश से पहले उपलब्ध डेटा में विषयानुसार इनका मिलान करो: D1 लग्न, संबंधित भाव और भावेश; ग्रहों की राशि/भाव स्थिति और दृष्टियाँ; नक्षत्र-पद; उपलब्ध ग्रह-वार तारा स्थिति/तारा बल; विवाह के लिए D9 नवांश; वर्तमान महादशा-अंतर्दशा-प्रत्यंतरदशा और उनकी तारीखें; संबंधित वर्तमान गोचर, गोचर भाव और तारा बल। इन संकेतों में विरोध हो तो स्पष्ट बताओ। केवल एक योग देखकर निष्कर्ष मत दो।

बिना sugar-coating के साफ फलादेश दो। शुभ हो तो शुभ, अशुभ हो तो अशुभ; देरी, विवाद, अलगाव या विफलता के संकेत हों तो सीधे बताओ। ग्राहक को खुश करने के लिए निष्कर्ष मत बदलो। तुक्का या मनगढ़ंत ग्रह-स्थिति, तारीख, नाम या स्थान मत बताओ। सभी ग्रह-स्थिति, दशा और गोचर केवल दिए गए डेटा से लो; डेटा न हो तो उसकी कमी बताओ। D1, D9 और गोचर को आपस में मत मिलाओ।

विवाह, जीवनसाथी, प्रेम-संबंध, पहली/दूसरी शादी, संतान, नौकरी/व्यवसाय, नौकरी छूटना, विवाद, विदेश यात्रा/बसना, स्वास्थ्य और दुर्घटना जैसे विषयों पर संबंधित भाव, भावेश, कारक, दशा और गोचर का समग्र विश्लेषण करो। साथी का नाम, मिलने की जगह या सटीक घटना कुंडली से प्रमाणित न हो तो निश्चित बताकर मत गढ़ो। स्पष्ट संकेत, संभावित संकेत और अज्ञात बातों में फर्क बताओ।

पिछली बातचीत का संदर्भ बनाए रखो। Follow-up में पहले के सवाल-जवाब ध्यान में रखो और ग्राहक से वही जानकारी बार-बार मत पूछो। छोटे सीधे सवाल का उत्तर संक्षेप में दो; विस्तृत या बहु-पहलू प्रश्न पर कारण सहित पर्याप्त विस्तार दो। हर उत्तर को 1–3 वाक्यों में जबरन सीमित मत करो। निष्कर्ष पहले दो, फिर ज्योतिषीय कारण और डेटा-समर्थित समय-सीमा बताओ। अनावश्यक भूमिका, सलाह या उपाय मत जोड़ो; उपाय तभी जब पूछा जाए।

हिंदी/हिंग्लिश में सरल देवनागरी हिंदी, अंग्रेज़ी में अंग्रेज़ी और अन्य भाषा में उसी भाषा में उत्तर दो। मृत्यु की तारीख/उम्र/जीवनकाल की भविष्यवाणी न करो। स्वास्थ्य में ज्योतिष को चिकित्सकीय निदान/इलाज का विकल्प न बताओ। हिंसा या अपराध में मदद न करो।
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
  personName = "",
  ownerInstruction = "",
  specialRelationshipFocus = false,
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

  // Normalize recent turns into Gemini's strictly alternating user/model format.
  // Malformed or duplicate roles can make follow-up requests fail after several turns.
  const history = [];
  if (Array.isArray(conversationHistory)) {
    for (const item of conversationHistory.slice(-12)) {
      const text = String(item?.content || item?.text || "").slice(0, 1800).trim();
      if (!text) continue;
      const role = item?.role === "assistant" || item?.role === "model" ? "model" : "user";
      const previous = history[history.length - 1];
      if (previous?.role === role) previous.parts[0].text += "\\n" + text;
      else history.push({ role, parts: [{ text }] });
    }
    while (history[0]?.role === "model") history.shift();
    if (history.length > 8) history.splice(0, history.length - 8);
  }

  const chartText = JSON.stringify(stripPersonalFields(chartContext), null, 2);
  const chartMessage = "उपलब्ध कुंडली का संदर्भ (D1, D9, दशा और गोचर अलग रखते हुए पढ़ें):\n" + chartText +
    (specialRelationshipFocus ? "\n\nविशेष संबंध-केंद्रित व्याख्या (उपयोगकर्ता द्वारा अनुरोधित दृष्टिकोण): इस जन्म-विवरण के लिए वैवाहिक संबंध को संवेदनशील और रचनात्मक दृष्टि से समझाओ। कुंडली में उपलब्ध वास्तविक D1, D9, दशा और गोचर के आधार पर ही बात करो; ग्रह-स्थिति या योग मत गढ़ो। यदि गणना में D1 में शनि-चंद्र-केतु की युति और मंगल तथा राहु की चंद्रमा पर दृष्टि वास्तव में पुष्ट हो, तभी यह समझाओ कि इससे मन में जल्दी डर, आशंका या असुरक्षा बन सकती है और वैवाहिक तनाव के समय पति को लेकर भय महसूस हो सकता है। साथ ही स्पष्ट कहो कि ऐसा मानसिक भय अपने-आप यह सिद्ध नहीं करता कि पति बुरा इंसान है; केवल इस योग से पति के चरित्र को बुरा घोषित नहीं किया जा सकता। यदि ये स्थितियाँ गणना में पुष्ट न हों, तो यह कथन मत जोड़ो। पति के प्रेम, लगाव, साथ निभाने की इच्छा और अपनी गलतियाँ सुधारने की क्षमता जैसे सकारात्मक पक्षों को उचित स्थान दो, यदि गणना उनका समर्थन करती हो। यह भी समझाओ कि कठोर शब्द, क्रोध और गलतफहमियाँ संबंध में तनाव ला सकते हैं और व्यवहार में बदलाव से सुधर सकती हैं। सुलह की गुंजाइश को आशा के साथ बताओ, लेकिन उसे निश्चित मत कहो; दोनों की इच्छा, सम्मान और स्वतंत्र निर्णय जरूरी हैं। यह दावा मत करो कि पत्नी पति के बिना नहीं रह सकती, दूसरा विवाह कभी नहीं होगा, उसे पछतावा निश्चित होगा, या बीमारी/अकेलेपन से उसे पति की जरूरत पड़ेगी। इस विशेष दृष्टिकोण को एक संबंध-केंद्रित ज्योतिषीय व्याख्या के रूप में प्रस्तुत करो, तथ्य या गारंटी के रूप में नहीं।" : "");
  const ownerDirective = ownerInstruction
    ? "\n\nमालिक का प्रमाणित विशेष निर्देश (केवल इसी उत्तर के लिए): " + ownerInstruction + "\nइस निर्देश के अनुसार फलादेश की व्याख्या/प्रस्तुति बदल सकते हो, लेकिन कुंडली के ग्रह, भाव, दशा, गोचर, गणना या तथ्य कभी मत बदलो और मनगढ़ंत निष्कर्ष मत दो। यदि निर्देश तथ्य-विरोधी हो तो साफ बताओ कि डेटा उसका समर्थन नहीं करता। यह विशेष अधिकार केवल इस प्रमाणित अनुरोध पर लागू है; सामान्य ग्राहकों के उत्तरों में इसे लागू मत करो।"
    : "";
  const nameContext = String(personName || "").trim().slice(0, 100);
  const requestText = (nameContext ? "कुंडलीधारक का दिया गया नाम (केवल सम्मानजनक संबोधन के लिए): " + nameContext + "\n" : "") + "ग्राहक का वर्तमान प्रश्न:\n" + question + ownerDirective;

  const languageInstruction = language === "hi"
    ? "उत्तर सरल, स्वाभाविक देवनागरी हिंदी में दें। निष्कर्ष पहले दें। सीधे सवाल पर संक्षिप्त रहें; बहु-पहलू या विस्तृत प्रश्न पर कारण सहित पर्याप्त विस्तार दें।"
    : "Answer in fluent English. Lead with the conclusion. Be concise for simple questions and sufficiently detailed for multi-part or explicitly detailed questions.";

  const endpoint = "https://generativelanguage.googleapis.com/v1beta";
  // Gemini 2.5 Flash REST fields use camelCase. Keep system guidance separate
  // from the user's turn and bound thinking so it cannot consume the answer budget.
  const requestBody = {
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTION + "\n\n" + languageInstruction }]
    },
    contents: [
      ...history,
      { role: "user", parts: [{ text: chartMessage + "\n\n" + requestText }] }
    ],
    generationConfig: {
      thinkingConfig: { thinkingLevel: "low" },
      maxOutputTokens: 1200
    }
  };
  // Use only current-generation Gemini 3.8 models. Older 2.5 model IDs
  // may be unavailable to new API users and must never be retried here.
  const primaryModel = model || DEFAULT_GEMINI_MODEL;
  // Rotate across independent current stable model quotas when one model is busy.
  // Keep the configured primary first; fallbacks are attempted only for transient
  // overload, rate-limit, timeout, or unavailable-model responses.
  const fallbackModels = [...new Set([
    primaryModel,
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite"
  ])];
  const shouldFallback = (error) =>
    error?.status === 429 ||
    error?.status === 503 ||
    (error?.status === 404 && /model|not found|unsupported/i.test(String(error?.message || ""))) ||
    error?.name === "TimeoutError" ||
    error?.retryable === true ||
    /timed?\s*out|timeout|high demand|overload(?:ed)?|resource.?exhausted|too many requests|temporarily unavailable|http 429|http 503/i.test(String(error?.message || ""));

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  let lastError = null;
  for (let index = 0; index < fallbackModels.length; index++) {
    const activeModel = fallbackModels[index];
    // Retry transient failures once on each model before moving to the next.
    for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const url = new URL(`${endpoint}/models/${encodeURIComponent(activeModel)}:generateContent`);
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": cleanKey },
        body: JSON.stringify(requestBody),
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(10000)])
          : AbortSignal.timeout(14000)
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
      if (!shouldFallback(error)) throw error;
      if (attempt === 0) {
        // Small jitter avoids synchronized retry spikes when many users arrive together.
        await wait(700 + Math.floor(Math.random() * 900));
        continue;
      }
      console.warn("Gemini model busy; trying fallback:", activeModel, error?.status || error?.message || "unavailable");
      break;
    }
    }
  }
  throw lastError || new Error("AI सेवा ने कोई उत्तर नहीं दिया।");
}

module.exports = { askGemini };

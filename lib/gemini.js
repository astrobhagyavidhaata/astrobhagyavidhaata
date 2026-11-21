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

function formatTrustedChartFacts(chartContext) {
  const lines = [];
  const formatChart = (chart, label) => {
    if (!chart || typeof chart !== "object") { lines.push(label + ": उपलब्ध नहीं"); return; }
    const asc = chart.ascendant;
    lines.push(label + " लग्न: " + (asc?.rashi || "उपलब्ध नहीं") +
      (Number.isInteger(asc?.rashiIndex) ? " (राशि क्रमांक " + asc.rashiIndex + ")" : ""));
    const planets = chart.planets && typeof chart.planets === "object" ? chart.planets : {};
    for (const [name, p] of Object.entries(planets)) {
      if (!p || typeof p !== "object") continue;
      const parts = [name, p.rashi || "राशि अज्ञात",
        Number.isInteger(p.house) ? p.house + "वाँ भाव" : "भाव अज्ञात"];
      if (p.retrograde === true) parts.push("वक्री");
      if (p.nakshatra) parts.push(p.nakshatra + (p.pada ? " चरण " + p.pada : ""));
      lines.push(parts.join(" — "));
    }
  };
  formatChart(chartContext?.d1, "D1");
  formatChart(chartContext?.d9, "D9");
  const d = chartContext?.vimshottariCurrent || {};
  lines.push("वर्तमान विंशोत्तरी दशा: " +
    [d.mahadasha, d.antardasha, d.pratyantardasha].filter(Boolean).join(" / ") +
    (d.mahadashaStart || d.antardashaStart || d.pratyantardashaStart
      ? " | तारीखें: " + [d.mahadashaStart && d.mahadashaEnd ? "महादशा " + d.mahadashaStart + " से " + d.mahadashaEnd : "",
        d.antardashaStart && d.antardashaEnd ? "अंतर्दशा " + d.antardashaStart + " से " + d.antardashaEnd : "",
        d.pratyantardashaStart && d.pratyantardashaEnd ? "प्रत्यंतर " + d.pratyantardashaStart + " से " + d.pratyantardashaEnd : ""].filter(Boolean).join("; ")
      : " | तारीखें उपलब्ध नहीं"));
  lines.push("जन्म नक्षत्र: " + (chartContext?.birthNakshatra?.name || chartContext?.birthNakshatra || "उपलब्ध नहीं"));
  lines.push("गोचर की स्थिति: " + (chartContext?.gochar?.asOf || "उपलब्ध नहीं"));
  return lines.join("\\n");
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
  const trustedChartFacts = formatTrustedChartFacts(chartContext);\n  const chartMessage = "उपलब्ध कुंडली का संदर्भ (D1, D9, दशा और गोचर अलग रखते हुए पढ़ें):\\n" + chartText + "\\n\\nसर्वर द्वारा निकाले गए चार्ट-तथ्यों की संक्षिप्त सूची (यही अंतिम संदर्भ है):\\n" + trustedChartFacts +
    (specialRelationshipFocus ? "\\n\\nइस विशेष जन्म-प्रोफाइल के विवाह/पति-पत्नी संबंधी प्रश्नों में ग्राहक ने प्रेम-विवाह, पति की ड्रिंकिंग की समस्या, उससे हुई सामाजिक प्रतिष्ठा की चिंता, वैवाहिक तनाव और पति को छोड़ने/अलग होने की इच्छा बताई है। प्रश्न का सीधा उत्तर दो; ग्राहक की बताई परिस्थिति को कुंडली का प्रमाण मत मानो। बिना sugar-coating के निष्कर्ष दो, लेकिन न तो तलाक निश्चित बताओ, न यह कहो कि पत्नी तलाक ले ही नहीं सकती या ग्रह उसे अनुमति नहीं देते। 'अलग रहने की इच्छा', 'अस्थायी अलगाव' और 'कानूनी तलाक' को स्पष्ट रूप से अलग रखो। पहले D1 में लग्न, सप्तम भाव/सप्तमेश, द्वितीय (परिवार), षष्ठ (विवाद), अष्टम (वैवाहिक संकट), द्वादश (दूरी), शुक्र और गुरु का विश्लेषण करो; फिर D9 में लग्न, सप्तम भाव/सप्तमेश और विवाह की स्थिरता के संकेत अलग से देखो। इसके बाद उपलब्ध वास्तविक महादशा-अंतरदशा-प्रत्यंतरदशा की आरंभ/समाप्ति तारीखें, संबंधित ग्रहों के नक्षत्र-पद, चंद्र नक्षत्र से तारा-बल (जन्म, सम्पत, विपत, क्षेम, प्रत्यरि, साधक, वध, मित्र, अतिमित्र) तथा वर्तमान गोचर के ग्रह, नक्षत्र और भाव का परीक्षण करो। तारा-बल की गणना तभी बताओ जब जन्म नक्षत्र और गोचर नक्षत्र डेटा मौजूद हो; अन्यथा साफ लिखो कि डेटा उपलब्ध नहीं है। नक्षत्र, तारा, दशा, D1/D9 या गोचर की स्थिति स्वयं से मत गढ़ो। यदि डेटा समर्थन करे तो कहो कि स्थायी अलगाव/तलाक के संकेत कमजोर, मध्यम या प्रबल हैं और किस अवधि में तनाव/दूरी बढ़ सकती है; संकेत मिले-जुले हों तो वैसा ही स्पष्ट कहो। यदि ग्राहक सीधे पूछे “मैं पति को छोड़ पाऊँगी या नहीं?”, तो पहले एक स्पष्ट ज्योतिषीय आकलन दो—कुंडली के उपलब्ध संकेतों के आधार पर अलग रहने/स्थायी अलगाव/कानूनी तलाक की संभावना कमजोर, मध्यम या प्रबल है; केवल “रिश्ता नहीं टूटेगा”, “आप छोड़ नहीं पाएँगी” या “ग्रह अनुमति नहीं देते” जैसे निराधार निर्णायक वाक्य मत लिखो। यदि डेटा पर्याप्त हो तो अपनी ज्योतिषीय राय साफ शब्दों में बताओ और उसके पक्ष-विपक्ष के योग भी बताओ; यदि डेटा अधूरा हो तो साफ कहो कि निश्चित निष्कर्ष निकालने के लिए कौन-सा डेटा अनुपस्थित है। ग्राहक द्वारा पति को अच्छा बताना, ड्रिंकिंग की समस्या बताना, सामाजिक प्रतिष्ठा की चिंता या अलग होने की इच्छा—इनमें से किसी को भी ग्रह-स्थिति का प्रमाण न मानो। पति की ड्रिंकिंग को अपने-आप तलाक का ज्योतिषीय प्रमाण मत मानो। सामाजिक प्रतिष्ठा के प्रश्न पर ग्रहों से किसी के हंसने या बदनामी की घटना को तथ्य की तरह प्रमाणित मत करो; केवल संभावित मानसिक/सामाजिक दबाव के संकेत बताओ। अंतिम उत्तर का ढांचा: (1) सीधा निष्कर्ष—अलगाव/तलाक के संकेत कितने मजबूत हैं, (2) D1 और D9 के कारण, (3) दशा-गोचर-नक्षत्र-तारा बल, (4) किन तथ्यों/डेटा के बिना निष्कर्ष सीमित है। कोई निश्चित कानूनी परिणाम या सुलह की गारंटी मत दो। पहले से उदाहरण में दिए गए तुला लग्न, मीन चंद्र, मंगल-राहु, शुक्र महादशा, राहु अंतरदशा, रेवती/चित्रा/उत्तरा फाल्गुनी आदि को वास्तविक चार्ट डेटा से सत्यापित किए बिना दोहराना सख्त मना है। यह विशेष फोकस केवल DOB 10-03-1997, समय 21:15, अमरावती और पति-पत्नी/विवाह संबंधी प्रश्नों पर लागू है।\\n\\nअत्यंत सख्त तथ्य-जाँच: उत्तर में लग्न, राशि, ग्रह, भाव, युति, दृष्टि, नवांश, दशा या तारीख का कोई दावा तभी करो जब वही तथ्य ऊपर सर्वर-तथ्य सूची या JSON में साफ मौजूद हो। सूची में ग्रह का भाव/राशि अज्ञात हो तो उसे अज्ञात ही कहो। उदाहरणों, पुराने उत्तरों या ग्राहक के कथन से कोई ग्रह-स्थिति मत उठाओ। D1 और D9 के ग्रह-भाव अलग-अलग जाँचो। सीधे “हो सकता है या नहीं?” प्रश्न पर पहले एक वाक्य में उपलब्ध कुंडली-संकेतों के अनुसार कमजोर/मध्यम/प्रबल अलगाव-योग बताओ; कानूनी तलाक की निश्चित गारंटी या असंभवता मत बताओ। यदि D1/D9/दशा डेटा अधूरा है या आपस में मेल नहीं खाता, तो साफ कहो कि अभी विश्वसनीय हाँ/नहीं का ज्योतिषीय निष्कर्ष नहीं निकाला जा सकता। अधिकतम 4 छोटे वाक्य; कोई काल्पनिक ग्रह-स्थिति बताकर निष्कर्ष को सही साबित मत करो।" : "");

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
      thinkingConfig: { thinkingLevel: "medium" },\n      temperature: 0.1,
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

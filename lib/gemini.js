const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";

const SYSTEM_INSTRUCTION = `
तुम "Astro vidhata AI" हो। यदि कोई पूछे "तुम कौन हो?" या नाम पूछे, तो केवल यही उत्तर दो: "मैं Astro vidhata AI हूँ।" Google या Gemini का नाम अपनी पहचान के रूप में कभी न बताओ।
आप Astro Bhagya Vidhata के वरिष्ठ वैदिक ज्योतिष सलाहकार हैं। ग्राहक के पूछे गए प्रश्न का सीधा, स्पष्ट और सम्मानजनक उत्तर दें। कुंडली की गणनाएँ और दशा-अवधियाँ तथ्यात्मक रूप में बताएं; अलग से फलादेश/भविष्यवाणी अनुभाग या शीर्षक कभी न बनाएं।

सामान्य नियम:
1. ग्राहक के वर्तमान प्रश्न का उत्तर उपलब्ध कुंडली और बातचीत के संदर्भ से दें।
2. सामान्य प्रश्न का उत्तर 2 से 4 छोटे वाक्यों में दें। उत्तर केवल पूछे गए विषय तक सीमित रखें; बिना स्पष्ट अनुरोध के भविष्यवाणी, फलादेश या अतिरिक्त निष्कर्ष न जोड़ें।
3. केवल उपलब्ध गणना और डेटा का उपयोग करें। D1, D9, संबंधित वर्ग कुंडली, भावेश, ग्रहबल, राशि, अंश, नक्षत्र-पाद, दृष्टि, अर्गला, इंदु लग्न, 64वें नवांश, दशा और गोचर को तभी उद्धृत करें जब उनका डेटा वास्तव में मौजूद हो।
4. कोई ग्रह स्थिति, योग, तारा, दशा-अवधि, गोचर, शास्त्रीय उद्धरण या गणना अपनी तरफ से न गढ़ें। किसी गणना का डेटा उपलब्ध न हो तो स्पष्ट लिखें कि उसकी पुष्टि के लिए डेटा चाहिए।
5. उदाहरण या ग्राहक द्वारा दिया गया नमूना केवल लेखन-शैली समझने के लिए है। उसके ग्रह-स्थान, घटनाएं, तारीखें, निष्कर्ष या शब्दशः दावे वास्तविक कुंडली में कभी न डालें।
6. शास्त्रीय मतों में भिन्नता हो तो संबंधित परंपरा बताएं; किसी एक मत को सर्वमान्य न कहें।
7. सरल, स्वाभाविक और सम्मानजनक हिंदी लिखें। अनावश्यक अंग्रेज़ी और डराने वाली भाषा से बचें।
8. मृत्यु, मृत्यु की तारीख, मृत्यु का कारण, जीवनकाल या उम्र-ए-मौत की कोई भविष्यवाणी किसी भी रूप में कभी न करें। ऐसा प्रश्न आए तो विनम्रता से मना करें। गंभीर बीमारी, दुर्घटना, तलाक या संतानहानि को निश्चित/अटल/100% घोषित न करें।
9. भय पैदा करके महंगे उपाय न बेचें। उपाय पूछे जाने पर सामान्य, सुरक्षित और वैकल्पिक उपाय दें।
10. जीवनसाथी का निश्चित नाम/अक्षर या किसी घटना की गारंटी न दें। "यह अवश्य होगा", "मैं वादा करता हूँ" या "पक्का प्रॉमिस" जैसे दावे न करें; इसके स्थान पर बताएं कि कुंडली में कौन-से संकेत किस परिणाम का समर्थन करते हैं।
11. ग्राहक के पिछले संदेशों का संदर्भ बनाए रखें और उपयोगी जानकारी न रोकें।
12. नौकरी मिलना/बदलना, करियर और काम का प्रकार, निवास/स्थान परिवर्तन, विदेश यात्रा/विदेश में बसना, प्रेम/विश्वासघात के संकेत, विवाह/जीवनसाथी का स्वभाव, संतान/संतान का स्वभाव, परिवार से सहयोग, बचपन/मानसिक प्रवृत्ति, जीवन की चुनौतियाँ और बीते/आने वाले समय के प्रश्नों पर भी केवल वही जानकारी दें जो ग्राहक ने स्पष्ट रूप से पूछी है। अलग फलादेश अनुभाग या सामान्य राशिफल न जोड़ें।
13. किसी विशिष्ट प्रश्न का ज्योतिषीय उत्तर देते समय ही उससे संबंधित उपलब्ध D1/D9, भाव, ग्रह और दशा डेटा का संक्षिप्त आधार बताएं। बिना पूछे अलग निष्कर्ष न जोड़ें।
14. नवतारा/तारा-बल में जन्म नक्षत्र से गिनती, तारा का नाम, क्रम और शुभ/अशुभ/मिश्रित प्रकृति स्पष्ट करें। तारा-बल को अकेले निर्णायक न बनाएं; दशा, गोचर और संबंधित भाव से मिलाकर पढ़ें।
15. अष्टकवर्ग/भिन्नाष्टकवर्ग/सर्वाष्टकवर्ग का डेटा उपलब्ध हो तभी बिंदु और फल बताएं। डेटा न हो तो साफ कहें कि अष्टकवर्ग गणना अभी उपलब्ध नहीं है; कभी बिंदु या निष्कर्ष गढ़ें नहीं।
16. भूतकाल/बचपन के विश्लेषण में कुंडली से समर्थित प्रवृत्ति और संभावित समय-खंड बताएं; उसे व्यक्ति के जीवन की सत्यापित घटना की तरह न लिखें। उपयोगकर्ता के बताए वास्तविक अनुभव को अलग रखें।
17. भविष्य के निष्कर्ष में समर्थन और विरोध—दोनों संकेत दिखाएं। निष्कर्ष की मजबूती (मजबूत/मध्यम/सीमित) और कारण बताएं। नौकरी मिलेगी/बदलेगी जैसे प्रश्नों पर हाँ/नहीं की दिशा दें, लेकिन ज्योतिषीय अनुमान को निश्चित गारंटी न बताएं।
18. किसी भी गणना का डेटा अनुपलब्ध, अपूर्ण या अनुमानित हो तो उससे निकला निष्कर्ष सीमित करें और कमी साफ बताएं। ग्रहों/दशाओं/तारों/अष्टकवर्ग के आंकड़े कभी न गढ़ें।
12. किसी व्यक्ति को मारने, चोट पहुँचाने, डराने, हिंसा करने, चोरी, लूट, धोखाधड़ी या किसी अन्य अपराध में मदद, तरीका, योजना, शुभ समय या मुहूर्त कभी न दें। संभावित झगड़े/विवाद की चेतावनी और उससे बचने की सुरक्षित सलाह दे सकते हैं।
13. यदि जन्म विवरण के अनुसार व्यक्ति 18 वर्ष से कम है, तो परीक्षा के सटीक नंबर, अंक या प्रतिशत की भविष्यवाणी न करें। पास/फेल के बारे में केवल सीमित, अनिश्चित ज्योतिषीय संकेत बताएं—कभी निश्चित फैसला नहीं; पढ़ाई की तैयारी पर व्यावहारिक सलाह दें।
14. स्वास्थ्य संबंधी प्रश्नों में ज्योतिष को चिकित्सकीय निदान या इलाज का विकल्प न बताएं; लक्षण/जोखिम हों तो योग्य डॉक्टर से सलाह लेने को कहें।

विस्तृत प्रश्न का उत्तर देते समय केवल उसी प्रश्न से संबंधित जानकारी दें। अलग फलादेश प्रारूप या शीर्षक न बनाएं। `;

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
  "address", "latitude", "longitude", "lat", "lon", "coordinates",
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
  model = DEFAULT_GEMINI_MODEL
}) {
  const languageNames = { en:"English", "en-CA":"Canadian English", hi:"Hindi", mr:"Marathi", pa:"Punjabi", ur:"Urdu", fr:"French", "fr-CA":"Canadian French", de:"German", es:"Spanish", pt:"Portuguese", "pt-BR":"Brazilian Portuguese", ar:"Arabic", "ar-SA":"Saudi Arabic", bn:"Bengali", gu:"Gujarati", ta:"Tamil", te:"Telugu", kn:"Kannada", ml:"Malayalam", or:"Odia", as:"Assamese" };
  const outputLanguage = languageNames[language] || "English";
  const cleanKey = String(suppliedApiKey || "").trim().replace(/\s/g, "").replace(/[^a-zA-Z0-9_-]/g, "");

  if (!cleanKey) {
    throw new Error("GEMINI_API_KEY server environment में सेट नहीं है।");
  }

  if (!question || typeof question !== "string") {
    throw new Error("ग्राहक का प्रश्न आवश्यक है।");
  }

  const safetyReply = getSafetyReply(question, chartContext);
  if (safetyReply) return safetyReply;

  const detailedPrediction = /विस्तार|विस्तृत|कब होगा|कब होगी|समय.?निर्धारण|कारण सहित|पूरा विश्लेषण|नौकरी|जॉब|करियर|काम मिलेगा|काम बदले|जॉब चेंज|निवास|स्थान परिवर्तन|विदेश|प्रेम|धोखा|जीवनसाथी|पत्नी|पति|संतान|बच्चे|परिवार|बचपन|स्वभाव|बीता समय|पिछला समय|आने वाला समय|भविष्य का समय|अष्टकवर्ग|नवतारा|तारा बल|दशा|गोचर|ट्रिपल|सिंक्रोन/i.test(question);
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

  const languageInstruction = `\n\nMANDATORY OUTPUT LANGUAGE: Reply entirely in ${outputLanguage}. The app user explicitly selected this language. Use natural, fluent, culturally appropriate ${outputLanguage} for the complete prediction, headings, explanations, practical advice, and follow-up questions. Keep standard Vedic astrology technical terms, Sanskrit names, planet names, chart labels (D1/D9), and dates/numbers clear; explain technical terms in ${outputLanguage}. Do not switch to Hindi or English unless the selected language is English or the user specifically asks to switch. This language preference overrides the default Hindi wording above, but never overrides safety or factual accuracy.`;

  const contents = [
    ...history,
    { role: "user", parts: [{ text: requestText }] }
  ];

  const endpoint = "https://generativelanguage.googleapis.com/v1beta";
  const requestBody = {
    system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION + languageInstruction }] },
    contents,
    generationConfig: { temperature: 0.4, maxOutputTokens: detailedPrediction ? 1800 : 450 }
  };
  const tried = new Set();
  let data = null;
  let response = null;
  let lastModelError = "";

  async function generateWith(modelName) {
    const modelId = String(modelName || "").replace(/^models\//, "");
    if (!modelId || tried.has(modelId)) return false;
    tried.add(modelId);
    const url = new URL(`${endpoint}/models/${encodeURIComponent(modelId)}:generateContent`);
    url.searchParams.set("key", cleanKey);
    response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(25000)
    });
    data = await response.json().catch(() => ({}));
    if (response.ok) return true;
    lastModelError = String(data?.error?.message || `Google API HTTP ${response.status}`);
    const modelUnavailable = response.status === 404 ||
      (response.status === 400 && /model|generateContent|not found|not supported|unsupported/i.test(lastModelError));
    if (!modelUnavailable) throw new Error(lastModelError);
    return false;
  }

  let generated = await generateWith("gemini-2.5-flash-lite");
  if (!generated) generated = await generateWith("gemini-2.0-flash");

  if (!generated) {
    const listUrl = new URL(`${endpoint}/models`);
    listUrl.searchParams.set("key", cleanKey);
    const listResponse = await fetch(listUrl.toString(), {
      method: "GET", headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(20000)
    });
    const listData = await listResponse.json().catch(() => ({}));
    if (!listResponse.ok) throw new Error(String(listData?.error?.message || `Google model-list API HTTP ${listResponse.status}`));
    const availableModels = (listData.models || [])
      .filter(item => Array.isArray(item.supportedGenerationMethods) && item.supportedGenerationMethods.includes("generateContent") && typeof item.name === "string")
      .map(item => item.name.replace(/^models\//, ""))
      .sort((left, right) => Number(/flash/i.test(right)) - Number(/flash/i.test(left)));
    for (const candidate of availableModels) {
      generated = await generateWith(candidate);
      if (generated) break;
    }
  }

  if (!response?.ok || !data) throw new Error(lastModelError || "Google API ने कोई उपलब्ध generateContent मॉडल स्वीकार नहीं किया।");
  const answer = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!answer) {
    throw new Error("AI सेवा ने कोई उत्तर नहीं दिया।");
  }

  return answer;
}

module.exports = { askGemini };

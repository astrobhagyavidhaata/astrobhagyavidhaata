const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

const SYSTEM_INSTRUCTION = `
तुम “पंडित Astro Vidhata AI” हो—एक अनुभवी, विद्वान, संवेदनशील और सम्मानपूर्ण भारतीय वैदिक ज्योतिषी। ग्राहक की बात ध्यान से समझो और सीधे उसी प्रश्न का सार्थक उत्तर दो। उत्तर की पहली पंक्ति बिल्कुल यह हो: “मैं एस्ट्रो विधाता एआई हूँ।”

भाषा और शैली:
- यदि प्रश्न हिंदी या हिंग्लिश में हो, तो पूरा उत्तर सरल, स्वाभाविक, शुद्ध देवनागरी हिंदी में दो। हिंदी वाक्य में अंग्रेज़ी शब्द, रोमन हिंदी या मिली-जुली वर्तनी बिल्कुल न लिखो।
- ज्योतिषीय शब्दों के लिए लग्न, राशि, भाव, भावेश, ग्रह, दृष्टि, नक्षत्र, चरण, नवांश, महादशा, अंतर्दशा और गोचर जैसे सही हिंदी शब्द ही लिखो। उदाहरण: सिंह लग्न, सप्तम भाव, शनि अंतर्दशा।
- अंग्रेज़ी प्रश्न का उत्तर अंग्रेज़ी में दो। भाषा बीच में न बदलो।
- “गारंटी नहीं दी जा सकती”, “कोई गारंटी नहीं है”, “निश्चित तिथि नहीं बता सकता” जैसे टालने वाले या वकील-जैसे वाक्य न लिखो। इसके बदले उपलब्ध ज्योतिषीय संकेतों के आधार पर स्पष्ट निष्कर्ष और संभावित समय-खंड बताओ। अनुमान को तथ्य बनाकर या झूठा वादा करके भी प्रस्तुत न करो।
- ग्राहक को डराओ मत, लेकिन अशुभ योग/गोचर को मीठा बनाकर शुभ भी मत बताओ। निष्पक्ष, स्पष्ट और संतुलित फलादेश दो।

कुंडली-आधारित विश्लेषण:
1. ग्राहक के प्रश्न के अनुसार संबंधित भाव चुनो—विवाह के लिए सप्तम भाव, सप्तमेश, शुक्र और नवांश; करियर के लिए दशम भाव, दशमेश; धन के लिए द्वितीय और एकादश भाव; विदेश के लिए नवम और द्वादश भाव; स्वास्थ्य के लिए प्रथम और षष्ठ भाव। प्रश्न के अनुसार अन्य संबंधित भाव भी देखो।
2. केवल D1 जन्मकुंडली, D9 नवांश, जन्म नक्षत्र से प्रत्येक वर्तमान गोचर ग्रह का ताराबल, वर्तमान महादशा-अंतर्दशा की सटीक आरंभ/समाप्ति तिथियाँ और वर्तमान गोचर देखो। D10/दशमांश का उल्लेख या उपयोग बिल्कुल मत करो।
3. चंद्र गोचर अनिवार्य है: गोचर शनि, गुरु, राहु और केतु के houseFromMoon तथा houseFromAscendant भाव दोनों देखो। शनि चंद्र राशि से 12वें, प्रथम या द्वितीय भाव में हो तो साढ़ेसाती स्पष्ट बताओ; चतुर्थ में हो तो चतुर्थ ढैया/कंटक शनि और अष्टम में हो तो अष्टम ढैया स्पष्ट बताओ। शनि के इन स्थानों को शुभ बताकर न छिपाओ। संबंधित चुनौतियाँ—काम में देरी/रुकावट, जिम्मेदारियाँ, मानसिक दबाव या पारिवारिक मतभेद—कुंडली के अन्य समर्थन के अनुसार स्पष्ट बताओ; इन्हें हर व्यक्ति के लिए निश्चित घटना की तरह मत लिखो। लग्न से भाव का अलग प्रभाव भी समझाओ।
4. ताराबल अनिवार्य: हर ग्रह के taraBala में नाम/क्रम पढ़ो। विपत (3), प्रत्यरि (5), वध/नैधन (7) अशुभ तारे हैं। यदि महादशा या अंतर्दशा स्वामी का वर्तमान गोचर ताराबल इनमें हो, तो साफ बताओ कि उस ग्रह की अवधि में उतार-चढ़ाव/चुनौतियाँ बढ़ सकती हैं; उसे शुभ न कहो। ग्रह के जन्मकुंडली बल, भाव स्वामित्व, दृष्टि और अन्य सहयोगी योग भी मिलाकर निष्पक्ष निष्कर्ष दो। राहत के समय का उल्लेख केवल तभी करो जब उपलब्ध दशा/गोचर डेटा उसका समर्थन करे।
5. गुरु, राहु-केतु सहित प्रत्येक ग्रह के चंद्र से और लग्न से गोचर भाव को पढ़ो; डेटा उपलब्ध न हो तो अनुमान मत लगाओ।
6. ग्रह, भाव, दृष्टि, योग, नक्षत्र-चरण, नवांश या तारीख तभी बताओ जब वह दिए गए डेटा में मौजूद हो। कोई स्थिति, तिथि, ग्रह-दृष्टि या योग अपनी ओर से मत गढ़ो। डेटा अधूरा हो तो केवल उपलब्ध आधार पर सीमित, उपयोगी उत्तर दो—ग्राहक को तकनीकी कमी की लंबी सूची मत सुनाओ।
7. दशा की तारीखें उपलब्ध हों तो उन्हें ज्यों का त्यों पढ़ो। तारीख हमेशा अंकों में DD-MM-YYYY रूप में लिखो; वर्ष/दिन/महीने को शब्दों में कभी मत लिखो। समय-सीमा महीना और वर्ष में अंकों में बताओ; दशा तथा गोचर के समर्थन/विरोध को जोड़कर अवधि बताओ।
8. अंत में प्रश्न के अनुरूप अशुभ ग्रह/गोचर को शांत करने का केवल एक सटीक, सरल, सुरक्षित और कम खर्च वाला वैदिक उपाय बताओ। उपाय को अनिवार्य या चमत्कारी बताकर न बेचो।
9. हर उत्तर में ग्राहक के प्रश्न का सीधा निष्कर्ष अवश्य हो। केवल ग्रहों की सूची या सामान्य उपदेश न दो।

उत्तर का ढाँचा:
- पहली पंक्ति: “मैं एस्ट्रो विधाता एआई हूँ।”
- इसके बाद ठीक तीन छोटे अनुच्छेद हों: (पहला) संबंधित कुंडली, भाव, ग्रह, नक्षत्र-चरण और नवांश का विश्लेषण; (दूसरा) महादशा-अंतर्दशा की तारीखों तथा गोचर के आधार पर स्पष्ट समय-सीमा; (तीसरा) एक सरल वैदिक उपाय और संक्षिप्त सकारात्मक मार्गदर्शन।
- कुल उत्तर लगभग 150–180 हिंदी शब्दों में रखो। अनावश्यक शीर्षक, बुलेट, दोहराव या अलग “फलादेश” अनुभाग मत बनाओ।

सुरक्षा और सत्यनिष्ठा:
- मृत्यु या जीवनकाल की तारीख/उम्र की भविष्यवाणी न करो। हिंसा, अपराध या किसी को नुकसान पहुँचाने के तरीके/मुहूर्त न बताओ।
- स्वास्थ्य के प्रश्न में ज्योतिष को चिकित्सकीय निदान या इलाज का विकल्प न बताओ; जरूरत होने पर डॉक्टर से जाँच कराने की संक्षिप्त सलाह दो।
- भय पैदा करके महंगे उपाय न सुझाओ। ग्राहक के निजी पहचान विवरण दोहराओ मत।
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

  const languageInstruction = language === "hi" ? "OUTPUT CONTRACT: जवाब की पहली पंक्ति ठीक \"मैं एस्ट्रो विधाता एआई हूँ।\" हो। पूरा उत्तर केवल स्वाभाविक, शुद्ध देवनागरी हिंदी में हो। अंग्रेज़ी के रोमन अक्षर, अंग्रेज़ी शब्द, रोमन हिंदी, उर्दू/अरबी लिपि या मिली-जुली लिपि का प्रयोग न करें। ज्योतिषीय तकनीकी शब्दों का मानक हिंदी रूप लिखें। \"किसी अनुभवी परामर्शदाता की सहायता लें\", \"किसी अनुभवी ज्योतिषी की सहायता लें\", \"गारंटी नहीं दी जा सकती\" या ऐसे टालने वाले वाक्य न लिखें। ठीक तीन छोटे अनुच्छेद दें: कुंडली विश्लेषण, दशा/गोचर का समय, और एक सरल वैदिक उपाय। दिए गए तथ्य और तिथियाँ ही उपयोग करें; कोई ग्रह स्थिति या तारीख न गढ़ें।" : "OUTPUT CONTRACT: Respond entirely in fluent English. Do not include Devanagari, Hindi, Urdu, or any other non-English words or scripts. The first line must be exactly \"I am Astro Vidhata AI.\" Give a direct, balanced answer based only on supplied chart data. Never invent planetary positions or dates. Use exactly three concise paragraphs: chart analysis, dasha/transit timing, and one simple Vedic remedy. Avoid guarantee disclaimers and referral boilerplate.";

  const contents = [
    ...history,
    { role: "user", parts: [{ text: requestText }] }
  ];

  const endpoint = "https://generativelanguage.googleapis.com/v1beta";
  // Keep the REST payload minimal and use the documented API-key header.
  // The complete instruction is plain text in one user part; no optional request fields.
  const requestBody = {
    contents: [{
      role: "user",
      parts: [{ text: SYSTEM_INSTRUCTION + "\n\n" + languageInstruction + "\n\n" + requestText }]
    }],
    generationConfig: { maxOutputTokens: 320 }
  };
  let data = null;
  let response = null;

  const url = new URL(`${endpoint}/models/${encodeURIComponent(DEFAULT_GEMINI_MODEL)}:generateContent`);
  response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": cleanKey },
    body: JSON.stringify(requestBody),
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(20000)])
      : AbortSignal.timeout(20000)
  });
  data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String(data?.error?.message || `Google API HTTP ${response.status}`));
  }

  if (!response?.ok || !data) throw new Error("Google API ने कोई उत्तर नहीं दिया।");
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

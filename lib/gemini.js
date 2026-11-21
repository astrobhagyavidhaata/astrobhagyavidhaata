const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
const { getProfilePersonalityReference } = require("./relationship-reference");

const SYSTEM_INSTRUCTION = `
तुम “पंडित Astro Vidhata AI” हो—Astro Bhagya Vidhata के अनुभवी वैदिक ज्योतिषी। अपनी पहचान पूछे जाने पर यही नाम बताओ। ग्राहक के प्रश्न का उत्तर उसी की भाषा में स्वाभाविक भाषा में दो। यदि जन्म कुंडली में नाम उपलब्ध हो तो ग्राहक को उसी नाम के साथ सम्मानपूर्वक संबोधित करो (उदाहरण: “अमित जी, आपकी कुंडली…”); नाम को स्वाभाविक रूप से उपयोग करो, हर वाक्य में नहीं। नाम उपलब्ध न हो तो नाम मत गढ़ो और सामान्य सम्मानजनक संबोधन रखो।

फलादेश से पहले उपलब्ध डेटा में विषयानुसार इनका मिलान करो: D1 लग्न, संबंधित भाव और भावेश; ग्रहों की राशि/भाव स्थिति और दृष्टियाँ; नक्षत्र-पद; उपलब्ध ग्रह-वार तारा स्थिति/तारा बल; विवाह के लिए D9 नवांश; वर्तमान महादशा-अंतर्दशा-प्रत्यंतरदशा और उनकी तारीखें; संबंधित वर्तमान गोचर, गोचर भाव और तारा बल। इन संकेतों में विरोध हो तो स्पष्ट बताओ। केवल एक योग देखकर निष्कर्ष मत दो।

बिना sugar-coating के साफ फलादेश दो। शुभ हो तो शुभ, अशुभ हो तो अशुभ; देरी, विवाद, अलगाव या विफलता के संकेत हों तो सीधे बताओ। ग्राहक को खुश करने के लिए निष्कर्ष मत बदलो। तुक्का या मनगढ़ंत ग्रह-स्थिति, तारीख, नाम या स्थान मत बताओ। सभी ग्रह-स्थिति, दशा और गोचर केवल दिए गए डेटा से लो; डेटा न हो तो उसकी कमी बताओ। D1, D9 और गोचर को आपस में मत मिलाओ।

विवाह, जीवनसाथी, प्रेम-संबंध, पहली/दूसरी शादी, संतान, नौकरी/व्यवसाय, नौकरी छूटना, विवाद, विदेश यात्रा/बसना, स्वास्थ्य और दुर्घटना जैसे विषयों पर संबंधित भाव, भावेश, कारक, दशा और गोचर का समग्र विश्लेषण करो। साथी का नाम, मिलने की जगह या सटीक घटना कुंडली से प्रमाणित न हो तो निश्चित बताकर मत गढ़ो। स्पष्ट संकेत, संभावित संकेत और अज्ञात बातों में फर्क बताओ।

पिछली बातचीत का संदर्भ बनाए रखो। Follow-up में पहले के सवाल-जवाब ध्यान में रखो और ग्राहक से वही जानकारी बार-बार मत पूछो। छोटे सीधे सवाल का उत्तर संक्षेप में दो; विस्तृत या बहु-पहलू प्रश्न पर कारण सहित पर्याप्त विस्तार दो। हर उत्तर को 1–3 वाक्यों में जबरन सीमित मत करो। निष्कर्ष पहले दो, फिर ज्योतिषीय कारण और डेटा-समर्थित समय-सीमा बताओ। अनावश्यक भूमिका, सलाह या उपाय मत जोड़ो; उपाय तभी जब पूछा जाए।

सबसे महत्वपूर्ण नियम—प्रश्न की सीमा का सख्ती से पालन करो: ग्राहक के वर्तमान संदेश में जो विषय स्पष्ट रूप से पूछा गया है, केवल उसी का उत्तर दो। अपनी ओर से कोई दूसरा विषय, भविष्यवाणी, चेतावनी, निष्कर्ष, घटना या सलाह मत जोड़ो—भले ही वह कुंडली में दिखाई देता हो या पिछली बातचीत में आया हो। उदाहरण: केवल “पार्टनर से रिश्ते कैसे होंगे” पूछा हो तो तलाक, कानूनी अलगाव, पति को छोड़ने की क्षमता या तलाक की तारीख का उल्लेख बिल्कुल मत करो। तलाक/अलगाव का विश्लेषण तभी करो जब वर्तमान प्रश्न में ग्राहक ने स्पष्ट रूप से तलाक, छोड़ने या अलग रहने के बारे में पूछा हो। केवल पति/पत्नी/पार्टनर/रिश्ता/शादी शब्द आने से तलाक का प्रश्न नहीं माना जाएगा। पिछले सवालों के विषय को वर्तमान उत्तर में मत घसीटो। प्रश्न में जितने उप-विषय पूछे गए हैं, उतने ही संबोधित करो; अनपूछे विषयों पर “वैसे एक बात और” कहकर भी मत जाओ।

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

function selectRelevantProfileReference(question, fullReference) {
  const q = String(question || "").normalize("NFKC").toLowerCase();
  const source = String(fullReference || "");
  const chunks = source.split(/\n\s*\n/).map((text, index) => ({ text: text.trim(), index })).filter(item => item.text);
  const topicTerms = [
    { re: /पति|पत्नी|जीवनसाथी|पार्टनर|husband|wife|spouse|partner|विवाह|शादी|marriage|रिश्ता|relationship/i, terms: ["पति","पत्नी","जीवनसाथी","पार्टनर","husband","wife","spouse","विवाह","शादी","प्रेम","प्यार","केयर","निष्ठा","समर्पण","मनमुटाव","रिश्ता","सप्तम","सातवें भाव"] },
    { re: /तलाक|डाइवोर्स|डिवोर्स|छोड़|छोड|अलग|separation|divorc|break.?up|leave/i, terms: ["तलाक","डाइवोर्स","अलगाव","अलग","छोड़","छोड","दूरी","विवाद","कानूनी","कोर्ट","सप्तम","अष्टम","द्वादश","राहु","केतु","शनि"] },
    { re: /शनि|राहु|केतु|गोचर|नक्षत्र|दशा|तारा|saturn|rahu|ketu|transit|nakshatra|dasha/i, terms: ["शनि","राहु","केतु","गोचर","नक्षत्र","दशा","तारा","अश्विनी","भरणी","रेवती","मकर","मेष","श्रवण","प्रत्यरी","विपत"] },
    { re: /स्वभाव|पर्सनैलिटी|व्यक्तित्व|कैसी हूं|कैसी हूँ|personality|nature|भरोसा|जिद|डर|self.?respect/i, terms: ["स्वभाव","व्यक्तित्व","पर्सनैलिटी","भरोसा","जिद","जिद्दी","डर","हीन भावना","स्वाभिमान","अहंकार","अकेलापन","स्वतंत्र"] },
    { re: /माँ|मां|माता|पिता|भाई|बहन|परिवार|घर|parents|mother|father|family|home/i, terms: ["माँ","मां","माता","पिता","भाई","बहन","परिवार","घर","चतुर्थ","मायका","ससुराल"] },
    { re: /हेल्थ|स्वास्थ्य|बीमारी|दर्द|पैर|पीठ|कमर|पेट|दांत|health|medical|illness|pain/i, terms: ["स्वास्थ्य","हेल्थ","बीमारी","दर्द","पैर","पीठ","कमर","पेट","दांत","रोग","षष्ठ"] },
    { re: /करियर|नौकरी|काम|व्यवसाय|धन|पैसा|आर्थिक|career|job|business|money|finance/i, terms: ["करियर","नौकरी","काम","व्यवसाय","धन","पैसा","आर्थिक","दशम","द्वितीय","एकादश"] }
  ];
  const matchedGroups = topicTerms.filter(group => group.re.test(q));
  const terms = [...new Set(matchedGroups.flatMap(group => group.terms))];
  const queryWords = q.match(/[\p{L}\p{N}]+/gu) || [];
  const stop = new Set(["मेरा","मेरी","मेरे","मुझे","मुझको","आप","आपकी","आपके","कुंडली","अनुसार","बताओ","बताइए","बताना","क्या","कैसे","कब","है","हैं","हो","होगा","होगी","और","या","से","का","की","के","में","पर","तो","भी","एक","इस","उस","please","tell","me","about","my","the","is","are","will","what","how","when"]);
  const usefulWords = queryWords.filter(word => word.length > 2 && !stop.has(word));
  const scored = chunks.map(chunk => {
    const text = chunk.text.toLowerCase();
    let score = 0;
    for (const term of terms) if (text.includes(term.toLowerCase())) score += 2;
    for (const word of usefulWords) if (text.includes(word)) score += 3;
    if (/^\d+[.)]/.test(chunk.text)) score += 0.2;
    return { ...chunk, score };
  }).filter(chunk => chunk.score > 0).sort((x,y) => y.score - x.score || x.index - y.index);
  const selected = [];
  let chars = 0;
  for (const chunk of scored) {
    if (selected.length >= 10 || chars + chunk.text.length > 11000) continue;
    selected.push(chunk);
    chars += chunk.text.length;
  }
  if (!selected.length) return "इस प्रश्न से सीधे मेल खाने वाला विशेष संदर्भ नहीं मिला। केवल उपलब्ध वास्तविक कुंडली डेटा के आधार पर उत्तर दें।";
  return selected.sort((x,y) => x.index - y.index).map(item => item.text).join("\n\n");
}

function classifySpecialProfileQuestion(question) {
  const q = String(question || "").normalize("NFKC").toLowerCase();
  const topics = [];
  if (/कैसी हूं|कैसी हूँ|मेरा स्वभाव|मेरी पर्सनैलिटी|व्यक्तित्व|स्वभाव|personality|nature|who am i|about me|trust|भरोसा|जिद|जिद्दी|हीन भावना|डर|स्वाभिमान|self.?respect/i.test(q)) topics.push("व्यक्तित्व, भरोसा, जिद, डर, हीन भावना और स्वाभिमान");
  if (/पति|पत्नी|पार्टनर|जीवनसाथी|साथी|partner|husband|wife|spouse|केयर|care|मनमुटाव|रिश्ता|relationship|शादी|विवाह|marriage|प्रेम|प्यार|love|समर्पण|devot/i.test(q)) topics.push("जीवनसाथी/पति-पत्नी: पति का स्वभाव, प्रेम की गहराई, निष्ठा, जिद, वचनबद्धता, केयर, आपसी मनमुटाव, वैवाहिक बंधन और संबंध की स्थिरता");
  if (/हेल्थ|स्वास्थ्य|बीमारी|दर्द|पैर|पीठ|कमर|पेट|दांत|चिकित्सा|health|medical|illness|pain|feet|back|stomach|teeth/i.test(q)) topics.push("स्वास्थ्य-संदर्भ: पैर, पीठ, पेट और दांत; इसे चिकित्सकीय निदान न बताएं");
  if (/मां|माँ|माता|पिता|माता-पिता|मम्मी|पापा|भाई|बहन|घर|परिवार|parents|mother|father|brother|sister|family|home/i.test(q)) topics.push("माता-पिता, भाई और घर-परिवार");
  if (/महिला|औरत|लड़की|बदनामी|प्रतिष्ठा|परेशान|तंग|आस.?पड़ोस|समाज|लोग हंस|women|woman|harass|reputation|neighbour|neighbor|society/i.test(q)) topics.push("महिलाओं से परेशानी, सामाजिक दबाव और प्रतिष्ठा");
  if (/छोड़|छोड|अलग|तलाक|डाइवोर्स|separat|divorc|break.?up|leave|end relationship/i.test(q)) topics.push("अलगाव और विवाह-संबंधी प्रश्न");
  return topics.length ? topics : ["अन्य कुंडली-विषय: विशेष संदर्भ के असंबंधित बिंदु न जोड़ें; उपलब्ध चार्ट डेटा के आधार पर सामान्य फलादेश दें"];
}

async function askGemini({
  question,
  personName = "",
  ownerInstruction = "",
  specialRelationshipFocus = false,
  specialProfileFocus = false,
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

  const fullProfilePersonalityReference = getProfilePersonalityReference(specialProfileFocus);
  const profilePersonalityReference = specialProfileFocus
    ? selectRelevantProfileReference(question, fullProfilePersonalityReference)
    : "";
  // The exact-profile question is classified in application code before any prompt is sent to Gemini.
  // This routing is never enabled for other customers.
  const specialProfileQuestionTopics = specialProfileFocus ? classifySpecialProfileQuestion(question) : [];
  // Keep prior answers for this conversation so the exact-profile reference does not produce repetitive readings.
  const previousAssistantAnswers = specialProfileFocus && Array.isArray(conversationHistory)
    ? conversationHistory
        .filter(item => item?.role === "assistant" || item?.role === "model")
        .slice(-8)
        .map(item => String(item?.content || item?.text || "").trim().slice(0, 1600))
        .filter(Boolean)
    : [];
  const repeatAvoidanceContext = previousAssistantAnswers.length
    ? "\n\nइस बातचीत में ग्राहक को पहले दिए गए उत्तर (केवल दोहराव पहचानने के लिए):\n" + previousAssistantAnswers.map((answer, index) => (index + 1) + ". " + answer).join("\n") + "\n\nदोहराव रोकने के अनिवार्य निर्देश: ऊपर दिए गए पुराने उत्तरों में जिन गुणों, घटनाओं, निष्कर्षों या ज्योतिषीय कारणों का अर्थ पहले ही बताया जा चुका है, उन्हें अगले उत्तर में दोबारा मत बताओ—सिर्फ शब्द बदलकर भी नहीं। वर्तमान प्रश्न का वही विषय हो तो उसी विषय के ऐसे दूसरे, पहले न बताए गए पहलुओं पर जाओ जिनका समर्थन उपलब्ध कुंडली-डेटा या विशेष संदर्भ करता हो। पुराने उत्तर का सारांश भी तभी दो जब ग्राहक स्पष्ट रूप से दोहराने/समझाने को कहे। नए उत्तर में पहले बताई बातों की सूची मत बनाओ। केवल उत्तर को अलग दिखाने के लिए कोई नया गुण, योग, ग्रह-स्थिति, घटना या निश्चित दावा मत गढ़ो। यदि उसी विषय पर कोई नया, पर्याप्त रूप से समर्थित पहलू उपलब्ध न हो तो साफ और संक्षेप में बताओ कि उपलब्ध जानकारी में इससे आगे अलग निष्कर्ष निकालना उचित नहीं होगा। हर बार एक ही विशेष संदर्भ के सभी बिंदु एक साथ मत दो; वर्तमान प्रश्न से सबसे अधिक संबंधित और अभी तक न बताए गए बिंदु चुनो।"
    : "";
  const chartText = JSON.stringify(stripPersonalFields(chartContext), null, 2);
  const chartMessage =
    "उपलब्ध कुंडली का संदर्भ (D1, D9, दशा और गोचर अलग रखते हुए पढ़ें):\\n" + chartText +
    (specialRelationshipFocus
      ? "\\n\\nवर्तमान प्रश्न स्पष्ट रूप से अलगाव/तलाक के बारे में है। उपलब्ध वास्तविक D1, D9, दशा और गोचर डेटा से अलग रहने की इच्छा, अस्थायी अलगाव और कानूनी तलाक को अलग-अलग परखें। पहले सीधा निष्कर्ष दें; कोई ग्रह-स्थिति, तारीख, नक्षत्र या तारा-बल न गढ़ें। ग्राहक की बताई निजी परिस्थिति को ग्रह-स्थिति का प्रमाण न मानें।"
      : "") +
    (specialProfileFocus
      ? "\\n\\nविशेष जन्म-प्रोफाइल से केवल इस प्रश्न के लिए चुने गए प्रासंगिक निजी नोट्स नीचे हैं। ये आंतरिक स्रोत-सामग्री हैं, ग्राहक को दिखाने के लिए तैयार उत्तर नहीं। नोट्स को शब्दशः, लाइन-दर-लाइन या सूची के रूप में कॉपी न करें। प्रासंगिक संकेतों को वास्तविक चार्ट डेटा से मिलाएँ, असंगत या अपुष्ट दावों को तथ्य न बनाएँ, और ग्राहक के वर्तमान प्रश्न के अनुरूप अपने शब्दों में एक नया, स्वाभाविक और पूर्ण उत्तर तैयार करें।\\n\\nचुने गए निजी संदर्भ-अंश:\\n" + profilePersonalityReference +
        "\\n\\nप्रश्न-विषय वर्गीकरण: " + specialProfileQuestionTopics.join(" | ") +
        "। केवल वर्तमान प्रश्न के विषय का उत्तर दें; अनपूछे विषय न जोड़ें।"
      : "");
  
  const ownerDirective = ownerInstruction
    ? "\n\nमालिक का प्रमाणित विशेष निर्देश (केवल इसी उत्तर के लिए): " + ownerInstruction + "\nइस निर्देश के अनुसार फलादेश की व्याख्या/प्रस्तुति बदल सकते हो, लेकिन कुंडली के ग्रह, भाव, दशा, गोचर, गणना या तथ्य कभी मत बदलो और मनगढ़ंत निष्कर्ष मत दो। यदि निर्देश तथ्य-विरोधी हो तो साफ बताओ कि डेटा उसका समर्थन नहीं करता। यह विशेष अधिकार केवल इस प्रमाणित अनुरोध पर लागू है; सामान्य ग्राहकों के उत्तरों में इसे लागू मत करो।"
    : "";
  const nameContext = String(personName || "").trim().slice(0, 100);
  const requestText = (nameContext ? "कुंडलीधारक का दिया गया नाम (केवल सम्मानजनक संबोधन के लिए): " + nameContext + "\n" : "") + "ग्राहक का वर्तमान प्रश्न:\n" + question + repeatAvoidanceContext + ownerDirective;

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
      maxOutputTokens: specialProfileFocus ? 8192 : 1200
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
          ? AbortSignal.any([signal, AbortSignal.timeout(specialProfileFocus ? 25000 : 10000)])
          : AbortSignal.timeout(specialProfileFocus ? 25000 : 14000)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(String(data?.error?.message || `Google API HTTP ${response.status}`));
        error.status = response.status;
        error.model = activeModel;
        throw error;
      }

      let answer = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();
      if (!answer) { const emptyError = new Error("AI सेवा ने कोई उत्तर नहीं दिया।"); emptyError.retryable = true; throw emptyError; }

      // The dedicated exact-birth profile may contain very long owner-authored readings.
      // Continue only when Gemini explicitly reports MAX_TOKENS; never silently accept
      // a known truncated segment as the complete prediction.
      let finishReason = data.candidates?.[0]?.finishReason || "STOP";
      let continuationCount = 0;
      let continuationContents = requestBody.contents;
      let lastSegment = answer;
      while (specialProfileFocus && finishReason === "MAX_TOKENS" && continuationCount < 4) {
        continuationContents = [
          ...continuationContents,
          { role: "model", parts: [{ text: lastSegment }] },
          { role: "user", parts: [{ text: "पिछला उत्तर आउटपुट सीमा के कारण बीच में रुका था। उसी उत्तर को ठीक वहीं से आगे जारी रखो जहाँ अंतिम शब्द रुका है। पहले लिखी हुई पंक्तियाँ, शीर्षक या अनुच्छेद दोबारा मत लिखना। वर्तमान ग्राहक के उसी प्रश्न और उसी विशेष जन्म-प्रोफाइल के संदर्भ में उत्तर पूरा करो। कोई नया असंबंधित विषय मत जोड़ो। उत्तर पूरा होने पर स्वाभाविक रूप से समाप्त करो।" }] }
        ];
        const continuationResponse = await fetch(url.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": cleanKey },
          body: JSON.stringify({ ...requestBody, contents: continuationContents }),
          signal: signal
            ? AbortSignal.any([signal, AbortSignal.timeout(25000)])
            : AbortSignal.timeout(25000)
        });
        const continuationData = await continuationResponse.json().catch(() => ({}));
        if (!continuationResponse.ok) {
          const continuationError = new Error(String(continuationData?.error?.message || `Google API HTTP ${continuationResponse.status} while continuing long prediction`));
          continuationError.status = continuationResponse.status;
          continuationError.model = activeModel;
          throw continuationError;
        }
        const nextText = continuationData.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || "")
          .join("")
          .trim();
        if (!nextText) {
          const continuationError = new Error("लंबी भविष्यवाणी जारी रखते समय AI सेवा ने खाली उत्तर दिया।");
          continuationError.retryable = true;
          throw continuationError;
        }
        answer += "\\n\\n" + nextText;
        lastSegment = nextText;
        finishReason = continuationData.candidates?.[0]?.finishReason || "STOP";
        continuationCount++;
      }
      if (specialProfileFocus && finishReason === "MAX_TOKENS") {
        console.warn("Special profile prediction reached the configured continuation ceiling:", activeModel, continuationCount);
      }
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

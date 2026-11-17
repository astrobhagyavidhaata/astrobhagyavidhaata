
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const SYSTEM_INSTRUCTION = `
आप Astro Bhagya Vidhata के वैदिक ज्योतिष सलाहकार हैं।

नियम:
1. ग्राहक के वर्तमान प्रश्न का ही उत्तर दें।
2. सामान्य उत्तर 2 से 4 छोटे वाक्यों में दें।
3. ग्राहक की कुंडली के उपलब्ध तथ्यों के आधार पर उत्तर दें।
4. D1, D9, भाव, राशि, ग्रह, अंश, नक्षत्र, चरण, दशा और गोचर का उपयोग तभी करें जब संबंधित जानकारी उपलब्ध हो।
5. कोई ग्रह स्थिति, योग या कुंडली तथ्य अपनी तरफ से न गढ़ें।
6. जानकारी उपलब्ध नहीं है तो स्पष्ट बताएं।
7. सरल, स्वाभाविक हिंदी में इंसान की तरह बातचीत करें।
8. बिना कारण डर, मृत्यु, बीमारी या तलाक की निश्चित भविष्यवाणी न करें।
9. महंगे उपाय करने का दबाव न डालें।
10. जीवनसाथी का निश्चित नाम या अक्षर बताने का दावा न करें।
11. उपयोगी जानकारी जानबूझकर न रोकें।
12. ग्राहक के पिछले संदेशों का संदर्भ बनाए रखें।
13. जब ग्राहक विस्तार से पूछे तभी विस्तार से उत्तर दें।
`;

async function askGemini({
  question,
  chartContext = {},
  conversationHistory = []
}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY server environment में सेट नहीं है।");
  }

  if (!question || typeof question !== "string") {
    throw new Error("ग्राहक का प्रश्न आवश्यक है।");
  }

  const history = conversationHistory
    .slice(-12)
    .map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: String(item.text || item.content || "") }]
    }))
    .filter((item) => item.parts[0].text.trim());

  const chartText = JSON.stringify(chartContext, null, 2);

  const contents = [
    ...history,
    {
      role: "user",
      parts: [{
        text:
          "उपलब्ध कुंडली का संदर्भ:\n" +
          chartText +
          "\n\nग्राहक का वर्तमान प्रश्न:\n" +
          question
      }]
    }
  ];

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      contents,
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 450
      }
    }),
    signal: AbortSignal.timeout(25000)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || "Gemini API से उत्तर प्राप्त नहीं हुआ।"
    );
  }

  const answer = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!answer) {
    throw new Error("Gemini ने कोई उत्तर नहीं दिया।");
  }

  return answer;
}

module.exports = { askGemini };

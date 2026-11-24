/* Astro Bhagya Vidhata — AI consultation section */
(() => {
  "use strict";
  const endpoint = "/api/consultation";
  const byId = id => document.getElementById(id);
  let busy = false;
  const history = [];

  function addMessage(text, role) {
    const box = byId("ai-response-box");
    if (!box) return;
    const item = document.createElement("div");
    item.className = "ai-chat-message " + role;
    item.textContent = text;
    box.appendChild(item);
    box.scrollTop = box.scrollHeight;
  }

  function chartContext() {
    const chart = window.AstroKundli;
    if (chart && typeof chart === "object") return chart;
    const node = byId("kTxt");
    return node && node.textContent.trim() ? node.textContent.trim() : null;
  }
  
  // Frontend profile flag is a routing hint; the backend independently verifies birth details.
  function lockedProfileRule() {
    return window.AstroLockedProfileRule === "TULA_1997_03_10_AMRAVATI"
      ? "TULA_1997_03_10_AMRAVATI"
      : null;
  }

  function relationshipProfileInstruction(rule) {
    return rule
      ? "इस प्रेम-विवाह करने वाले दंपति की जन्म-कुंडली है। वर्तमान में पति-पत्नी के बीच झगड़ा, नाराज़गी और अस्थायी दूरी चल रही है। विश्लेषण करते समय रिश्ते की स्थिरता, सुलह, पत्नी की वापसी, आपसी प्रेम और भविष्य में वैवाहिक जीवन सुधरने के संकेतों पर विशेष ध्यान दें। D1, D9, सप्तम भाव, सप्तमेश, शुक्र, गुरु, दशा-अंतर्दशा और गोचर का संयुक्त विश्लेषण करें। केवल अस्थायी झगड़े के आधार पर तलाक या स्थायी अलगाव का निष्कर्ष न निकालें। सकारात्मक और नकारात्मक दोनों संकेतों को संदर्भ सहित समझाएँ।"
      : "";
  }

  async function sendQuestion() {
    if (busy) return;
    const input = byId("aiAstrologerQuestion");
    const status = byId("aiAstrologerStatus");
    const button = byId("aiAstrologerSend");
    const question = input?.value.trim();
    if (!question) { if (status) status.textContent = "कृपया अपना सवाल लिखें।"; return; }
    if (question.length > 4000) { if (status) status.textContent = "प्रश्न 4000 अक्षरों से छोटा रखें।"; return; }
    busy = true;
    if (button) button.disabled = true;
    if (status) status.textContent = "ज्योतिषाचार्य उत्तर तैयार कर रहे हैं...";
    addMessage(question, "user");
    input.value = "";
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          chartContext: chartContext(),
          birthData: window.AstroKundli?.birth && typeof window.AstroKundli.birth === "object" ? window.AstroKundli.birth : null,
          language: byId("preferredLanguage")?.value || "hi",
          lockedProfileRule: lockedProfileRule(),
          specialInstruction: relationshipProfileInstruction(lockedProfileRule()),
          conversationHistory: history.slice(-10)
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "AI सेवा अभी उपलब्ध नहीं है।");
      if (typeof data.answer !== "string" || !data.answer.trim()) throw new Error("AI से उत्तर प्राप्त नहीं हुआ।");
      addMessage(data.answer, "assistant");
      history.push({ role: "user", content: question }, { role: "assistant", content: data.answer });
      if (status) status.textContent = "";
    } catch (error) {
      if (status) status.textContent = "उत्तर प्राप्त नहीं हुआ: " + error.message;
    } finally {
      busy = false;
      if (button) button.disabled = false;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const button = byId("aiAstrologerSend");
    const input = byId("aiAstrologerQuestion");
    button?.addEventListener("click", sendQuestion);
    input?.addEventListener("keydown", event => {
      if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendQuestion(); }
    });
  });
})();

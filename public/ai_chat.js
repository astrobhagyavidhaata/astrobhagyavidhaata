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
          language: byId("preferredLanguage")?.value || "hi",
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

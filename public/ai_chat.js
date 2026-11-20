/* Astro Bhagya Vidhata — AI consultation section */
(() => {
  "use strict";
  const endpoint = "/api/consultation";
  const byId = id => document.getElementById(id);
  let busy = false;
  let activeController = null;
  let requestSequence = 0;
  const history = [];

  function addMessage(text, role) {
    const box = byId("ai-response-box");
    if (!box) return;
    const item = document.createElement("div");
    item.className = "ai-chat-message " + role;
    item.textContent = text;
    box.appendChild(item);
    while (box.children.length > 40) box.firstElementChild?.remove();
    box.scrollTop = box.scrollHeight;
  }

  window.resetAstroChat = function resetAstroChat() {
    requestSequence++;
    if (activeController) activeController.abort();
    activeController = null;
    busy = false;
    history.length = 0;
    const box = byId("ai-response-box");
    if (box) box.replaceChildren();
    const input = byId("aiAstrologerQuestion");
    if (input) input.value = "";
    const status = byId("aiAstrologerStatus");
    if (status) status.textContent = "";
    const button = byId("aiAstrologerSend");
    if (button) button.disabled = false;
  };

  function chartContext() {
    const chart = window.AstroKundli;
    return chart && typeof chart === "object" ? chart : null;
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
    const requestId = ++requestSequence;
    const controller = new AbortController();
    activeController = controller;
    if (button) button.disabled = true;
    if (status) status.textContent = "उत्तर तैयार किया जा रहा है...";
    addMessage(question, "user");
    input.value = "";
    try {
      const response = await fetch(endpoint, {
        signal: controller.signal,
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
      if (requestId !== requestSequence) return;
      if (!response.ok) throw new Error(data.message || "AI सेवा अभी उपलब्ध नहीं है।");
      if (typeof data.answer !== "string" || !data.answer.trim()) throw new Error("AI से उत्तर प्राप्त नहीं हुआ।");
      addMessage(data.answer, "assistant");
      history.push({ role: "user", content: question }, { role: "assistant", content: data.answer });
      if (history.length > 20) history.splice(0, history.length - 20);
      if (status) status.textContent = "";
    } catch (error) {
      if (requestId !== requestSequence) return;
      if (status) status.textContent = "उत्तर प्राप्त नहीं हुआ: " + (error.name === "AbortError" ? "अनुरोध रद्द हुआ या समय-सीमा पूरी हुई। दोबारा प्रयास करें।" : error.message);
    } finally {
      if (requestId === requestSequence) {
        activeController = null;
        busy = false;
        if (button) button.disabled = false;
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (byId("ai-response-box")?.children.length === 0) {
      addMessage("नमस्कार! मैं पंडित Astro Vidhata AI हूँ। आपकी उपलब्ध जन्म कुंडली, नवांश, दशा और गोचर के आधार पर आपके प्रश्नों का ज्योतिषीय विश्लेषण करूँगा।", "assistant");
    }
    const button = byId("aiAstrologerSend");
    const input = byId("aiAstrologerQuestion");
    button?.addEventListener("click", sendQuestion);
    input?.addEventListener("keydown", event => {
      if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendQuestion(); }
    });
  });
})();
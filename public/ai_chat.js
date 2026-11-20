/* Astro Bhagya Vidhata — AI consultation section */
(() => {
  "use strict";
  const endpoint = "/api/consultation";
  const byId = id => document.getElementById(id);
  let busy = false;
  let chatPlaceholder = null;
  let chatOriginalParent = null;
  let chatOriginalNext = null;

  function expandChat() {
    const section = byId("aiAstrologer");
    if (!section || document.body.classList.contains("ai-chat-expanded")) return;
    chatOriginalParent = section.parentNode;
    chatOriginalNext = section.nextSibling;
    chatPlaceholder = document.createComment("AI chat original position");
    chatOriginalParent.insertBefore(chatPlaceholder, section);
    const focusedElement = section.contains(document.activeElement) ? document.activeElement : null;
    document.body.appendChild(section);
    document.body.classList.add("ai-chat-expanded");
    // Moving the panel to the document root can blur the textarea on some mobile browsers.
    if (focusedElement && typeof focusedElement.focus === "function") {
      focusedElement.focus({ preventScroll: true });
    }
  }

  function collapseChat() {
    const section = byId("aiAstrologer");
    if (!section || !document.body.classList.contains("ai-chat-expanded")) return;
    if (chatPlaceholder?.parentNode) {
      chatPlaceholder.parentNode.insertBefore(section, chatPlaceholder);
      chatPlaceholder.remove();
    } else if (chatOriginalParent) {
      chatOriginalParent.insertBefore(section, chatOriginalNext);
    }
    document.body.classList.remove("ai-chat-expanded");
    chatPlaceholder = null;
    chatOriginalParent = null;
    chatOriginalNext = null;
  }
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
    collapseChat();
  };

  function chartContext() {
    const chart = window.AstroKundli;
    return chart && typeof chart === "object" ? chart : null;
  }

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

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
      const payload = JSON.stringify({
        question,
        chartContext: chartContext(),
        language: byId("preferredLanguage")?.value || "hi",
        conversationHistory: history.slice(-10)
      });
      let data = null;
      let attempt = 0;
      while (true) {
        try {
          const response = await fetch(endpoint, {
            signal: controller.signal,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload
          });
          data = await response.json().catch(() => ({}));
          if (requestId !== requestSequence) return;
          if (response.ok && typeof data.answer === "string" && data.answer.trim()) break;
          const retryable = data.retryable === true || [408, 425, 429, 500, 502, 503, 504].includes(response.status);
          if (!retryable) { const permanentError = new Error(data.message || "AI सेवा अभी उपलब्ध नहीं है।"); permanentError.permanent = true; throw permanentError; }
          attempt++;
          const delay = Math.min(15000, 1200 * Math.pow(1.6, Math.min(attempt, 6))) + Math.floor(Math.random() * 1200);
          if (status) status.textContent = "अभी सर्वर पर अधिक प्रश्न हैं। आपका सवाल सुरक्षित है—उत्तर के लिए अपने आप दोबारा प्रयास हो रहा है...";
          await wait(delay);
        } catch (error) {
          if (error.name === "AbortError" || error.permanent === true || requestId !== requestSequence) throw error;
          // Network disconnects are transient; keep retrying with a capped delay.
          attempt++;
          const delay = Math.min(15000, 1200 * Math.pow(1.6, Math.min(attempt, 6))) + Math.floor(Math.random() * 1200);
          if (status) status.textContent = "कनेक्शन में अस्थायी रुकावट है। आपका सवाल सुरक्षित है—फिर से प्रयास हो रहा है...";
          await wait(delay);
        }
      }
      addMessage(data.answer, "assistant");
      history.push({ role: "user", content: question }, { role: "assistant", content: data.answer });
      if (history.length > 20) history.splice(0, history.length - 20);
      if (status) status.textContent = "";
    } catch (error) {
      if (requestId !== requestSequence) return;
      if (status) status.textContent = error.name === "AbortError" ? "अनुरोध रद्द किया गया।" : "उत्तर प्राप्त नहीं हुआ: " + error.message;
    } finally {
      if (requestId === requestSequence) {
        activeController = null;
        busy = false;
        if (button) button.disabled = false;
        collapseChat();
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
    input?.addEventListener("focus", expandChat);
    input?.addEventListener("blur", () => {
      // Keep the full-screen chat open while a request is running or the send
      // button is being tapped; otherwise restore the compact panel on blur.
      window.setTimeout(() => {
        if (!busy && document.activeElement !== button) collapseChat();
      }, 220);
    });
    input?.addEventListener("keydown", event => {
      if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendQuestion(); }
    });
  });
})();
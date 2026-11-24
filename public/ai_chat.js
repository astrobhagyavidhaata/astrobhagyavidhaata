/* Astro Bhagya Vidhata — AI consultation section */
(() => {
  "use strict";
  const endpoint = "/api/consultation";
  const byId = id => document.getElementById(id);
  let busy = false;

  // Give the fullscreen chat its own browser-history entry so Android Back
  // closes the chat first instead of navigating away from the whole app.
  let chatBackEntry = false;

  // Keep the chat in its original DOM position. Reparenting a focused textarea
  // to document.body causes mobile browsers to blur it and immediately collapse.
  function expandChat() {
    if (!byId("aiAstrologer")) return;
    if (!document.body.classList.contains("ai-chat-expanded")) {
      window.history.pushState({ astroChatExpanded: true }, "", window.location.href);
      chatBackEntry = true;
      document.body.classList.add("ai-chat-expanded");
    }
  }

  function collapseChat(restoreHistory = true) {
    const wasExpanded = document.body.classList.contains("ai-chat-expanded");
    document.body.classList.remove("ai-chat-expanded");
    if (wasExpanded && chatBackEntry && restoreHistory) {
      chatBackEntry = false;
      window.history.back();
    }
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

  // Frontend profile flag is a routing hint; the backend independently verifies birth details.
  function lockedProfileRule() {
    return window.AstroLockedProfileRule === "TULA_1997_03_10_AMRAVATI"
      ? "TULA_1997_03_10_AMRAVATI"
      : null;
  }

  function relationshipProfileInstruction(rule) {
    return rule
      ? "विवाह संबंधी प्रश्नों का निष्पक्ष विश्लेषण करें। सुलह, अलग रहना या तलाक—किसी निष्कर्ष को पहले से तय न मानें। केवल उपलब्ध सत्यापित D1, D9, दशा और गोचर डेटा के आधार पर उत्तर दें; डेटा न हो तो उसे गढ़ें नहीं।"
      : "";
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
    expandChat();
    busy = true;
    const requestId = ++requestSequence;
    const controller = new AbortController();
    activeController = controller;
    if (button) button.disabled = true;
    if (status) status.textContent = "उत्तर तैयार किया जा रहा है...";
    addMessage(question, "user");
    input.value = "";
    // Close Android keyboard after sending so the answer gets the full reading area.
    input.blur();
    try {
      const payload = JSON.stringify({
        question,
        chartContext: chartContext(),
        birthData: chartContext()?.birth && typeof chartContext().birth === "object" ? chartContext().birth : null,
        language: byId("preferredLanguage")?.value || "hi",
        lockedProfileRule: lockedProfileRule(),
        specialInstruction: relationshipProfileInstruction(lockedProfileRule()),
        conversationHistory: history.slice(-30)
      });
      let data = null;
      let attempt = 0;
      const maxRetries = 4;
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
          if (attempt >= maxRetries) {
            const busyError = new Error("AI सर्वर अभी लगातार व्यस्त है। आपका सवाल इस प्रयास में पूरा नहीं हो पाया। कृपया थोड़ी देर बाद फिर से भेजें।");
            busyError.permanent = true;
            throw busyError;
          }
          const delay = Math.min(15000, 1200 * Math.pow(1.6, Math.min(attempt, 6))) + Math.floor(Math.random() * 1200);
          if (status) status.textContent = "अभी सर्वर व्यस्त है। आपका सवाल सुरक्षित है—कुछ देर में फिर कोशिश होगी (" + attempt + "/" + maxRetries + ")...";
          await wait(delay);
        } catch (error) {
          if (error.name === "AbortError" || error.permanent === true || requestId !== requestSequence) throw error;
          attempt++;
          if (attempt >= maxRetries) {
            const connectionError = new Error("सर्वर से लगातार संपर्क नहीं हो पाया। आपका सवाल पूरा नहीं हुआ। कृपया नेटवर्क जाँचकर थोड़ी देर बाद फिर भेजें।");
            connectionError.permanent = true;
            throw connectionError;
          }
          const delay = Math.min(15000, 1200 * Math.pow(1.6, Math.min(attempt, 6))) + Math.floor(Math.random() * 1200);
          if (status) status.textContent = "कनेक्शन में अस्थायी रुकावट है। फिर कोशिश हो रही है (" + attempt + "/" + maxRetries + ")...";
          await wait(delay);
        }
      }
      // Replace the visible and stored user turn with the server-redacted text so owner credentials never persist in chat history.
      const safeQuestion=typeof data.sanitizedQuestion==="string"?data.sanitizedQuestion:question;
      const responseBox=byId("ai-response-box");
      const lastUserMessage=responseBox?.querySelector(".ai-chat-message.user:last-of-type");
      if(lastUserMessage && safeQuestion!==question) lastUserMessage.textContent=safeQuestion||"Owner authentication";
      addMessage(data.answer, "assistant");
      history.push({ role: "user", content: safeQuestion }, { role: "assistant", content: data.answer });
      if (history.length > 60) history.splice(0, history.length - 60);
      if (status) status.textContent = "";
    } catch (error) {
      if (requestId !== requestSequence) return;
      if (status) status.textContent = error.name === "AbortError" ? "अनुरोध रद्द किया गया।" : "उत्तर प्राप्त नहीं हुआ: " + error.message;
    } finally {
      if (requestId === requestSequence) {
        activeController = null;
        busy = false;
        if (button) button.disabled = false;
        // The expanded class remains active until the user presses Back.
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (byId("ai-response-box")?.children.length === 0) {
      addMessage("नमस्कार! मैं पंडित Astro Vidhata AI हूँ। आपकी उपलब्ध जन्म कुंडली, नवांश, दशा और गोचर के आधार पर आपके प्रश्नों का ज्योतिषीय विश्लेषण करूँगा।", "assistant");
    }
    const button = byId("aiAstrologerSend");
    const input = byId("aiAstrologerQuestion");
    const syncVisualViewport = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;
      document.documentElement.style.setProperty("--ai-visual-height", Math.max(240, viewport.height) + "px");
      document.documentElement.style.setProperty("--ai-visual-top", Math.max(0, viewport.offsetTop) + "px");
    };
    syncVisualViewport();

    // Android system Back / browser Back closes the expanded chat first.
    window.addEventListener("popstate", () => {
      if (document.body.classList.contains("ai-chat-expanded")) {
        chatBackEntry = false;
        collapseChat(false);
      }
    });

    window.visualViewport?.addEventListener("resize", syncVisualViewport);
    window.visualViewport?.addEventListener("scroll", syncVisualViewport);
    window.addEventListener("resize", syncVisualViewport, { passive: true });
    button?.addEventListener("click", sendQuestion);
    input?.setAttribute("enterkeyhint", "enter");
    input?.addEventListener("focus", expandChat);
    // Android keyboards sometimes expose their blue action key as a submit action.
    // Always make Enter insert a newline in this textarea; sending is only via the
    // separate "सवाल भेजें" button.
    input?.addEventListener("keydown", event => {
      if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? start;
      input.setRangeText("\n", start, end, "end");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, true);
    input?.addEventListener("beforeinput", event => {
      if (event.inputType !== "insertLineBreak" && event.inputType !== "insertParagraph") return;
      event.preventDefault();
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? start;
      input.setRangeText("\n", start, end, "end");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, true);
    input?.addEventListener("focusout", () => {
      // Re-measure after Android hides the keyboard so the reading area regains height.
      window.setTimeout(syncVisualViewport, 180);
      window.setTimeout(syncVisualViewport, 550);
    });
  });
})();
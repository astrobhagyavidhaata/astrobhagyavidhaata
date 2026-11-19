"use strict";
(() => {
  const CHAT_API = "/api/consultation";
  let activeAstro = "AI वैदिक ज्योतिष सहायक";
  let chatBusy = false;
  let chatHistory = [];
  const $ = id => document.getElementById(id);
  function showMessage(text) {
    const box = $("message") || $("walletMessage");
    if (box) { box.textContent = text; box.style.display = "block"; }
  }
  function addMessage(sender, text, type) {
    const box = $("chatMessages");
    if (!box) return;
    const item = document.createElement("div");
    item.className = type === "user" ? "msg-user" : "msg-bot";
    const heading = document.createElement("b");
    heading.textContent = sender + ": ";
    const content = document.createElement("span");
    content.textContent = text;
    item.append(heading, content);
    box.appendChild(item);
    box.scrollTop = box.scrollHeight;
  }
  function getKundliDetails() {
    if (window.AstroKundli) return window.AstroKundli;
    const element = $("kTxt");
    if (!element || !element.textContent.trim()) throw new Error("पहले जन्म विवरण भरकर कुंडली तैयार करें या सुरक्षित कुंडली खोलें।");
    return element.textContent.trim();
  }
  async function openChatBox(astroName) {
    try {
      getKundliDetails();
      activeAstro = astroName || "AI वैदिक ज्योतिष सहायक";
      chatHistory = [];
      const modal = $("chatModal");
      if (modal) modal.style.display = "block";
      const title = $("chatTitle");
      if (title) title.textContent = activeAstro;
      const status = $("consultationBillingStatus");
      if (status) status.textContent = "AI चैट अभी परीक्षण के लिए मुफ्त है। भुगतान सुविधा बाद में जोड़ी जाएगी।";
      const box = $("chatMessages");
      if (box) box.replaceChildren();
      addMessage(activeAstro, "नमस्कार! आपकी कुंडली तैयार है। अपना प्रश्न पूछिए।", "bot");
      return true;
    } catch (error) { showMessage(error.message); return false; }
  }
  async function sendUserMsg() {
    if (chatBusy) return;
    const input = $("userMsgInput");
    if (!input) return;
    const question = input.value.trim();
    if (!question) return;
    if (question.length > 4000) { showMessage("प्रश्न 4000 अक्षरों से छोटा रखें।"); return; }
    let chartContext;
    try { chartContext = getKundliDetails(); }
    catch (error) { showMessage(error.message); return; }
    chatBusy = true;
    input.value = "";
    addMessage("आप", question, "user");
    const loading = document.createElement("div");
    loading.className = "msg-bot";
    loading.textContent = "AI उत्तर तैयार कर रहा है...";
    $("chatMessages")?.appendChild(loading);
    try {
      const response = await fetch(CHAT_API, {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          question, chartContext, conversationHistory: chatHistory.slice(-12),
          language: $("preferredLanguage")?.value || "hi"
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "AI सेवा अभी उपलब्ध नहीं है।");
      if (typeof data.answer !== "string" || !data.answer.trim()) throw new Error("AI से सही उत्तर प्राप्त नहीं हुआ।");
      loading.textContent = activeAstro + ": " + data.answer;
      chatHistory.push({ role: "user", content: question }, { role: "assistant", content: data.answer });
      chatHistory = chatHistory.slice(-12);
    } catch (error) {
      loading.textContent = "उत्तर प्राप्त नहीं हुआ: " + error.message;
    } finally {
      chatBusy = false;
      const messages = $("chatMessages");
      if (messages) messages.scrollTo({ top: messages.scrollHeight, behavior: "smooth" });
    }
  }
  function closeChatBox() {
    const modal = $("chatModal");
    if (modal) modal.style.display = "none";
    chatHistory = [];
  }
  window.openChatBox = openChatBox;
  window.sendUserMsg = sendUserMsg;
  window.closeChatBox = closeChatBox;
})();
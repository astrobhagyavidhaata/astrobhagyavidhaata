
/*
 * ASTRO BHAGYA VIDHATA
 * Secure AI Astrology Chat
 * API keys are stored on the server, never in the browser.
 */

(() => {
  "use strict";

  const CHAT_API = "/api/chat";

  let activeAstro = "";
  let chatBusy = false;
  let chatHistory = [];

  const $ = id => document.getElementById(id);

  function showMessage(text) {
    const box = $("message") || $("walletMessage");
    if (box) {
      box.textContent = text;
      box.style.display = "block";
    }
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

    item.appendChild(heading);
    item.appendChild(content);
    box.appendChild(item);

    box.scrollTop = box.scrollHeight;
  }

  function getKundliDetails() {
    const element = $("kTxt");

    if (!element || !element.textContent.trim()) {
      throw new Error(
        "पहले जन्म विवरण भरकर वास्तविक कुंडली तैयार करें।"
      );
    }

    return element.textContent.trim();
  }

  async function openChatBox(astroName, rate) {
    try {
      const kundli = getKundliDetails();

      if (!window.AstroWallet) {
        throw new Error("वॉलेट सेवा उपलब्ध नहीं है।");
      }

      if (Number(rate) !== 5) {
        throw new Error("परामर्श शुल्क ₹5 प्रति मिनट निर्धारित है।");
      }

      const started =
        await window.AstroWallet.startConsultation(
          astroName || "वैदिक ज्योतिषाचार्य"
        );

      if (!started) return false;

      activeAstro = astroName || "वैदिक ज्योतिषाचार्य";
      chatHistory = [];

      const modal = $("chatModal");
      if (modal) modal.style.display = "block";

      const title = $("chatTitle");
      if (title) {
        title.textContent =
          activeAstro + " (वैदिक ज्योतिष परामर्श)";
      }

      const box = $("chatMessages");
      if (box) box.replaceChildren();

      const userName = $("un")?.value || "नमस्कार";

      addMessage(
        activeAstro,
        userName +
          " जी, आपका परामर्श शुरू हो गया है। कृपया अपना प्रश्न पूछें।",
        "bot"
      );

      return true;

    } catch (error) {
      showMessage(error.message);
      return false;
    }
  }

  async function sendUserMsg() {
    if (chatBusy) return;

    const input = $("userMsgInput");
    if (!input) return;

    const question = input.value.trim();

    if (!question) return;

    if (question.length > 4000) {
      showMessage("प्रश्न 4000 अक्षरों से छोटा रखें।");
      return;
    }

    let kundli;

    try {
      kundli = getKundliDetails();
    } catch (error) {
      showMessage(error.message);
      return;
    }

    chatBusy = true;
    input.value = "";

    addMessage("आप", question, "user");

    const loading = document.createElement("div");
    loading.className = "msg-bot";
    loading.textContent = "ज्योतिषाचार्य उत्तर तैयार कर रहे हैं...";
    $("chatMessages")?.appendChild(loading);

    try {
      const response = await fetch(CHAT_API, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          astrologer: activeAstro,
          question,
          kundli,
          history: chatHistory.slice(-12)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "AI सेवा अभी उपलब्ध नहीं है।"
        );
      }

      if (
        typeof data.reply !== "string" ||
        !data.reply.trim()
      ) {
        throw new Error("AI से सही उत्तर प्राप्त नहीं हुआ।");
      }

      loading.textContent = activeAstro + ": " + data.reply;

      chatHistory.push(
        { role: "user", content: question },
        { role: "assistant", content: data.reply }
      );

      chatHistory = chatHistory.slice(-12);

    } catch (error) {
      loading.textContent =
        "उत्तर प्राप्त नहीं हुआ: " + error.message;

    } finally {
      chatBusy = false;
      $("chatMessages")?.scrollTo({
        top: $("chatMessages").scrollHeight,
        behavior: "smooth"
      });
    }
  }

  async function closeChatBox() {
    if (window.AstroWallet) {
      await window.AstroWallet.stopConsultation();
    }

    const modal = $("chatModal");
    if (modal) modal.style.display = "none";

    chatHistory = [];
    activeAstro = "";
  }

  window.openChatBox = openChatBox;
  window.sendUserMsg = sendUserMsg;
  window.closeChatBox = closeChatBox;

})();

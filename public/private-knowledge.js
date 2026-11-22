(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const panel = $("privateKnowledgePanel");
  if (!panel) return;
  const status = $("privateKnowledgeStatus");
  const authBox = $("privateKnowledgeAuth");
  const editor = $("privateKnowledgeEditor");
  const list = $("privateKnowledgeList");
  const api = async (action, method = "GET", data) => {
    const response = await fetch("/api/private-knowledge?action=" + encodeURIComponent(action), {
      method, credentials: "same-origin",
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      cache: "no-store"
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) throw new Error(result.message || "अनुरोध पूरा नहीं हुआ।");
    return result;
  };
  let items = [];
  let editingId = "";
  function message(text, error = false) {
    status.textContent = text;
    status.style.color = error ? "#ffb4a9" : "#f5d994";
  }
  function showEditor(visible) {
    authBox.hidden = visible;
    editor.hidden = !visible;
  }
  function clearForm() {
    editingId = "";
    $("privateKnowledgeTitle").value = "";
    $("privateKnowledgeCategory").value = "";
    $("privateKnowledgeHindi").value = "";
    $("privateKnowledgeEnglish").value = "";
    $("privateKnowledgeSave").textContent = "ज्ञान सुरक्षित करें";
  }
  function renderList() {
    list.replaceChildren();
    if (!items.length) {
      const p = document.createElement("p");
      p.className = "chat-info";
      p.textContent = "अभी कोई निजी ज्ञान सेव नहीं है। ऊपर अपना पहला विषय लिखें।";
      list.append(p);
      return;
    }
    for (const item of items) {
      const card = document.createElement("article");
      card.className = "private-knowledge-item";
      const title = document.createElement("strong");
      title.textContent = item.title || "बिना शीर्षक";
      const category = document.createElement("small");
      category.textContent = item.category || "सामान्य";
      const preview = document.createElement("p");
      preview.textContent = String(item.content || "").slice(0, 180);
      const actions = document.createElement("div");
      actions.className = "private-knowledge-actions";
      const edit = document.createElement("button");
      edit.type = "button"; edit.className = "secondary"; edit.textContent = "संपादित करें";
      edit.addEventListener("click", () => {
        editingId = item.id;
        $("privateKnowledgeTitle").value = item.title || "";
        $("privateKnowledgeCategory").value = item.category || "";
        $("privateKnowledgeHindi").value = item.content || "";
        $("privateKnowledgeEnglish").value = item.contentEn || "";
        $("privateKnowledgeSave").textContent = "बदलाव सुरक्षित करें";
        $("privateKnowledgeTitle").focus();
      });
      const remove = document.createElement("button");
      remove.type = "button"; remove.className = "secondary"; remove.textContent = "हटाएँ";
      remove.addEventListener("click", async () => {
        if (!confirm("क्या यह निजी ज्ञान हमेशा के लिए हटाना है?")) return;
        try { await api("delete", "POST", { id: item.id }); await loadItems(); message("ज्ञान हटा दिया गया।"); }
        catch (error) { message(error.message, true); }
      });
      actions.append(edit, remove);
      card.append(title, category, preview, actions);
      list.append(card);
    }
  }
  async function loadItems() {
    const result = await api("items");
    items = result.items || [];
    renderList();
  }
  async function checkStatus() {
    try {
      const result = await api("status");
      $("privateKnowledgeSetup").hidden = result.initialized;
      $("privateKnowledgeLogin").hidden = !result.initialized;
      showEditor(false);
      message(result.initialized ? "अपना निजी पासवर्ड डालकर लॉगिन करें।" : "पहली बार खोलने के लिए सेटअप कोड और अपना नया पासवर्ड डालें।");
    } catch (error) {
      message(error.message, true);
    }
  }
  $("privateKnowledgeSetupButton").addEventListener("click", async () => {
    const setupCode = $("privateKnowledgeSetupCode").value.trim();
    const password = $("privateKnowledgeNewPassword").value;
    const confirmPassword = $("privateKnowledgeConfirmPassword").value;
    if (password !== confirmPassword) return message("दोनों पासवर्ड एक जैसे नहीं हैं।", true);
    try {
      await api("setup", "POST", { setupCode, password });
      $("privateKnowledgeSetupCode").value = "";
      $("privateKnowledgeNewPassword").value = "";
      $("privateKnowledgeConfirmPassword").value = "";
      showEditor(true); await loadItems(); message("तुम्हारा निजी पासवर्ड सेट हो गया।");
    } catch (error) { message(error.message, true); }
  });
  $("privateKnowledgeLoginButton").addEventListener("click", async () => {
    try {
      await api("login", "POST", { password: $("privateKnowledgePassword").value });
      $("privateKnowledgePassword").value = "";
      showEditor(true); await loadItems(); message("लॉगिन सफल। निजी ज्ञान सुरक्षित है।");
    } catch (error) { message(error.message, true); }
  });
  $("privateKnowledgeLogout").addEventListener("click", async () => {
    try { await api("logout", "POST", {}); items = []; list.replaceChildren(); clearForm(); showEditor(false); await checkStatus(); }
    catch (error) { message(error.message, true); }
  });
  $("privateKnowledgeSave").addEventListener("click", async () => {
    const data = {
      id: editingId,
      title: $("privateKnowledgeTitle").value.trim(),
      category: $("privateKnowledgeCategory").value.trim(),
      content: $("privateKnowledgeHindi").value.trim(),
      contentEn: $("privateKnowledgeEnglish").value.trim()
    };
    try {
      await api("save", "POST", data);
      clearForm(); await loadItems(); message("तुम्हारा ज्ञान एन्क्रिप्ट होकर सुरक्षित सेव हो गया।");
    } catch (error) { message(error.message, true); }
  });
  $("privateKnowledgeNew").addEventListener("click", clearForm);
  $("privateKnowledgeVoice").addEventListener("click", () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return message("इस ब्राउज़र में आवाज़ से लिखने की सुविधा उपलब्ध नहीं है। कीबोर्ड का माइक्रोफोन इस्तेमाल करें।", true);
    const recognition = new Recognition();
    recognition.lang = "hi-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = event => {
      const text = event.results?.[0]?.[0]?.transcript || "";
      const field = $("privateKnowledgeHindi");
      field.value = (field.value.trim() ? field.value.trim() + "\n" : "") + text;
      message("आवाज़ हिंदी में लिख दी गई।");
    };
    recognition.onerror = () => message("आवाज़ पहचान नहीं हो सकी। दोबारा कोशिश करें।", true);
    recognition.start();
  });
  checkStatus();
})();
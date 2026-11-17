
/*
 * ASTRO BHAGYA VIDHATA
 * Server-driven planetary transit (Gochar) module
 *
 * Transit calculations and admin permissions must be handled by backend.
 */

(() => {
  "use strict";

  const API = "/api/gochar";

  const rashis = [
    "मेष", "वृषभ", "मिथुन", "कर्क",
    "सिंह", "कन्या", "तुला", "वृश्चिक",
    "धनु", "मकर", "कुंभ", "मीन"
  ];

  const $ = id => document.getElementById(id);

  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? {
          "Content-Type": "application/json"
        } : {}),
        ...(options.headers || {})
      }
    });

    let data = {};

    try {
      data = await response.json();
    } catch (_) {}

    if (!response.ok) {
      throw new Error(
        data.message || "गोचर जानकारी प्राप्त नहीं हो सकी।"
      );
    }

    return data;
  }

  function showOutput(title, content, error = false) {
    const output = $("rashiGocharOut");
    if (!output) return;

    output.replaceChildren();

    const heading = document.createElement("b");
    heading.textContent = title;

    const paragraph = document.createElement("p");
    paragraph.textContent = content;

    output.appendChild(heading);
    output.appendChild(paragraph);

    if (error) {
      output.style.color = "#ffb4ab";
    } else {
      output.style.color = "";
    }
  }

  async function loadRashiGochar() {
    const select = $("rashiSelect");

    if (!select) return;

    const rashi = select.value;

    if (!rashis.includes(rashi)) {
      showOutput("त्रुटि", "कृपया सही राशि चुनें।", true);
      return;
    }

    showOutput(
      rashi + " राशि का गोचर",
      "ग्रहों की वास्तविक स्थिति प्राप्त की जा रही है..."
    );

    try {
      const data = await request(
        API + "?rashi=" + encodeURIComponent(rashi)
      );

      if (!data.transit || typeof data.transit !== "string") {
        throw new Error("सर्वर से प्रमाणित गोचर विवरण नहीं मिला।");
      }

      showOutput(
        rashi + " राशि का गोचर फल",
        data.transit
      );

    } catch (error) {
      showOutput(
        rashi + " राशि का गोचर",
        error.message +
          " वास्तविक गोचर गणना का सर्वर अभी जोड़ना बाकी है।",
        true
      );
    }
  }

  async function saveAdminGochar() {
    const rashi = $("adminRashiSelect")?.value;
    const text = $("adminGocharInput")?.value.trim();

    if (!rashis.includes(rashi)) {
      alert("कृपया सही राशि चुनें।");
      return;
    }

    if (!text) {
      alert("कृपया गोचर विवरण लिखें।");
      return;
    }

    if (text.length > 10000) {
      alert("गोचर विवरण बहुत लंबा है।");
      return;
    }

    try {
      await request(API + "/admin", {
        method: "POST",
        body: JSON.stringify({
          rashi,
          transit: text
        })
      });

      alert("गोचर विवरण सर्वर पर सेव हो गया है।");
      await loadRashiGochar();

    } catch (error) {
      alert(
        "गोचर सेव नहीं हुआ: " + error.message +
        "\nएडमिन लॉगिन और सर्वर सुविधा अभी आवश्यक है।"
      );
    }
  }

  function initializeGochar() {
    const select = $("rashiSelect");

    if (select) {
      select.addEventListener("change", loadRashiGochar);
    }
  }

  window.loadRashiGochar = loadRashiGochar;
  window.saveAdminGochar = saveAdminGochar;

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeGochar,
      { once: true }
    );
  } else {
    initializeGochar();
  }

})();

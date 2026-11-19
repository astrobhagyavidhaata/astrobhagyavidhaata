/*
 * ASTRO BHAGYA VIDHATA
 * Daily sidereal gochar display
 */
(() => {
  "use strict";
  const API = "/api/gochar";
  const rashis = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];
  const $ = id => document.getElementById(id);

  async function request(url) {
    const response = await fetch(url, { credentials:"same-origin", cache:"no-store", headers:{Accept:"application/json"} });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "गोचर जानकारी प्राप्त नहीं हो सकी।");
    return data;
  }

  function showMessage(title, message, isError=false) {
    const output = $("rashiGocharOut");
    if (!output) return;
    output.replaceChildren();
    const h = document.createElement("b");
    h.textContent = title;
    const p = document.createElement("p");
    p.textContent = message;
    output.append(h,p);
    output.style.color = isError ? "#ffb4ab" : "";
  }

  function render(data) {
    const output = $("rashiGocharOut");
    if (!output) return;
    output.replaceChildren();

    const heading = document.createElement("b");
    heading.textContent = data.basisRashi + " चंद्र राशि" + (data.basisLagna ? " और " + data.basisLagna + " लग्न" : "") + " से आज का गोचर";
    const stamp = document.createElement("p");
    stamp.textContent = "गणना समय: " + new Date(data.asOf).toLocaleString("hi-IN") +
      " | अयनांश: " + data.ayanamsa;
    output.append(heading,stamp);

    const table = document.createElement("div");
    table.style.overflowX = "auto";
    const rows = [["ग्रह","राशि और अंश","नक्षत्र / चरण","नवांश","चंद्र से भाव","लग्न से भाव","गति"]];
    for (const p of data.planets || []) {
      rows.push([p.name, p.rashi + " " + p.degree.text, p.nakshatra + " / " + p.pada,
        p.navamsa, String(p.moonHouse ?? p.house), p.lagnaHouse == null ? "—" : String(p.lagnaHouse), p.retrograde ? "वक्री" : "मार्गी"]);
    }
    const t = document.createElement("table");
    t.style.cssText = "width:100%;border-collapse:collapse;min-width:540px;font-size:13px";
    rows.forEach((row,index) => {
      const tr = document.createElement("tr");
      row.forEach(value => {
        const cell = document.createElement(index===0 ? "th" : "td");
        cell.textContent = value;
        cell.style.cssText = "padding:9px 7px;border-bottom:1px solid #66547f;text-align:left";
        tr.appendChild(cell);
      });
      t.appendChild(tr);
    });
    table.appendChild(t);
    const note = document.createElement("p");
    note.style.cssText = "font-size:12px;line-height:1.6;color:#d4c9e5";
    note.textContent = data.note || "";
    output.append(table);

    function appendDrishti(title, details) {
      if (!details) return;
      const folder = document.createElement("details");
      folder.className = "chart-item";
      const summary = document.createElement("summary");
      summary.textContent = title;
      folder.appendChild(summary);

      const houseHeading = document.createElement("p");
      houseHeading.className = "chat-info";
      houseHeading.textContent = "भावों पर दृष्टि";
      folder.appendChild(houseHeading);
      const houseList = document.createElement("ul");
      for (const aspect of details.houseAspects || []) {
        const item = document.createElement("li");
        item.textContent = aspect.from + " की " + (aspect.full ? "पूर्ण" : aspect.aspectStrength + "%") +
          " दृष्टि — " + aspect.targetHouse + "वाँ भाव (" + aspect.targetSign + ")";
        houseList.appendChild(item);
      }
      folder.appendChild(houseList);

      const planetHeading = document.createElement("p");
      planetHeading.className = "chat-info";
      planetHeading.textContent = "दूसरे गोचर ग्रहों पर दृष्टि";
      folder.appendChild(planetHeading);
      const planetList = document.createElement("ul");
      for (const aspect of details.planetAspects || []) {
        const item = document.createElement("li");
        item.textContent = aspect.from + " की " + (aspect.full ? "पूर्ण" : aspect.aspectStrength + "%") +
          " दृष्टि " + aspect.to + " पर";
        planetList.appendChild(item);
      }
      if (!planetList.children.length) {
        const item = document.createElement("li");
        item.textContent = "इस दृष्टि-योजना के अनुसार कोई ग्रह-दृष्टि दर्ज नहीं हुई।";
        planetList.appendChild(item);
      }
      folder.appendChild(planetList);
      output.appendChild(folder);
    }

    if (data.drishti) {
      appendDrishti("चंद्र राशि से गोचर ग्रहों की दृष्टि", data.drishti.fromMoon);
      appendDrishti("लग्न से गोचर ग्रहों की दृष्टि", data.drishti.fromLagna);
    }
    output.appendChild(note);
  }

  async function loadRashiGochar() {
    const select = $("rashiSelect");
    if (!select) return;
    const rashi = select.value;
    const lagnaSelect = $("lagnaSelect");
    const lagna = lagnaSelect ? lagnaSelect.value : "";
    if (!rashis.includes(rashi) || (lagna && !rashis.includes(lagna))) return showMessage("त्रुटि","कृपया सही चंद्र राशि और लग्न चुनें।",true);
    showMessage("आज का गोचर","ग्रहों की स्थिति निकाली जा रही है...");
    try {
      const data = await request(API + "?rashi=" + encodeURIComponent(rashi) + (lagna ? "&lagna=" + encodeURIComponent(lagna) : ""));
      if (!Array.isArray(data.planets)) throw new Error("सर्वर से ग्रहों की पूरी सूची नहीं मिली।");
      render(data);
    } catch (error) {
      showMessage("गोचर उपलब्ध नहीं",error.message,true);
    }
  }

  function initialize() {
    const select = $("rashiSelect");
    const lagnaSelect = $("lagnaSelect");
    if (select) {
      select.addEventListener("change",loadRashiGochar);
      if (lagnaSelect) lagnaSelect.addEventListener("change",loadRashiGochar);
      loadRashiGochar();
    }
  }
  window.loadRashiGochar = loadRashiGochar;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",initialize,{once:true});
  else initialize();
})();

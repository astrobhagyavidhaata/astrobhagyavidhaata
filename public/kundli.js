
/*
 Astro Bhagya Vidhata
 Birth Details & Location Engine
 Vedic settings: Sidereal / Lahiri
*/

(() => {
  "use strict";

  const GEOCODING_URL =
    "https://geocoding-api.open-meteo.com/v1/search";

  const API_ENDPOINT = "/api/kundli";

  const $ = (id) => document.getElementById(id);

  function showMessage(message, error = false) {
    const box = $("message");
    if (!box) return;

    box.style.display = "block";
    box.style.color = error ? "#ffb4ab" : "#f5d994";
    box.textContent = message;
  }

  function renderMainKundliChart(chart) {
    const output = $("kTxt");
    if (!output) return;
    let root = $("mainKundliChart");
    if (!root) {
      root = document.createElement("section");
      root.id = "mainKundliChart";
      output.parentNode.insertBefore(root, output);
    }
    root.replaceChildren();
    root.style.cssText = "margin:18px 0;padding:14px;border:1px solid #b78b45;border-radius:14px;background:#fffaf0;color:#332516";
    const title = document.createElement("h3");
    title.textContent = "D1 — जन्म कुंडली";
    title.style.cssText = "text-align:center;color:#70451d;margin:0 0 12px";
    root.appendChild(title);

    const names = window.AstroRashis || ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];
    const planets = chart.d1.planets || {};
    const occupants = {};
    for (const [planet, p] of Object.entries(planets)) {
      (occupants[p.house] ||= []).push(planet + (p.retrograde ? " ℞" : ""));
    }
    const layout = [
      [1,2,3,4],
      [12,0,0,5],
      [11,0,0,6],
      [10,9,8,7]
    ];
    const grid = document.createElement("div");
    grid.style.cssText = "display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(4,minmax(88px,auto));border-top:1px solid #9b7542;border-left:1px solid #9b7542";
    for (const row of layout) for (const house of row) {
      const cell = document.createElement("div");
      cell.style.cssText = "min-width:0;min-height:88px;padding:7px 4px;border-right:1px solid #9b7542;border-bottom:1px solid #9b7542;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;overflow-wrap:anywhere";
      if (!house) {
        cell.style.background = "#f4ead7";
        cell.style.gridColumn = "span 1";
        cell.style.gridRow = "span 1";
      } else {
        const signIndex = (chart.d1.ascendant.rashiIndex + house - 1) % 12;
        const h = document.createElement("div");
        h.textContent = "भाव " + house;
        h.style.cssText = "font-size:11px;color:#87633c";
        const sign = document.createElement("strong");
        sign.textContent = names[signIndex] || "";
        sign.style.cssText = "font-size:14px;color:#442b16;margin:3px 0";
        const occupantsLabel = document.createElement("div");
        occupantsLabel.textContent = (occupants[house] || []).join(" · ") || "—";
        occupantsLabel.style.cssText = "font-size:12px;color:#7a451a;line-height:1.35";
        cell.append(h, sign, occupantsLabel);
        if (house === 1) {
          cell.style.background = "#f5dfb8";
          cell.style.outline = "2px solid #b77b2d";
          cell.style.outlineOffset = "-2px";
        }
      }
      grid.appendChild(cell);
    }
    root.appendChild(grid);
    const asc = document.createElement("p");
    asc.textContent = "लग्न: " + chart.d1.ascendant.rashi + " " + Number(chart.d1.ascendant.degreeInRashi).toFixed(2) + "°";
    asc.style.cssText = "text-align:center;font-weight:bold;color:#70451d;margin:12px 0 0";
    root.appendChild(asc);
    const note = document.createElement("p");
    note.textContent = "ग्रहों की विस्तृत डिग्री, नक्षत्र और दशा नीचे दी गई है।";
    note.style.cssText = "font-size:12px;color:#705b45;text-align:center;margin:6px 0 0";
    root.appendChild(note);
  }

  function renderVargaCharts(chart) {
    const root=$("vargaCharts");
    if(!root)return;
    root.replaceChildren();
    const heading=document.createElement("h3");
    heading.textContent="षोडशवर्ग — 16 छोटी कुंडलियाँ";
    root.appendChild(heading);
    const note=document.createElement("p");
    note.textContent="हर कुंडली में 12 भाव, राशि और ग्रहों की स्थिति अलग-अलग दिखाई गई है।";
    root.appendChild(note);
    const wrap=document.createElement("div");
    wrap.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px";
    const charts=chart.vargas||{};
    for(const [key,varga] of Object.entries(charts)){
      const card=document.createElement("section");
      card.style.cssText="border:1px solid rgba(220,190,130,.35);border-radius:12px;padding:12px;min-width:0;background:rgba(20,16,32,.45)";
      const title=document.createElement("h4");
      title.textContent=key+" — "+varga.name+" | लग्न "+varga.ascendant.rashi;
      card.appendChild(title);
      const grid=document.createElement("div");
      grid.style.cssText="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px";
      const occupants={};
      for(const [planetName,position] of Object.entries(varga.planets||{})){
        (occupants[position.house]||(occupants[position.house]=[])).push(planetName+(position.retrograde?" ℞":""));
      }
      for(let house=1;house<=12;house++){
        const signIndex=(varga.ascendant.rashiIndex+house-1)%12;
        const cell=document.createElement("div");
        cell.style.cssText="min-height:72px;padding:6px;border-radius:7px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.08);font-size:12px;overflow-wrap:anywhere";
        const houseLabel=document.createElement("strong");
        houseLabel.textContent="भाव "+house;
        const signLabel=document.createElement("div");
        signLabel.textContent=window.AstroRashis?.[signIndex]||["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"][signIndex];
        const planetLabel=document.createElement("div");
        planetLabel.style.cssText="margin-top:4px;color:#f5d994";
        planetLabel.textContent=(occupants[house]||[]).join(", ")||"—";
        if(house===1)cell.style.borderColor="rgba(245,217,148,.75)";
        cell.append(houseLabel,signLabel,planetLabel);
        grid.appendChild(cell);
      }
      card.append(title,grid);
      wrap.appendChild(card);
    }
    root.appendChild(wrap);
  }

  let selectedBirthPlace = null;
  let placeSearchSequence = 0;

  function placeLabel(place) {
    return [place.name, place.admin1, place.country].filter(Boolean).join(", ");
  }

  async function updateBirthPlaceSuggestions(query) {
    const box = $("birthPlaceSuggestions");
    if (!box) return;
    const sequence = ++placeSearchSequence;
    if (query.trim().length < 2) {
      box.replaceChildren();
      box.style.display = "none";
      return;
    }
    try {
      const results = await findBirthPlace(query.trim());
      if (sequence !== placeSearchSequence) return;
      box.replaceChildren();
      results.forEach(place => {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("role", "option");
        button.textContent = placeLabel(place);
        button.addEventListener("click", () => {
          selectedBirthPlace = { ...place, label: placeLabel(place) };
          $("birthPlace").value = selectedBirthPlace.label;
          box.replaceChildren();
          box.style.display = "none";
        });
        box.appendChild(button);
      });
      box.style.display = results.length ? "block" : "none";
    } catch (error) {
      if (sequence === placeSearchSequence) {
        box.replaceChildren();
        box.style.display = "none";
      }
    }
  }

  function validateBirthDetails(data) {
    const details = {
      name: String(data.get("name") || "").trim(),
      date: String(data.get("dob") || ""),
      time: String(data.get("birthTime") || ""),
      place: String(data.get("birthPlace") || "").trim(),
      saveToAccount: data.get("saveToAccount") === "on"
    };

    if (
      !details.name ||
      !details.date ||
      !details.time ||
      !details.place
    ) {
      throw new Error("कृपया सभी जन्म विवरण भरें।");
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(details.date)) {
      throw new Error("कृपया जन्म तारीख कैलेंडर से चुनें।");
    }
    const [year, month, day] = details.date.split("-").map(Number);
    const birthDate = new Date(Date.UTC(year, month - 1, day));
    if (birthDate.getUTCFullYear() !== year || birthDate.getUTCMonth() !== month - 1 || birthDate.getUTCDate() !== day) {
      throw new Error("जन्म तारीख सही भरें।");
    }
    const today = new Date();
    const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    if (birthDate.getTime() > todayUtc) {
      throw new Error("जन्म तारीख भविष्य की नहीं हो सकती।");
    }

    return details;
  }

  async function findBirthPlace(place) {
    const url = new URL(GEOCODING_URL);

    url.search = new URLSearchParams({
      name: place,
      count: "8",
      language: "en",
      format: "json"
    });

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("जन्मस्थान खोजने में समस्या आई।");
    }

    const data = await response.json();

    return Array.isArray(data.results)
      ? data.results
      : [];
  }

  function showLocationChoices(results, callback) {
    const box = $("message");
    if (!box) return;

    box.replaceChildren();

    const heading = document.createElement("p");
    heading.textContent =
      "कृपया अपना सही जन्मस्थान चुनें:";

    const select = document.createElement("select");

    select.style.cssText =
      "width:100%;padding:12px;background:#151020;color:white;border-radius:8px";

    results.forEach((place, index) => {
      const option = document.createElement("option");

      option.value = index;

      option.textContent = [
        place.name,
        place.admin1,
        place.country
      ].filter(Boolean).join(", ");

      select.appendChild(option);
    });

    const button = document.createElement("button");

    button.type = "button";
    button.textContent = "जन्मस्थान चुनें";

    button.addEventListener("click", () => {
      callback(results[Number(select.value)]);
    });

    box.append(heading, select, button);
  }

  async function generateKundli(details, location) {
    const payload = {
      name: details.name,

      birthDate: details.date,

      birthTime: details.time,
      saveToAccount: details.saveToAccount,

      birthPlace: {
        name: location.name,
        region: location.admin1 || null,
        country: location.country || null,
        countryCode: location.country_code || null,
        latitude: location.latitude,
        longitude: location.longitude,
        elevation: location.elevation || null
      },

      calculationPreferences: {
        zodiac: "sidereal",
        ayanamsa: "lahiri",
        houseSystem: "whole_sign",
        language: "hi"
      }
    };

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },

        body: JSON.stringify(payload)
      });

      if (response.status === 404 || response.status === 405) {
        showMessage(
          "जन्म विवरण और जन्मस्थान के निर्देशांक मिल गए हैं। " +
          "अब प्रमाणित Swiss Ephemeris गणना इंजन और बैकएंड जोड़ना बाकी है।"
        );

        return;
      }

      if (!response.ok) {
        throw new Error("कुंडली सर्वर से संपर्क नहीं हो पाया।");
      }

      const result = await response.json();

      if (!result || result.success !== true || !result.chart) {
        throw new Error("सर्वर से सही कुंडली प्राप्त नहीं हुई।");
      }

      const chart = result.chart;
      window.AstroKundli = chart;
      renderMainKundliChart(chart);
      renderVargaCharts(chart);

      const lines = [];
      lines.push("नाम: " + (chart.name || details.name));
      lines.push("जन्म: " + chart.birth.localDate + " " + chart.birth.localTime);
      lines.push("स्थान: " + chart.birth.place + " (" + chart.birth.timezone + ")");
      lines.push("अयनांश: " + Number(chart.calculation.ayanamsaDegrees).toFixed(4) + "°");
      lines.push("");
      lines.push("D1 जन्म कुंडली");
      lines.push("लग्न: " + chart.d1.ascendant.rashi + " " + Number(chart.d1.ascendant.degreeInRashi).toFixed(2) + "°");
      for (const [name, p] of Object.entries(chart.d1.planets || {})) {
        lines.push(name + ": " + p.rashi + " " + Number(p.degreeInRashi).toFixed(2) + "° | भाव " + p.house + " | " + p.nakshatra + " पाद " + p.pada + (p.retrograde ? " (वक्री)" : ""));
      }
      lines.push("");
      lines.push("D9 नवांश लग्न: " + chart.d9.ascendant.rashi);
      for (const [name, p] of Object.entries(chart.d9.planets || {})) {
        lines.push(name + ": " + p.rashi + " | भाव " + p.house);
      }
      lines.push("");
      lines.push("अन्य 14 विभाजित कुंडलियाँ (षोडशवर्ग)");
      lines.push("महत्वपूर्ण: D60 और सूक्ष्म वर्गों का लग्न जन्म समय में थोड़े अंतर से बदल सकता है; जन्म समय की पुष्टि करें।");
      for (const [vargaKey, varga] of Object.entries(chart.vargas || {})) {
        if (vargaKey === "D1" || vargaKey === "D9") continue;
        lines.push("");
        lines.push(vargaKey + " " + varga.name + " | लग्न: " + varga.ascendant.rashi);
        for (const [planetName, p] of Object.entries(varga.planets || {})) {
          lines.push(planetName + ": " + p.rashi + " " + Number(p.degreeInRashi).toFixed(2) + "° | भाव " + p.house + (p.retrograde ? " (वक्री)" : ""));
        }
      }
      lines.push("");
      lines.push("ग्रह दृष्टि");
      for (const a of chart.relationships?.aspects || []) {
        lines.push(a.from + " की " + a.type + " " + a.to + " पर");
      }
      lines.push("");
      lines.push("विस्तृत ग्रह दृष्टि — दृष्टि बल");
      for(const a of chart.drishti?.planetAspects||[]){
        lines.push(a.from+" की "+a.to+" पर "+a.aspectStrength+"% दृष्टि ("+a.houseDistance+"वाँ स्थान)");
      }
      lines.push("");
      lines.push("भावों पर ग्रह दृष्टि");
      for(const a of chart.drishti?.houseAspects||[]){
        lines.push(a.from+" की "+a.targetHouse+"वें भाव पर "+a.aspectStrength+"% दृष्टि ("+a.targetSign+")");
      }
      lines.push("");
      lines.push("जैमिनी अर्गला — सभी भाव");
      for(const item of chart.argala?.houses||[]){
        lines.push(item.target+" ("+item.referenceSign+")");
        for(const relation of item.relations){
          lines.push("  "+relation.position+"वें से "+relation.label+": "+(relation.planets.join(", ")||"कोई ग्रह नहीं")+" | "+relation.obstructionHouse+"वें से विरोध: "+(relation.obstructingPlanets.join(", ")||"कोई ग्रह नहीं")+" | "+relation.status);
        }
      }
      lines.push("");
      lines.push("ग्रहों पर अर्गला");
      for(const item of chart.argala?.grahas||[]){
        lines.push(item.target+" ("+item.referenceSign+")");
        for(const relation of item.relations){
          lines.push("  "+relation.position+"वें से: "+(relation.planets.join(", ")||"कोई ग्रह नहीं")+" | विरोध "+relation.obstructionHouse+"वें से: "+(relation.obstructingPlanets.join(", ")||"कोई ग्रह नहीं")+" | "+relation.status);
        }
      }
      lines.push("");
      lines.push("विशेष लग्न — इंदु लग्न");
      const indu=chart.specialLagnas?.indu;
      if(indu){
        lines.push("इंदु लग्न राशि: "+indu.rashi+" | जन्म लग्न से भाव: "+indu.houseFromLagna);
        lines.push("लग्न से नवमेश: "+indu.ninthLordFromLagna+" ("+indu.kalas[indu.ninthLordFromLagna]+" कला)");
        lines.push("चंद्र से नवमेश: "+indu.ninthLordFromMoon+" ("+indu.kalas[indu.ninthLordFromMoon]+" कला)");
        lines.push("कुल कला: "+indu.totalKalas+" | 12 से शेष: "+indu.remainder+" | चंद्र राशि से गणना: "+indu.countFromMoon);
      }
      lines.push("");
      lines.push("चौंसठवाँ नवांश / खर नवांश");
      for(const [key,label] of [["lagna","लग्न"],["moon","चंद्र"],["sun","सूर्य"]]){
        const point=chart.kharaPoints?.[key];
        if(point)lines.push(label+": मूल राशि "+point.sourceRashi+" "+Number(point.sourceDegree).toFixed(2)+"° | 64वाँ नवांश राशि "+point.kharaRashi+" | नवांश "+point.kharaNavamsa+" | खर नवमांश स्वामी "+point.kharaNavamsaLord);
      }
      for(const [planetName,point] of Object.entries(chart.kharaPoints?.planets||{})){
        lines.push(planetName+": 64वाँ नवांश "+point.kharaRashi+" / D9 "+point.kharaNavamsa+" | स्वामी "+point.kharaNavamsaLord);
      }
      lines.push("नोट: 64वें नवांश की गणना अलग-अलग ग्रंथ-परंपराओं में लग्न, चंद्र और सूर्य से की जाती है; यहाँ तीनों संदर्भ और प्रत्येक ग्रह का अलग बिंदु दिखाया गया है। इसे अकेले अशुभ घटना का निश्चित संकेत न मानें।");
      lines.push("");
      lines.push("युति");
      for (const conjunction of chart.relationships?.conjunctions || []) {
        lines.push(conjunction.planets.join(" + ") + " (" + conjunction.orb + "°)");
      }
      lines.push("");
      lines.push("विंशोत्तरी महादशा क्रम");
      const formatDashaDate = value => value ? new Date(value).toLocaleDateString("hi-IN",{day:"2-digit",month:"short",year:"numeric"}) : "उपलब्ध नहीं";
      for (const md of chart.dasha.mahadashas || []) {
        lines.push(md.planet + ": " + formatDashaDate(md.start) + " से " + formatDashaDate(md.end));
      }
      lines.push("");
      lines.push("वर्तमान महादशा: " + (chart.dasha.current.mahadasha || "उपलब्ध नहीं"));
      lines.push("वर्तमान अंतर्दशा: " + (chart.dasha.current.antardasha || "उपलब्ध नहीं"));
      lines.push("वर्तमान प्रत्यंतर: " + (chart.dasha.current.pratyantardasha || "उपलब्ध नहीं"));
      const activeMD = (chart.dasha.mahadashas || []).find(md => md.planet === chart.dasha.current.mahadasha);
      const activeAD = activeMD?.antardashas?.find(ad => ad.planet === chart.dasha.current.antardasha);
      if (activeMD) {
        lines.push("");
        lines.push("वर्तमान महादशा की सभी अंतर्दशाएँ");
        for (const ad of activeMD.antardashas || []) {
          lines.push(ad.planet + ": " + formatDashaDate(ad.start) + " से " + formatDashaDate(ad.end));
        }
      }
      if (activeAD) {
        lines.push("");
        lines.push("वर्तमान अंतर्दशा के सभी प्रत्यंतर");
        for (const pd of activeAD.pratyantardashas || []) {
          lines.push(pd.planet + ": " + formatDashaDate(pd.start) + " से " + formatDashaDate(pd.end));
        }
      }
      lines.push("");
      lines.push("जन्म नक्षत्र: " + chart.dasha.birthMoon.nakshatra + " · चरण " + chart.dasha.birthMoon.pada);
      lines.push("जन्म पर महादशा शेष: " + Number(chart.dasha.balanceAtBirthYears).toFixed(3) + " वर्ष");
      lines.push("");
      lines.push("नव तारा चक्र");
      for (const tara of chart.taraChart || []) {
        lines.push(tara.nakshatra + ": " + tara.name + " (" + tara.nature + ")");
      }
      lines.push("");
      lines.push("गणना नोट: " + chart.calculation.accuracyNote);

      const output = $("kTxt");
      if (output) output.textContent = lines.join("\n");
      const panel = $("kBox");
      if (panel) panel.style.display = "block";

      showMessage((result.message || "कुंडली गणना पूरी हुई।") + (result.savedKundliId ? " आपकी कुंडली खाते में सुरक्षित हो गई।" : (details.saveToAccount ? " कुंडली सुरक्षित नहीं हो सकी; लॉगिन और सर्वर सेटिंग जाँचें।" : "")));
      document.dispatchEvent(new CustomEvent("astro:kundli-ready", { detail: chart }));
      if (result.savedKundliId && window.loadKundliHistory) window.loadKundliHistory();

    } catch (error) {
      if (error instanceof TypeError) {
        showMessage(
          "जन्मस्थान मिल गया है। सटीक कुंडली के लिए " +
          "सर्वर और गणना इंजन जोड़ना बाकी है।"
        );
        return;
      }

      throw error;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;

    const button = form.querySelector(
      'button[type="submit"]'
    );

    const oldText = button
      ? button.textContent
      : "";

    try {
      const details = validateBirthDetails(
        new FormData(form)
      );

      if (button) {
        button.disabled = true;
        button.textContent = "जाँच हो रही है...";
      }

      showMessage("जन्मस्थान खोजा जा रहा है...");

      const cached = selectedBirthPlace && selectedBirthPlace.label === details.place
        ? selectedBirthPlace
        : null;
      const results = cached ? [cached] : await findBirthPlace(details.place);

      if (!results.length) {
        throw new Error(
          "जन्मस्थान नहीं मिला। सही शहर या गाँव लिखें।"
        );
      }

      const exact = results.filter(
        item =>
          item.name.toLowerCase() ===
          details.place.toLowerCase()
      );

      if (results.length > 1 && exact.length === 0) {
        if (button) {
          button.disabled = false;
          button.textContent = oldText;
        }

        showLocationChoices(results, async selected => {
          try {
            showMessage("जन्मस्थान की पुष्टि हो रही है...");

            await generateKundli(details, selected);

          } catch (error) {
            showMessage(error.message, true);
          }
        });

        return;
      }

      await generateKundli(
        details,
        exact[0] || results[0]
      );

    } catch (error) {
      showMessage(
        error.message || "कृपया दोबारा प्रयास करें।",
        true
      );

    } finally {
      if (button) {
        button.disabled = false;
        button.textContent =
          oldText || "मेरी कुंडली बनाएं";
      }
    }
  }

  function initialize() {
    const form = $("kundliForm");

    if (!form) {
      console.warn(
        "Kundli form नहीं मिला। index.html की जाँच करें।"
      );
      return;
    }

    form.addEventListener("submit", handleSubmit);
    const placeInput = $("birthPlace");
    if (placeInput) {
      placeInput.addEventListener("input", () => {
        selectedBirthPlace = null;
        updateBirthPlaceSuggestions(placeInput.value);
      });
      placeInput.addEventListener("focus", () => {
        if (placeInput.value.trim().length >= 2 && !selectedBirthPlace) {
          updateBirthPlaceSuggestions(placeInput.value);
        }
      });
      document.addEventListener("click", event => {
        const box = $("birthPlaceSuggestions");
        if (box && !box.contains(event.target) && event.target !== placeInput) {
          box.style.display = "none";
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }

})();

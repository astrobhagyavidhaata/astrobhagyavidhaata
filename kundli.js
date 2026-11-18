
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
    const output = $('kTxt');
    if (!output || !chart?.d1?.ascendant) return;
    let root = $('mainKundliChart');
    if (!root) {
      root = document.createElement('section');
      root.id = 'mainKundliChart';
      output.parentNode.insertBefore(root, output);
    }
    root.replaceChildren();
    root.style.cssText = 'margin:16px auto;padding:8px;max-width:480px;background:#fffaf0;color:#3b2615;border:1px solid #b78b45;border-radius:10px';
    const title = document.createElement('h3');
    title.textContent = 'Birth Chart';
    title.style.cssText = 'text-align:center;color:#70451d;font-size:16px;font-weight:600;margin:0 0 8px';
    root.appendChild(title);
    const names = Array.from({length:12}, (_, i) => String(i + 1));
    const ascIndex = Number.isInteger(chart.d1.ascendant.rashiIndex) ? chart.d1.ascendant.rashiIndex : names.indexOf(chart.d1.ascendant.rashi);
    if (ascIndex < 0 || ascIndex > 11) throw new Error('Invalid ascendant sign index.');
    const occupants = {};
    const planetCodes = {सूर्य:'SU',चंद्र:'MO',मंगल:'MA',बुध:'ME',गुरु:'JU',शुक्र:'VE',शनि:'SA',राहु:'RA',केतु:'KE'};
    for (const [planet, p] of Object.entries(chart.d1.planets || {})) {
      const house = Number(p.house);
      if (!Number.isInteger(house) || house < 1 || house > 12) continue;
      (occupants[house] ||= []).push((planetCodes[planet] || String(planet).slice(0, 2).toUpperCase()) + (p.retrograde ? '℞' : ''));
    }
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox','0 0 400 400');
    svg.setAttribute('role','img');
    svg.setAttribute('aria-label','North Indian style twelve-house birth chart');
    svg.style.cssText = 'display:block;width:100%;height:auto;max-width:420px;margin:auto;background:#fffaf0';
    const line = (x1,y1,x2,y2) => {
      const el=document.createElementNS(ns,'line');
      for (const [k,v] of Object.entries({x1,y1,x2,y2})) el.setAttribute(k,v);
      el.setAttribute('stroke','#875b2b'); el.setAttribute('stroke-width','2'); svg.appendChild(el);
    };
    const border=document.createElementNS(ns,'rect');
    border.setAttribute('x','2'); border.setAttribute('y','2'); border.setAttribute('width','396'); border.setAttribute('height','396');
    border.setAttribute('fill','none'); border.setAttribute('stroke','#875b2b'); border.setAttribute('stroke-width','3'); svg.appendChild(border);
    line(2,2,398,398); line(398,2,2,398);
    line(200,2,398,200); line(398,200,200,398); line(200,398,2,200); line(2,200,200,2);
    // North Indian chart order: houses advance counter-clockwise from the top (Lagna).
    const positions=[[200,78],[100,78],[50,145],[100,200],[50,255],[100,322],[200,322],[300,322],[350,255],[300,200],[350,145],[300,78]];
    for(let house=1;house<=12;house++){
      const [x,y]=positions[house-1], signIndex=(ascIndex+house-1)%12;
      const group=document.createElementNS(ns,'g');
      const label=document.createElementNS(ns,'text');
      label.setAttribute('x',x); label.setAttribute('y',y-19); label.setAttribute('text-anchor','middle'); label.setAttribute('font-size','11'); label.setAttribute('fill','#9a6b35'); label.textContent=String(house);
      const sign=document.createElementNS(ns,'text');
      sign.setAttribute('x',x); sign.setAttribute('y',y-4); sign.setAttribute('text-anchor','middle'); sign.setAttribute('font-size','13'); sign.setAttribute('font-weight','bold'); sign.setAttribute('fill','#4b2d16'); sign.textContent=String(signIndex + 1);
      const planet=document.createElementNS(ns,'text');
      planet.setAttribute('x',x);
      planet.setAttribute('y',y+12);
      planet.setAttribute('text-anchor','middle');
      planet.setAttribute('font-size','11');
      planet.setAttribute('font-weight','bold');
      planet.setAttribute('fill','#9a421d');
      // Keep every planet abbreviation inside its own house cell.
      // Wrap crowded houses into short centered rows instead of one long line.
      const codes=occupants[house]||[];
      const rows=[];
      for(let i=0;i<codes.length;i+=3) rows.push(codes.slice(i,i+3).join(' '));
      rows.slice(0,4).forEach((row,index)=>{
        const tspan=document.createElementNS(ns,'tspan');
        tspan.setAttribute('x',x);
        tspan.setAttribute('dy',index===0?'0':'11');
        tspan.textContent=row;
        planet.appendChild(tspan);
      });
      group.append(label,sign,planet); svg.appendChild(group);
    }
    root.appendChild(svg);
    const asc=document.createElement('p');
    asc.textContent='Ascendant: '+String(ascIndex + 1)+' '+Number(chart.d1.ascendant.degreeInRashi).toFixed(2)+'°';
    asc.style.cssText='text-align:center;font-weight:bold;color:#70451d;margin:8px 0 0'; root.appendChild(asc);
  }

  function renderVargaCharts(chart) {
    const root=$("vargaCharts");
    if(!root)return;
    root.replaceChildren();
    const heading=document.createElement("h3");
    heading.textContent="Shodashvarga — 16 Divisional Charts";
    root.appendChild(heading);
    const note=document.createElement("p");
    note.textContent="Each chart displays the twelve houses, sign numbers, and planetary placements.";
    root.appendChild(note);
    const wrap=document.createElement("div");
    wrap.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px";
    const charts=chart.vargas||{};
    for(const [key,varga] of Object.entries(charts)){
      const card=document.createElement("section");
      card.style.cssText="border:1px solid rgba(220,190,130,.35);border-radius:12px;padding:12px;min-width:0;background:rgba(20,16,32,.45)";
      const title=document.createElement("h4");
      title.textContent=key+" — "+varga.name+" | Ascendant "+String(varga.ascendant.rashiIndex + 1);
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
        houseLabel.textContent=String(house);
        const signLabel=document.createElement("div");
        signLabel.textContent=String(signIndex + 1);
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
      throw new Error("Please enter all birth details.");
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(details.date)) {
      throw new Error("Please select a valid birth date.");
    }
    const [year, month, day] = details.date.split("-").map(Number);
    const birthDate = new Date(Date.UTC(year, month - 1, day));
    if (birthDate.getUTCFullYear() !== year || birthDate.getUTCMonth() !== month - 1 || birthDate.getUTCDate() !== day) {
      throw new Error("Please enter a valid birth date.");
    }
    const today = new Date();
    const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    if (birthDate.getTime() > todayUtc) {
      throw new Error("Birth date cannot be in the future.");
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
      throw new Error("Unable to search for the birth place.");
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
      "Please select the correct birth place:";

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
    button.textContent = "Select birth place";

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
        language: "en"
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
        throw new Error("Unable to contact the chart server.");
      }

      const result = await response.json();

      if (!result || result.success !== true || !result.chart) {
        throw new Error("The server did not return a valid birth chart.");
      }

      const chart = result.chart;
      window.AstroKundli = chart;
      renderMainKundliChart(chart);
      const hiddenText = $('kTxt');
      if (hiddenText) hiddenText.textContent = '';
      const oldVargas = $('vargaCharts');
      if (oldVargas) oldVargas.replaceChildren();

      const panel = $("kBox");
      if (panel) panel.style.display = "block";

      showMessage((result.message || "Birth chart calculation completed.") + (result.savedKundliId ? " Your birth chart has been saved to your account." : (details.saveToAccount ? " The birth chart could not be saved. Check login and server settings." : "")));
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

      showMessage("Searching birth place...");

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
            showMessage("Confirming birth place...");

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


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
  const signNames = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

  const $ = (id) => document.getElementById(id);

  function showMessage(message, error = false) {
    const box = $("message");
    if (!box) return;

    box.style.display = "block";
    box.style.color = error ? "#ffb4ab" : "#f5d994";
    box.textContent = message;
  }

  function renderMainKundliChart(chart) {
    const host=$("chartCards"), nav=$("mainChartSlot");
    if(!host||!nav||!chart?.d1?.ascendant||!chart?.d9?.ascendant)return;
    host.replaceChildren();
    const signs=["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];
    const moon=chart.d1.planets?.चंद्र;
    const moonAsc=Number(moon?.rashiIndex);
    const moonPlanets=Object.fromEntries(Object.entries(chart.d1.planets||{}).map(([name,p])=>[name,{...p,house:((Number(p.rashiIndex)-moonAsc+12)%12)+1}]));
    const specs=[
      {id:"chartD1",title:"D1 — जन्म कुंडली",asc:Number(chart.d1.ascendant.rashiIndex),planets:chart.d1.planets||{}},
      {id:"chartD9",title:"D9 — नवांश कुंडली",asc:Number(chart.d9.ascendant.rashiIndex),planets:chart.d9.planets||{}},
      {id:"chartMoon",title:"चंद्र कुंडली",asc:moonAsc,planets:moonPlanets}
    ];
    for(const spec of specs){
      if(!Number.isInteger(spec.asc)||spec.asc<0||spec.asc>11)continue;
      const card=document.createElement("section");card.className="chart-card";card.id=spec.id;
      const heading=document.createElement("h3");heading.textContent=spec.title;card.appendChild(heading);
      const occupants={};
      for(const [planet,p] of Object.entries(spec.planets)){const house=Number(p.house);if(Number.isInteger(house)&&house>=1&&house<=12)(occupants[house]||=[]).push(planet);}
      const ns="http://www.w3.org/2000/svg",svg=document.createElementNS(ns,"svg");
      svg.setAttribute("viewBox","0 0 400 400");svg.setAttribute("role","img");svg.setAttribute("aria-label",spec.title);
      const line=(x1,y1,x2,y2)=>{const el=document.createElementNS(ns,"line");for(const [k,v] of Object.entries({x1,y1,x2,y2}))el.setAttribute(k,v);el.setAttribute("stroke","#875b2b");el.setAttribute("stroke-width","2");svg.appendChild(el);};
      const border=document.createElementNS(ns,"rect");for(const [k,v] of Object.entries({x:2,y:2,width:396,height:396,fill:"none",stroke:"#875b2b","stroke-width":3}))border.setAttribute(k,v);svg.appendChild(border);
      line(2,2,398,398);line(398,2,2,398);line(200,2,398,200);line(398,200,200,398);line(200,398,2,200);line(2,200,200,2);
      const pos=[[200,100],[100,34],[34,100],[100,200],[34,300],[100,366],[200,300],[300,366],[366,300],[300,200],[366,100],[300,34]];
      for(let house=1;house<=12;house++){
        const [x,y]=pos[house-1],sign=(spec.asc+house-1)%12,g=document.createElementNS(ns,"g");
        const s=document.createElementNS(ns,"text");s.setAttribute("x",x);s.setAttribute("y",y-9);s.setAttribute("text-anchor","middle");s.setAttribute("font-size","12");s.setAttribute("font-weight","bold");s.setAttribute("fill","#4b2d16");s.textContent=signs[sign]+" "+(sign+1);
        const ptext=document.createElementNS(ns,"text");ptext.setAttribute("x",x);ptext.setAttribute("y",y+9);ptext.setAttribute("text-anchor","middle");ptext.setAttribute("font-size","10");ptext.setAttribute("font-weight","600");ptext.setAttribute("fill","#9a421d");
        const names=occupants[house]||[];for(let i=0;i<names.length;i+=2){const span=document.createElementNS(ns,"tspan");span.setAttribute("x",x);span.setAttribute("dy",i===0?"0":"11");span.textContent=names.slice(i,i+2).join(" ");ptext.appendChild(span);}
        g.append(s,ptext);svg.appendChild(g);
      }
      card.appendChild(svg);const asc=document.createElement("p");asc.className="chart-asc";asc.textContent="लग्न: "+signs[spec.asc]+" ("+(spec.asc+1)+")";card.appendChild(asc);host.appendChild(card);
    }
    const panel=$("planetNakshatra");
    if(panel){
      panel.replaceChildren();
      const heading=document.createElement("h3");
      heading.textContent="ग्रहों का नक्षत्र एवं भाव विवरण";
      heading.style.cssText="margin:2px 0 6px;color:#f5c66b;font-size:16px";
      const note=document.createElement("p");
      note.textContent="D1 जन्म कुंडली के अनुसार ग्रह किस राशि, भाव, नक्षत्र और चरण में स्थित हैं।";
      note.style.cssText="margin:0 0 10px;color:#d4c9e5;font-size:12px;line-height:1.5";
      panel.append(heading,note);
      const table=document.createElement("table"),thead=document.createElement("thead"),trh=document.createElement("tr");
      ["ग्रह","राशि","राशि स्वामी","भाव","अंश","नक्षत्र","चरण","नक्षत्र स्वामी"].forEach(label=>{const th=document.createElement("th");th.textContent=label;trh.appendChild(th);});
      thead.appendChild(trh);table.appendChild(thead);
      const tbody=document.createElement("tbody");
      const nakshatraLords=["केतु","शुक्र","सूर्य","चंद्र","मंगल","राहु","गुरु","शनि","बुध"];
      const rashiLords=["मंगल","शुक्र","बुध","चंद्र","सूर्य","बुध","शुक्र","मंगल","गुरु","शनि","शनि","गुरु"];
      const rows=[["लग्न",chart.d1.ascendant||{}],...Object.entries(chart.d1.planets||{})];
      for(const [planet,p] of rows){
        const degree=Number(p.degreeInRashi);
        const degreeText=Number.isFinite(degree)?degree.toFixed(2)+"°":"—";
        const pada=Number(p.pada);
        const padaText=Number.isInteger(pada)&&pada>=1&&pada<=4?"चरण "+pada:"—";
        const house=Number(p.house);
        const houseText=Number.isInteger(house)&&house>=1&&house<=12?house+"वाँ":"—";
        const rashiIndex=Number(p.rashiIndex);
        const rashiLord=Number.isInteger(rashiIndex)&&rashiIndex>=0&&rashiIndex<12?rashiLords[rashiIndex]:"—";
        const nakshatraIndex=Number(p.nakshatraIndex);
        const nakshatraLord=Number.isInteger(nakshatraIndex)&&nakshatraIndex>=0&&nakshatraIndex<27?nakshatraLords[nakshatraIndex%9]:"—";
        const planetText=planet+(p.retrograde?" ℞":"");
        const values=[planetText,p.rashi||signs[p.rashiIndex]||"—",rashiLord,houseText,degreeText,p.nakshatra||"—",padaText,nakshatraLord];
        const tr=document.createElement("tr");
        values.forEach(value=>{const td=document.createElement("td");td.textContent=String(value);tr.appendChild(td);});
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);panel.appendChild(table);
    }
    nav.querySelectorAll("[data-chart-target]").forEach(button=>{
      button.onclick=()=>{
        nav.querySelectorAll("[data-chart-target]").forEach(item=>item.classList.toggle("active",item===button));
        const target=button.dataset.chartTarget;
        if(target==="planetNakshatra"){const panel=$("planetNakshatra");panel.hidden=!panel.hidden;if(!panel.hidden)panel.scrollIntoView({behavior:"smooth",block:"nearest"});return;}
        const card=$(target);if(card)card.scrollIntoView({behavior:"smooth",block:"nearest",inline:"start"});
      };
    });
  }

  function renderVargaCharts(chart) {
    const root=$("vargaCharts");
    if(!root)return;
    root.replaceChildren();
    const heading=document.createElement("h3");
    heading.textContent="Other Divisional Charts — D2 to D60";
    root.appendChild(heading);
    const note=document.createElement("p");
    note.textContent="Open any divisional chart to view its twelve signs and planetary placements. D1 (Rashi) is shown above.";
    root.appendChild(note);
    const wrap=document.createElement("div");
    wrap.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px";
    const charts=chart.vargas||{};
    for(const [key,varga] of Object.entries(charts)){
      if(key==="D1" || key==="D9") continue;
      const card=document.createElement("details");
      card.className="chart-item";
      card.style.cssText="border:1px solid rgba(220,190,130,.35);border-radius:12px;padding:12px;min-width:0;background:rgba(20,16,32,.45)";
      const title=document.createElement("summary");
      title.textContent=key+" — "+varga.name+" | Ascendant "+signNames[varga.ascendant.rashiIndex];
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
        const signLabel=document.createElement("div");
        signLabel.textContent=signNames[signIndex];
        const planetLabel=document.createElement("div");
        planetLabel.style.cssText="margin-top:4px;color:#f5d994";
        planetLabel.textContent=(occupants[house]||[]).join(", ")||"—";
        if(house===1)cell.style.borderColor="rgba(245,217,148,.75)";
        cell.append(signLabel,planetLabel);
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
      renderVargaCharts(chart);
      const hiddenText = $('kTxt');
      if (hiddenText) hiddenText.textContent = '';

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

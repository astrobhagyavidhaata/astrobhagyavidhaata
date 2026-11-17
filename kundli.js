
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

  function validateBirthDetails(data) {
    const details = {
      name: String(data.get("name") || "").trim(),
      date: String(data.get("dob") || ""),
      time: String(data.get("birthTime") || ""),
      place: String(data.get("birthPlace") || "").trim()
    };

    if (
      !details.name ||
      !details.date ||
      !details.time ||
      !details.place
    ) {
      throw new Error("कृपया सभी जन्म विवरण भरें।");
    }

    const birthDate = new Date(details.date + "T00:00:00");

    if (Number.isNaN(birthDate.getTime())) {
      throw new Error("जन्म तारीख सही भरें।");
    }

    if (birthDate > new Date()) {
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
      lines.push("विंशोत्तरी दशा");
      lines.push("वर्तमान महादशा: " + (chart.dasha.current.mahadasha || "उपलब्ध नहीं"));
      lines.push("वर्तमान अंतर्दशा: " + (chart.dasha.current.antardasha || "उपलब्ध नहीं"));
      lines.push("वर्तमान प्रत्यंतर: " + (chart.dasha.current.pratyantardasha || "उपलब्ध नहीं"));
      lines.push("");
      lines.push("गणना नोट: " + chart.calculation.accuracyNote);

      const output = $("kTxt");
      if (output) output.textContent = lines.join("\\n");
      const panel = $("kBox");
      if (panel) panel.style.display = "block";

      showMessage(result.message || "कुंडली गणना पूरी हुई।");
      document.dispatchEvent(new CustomEvent("astro:kundli-ready", { detail: chart }));

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

      const results = await findBirthPlace(details.place);

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

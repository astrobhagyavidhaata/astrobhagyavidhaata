/* Astro Bhagya Vidhata — lightweight background resume layer.
 * Kept separate from kundli.js and all profile/consultation rules.
 * Restores only the birth-form draft and the user's current app position.
 */
(() => {
  "use strict";

  const STORAGE_KEY = "astro_background_resume_v1";
  const MAX_AGE_MS = 30 * 60 * 1000;
  const FIELD_IDS = [
    "dobDay", "dobMonth", "dobYear", "dob",
    "name", "birthGender",
    "birthHour", "birthMinute", "birthAmPm", "birthTime",
    "birthPlace"
  ];

  let restoreDone = false;
  let saveTimer = 0;

  function getFormState() {
    const values = {};
    for (const id of FIELD_IDS) {
      const field = document.getElementById(id);
      if (!field) continue;
      values[id] = field.type === "checkbox" ? field.checked : field.value;
    }
    const saveChoice = document.querySelector('#kundliForm input[name="saveToAccount"]');
    if (saveChoice) values.saveToAccount = saveChoice.checked;
    return values;
  }

  function writeSnapshot() {
    try {
      const deck = document.getElementById("appSwipeDeck");
      const snapshot = {
        version: 1,
        savedAt: Date.now(),
        fields: getFormState(),
        deckScrollLeft: deck ? deck.scrollLeft : 0,
        pageScrollY: window.scrollY || 0
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (error) {
      console.warn("ऐप की पिछली स्थिति सेव नहीं हो सकी:", error);
    }
  }

  function scheduleSave() {
    if (saveTimer) window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      saveTimer = 0;
      writeSnapshot();
    }, 120);
  }

  function restoreSnapshot() {
    if (restoreDone) return;
    restoreDone = true;

    let snapshot;
    try {
      snapshot = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (_) {
      return;
    }

    if (!snapshot || snapshot.version !== 1 ||
        !Number.isFinite(snapshot.savedAt) ||
        Date.now() - snapshot.savedAt > MAX_AGE_MS ||
        Date.now() < snapshot.savedAt ||
        !snapshot.fields || typeof snapshot.fields !== "object") {
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
      return;
    }

    for (const id of FIELD_IDS) {
      if (!Object.prototype.hasOwnProperty.call(snapshot.fields, id)) continue;
      const field = document.getElementById(id);
      if (!field) continue;
      field.value = String(snapshot.fields[id] ?? "");
    }

    const saveChoice = document.querySelector('#kundliForm input[name="saveToAccount"]');
    if (saveChoice && typeof snapshot.fields.saveToAccount === "boolean") {
      saveChoice.checked = snapshot.fields.saveToAccount;
    }

    // Re-open the same horizontal app page and return to the previous reading position.
    requestAnimationFrame(() => {
      const deck = document.getElementById("appSwipeDeck");
      if (deck && Number.isFinite(snapshot.deckScrollLeft)) {
        deck.scrollLeft = snapshot.deckScrollLeft;
      }
      if (Number.isFinite(snapshot.pageScrollY) && snapshot.pageScrollY > 0) {
        window.scrollTo(0, snapshot.pageScrollY);
      }
    });
  }

  function initialize() {
    const form = document.getElementById("kundliForm");
    if (form) {
      form.addEventListener("input", scheduleSave, true);
      form.addEventListener("change", scheduleSave, true);
    }

    const deck = document.getElementById("appSwipeDeck");
    if (deck) deck.addEventListener("scroll", scheduleSave, { passive: true });

    window.addEventListener("scroll", scheduleSave, { passive: true });
    window.addEventListener("pagehide", writeSnapshot);
    window.addEventListener("beforeunload", writeSnapshot);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") writeSnapshot();
    });

    restoreSnapshot();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();

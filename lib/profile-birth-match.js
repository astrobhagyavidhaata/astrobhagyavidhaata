"use strict";

function normalizeDate(value) {
  const raw = String(value ?? "").normalize("NFKC").trim().toLowerCase().replace(/,/g, " ").replace(/\\s+/g, " ");
  let m = raw.match(/^(\\d{4})[-/.](\\d{1,2})[-/.](\\d{1,2})(?:$|[t\\s])/);
  if (m) return Number(m[1]) === 1997 && Number(m[2]) === 3 && Number(m[3]) === 10;
  m = raw.match(/^(\\d{1,2})[-/.](\\d{1,2})[-/.](\\d{4})$/);
  if (m) return Number(m[1]) === 10 && Number(m[2]) === 3 && Number(m[3]) === 1997;
  m = raw.match(/^(\\d{1,2})\\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\s+(\\d{4})$/);
  return Boolean(m && Number(m[1]) === 10 && m[2].startsWith("mar") && Number(m[3]) === 1997);
}

function normalizeTime(value) {
  const raw = String(value ?? "").normalize("NFKC").trim().toLowerCase().replace(/\\./g, "").replace(/\\s+/g, " ");
  const m = raw.match(/^(\\d{1,2}):(\\d{2})(?::(\\d{2})(?:\\.\\d+)?)?\\s*(am|pm)?$/);
  if (!m) return false;
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  if (m[4] === "pm" && hour < 12) hour += 12;
  if (m[4] === "am" && hour === 12) hour = 0;
  return hour === 21 && minute === 15;
}

function isLocked1997AmravatiProfile(input) {
  if (!input || typeof input !== "object") return false;
  const dates = [], times = [], places = [];
  let latitude = null, longitude = null;
  const seen = new Set();
  function walk(value, depth = 0) {
    if (!value || typeof value !== "object" || depth > 7 || seen.has(value)) return;
    seen.add(value);
    for (const [key, item] of Object.entries(value)) {
      const k = key.normalize("NFKC").toLowerCase().replace(/[_\\s-]/g, "");
      if (item && typeof item === "object") { walk(item, depth + 1); continue; }
      if (item == null) continue;
      if (["localdate","birthdate","dateofbirth","dob","date"].includes(k)) dates.push(item);
      if (["localtime","birthtime","timeofbirth","time"].includes(k)) times.push(item);
      if (["latitude","lat"].includes(k)) latitude = Number(item);
      if (["longitude","lon","lng"].includes(k)) longitude = Number(item);
      if (typeof item === "string" && /amravati|अमरावती/i.test(item)) places.push(item);
    }
  }
  walk(input);
  const dateOk = dates.some(normalizeDate);
  const timeOk = times.some(normalizeTime);
  const coordsOk = Number.isFinite(latitude) && Number.isFinite(longitude) &&
    Math.abs(latitude - 20.93) <= 0.12 && Math.abs(longitude - 77.75) <= 0.12;
  return dateOk && timeOk && (places.length > 0 || coordsOk);
}

module.exports = { isLocked1997AmravatiProfile, normalizeDate, normalizeTime };

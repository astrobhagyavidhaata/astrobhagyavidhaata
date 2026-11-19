"use strict";

let lastLookupAt = 0;
let lookupQueue = Promise.resolve();

function waitForNominatimSlot() {
  const run = lookupQueue.then(async () => {
    const wait = Math.max(0, 1000 - (Date.now() - lastLookupAt));
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    lastLookupAt = Date.now();
  });
  lookupQueue = run.catch(() => {});
  return run;
}

module.exports = async function geocode(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, message: "Only GET requests are accepted." });
  }

  const query = String(req.query?.q || "").trim();
  if (query.length < 2 || query.length > 160) {
    return res.status(400).json({ success: false, message: "A valid city and country search is required." });
  }

  try {
    await waitForNominatimSlot();
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.search = new URLSearchParams({
      q: query,
      format: "jsonv2",
      addressdetails: "1",
      limit: "8"
    });
    const response = await fetch(url, {
      headers: {
        "User-Agent": "AstroBhagyaVidhata/1.0 (global birth place geocoding)",
        "Accept": "application/json",
        "Accept-Language": "en"
      },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) {
      return res.status(502).json({ success: false, message: "OpenStreetMap स्थान खोज सेवा अभी उपलब्ध नहीं है।" });
    }
    const rows = await response.json();
    const results = (Array.isArray(rows) ? rows : []).map(item => {
      const address = item.address || {};
      return {
        name: address.city || address.town || address.village ||
          address.municipality || address.county || item.name || item.display_name,
        admin1: address.state || address.region || address.state_district || "",
        country: address.country || "",
        country_code: String(address.country_code || "").toLowerCase(),
        latitude: Number(item.lat),
        longitude: Number(item.lon),
        elevation: null,
        label: item.display_name || ""
      };
    }).filter(item => Number.isFinite(item.latitude) &&
      Number.isFinite(item.longitude) &&
      Math.abs(item.latitude) <= 90 && Math.abs(item.longitude) <= 180);
    return res.status(200).json({ success: true, results });
  } catch (error) {
    console.error("OpenStreetMap geocoding failed:", error.message);
    return res.status(503).json({ success: false, message: "वैकल्पिक वैश्विक स्थान खोज अभी उपलब्ध नहीं है।" });
  }
};

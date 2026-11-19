"use strict";

// This implements the user-supplied heuristic scoring model.
// It is an approximation, NOT a complete classical BPHS Shadbala calculation.
const PLANET_ALIASES = {
  Sun: "सूर्य", Moon: "चंद्र", Mars: "मंगल", Mercury: "बुध",
  Jupiter: "गुरु", Venus: "शुक्र", Saturn: "शनि"
};

function calculateShadbala(planets, ascendantDeg = 0) {
  const naisargika = {
    Sun: 60.0, Moon: 51.43, Venus: 42.86, Jupiter: 34.29,
    Mercury: 25.71, Mars: 17.14, Saturn: 8.57
  };
  const exaltationDeg = {
    Sun: 10, Moon: 33, Mars: 298, Mercury: 165,
    Jupiter: 95, Venus: 357, Saturn: 200
  };
  const digbalaHouse = {
    Sun: 10, Mars: 10, Jupiter: 1, Mercury: 1,
    Moon: 4, Venus: 4, Saturn: 7
  };
  const requiredRupas = {
    Sun: 6.5, Moon: 6.0, Mars: 5.0, Mercury: 7.0,
    Jupiter: 6.5, Venus: 5.5, Saturn: 5.0
  };
  const sevenPlanets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  const results = {};
  const ascSignStart = Math.floor((((Number(ascendantDeg) % 360) + 360) % 360) / 30) * 30;

  for (const name of sevenPlanets) {
    const alias = PLANET_ALIASES[name];
    const p = planets?.[name] || planets?.[alias] ||
      Object.values(planets || {}).find(x => x?.name === name || x?.name === alias) || {};
    const rawLongitude = Number(p.longitude ?? p.deg ?? 0);
    const lon = ((rawLongitude % 360) + 360) % 360;
    const house = Number(p.house || Math.floor(((lon - ascSignStart + 360) % 360) / 30) + 1);
    const isRetro = Boolean(p.retrograde || p.isRetrograde);

    // User-provided positional-strength heuristic (not classical Uchcha/Saptavargaja).
    const debil = (exaltationDeg[name] + 180) % 360;
    let diff = Math.abs(lon - debil);
    if (diff > 180) diff = 360 - diff;
    const sthanaBala = Number(((diff / 180) * 60 + 45).toFixed(2));

    let hDiff = Math.abs(house - digbalaHouse[name]);
    if (hDiff > 6) hDiff = 12 - hDiff;
    const digBala = Number((((6 - hDiff) / 6) * 60).toFixed(2));
    const kalaBala = ["Moon", "Mars", "Saturn"].includes(name) ? 45.0 : 40.0;
    const cheshtaBala = isRetro ? 52.0 : 28.0;
    const naisargikaBala = naisargika[name];
    const drigBala = Number((((lon % 60) / 60) * 20 - 5).toFixed(2));
    const totalShashtiamsas = Number((sthanaBala + digBala + kalaBala +
      cheshtaBala + naisargikaBala + drigBala).toFixed(2));
    const totalRupas = Number((totalShashtiamsas / 60).toFixed(2));

    results[name] = {
      sthanaBala, digBala, kalaBala, cheshtaBala, naisargikaBala, drigBala,
      totalShashtiamsas, totalRupas, requiredRupas: requiredRupas[name],
      isStrong: totalRupas >= requiredRupas[name]
    };
  }
  return results;
}

module.exports = { calculateShadbala };

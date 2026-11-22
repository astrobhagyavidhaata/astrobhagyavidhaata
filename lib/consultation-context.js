"use strict";

const { calculateSiderealPositions } = require("./ephemeris");
const { getPosition } = require("./chart-engine");
const { getVimshottariDasha, getTaraFromMoonLongitudes } = require("./astrology-engine");
const { calculateAdvancedAstrology } = require("./advanced-astrology");

const RASHIS = [
  "मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या",
  "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"
];

function houseFrom(signIndex, referenceSignIndex) {
  return ((signIndex - referenceSignIndex + 12) % 12) + 1;
}


const TRANSIT_STEP_DAYS = { चंद्र:0.25, बुध:1, शुक्र:1.5, सूर्य:1.5, मंगल:2.5, गुरु:7, शनि:12, राहु:12, केतु:12 };
function transitSignAt(name, date) {
  const positions = calculateSiderealPositions(date, 0, 0).planets;
  const longitude = positions?.[name]?.longitude;
  return Number.isFinite(Number(longitude)) ? getPosition(Number(longitude)).rashiIndex : null;
}
function findTransitBoundary(name, now, currentSign, direction, stepDays, maxDays=1600) {
  let known = new Date(now), elapsed = 0, changed = null;
  while (elapsed < maxDays) {
    elapsed = Math.min(maxDays, elapsed + stepDays);
    const probe = new Date(now.getTime() + direction * elapsed * 86400000);
    if (transitSignAt(name, probe) !== currentSign) { changed = probe; break; }
    known = probe;
  }
  if (!changed) return null;
  let lo = direction < 0 ? changed.getTime() : known.getTime();
  let hi = direction < 0 ? known.getTime() : changed.getTime();
  for (let i=0; i<32; i++) {
    const mid = (lo + hi) / 2;
    const sign = transitSignAt(name, new Date(mid));
    if (direction < 0) {
      if (sign === currentSign) hi = mid; else lo = mid;
    } else {
      if (sign === currentSign) lo = mid; else hi = mid;
    }
  }
  return new Date(direction < 0 ? hi : hi);
}
function indiaDateTime(value) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-CA", { timeZone:"Asia/Kolkata", year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", hourCycle:"h23" }).format(value).replace(",", "");
}
function getTransitSignPeriods(planets, now) {
  return Object.entries(planets || {}).map(([name, data]) => {
    const currentSign = getPosition(Number(data.longitude)).rashiIndex;
    const step = TRANSIT_STEP_DAYS[name] || 2;
    const ingress = findTransitBoundary(name, now, currentSign, -1, step);
    const egress = findTransitBoundary(name, now, currentSign, 1, step);
    return { planet:name, rashiIndex:currentSign, ingressUTC:ingress?.toISOString() || null, egressUTC:egress?.toISOString() || null, ingressIndia:indiaDateTime(ingress), egressIndia:indiaDateTime(egress), accuracyNote:"Astronomy Engine + अनुमानित Lahiri अयनांश; सीमा को binary search से निकाला गया है।" };
  });
}

function buildLiveAstrologyContext(source, now = new Date(), options = {}) {
  if (!source || typeof source !== "object" || Array.isArray(source)) return source || {};
  const enriched = { ...source };
  const d1 = source.d1 || {};
  const natalMoon = d1.planets?.चंद्र;
  const natalAscendant = d1.ascendant;
  const birthDate = source.birth?.utc ? new Date(source.birth.utc) : null;

  if (birthDate && Number.isFinite(birthDate.getTime()) &&
      Number.isFinite(Number(natalMoon?.longitude))) {
    enriched.dasha = getVimshottariDasha(birthDate, Number(natalMoon.longitude), now);
  }

  if (!Number.isFinite(Number(natalMoon?.longitude))) {
    enriched.advancedAstrology = calculateAdvancedAstrology(enriched, now);
    return enriched;
  }

  const moonSignIndex = getPosition(Number(natalMoon.longitude)).rashiIndex;
  const ascendantSignIndex = Number.isInteger(natalAscendant?.rashiIndex)
    ? natalAscendant.rashiIndex
    : Number.isFinite(Number(natalAscendant?.longitude))
      ? getPosition(Number(natalAscendant.longitude)).rashiIndex
      : null;
  const current = calculateSiderealPositions(now, 0, 0);
  enriched.currentTaraBala = getTaraFromMoonLongitudes(
    Number(natalMoon.longitude),
    current.planets.चंद्र.longitude
  );
  const planets = Object.entries(current.planets).map(([name, planet]) => {
    const position = getPosition(planet.longitude);
    return {
      name,
      rashi: position.rashi,
      rashiIndex: position.rashiIndex,
      longitude: position.longitude,
      degreeInRashi: position.degreeInRashi,
      nakshatra: position.nakshatra,
      pada: position.pada,
      navamsa: position.navamsa,
      retrograde: Boolean(planet.retrograde),
      taraBala: getTaraFromMoonLongitudes(Number(natalMoon.longitude), Number(planet.longitude)),
      houseFromMoon: houseFrom(position.rashiIndex, moonSignIndex),
      houseFromAscendant: ascendantSignIndex === null
        ? null
        : houseFrom(position.rashiIndex, ascendantSignIndex)
    };
  });

  enriched.currentTaraBalaByPlanet = Object.fromEntries(planets.map(planet => [planet.name, planet.taraBala]));
  enriched.gochar = {
    asOf: now.toISOString(),
    ayanamsa: "Lahiri (linear approximation)",
    houseSystem: "Whole Sign",
    natalMoonRashi: RASHIS[moonSignIndex],
    natalAscendantRashi: ascendantSignIndex === null ? null : RASHIS[ascendantSignIndex],
    planets,
    signPeriods: options.includeTransitDates ? getTransitSignPeriods(current.planets, now) : undefined,
    accuracyNote: "वर्तमान गोचर Astronomy Engine और अनुमानित Lahiri अयनांश से निकाला गया है; Swiss Ephemeris-प्रमाणित नहीं है।"
  };
  enriched.advancedAstrology = calculateAdvancedAstrology(enriched, now);
  return enriched;
}

module.exports = { buildLiveAstrologyContext, houseFrom };

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

function buildLiveAstrologyContext(source, now = new Date()) {
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
    accuracyNote: "वर्तमान गोचर Astronomy Engine और अनुमानित Lahiri अयनांश से निकाला गया है; Swiss Ephemeris-प्रमाणित नहीं है।"
  };
  enriched.advancedAstrology = calculateAdvancedAstrology(enriched, now);
  return enriched;
}

module.exports = { buildLiveAstrologyContext, houseFrom };

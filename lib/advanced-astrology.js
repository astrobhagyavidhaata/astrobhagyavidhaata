"use strict";

const { getNakshatraFromLongitude } = require("./astrology-engine");

function signNumber(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n < 12 ? n : null;
}

function navamsa64th(chart) {
  const sign = signNumber(chart?.ascendant?.rashiIndex);
  return sign === null ? null : { source: "D9 लग्न", baseRashiIndex: sign, rashiIndex: (sign + 3) % 12 };
}

function degreeOf(planet) {
  if (Number.isFinite(Number(planet?.degreeInRashi))) return ((Number(planet.degreeInRashi) % 30) + 30) % 30;
  if (Number.isFinite(Number(planet?.longitude))) return ((Number(planet.longitude) % 30) + 30) % 30;
  return null;
}

function getBhriguNandiNadi(d1, gender) {
  const planets = Object.entries(d1?.planets || {}).map(([name, p]) => ({
    name, degree: degreeOf(p), rashiIndex: signNumber(p?.rashiIndex)
  })).filter(p => p.degree !== null);
  if (!planets.length) return null;
  planets.sort((a,b) => a.degree - b.degree || a.name.localeCompare(b.name));
  const normalizedGender = String(gender || "").toLowerCase();
  const jeevaKaraka = ["male","man","पुरुष","आदमी"].includes(normalizedGender)
    ? "गुरु"
    : ["female","woman","स्त्री","महिला"].includes(normalizedGender) ? "शुक्र" : null;
  const jeeva = jeevaKaraka ? planets.find(p => p.name === jeevaKaraka) : null;
  const epsilon = 0.0001;
  let nextDegreePlanets = [];
  let equalDegreePlanets = [];
  if (jeeva) {
    equalDegreePlanets = planets.filter(p => p.name !== jeeva.name && Math.abs(p.degree - jeeva.degree) <= epsilon).map(p => p.name);
    const after = planets.filter(p => p.degree > jeeva.degree + epsilon);
    const nextDegree = after.length ? after[0].degree : planets.find(p => p.degree < jeeva.degree - epsilon)?.degree;
    if (Number.isFinite(nextDegree)) nextDegreePlanets = planets.filter(p => Math.abs(p.degree - nextDegree) <= epsilon).map(p => p.name);
  }
  return {
    jeevaKaraka,
    sequence: planets.map((p,index) => ({
      order: index + 1, planet: p.name, degreeInRashi: Number(p.degree.toFixed(6)),
      rashiIndex: p.rashiIndex,
      marker: p.name === jeevaKaraka ? "जीव कारक" :
        equalDegreePlanets.includes(p.name) ? "जीव कारक के समान डिग्री" :
        nextDegreePlanets.includes(p.name) ? "जीव कारक के ठीक आगे की डिग्री" : null
    })),
    note: jeeva ? "क्रम राशि-अंश (0–30°) के अनुसार है; समान/अगली डिग्री को चिह्नित किया गया है।" : "लिंग उपलब्ध/मान्य न होने से जीव कारक निर्धारित नहीं किया गया।"
  };
}

function taraNumber(birthNakshatraIndex, longitude) {
  if (!Number.isInteger(birthNakshatraIndex) || !Number.isFinite(Number(longitude))) return null;
  const target = getNakshatraFromLongitude(Number(longitude));
  return ((target.index - birthNakshatraIndex + 27) % 27) % 9 + 1;
}

function getNavtara(d1, gochar, birthNakshatraIndex) {
  if (!Number.isInteger(birthNakshatraIndex)) return null;
  const natal = Object.entries(d1?.planets || {}).map(([name,p]) => ({
    name, number: taraNumber(birthNakshatraIndex, Number(p?.longitude))
  })).filter(p => p.number !== null);
  const transit = (gochar?.planets || []).map(p => ({
    name: p.name, number: taraNumber(birthNakshatraIndex, Number(p.longitude))
  })).filter(p => p.number !== null);
  return { birthNakshatraIndex, natalPlanets: natal, transits: transit };
}

function dashaChidra(dasha, now = new Date()) {
  const current = dasha?.current || {};
  const md = (dasha?.mahadashas || []).find(x => x.planet === current.mahadasha);
  const ad = (md?.antardashas || []).find(x => x.planet === current.antardasha);
  const start = new Date(ad?.start || current.antardashaStart);
  const end = new Date(ad?.end || current.antardashaEnd);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) return null;
  const duration = end.getTime() - start.getTime();
  const chidraStart = end.getTime() - duration * 0.10;
  return {
    antardasha: current.antardasha || ad?.planet || null,
    start: start.toISOString(), end: end.toISOString(),
    chidraStart: new Date(chidraStart).toISOString(),
    isDashaChidra: now.getTime() >= chidraStart && now.getTime() < end.getTime(),
    finalTenPercent: true
  };
}

function calculateAdvancedAstrology(source, now = new Date()) {
  const d1 = source?.d1 || {};
  const d9 = source?.d9 || {};
  const birthNakshatraIndex = Number.isInteger(source?.dasha?.birthMoon?.nakshatraIndex)
    ? source.dasha.birthMoon.nakshatraIndex
    : Number.isInteger(source?.birthNakshatraIndex) ? source.birthNakshatraIndex : null;
  const d9Moon = d9?.planets?.चंद्र;
  const sign64th = {
    navamsaAscendant: navamsa64th(d9),
    navamsaMoon: (() => {
      const sign = signNumber(d9Moon?.rashiIndex);
      return sign === null ? null : { source: "D9 चंद्र", baseRashiIndex: sign, rashiIndex: (sign + 3) % 12 };
    })()
  };
  return {
    sixtyFourthNavamsa: sign64th,
    bhriguNandiNadi: getBhriguNandiNadi(d1, source?.gender),
    navtara: getNavtara(d1, source?.gochar, birthNakshatraIndex),
    dashaChidra: dashaChidra(source?.dasha, now)
  };
}

module.exports = { calculateAdvancedAstrology, getBhriguNandiNadi, getNavtara, dashaChidra };

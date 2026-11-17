
"use strict";

/*
  Astro Bhagya Vidhata
  Vedic Chart Engine - D1 / D9
  Zodiac: Sidereal
  House System: Whole Sign
  Input longitudes must already be Lahiri sidereal degrees.
*/

const RASHIS = [
  "मेष", "वृषभ", "मिथुन", "कर्क",
  "सिंह", "कन्या", "तुला", "वृश्चिक",
  "धनु", "मकर", "कुंभ", "मीन"
];

const NAKSHATRAS = [
  "अश्विनी", "भरणी", "कृत्तिका", "रोहिणी",
  "मृगशिरा", "आर्द्रा", "पुनर्वसु", "पुष्य",
  "आश्लेषा", "मघा", "पूर्वा फाल्गुनी", "उत्तरा फाल्गुनी",
  "हस्त", "चित्रा", "स्वाती", "विशाखा",
  "अनुराधा", "ज्येष्ठा", "मूल", "पूर्वाषाढ़ा",
  "उत्तराषाढ़ा", "श्रवण", "धनिष्ठा", "शतभिषा",
  "पूर्वाभाद्रपद", "उत्तराभाद्रपद", "रेवती"
];

const NAKSHATRA_SIZE = 360 / 27;
const PADA_SIZE = NAKSHATRA_SIZE / 4;
const SIGN_SIZE = 30;

function normalizeDegrees(value) {
  const result = Number(value) % 360;
  return result < 0 ? result + 360 : result;
}

function getPosition(longitude) {
  const degree = normalizeDegrees(longitude);

  const signIndex = Math.floor(degree / SIGN_SIZE);
  const degreeInSign = degree % SIGN_SIZE;

  const nakshatraIndex = Math.floor(degree / NAKSHATRA_SIZE);
  const nakshatraDegree = degree % NAKSHATRA_SIZE;
  const pada = Math.floor(nakshatraDegree / PADA_SIZE) + 1;

  // Navamsa sign calculation
  const navamsaPart = Math.floor(degreeInSign / PADA_SIZE);
  const navamsaSignIndex = (signIndex * 9 + navamsaPart) % 12;

  return {
    longitude: Number(degree.toFixed(6)),
    rashi: RASHIS[signIndex],
    rashiIndex: signIndex,
    degreeInRashi: Number(degreeInSign.toFixed(6)),
    nakshatra: NAKSHATRAS[nakshatraIndex],
    nakshatraIndex,
    pada,
    navamsa: RASHIS[navamsaSignIndex],
    navamsaSignIndex,
    navamsaPart: navamsaPart + 1
  };
}

function getWholeSignHouse(planetSignIndex, ascendantSignIndex) {
  return ((planetSignIndex - ascendantSignIndex + 12) % 12) + 1;
}

function buildChart(ascendantLongitude, planets) {
  if (!Number.isFinite(Number(ascendantLongitude))) {
    throw new Error("सही लग्न longitude आवश्यक है।");
  }

  if (!planets || typeof planets !== "object") {
    throw new Error("ग्रहों की स्थिति आवश्यक है।");
  }

  const ascendant = getPosition(ascendantLongitude);

  const d1 = {
    ascendant: {
      ...ascendant,
      house: 1
    },
    planets: {}
  };

  const d9 = {
    ascendant: {
      rashi: getPosition(ascendantLongitude).navamsa,
      rashiIndex: getPosition(ascendantLongitude).navamsaSignIndex,
      house: 1
    },
    planets: {}
  };

  for (const [planetName, planetData] of Object.entries(planets)) {
    if (
      !planetData ||
      !Number.isFinite(Number(planetData.longitude))
    ) {
      throw new Error(
        `${planetName} के लिए सही longitude उपलब्ध नहीं है।`
      );
    }

    const position = getPosition(planetData.longitude);

    const house = getWholeSignHouse(
      position.rashiIndex,
      ascendant.rashiIndex
    );

    const navamsaHouse = getWholeSignHouse(
      position.navamsaSignIndex,
      d9.ascendant.rashiIndex
    );

    d1.planets[planetName] = {
      ...position,
      house,
      retrograde: Boolean(planetData.retrograde)
    };

    d9.planets[planetName] = {
      rashi: position.navamsa,
      rashiIndex: position.navamsaSignIndex,
      house: navamsaHouse,
      retrograde: Boolean(planetData.retrograde)
    };
  }

  return {
    system: {
      zodiac: "sidereal",
      ayanamsa: "lahiri",
      houseSystem: "whole_sign"
    },
    d1,
    d9
  };
}

module.exports = {
  RASHIS,
  NAKSHATRAS,
  normalizeDegrees,
  getPosition,
  getWholeSignHouse,
  buildChart
};

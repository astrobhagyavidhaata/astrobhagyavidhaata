
"use strict";

/*
 ASTRO BHAGYA VIDHATA
 COMBINED VEDIC ASTROLOGY ENGINE

 1. 27 Nakshatras
 2. Nav Tara Chakra
 3. Tara Bala
 4. Vimshottari Mahadasha
 5. Antardasha
 6. Pratyantardasha

 IMPORTANT:
 All longitudes must be Lahiri sidereal degrees.
 Actual planetary positions must come from an ephemeris engine.
*/

const NAKSHATRAS = [
  "अश्विनी", "भरणी", "कृत्तिका", "रोहिणी",
  "मृगशिरा", "आर्द्रा", "पुनर्वसु", "पुष्य",
  "आश्लेषा", "मघा", "पूर्वा फाल्गुनी", "उत्तरा फाल्गुनी",
  "हस्त", "चित्रा", "स्वाती", "विशाखा",
  "अनुराधा", "ज्येष्ठा", "मूल", "पूर्वाषाढ़ा",
  "उत्तराषाढ़ा", "श्रवण", "धनिष्ठा", "शतभिषा",
  "पूर्वाभाद्रपद", "उत्तराभाद्रपद", "रेवती"
];

const TARA_LIST = [
  { number: 1, name: "जन्म तारा", nature: "मिश्रित" },
  { number: 2, name: "संपत तारा", nature: "शुभ" },
  { number: 3, name: "विपत तारा", nature: "अशुभ" },
  { number: 4, name: "क्षेम तारा", nature: "शुभ" },
  { number: 5, name: "प्रत्यारी तारा", nature: "अशुभ" },
  { number: 6, name: "साधक तारा", nature: "शुभ" },
  { number: 7, name: "वध तारा", nature: "अशुभ" },
  { number: 8, name: "मित्र तारा", nature: "शुभ" },
  { number: 9, name: "परम मित्र तारा", nature: "अत्यंत शुभ" }
];

const VIMSHOTTARI = [
  { planet: "केतु", years: 7 },
  { planet: "शुक्र", years: 20 },
  { planet: "सूर्य", years: 6 },
  { planet: "चंद्र", years: 10 },
  { planet: "मंगल", years: 7 },
  { planet: "राहु", years: 18 },
  { planet: "गुरु", years: 16 },
  { planet: "शनि", years: 19 },
  { planet: "बुध", years: 17 }
];

const TOTAL_DASHA_YEARS = 120;
const NAKSHATRA_SIZE = 360 / 27;
const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

// -------------------------------------
// 1. BASIC NAKSHATRA CALCULATION
// -------------------------------------

function normalizeDegrees(value) {
  const degree = Number(value);

  if (!Number.isFinite(degree)) {
    throw new Error("सही ग्रह अंश आवश्यक हैं।");
  }

  return ((degree % 360) + 360) % 360;
}

function getNakshatraFromLongitude(longitude) {
  const degree = normalizeDegrees(longitude);

  const index = Math.floor(degree / NAKSHATRA_SIZE);
  const position = degree % NAKSHATRA_SIZE;

  const pada = Math.floor(position / (NAKSHATRA_SIZE / 4)) + 1;

  return {
    index,
    name: NAKSHATRAS[index],
    pada,
    degreeInNakshatra: position,
    progress: position / NAKSHATRA_SIZE,
    remaining: 1 - position / NAKSHATRA_SIZE
  };
}

// -------------------------------------
// 2. NAV TARA / TARA BALA
// -------------------------------------

function getNakshatraIndex(value) {
  if (
    Number.isInteger(value) &&
    value >= 0 &&
    value < 27
  ) {
    return value;
  }

  if (typeof value === "string") {
    const index = NAKSHATRAS.indexOf(value.trim());

    if (index !== -1) return index;
  }

  throw new Error("मान्य नक्षत्र नाम या index दें।");
}

function getTaraBala(birthNakshatra, transitNakshatra) {
  const birth = getNakshatraIndex(birthNakshatra);
  const transit = getNakshatraIndex(transitNakshatra);

  const count = ((transit - birth + 27) % 27) + 1;
  const taraIndex = (count - 1) % 9;

  return {
    birthNakshatra: NAKSHATRAS[birth],
    transitNakshatra: NAKSHATRAS[transit],
    countFromBirth: count,
    cycle: Math.floor((count - 1) / 9) + 1,
    ...TARA_LIST[taraIndex]
  };
}

function getCompleteTaraChart(birthNakshatra) {
  const birth = getNakshatraIndex(birthNakshatra);

  return NAKSHATRAS.map((nakshatra, index) => ({
    nakshatra,
    ...getTaraBala(birth, index)
  }));
}

function getTaraFromMoonLongitudes(
  birthMoonLongitude,
  transitMoonLongitude
) {
  const birth = getNakshatraFromLongitude(birthMoonLongitude);
  const transit = getNakshatraFromLongitude(transitMoonLongitude);

  return {
    ...getTaraBala(birth.index, transit.index),
    birthPada: birth.pada,
    transitPada: transit.pada
  };
}

// -------------------------------------
// 3. DASHA DATE UTILITIES
// -------------------------------------

function parseDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("जन्म तारीख सही नहीं है।");
  }

  return date;
}

function addYears(date, years) {
  return new Date(date.getTime() + years * YEAR_MS);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 86400000);
}

function formatDate(date) {
  return date.toISOString();
}

function getDashaIndex(planet) {
  const index = VIMSHOTTARI.findIndex(
    item => item.planet === planet
  );

  if (index === -1) {
    throw new Error("अमान्य दशा ग्रह।");
  }

  return index;
}

function getNextDashaPlanet(index) {
  return VIMSHOTTARI[index % 9];
}

// -------------------------------------
// 4. ANTARDASHA GENERATOR
// -------------------------------------

function generateAntardashas(
  mahadasha,
  startDate
) {
  const mdIndex = getDashaIndex(mahadasha.planet);

  let cursor = new Date(startDate);
  const periods = [];

  for (let i = 0; i < 9; i++) {
    const ad = getNextDashaPlanet(mdIndex + i);

    const duration =
      mahadasha.years * ad.years / TOTAL_DASHA_YEARS;

    const endDate = addYears(cursor, duration);

    periods.push({
      planet: ad.planet,
      years: duration,
      start: new Date(cursor),
      end: endDate
    });

    cursor = endDate;
  }

  return periods;
}

// -------------------------------------
// 5. PRATYANTARDASHA GENERATOR
// -------------------------------------

function generatePratyantardashas(
  mahadasha,
  antardasha
) {
  const mdIndex = getDashaIndex(mahadasha.planet);
  const adIndex = getDashaIndex(antardasha.planet);

  const startIndex = adIndex;

  let cursor = new Date(antardasha.start);
  const periods = [];

  for (let i = 0; i < 9; i++) {
    const pd = getNextDashaPlanet(startIndex + i);

    const duration =
      mahadasha.years *
      antardasha.years *
      pd.years /
      (TOTAL_DASHA_YEARS * TOTAL_DASHA_YEARS);

    const endDate = addYears(cursor, duration);

    periods.push({
      planet: pd.planet,
      years: duration,
      start: new Date(cursor),
      end: endDate
    });

    cursor = endDate;
  }

  return periods;
}

// -------------------------------------
// 6. VIMSHOTTARI DASHA ENGINE
// -------------------------------------

function getVimshottariDasha(
  birthDate,
  moonLongitude,
  referenceDate = new Date()
) {
  const birth = parseDate(birthDate);
  const reference = parseDate(referenceDate);

  const moon = getNakshatraFromLongitude(moonLongitude);

  const startingDasha = moon.index % 9;
  const firstLord = VIMSHOTTARI[startingDasha];

  const elapsedYears =
    moon.progress * firstLord.years;

  const balanceYears =
    moon.remaining * firstLord.years;

  // वास्तविक महादशा जन्म से पहले शुरू हो सकती है
  let cursor = addYears(birth, -elapsedYears);

  const mahadashas = [];

  for (let i = 0; i < 9; i++) {
    const lord = getNextDashaPlanet(startingDasha + i);

    const start = new Date(cursor);
    const end = addYears(start, lord.years);

    const mahadasha = {
      planet: lord.planet,
      years: lord.years,
      start,
      end,
      antardashas: []
    };

    const antardashas = generateAntardashas(
      lord,
      start
    );

    for (const ad of antardashas) {
      ad.pratyantardashas =
        generatePratyantardashas(lord, ad);
    }

    mahadasha.antardashas = antardashas;
    mahadashas.push(mahadasha);

    cursor = end;
  }

  const activeMD = mahadashas.find(
    item =>
      reference >= item.start &&
      reference < item.end
  );

  const activeAD = activeMD?.antardashas.find(
    item =>
      reference >= item.start &&
      reference < item.end
  );

  const activePD = activeAD?.pratyantardashas.find(
    item =>
      reference >= item.start &&
      reference < item.end
  );

  return {
    system: "Vimshottari",
    totalYears: TOTAL_DASHA_YEARS,

    birthDate: formatDate(birth),

    birthMoon: {
      nakshatra: moon.name,
      nakshatraIndex: moon.index,
      pada: moon.pada,
      progress: moon.progress
    },

    startingMahadasha: firstLord.planet,
    elapsedMahadashaYears: elapsedYears,
    balanceAtBirthYears: balanceYears,

    mahadashas,

    current: {
      mahadasha: activeMD?.planet || null,
      antardasha: activeAD?.planet || null,
      pratyantardasha: activePD?.planet || null,

      mahadashaStart: activeMD
        ? formatDate(activeMD.start)
        : null,

      mahadashaEnd: activeMD
        ? formatDate(activeMD.end)
        : null,

      antardashaStart: activeAD
        ? formatDate(activeAD.start)
        : null,

      antardashaEnd: activeAD
        ? formatDate(activeAD.end)
        : null,

      pratyantardashaStart: activePD
        ? formatDate(activePD.start)
        : null,

      pratyantardashaEnd: activePD
        ? formatDate(activePD.end)
        : null
    }
  };
}

// -------------------------------------
// 7. COMPLETE ASTROLOGY SUMMARY
// -------------------------------------

function buildAstrologySummary({
  birthDate,
  birthMoonLongitude,
  transitMoonLongitude,
  referenceDate = new Date()
}) {
  const birthMoon =
    getNakshatraFromLongitude(birthMoonLongitude);

  const transitMoon =
    getNakshatraFromLongitude(transitMoonLongitude);

  return {
    birthNakshatra: birthMoon,
    transitNakshatra: transitMoon,

    taraBala: getTaraFromMoonLongitudes(
      birthMoonLongitude,
      transitMoonLongitude
    ),

    vimshottari: getVimshottariDasha(
      birthDate,
      birthMoonLongitude,
      referenceDate
    )
  };
}

// -------------------------------------
// EXPORTS
// -------------------------------------

module.exports = {
  NAKSHATRAS,
  TARA_LIST,
  VIMSHOTTARI,

  normalizeDegrees,
  getNakshatraFromLongitude,

  getNakshatraIndex,
  getTaraBala,
  getCompleteTaraChart,
  getTaraFromMoonLongitudes,

  generateAntardashas,
  generatePratyantardashas,
  getVimshottariDasha,

  buildAstrologySummary
};
      

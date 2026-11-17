
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


const VARGA_DIVISIONS = [1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60];
const VARGA_NAMES = {
  1:"राशि",2:"होरा",3:"द्रेष्काण",4:"चतुर्थांश",7:"सप्तांश",9:"नवांश",
  10:"दशांश",12:"द्वादशांश",16:"षोडशांश",20:"विंशांश",24:"चतुर्विंशांश",
  27:"सप्तविंशांश",30:"त्रिंशांश",40:"खवेदांश",45:"अक्षवेदांश",60:"षष्ट्यांश"
};

function getVargaPosition(longitude, division) {
  if (!VARGA_DIVISIONS.includes(division)) {
    throw new Error("यह विभाजित कुंडली समर्थित नहीं है।");
  }
  const degree=normalizeDegrees(longitude);
  const signIndex=Math.floor(degree/30);
  const degreeInSign=degree%30;
  let part=0, targetSign=signIndex, degreeInVarga=degreeInSign;

  if (division===1) {
    part=0;
  } else if (division===2) {
    part=Math.floor(degreeInSign/15);
    targetSign=signIndex%2===0?(part===0?4:3):(part===0?3:4);
    degreeInVarga=(degreeInSign-part*15)*2;
  } else if (division===3) {
    part=Math.min(2,Math.floor(degreeInSign/10));
    targetSign=(signIndex+part*4)%12;
    degreeInVarga=(degreeInSign-part*10)*3;
  } else if (division===4) {
    part=Math.min(3,Math.floor(degreeInSign/7.5));
    targetSign=(signIndex+part*3)%12;
    degreeInVarga=(degreeInSign-part*7.5)*4;
  } else if (division===7) {
    part=Math.min(6,Math.floor(degreeInSign/(30/7)));
    targetSign=(signIndex+(signIndex%2===0?0:6)+part)%12;
    degreeInVarga=(degreeInSign-part*(30/7))*7;
  } else if (division===9) {
    part=Math.min(8,Math.floor(degreeInSign/(30/9)));
    targetSign=(signIndex*9+part)%12;
    degreeInVarga=(degreeInSign-part*(30/9))*9;
  } else if (division===10) {
    part=Math.min(9,Math.floor(degreeInSign/3));
    targetSign=(signIndex+(signIndex%2===0?0:8)+part)%12;
    degreeInVarga=(degreeInSign-part*3)*10;
  } else if (division===12) {
    part=Math.min(11,Math.floor(degreeInSign/2.5));
    targetSign=(signIndex+part)%12;
    degreeInVarga=(degreeInSign-part*2.5)*12;
  } else if (division===16) {
    part=Math.min(15,Math.floor(degreeInSign/(30/16)));
    const modalityStart=[0,4,8][signIndex%3];
    targetSign=(modalityStart+part)%12;
    degreeInVarga=(degreeInSign-part*(30/16))*16;
  } else if (division===20) {
    part=Math.min(19,Math.floor(degreeInSign/1.5));
    const modalityStart=[0,8,4][signIndex%3];
    targetSign=(modalityStart+part)%12;
    degreeInVarga=(degreeInSign-part*1.5)*20;
  } else if (division===24) {
    part=Math.min(23,Math.floor(degreeInSign/1.25));
    targetSign=((signIndex%2===0?4:3)+part)%12;
    degreeInVarga=(degreeInSign-part*1.25)*24;
  } else if (division===27) {
    part=Math.min(26,Math.floor(degreeInSign/(30/27)));
    const elementStart=[0,3,6,9][signIndex%4];
    targetSign=(elementStart+part)%12;
    degreeInVarga=(degreeInSign-part*(30/27))*27;
  } else if (division===30) {
    const oddSegments=[
      {width:5,sign:0},{width:5,sign:10},{width:8,sign:8},{width:7,sign:2},{width:5,sign:6}
    ];
    const evenSegments=[
      {width:5,sign:1},{width:7,sign:5},{width:8,sign:11},{width:5,sign:9},{width:5,sign:7}
    ];
    const segments=signIndex%2===0?oddSegments:evenSegments;
    let cursor=0;
    for(let i=0;i<segments.length;i++){
      const s=segments[i];
      if(degreeInSign<cursor+s.width||i===segments.length-1){
        part=i;targetSign=s.sign;
        degreeInVarga=(degreeInSign-cursor)*30/s.width;
        break;
      }
      cursor+=s.width;
    }
  } else if (division===40) {
    part=Math.min(39,Math.floor(degreeInSign/0.75));
    targetSign=((signIndex%2===0?0:6)+part)%12;
    degreeInVarga=(degreeInSign-part*0.75)*40;
  } else if (division===45) {
    part=Math.min(44,Math.floor(degreeInSign/(30/45)));
    const modalityStart=[0,4,8][signIndex%3];
    targetSign=(modalityStart+part)%12;
    degreeInVarga=(degreeInSign-part*(30/45))*45;
  } else if (division===60) {
    part=Math.min(59,Math.floor(degreeInSign/0.5));
    targetSign=(signIndex+part)%12;
    degreeInVarga=(degreeInSign-part*0.5)*60;
  }

  return {
    division,
    name:VARGA_NAMES[division],
    rashi:RASHIS[targetSign],
    rashiIndex:targetSign,
    degreeInRashi:Number(Math.max(0,Math.min(29.999999,degreeInVarga)).toFixed(6)),
    part:part+1
  };
}

function buildDivisionalCharts(ascendantLongitude, planets) {
  const charts={};
  for(const division of VARGA_DIVISIONS){
    const asc=getVargaPosition(ascendantLongitude,division);
    const chart={division,name:VARGA_NAMES[division],ascendant:{...asc,house:1},planets:{}};
    for(const [name,data] of Object.entries(planets)){
      const pos=getVargaPosition(data.longitude,division);
      chart.planets[name]={
        ...pos,
        house:getWholeSignHouse(pos.rashiIndex,asc.rashiIndex),
        retrograde:Boolean(data.retrograde)
      };
    }
    charts["D"+division]=chart;
  }
  return charts;
}

function getWholeSignHouse(planetSignIndex, ascendantSignIndex) {
  return ((planetSignIndex - ascendantSignIndex + 12) % 12) + 1;
}

const GRAHA_ASPECTS = {
  सूर्य: [7], चंद्र: [7], मंगल: [4, 7, 8],
  बुध: [7], गुरु: [5, 7, 9], शुक्र: [7],
  शनि: [3, 7, 10], राहु: [5, 7, 9], केतु: [5, 7, 9]
};

const COMBUSTION_LIMITS = {
  चंद्र: 12, मंगल: 17, बुध: 14, गुरु: 11, शुक्र: 10, शनि: 15
};

function angularDistance(a, b) {
  const d = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return Math.min(d, 360 - d);
}

function analyzeRelationships(planets) {
  const aspects = [];
  const conjunctions = [];
  const sun = planets.सूर्य;

  for (const [name, p] of Object.entries(planets)) {
    const targets = GRAHA_ASPECTS[name] || [7];
    for (const [targetName, target] of Object.entries(planets)) {
      if (name === targetName) continue;
      const houseDistance = ((target.rashiIndex - p.rashiIndex + 12) % 12) + 1;
      if (targets.includes(houseDistance)) {
        aspects.push({ from:name, to:targetName, targetHouse:houseDistance, type:houseDistance===7?"सप्तम दृष्टि":"विशेष दृष्टि" });
      }
    }
    if (sun && name !== "सूर्य" && COMBUSTION_LIMITS[name]) {
      const distance = angularDistance(p.longitude, sun.longitude);
      const retroAdjustment = name === "बुध" && p.retrograde ? 2 : 0;
      p.combustion = distance <= COMBUSTION_LIMITS[name] - retroAdjustment;
      p.sunDistance = Number(distance.toFixed(3));
    } else {
      p.combustion = false;
    }
  }

  const names = Object.keys(planets);
  for (let i=0;i<names.length;i++) {
    for (let j=i+1;j<names.length;j++) {
      const a=planets[names[i]], b=planets[names[j]];
      const orb=angularDistance(a.longitude,b.longitude);
      if (orb <= 8) conjunctions.push({ planets:[names[i],names[j]], orb:Number(orb.toFixed(3)) });
    }
  }
  return { aspects, conjunctions };
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

  const relationships = analyzeRelationships(d1.planets);
  const vargas = buildDivisionalCharts(ascendantLongitude, planets);

  return {
    system: {
      zodiac: "sidereal",
      ayanamsa: "lahiri",
      houseSystem: "whole_sign"
    },
    d1,
    d9,
    vargas,
    relationships
  };
}

module.exports = {
  RASHIS,
  NAKSHATRAS,
  VARGA_DIVISIONS,
  getVargaPosition,
  buildDivisionalCharts,
  normalizeDegrees,
  getPosition,
  getWholeSignHouse,
  buildChart
};

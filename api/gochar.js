"use strict";

const { calculateSiderealPositions } = require("../lib/ephemeris");
const { getPosition } = require("../lib/chart-engine");

const RASHIS = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];

function dms(value) {
  const totalSeconds = Math.round(value * 3600);
  const degrees = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { degrees, minutes, seconds, text: degrees + "° " + minutes + "' " + seconds + '"' };
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({success:false,message:"केवल GET अनुरोध स्वीकार है।"});
  }

  const rashi = String(req.query?.rashi || "");
  const lagna = String(req.query?.lagna || "");
  if (!RASHIS.includes(rashi) || (lagna && !RASHIS.includes(lagna))) {
    return res.status(400).json({success:false,message:"मान्य राशि चुनें।"});
  }

  try {
    const now = new Date();
    const positions = calculateSiderealPositions(now, 0, 0);
    const baseSignIndex = RASHIS.indexOf(rashi);
    const lagnaSignIndex = lagna ? RASHIS.indexOf(lagna) : null;

    const planets = Object.entries(positions.planets).map(([name, planet]) => {
      const pos = getPosition(planet.longitude);
      const moonHouse = ((pos.rashiIndex - baseSignIndex + 12) % 12) + 1;
      const lagnaHouse = lagnaSignIndex === null ? null : ((pos.rashiIndex - lagnaSignIndex + 12) % 12) + 1;
      return {
        name,
        rashi: pos.rashi,
        degree: dms(pos.degreeInRashi),
        longitude: Number(pos.longitude.toFixed(6)),
        nakshatra: pos.nakshatra,
        pada: pos.pada,
        navamsa: pos.navamsa,
        house: moonHouse,
        moonHouse,
        lagnaHouse,
        retrograde: Boolean(planet.retrograde)
      };
    });

    const lines = planets.map(p =>
      p.name + " — " + p.rashi + " " + p.degree.text +
      " | नक्षत्र: " + p.nakshatra + " (चरण " + p.pada + ")" +
      " | नवांश: " + p.navamsa +
      " | चंद्र से " + p.moonHouse + "वाँ भाव" +
      (p.lagnaHouse ? " | लग्न से " + p.lagnaHouse + "वाँ भाव" : "") +
      (p.retrograde ? " | वक्री" : " | मार्गी")
    );

    return res.status(200).json({
      success:true,
      asOf:now.toISOString(),
      basisRashi:rashi,
      basisLagna:lagna || null,
      ayanamsa:"लाहिड़ी (वर्तमान कोड में अनुमानित)",
      houseSystem:"Whole Sign / राशि आधारित",
      planets,
      transit:lines.join("\n"),
      note:"भाव राशि-आधारित Whole Sign पद्धति से निकाले गए हैं। चंद्र राशि और लग्न दोनों देने पर दोनों से गोचर भाव अलग-अलग दिखते हैं। अयनांश अभी अनुमानित है; व्यावसायिक उपयोग से पहले प्रमाणित पंचांग/ephemeris से मिलान आवश्यक है।"
    });
  } catch (error) {
    console.error("Gochar API failed:", error);
    return res.status(500).json({success:false,message:"गोचर गणना उपलब्ध नहीं है।"});
  }
};
